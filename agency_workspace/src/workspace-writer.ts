import * as cheerio from 'cheerio';
import { WorkspaceManager, AgencyMessage } from './workspace-manager';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ParsedResponse {
    text: string;
    files: Array<{
        path: string;
        content: string;
    }>;
}

export class WorkspaceWriter {
    public manager: WorkspaceManager;

    constructor(manager: WorkspaceManager) {
        this.manager = manager;
    }

    parseHtml(html: string, responseSelector?: string): ParsedResponse {
        const $ = cheerio.load(html);
        
        let container = $('body');
        if (responseSelector) {
            const els = $(responseSelector);
            if (els.length > 0) {
                // Typically we want the last message matching the selector
                container = $(els[els.length - 1]);
            }
        }

        const files: Array<{ path: string; content: string }> = [];
        const textParts: string[] = [];

        // Parse paragraphs, code blocks, etc.
        // Look for pattern: <p>file:///path/to/file</p> followed by <pre><code>...</code></pre>
        container.children().each((_, el) => {
            if (el.type !== 'tag') return;
            const tagName = el.tagName.toLowerCase();
            const $el = $(el);

            if (['style', 'script', 'meta', 'link'].includes(tagName)) return;

            if (tagName === 'pre') {
                const code = $el.find('code').text();
                // Check if the previous text part was a file URL
                const lastText = textParts.length > 0 ? textParts[textParts.length - 1].trim() : '';
                if (lastText.startsWith('file://')) {
                    const filePath = lastText.substring(7).trim(); // remove file://
                    files.push({
                        path: filePath,
                        content: code
                    });
                    // We might want to keep the URL in the text or remove it, let's keep it.
                }
                textParts.push($el.text());
            } else {
                textParts.push($el.text());
            }
        });

        const text = textParts.join('\n').trim();

        return { text, files };
    }

    private repairMalformedJson(jsonString: string): string {
        const messageKeyStr = '"message"';
        let output = '';
        
        let i = 0;
        while (i < jsonString.length) {
            const messageKeyIdx = jsonString.indexOf(messageKeyStr, i);
            if (messageKeyIdx === -1) {
                output += jsonString.substring(i);
                break;
            }
            
            let colonIdx = jsonString.indexOf(':', messageKeyIdx + messageKeyStr.length);
            if (colonIdx === -1) {
                output += jsonString.substring(i);
                break;
            }
            
            let openQuoteIdx = jsonString.indexOf('"', colonIdx + 1);
            if (openQuoteIdx === -1) {
                output += jsonString.substring(i);
                break;
            }
            
            output += jsonString.substring(i, openQuoteIdx + 1);
            
            let j = openQuoteIdx + 1;
            let valueStr = '';
            while (j < jsonString.length) {
                if (jsonString[j] === '"') {
                    let isEnd = false;
                    let k = j + 1;
                    while (k < jsonString.length && /\s/.test(jsonString[k])) {
                        k++;
                    }
                    if (k < jsonString.length && (jsonString[k] === ',' || jsonString[k] === '}')) {
                        isEnd = true;
                    }
                    
                    if (isEnd) {
                        output += valueStr + '"';
                        i = j + 1;
                        break;
                    } else {
                        if (valueStr.endsWith('\\')) {
                            valueStr += '"';
                        } else {
                            valueStr += '\\"';
                        }
                    }
                } else if (jsonString[j] === '\n') {
                    valueStr += '\\n';
                } else if (jsonString[j] === '\r') {
                    valueStr += '\\r';
                } else {
                    valueStr += jsonString[j];
                }
                j++;
            }
            
            if (j >= jsonString.length) {
                output += valueStr;
                i = j;
            }
        }
        
        return output;
    }

    async extractMessage(response: ParsedResponse, validationKey: string): Promise<AgencyMessage | null> {
        let msg: AgencyMessage | null = null;
        let fallbackMsg: AgencyMessage | null = null;

        // Strategy 1: Find the last line that is a valid JSON object (JSONL format)
        const lines = response.text.split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed && parsed.id && parsed.type) {
                        if (parsed.devio_validation_key === validationKey) {
                            msg = parsed as AgencyMessage;
                            break;
                        } else if (!fallbackMsg) {
                            fallbackMsg = parsed as AgencyMessage;
                        }
                    }
                } catch (e) {
                    try {
                        const repaired = this.repairMalformedJson(line);
                        const parsed = JSON.parse(repaired);
                        if (parsed && parsed.id && parsed.type) {
                            if (parsed.devio_validation_key === validationKey) {
                                msg = parsed as AgencyMessage;
                                break;
                            } else if (!fallbackMsg) {
                                fallbackMsg = parsed as AgencyMessage;
                            }
                        }
                    } catch (e2) {
                        // ignore
                    }
                }
            }
        }

        // Strategy 2: Extract the last matching { ... } block
        if (!msg) {
            for (let i = response.text.length - 1; i >= 0; i--) {
                if (response.text[i] === '}') {
                    let braceCount = 0;
                    let startIndex = -1;
                    for (let j = i; j >= 0; j--) {
                        if (response.text[j] === '}') braceCount++;
                        if (response.text[j] === '{') braceCount--;
                        if (braceCount === 0) {
                            startIndex = j;
                            break;
                        }
                    }
                    if (startIndex !== -1) {
                        const candidate = response.text.substring(startIndex, i + 1);
                        try {
                            const parsed = JSON.parse(candidate);
                            if (parsed && parsed.id && parsed.type) {
                                if (parsed.devio_validation_key === validationKey) {
                                    msg = parsed as AgencyMessage;
                                    break;
                                } else if (!fallbackMsg) {
                                    fallbackMsg = parsed as AgencyMessage;
                                }
                            }
                        } catch (e) {
                            try {
                                const repaired = this.repairMalformedJson(candidate);
                                const parsed = JSON.parse(repaired);
                                if (parsed && parsed.id && parsed.type) {
                                    if (parsed.devio_validation_key === validationKey) {
                                        msg = parsed as AgencyMessage;
                                        break;
                                    } else if (!fallbackMsg) {
                                        fallbackMsg = parsed as AgencyMessage;
                                    }
                                }
                            } catch (e2) {
                                // ignore
                            }
                        }
                        i = startIndex; // Skip to before this block
                    }
                }
            }
        }

        if (msg) {
            return msg;
        }

        if (fallbackMsg) {
            try {
                const inbox = await this.manager.readInbox();
                const exists = inbox.some(m => m.id === fallbackMsg!.id);
                if (!exists) {
                    return fallbackMsg;
                }
            } catch (err) {
                // Ignore inbox read error, maybe it doesn't exist
            }
        }

        return null;
    }

    async applyResponse(response: ParsedResponse, msg: AgencyMessage, from: string, to: string, phase: string, preTurnTimestamp?: number): Promise<void> {
        // Apply files atomically
        for (const file of response.files) {
            const dir = path.dirname(file.path);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(file.path, file.content, 'utf8');
        }

        if (preTurnTimestamp !== undefined) {
            const scannedFiles = await this.manager.scanWorkspace(preTurnTimestamp);
            const mergedFiles = [...response.files];
            for (const sf of scannedFiles) {
                if (!mergedFiles.some(mf => mf.path === sf.path)) {
                    mergedFiles.push(sf);
                }
            }
            if (mergedFiles.length > 0) {
                msg.files = mergedFiles;
            }
        }

        await this.manager.appendInbox(msg);

        // If the agent is resolving a previous message, automatically close the original message
        if (msg.in_reply_to && msg.status === 'RESOLVED') {
            await this.manager.updateMessageStatus(msg.in_reply_to, 'RESOLVED');
        }
    }
}
