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
    private manager: WorkspaceManager;

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
        return jsonString.replace(/"message"\s*:\s*"(.*?)"\s*,\s*"(in_reply_to|status|devio_validation_key|timestamp|from|to|phase|type|ref_doc|id)"\s*:/gs, (match, p1, p2) => {
            const escaped = p1.replace(/(?<!\\)"/g, '\\"');
            return `"message": "${escaped}", "${p2}":`;
        });
    }

    extractMessage(response: ParsedResponse, validationKey: string): AgencyMessage | null {
        let msg: AgencyMessage | null = null;

        // Strategy 1: Find the last line that is a valid JSON object (JSONL format)
        const lines = response.text.split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('{') && line.endsWith('}')) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed && parsed.id && parsed.type && parsed.devio_validation_key === validationKey) {
                        msg = parsed as AgencyMessage;
                        break;
                    }
                } catch (e) {
                    try {
                        const repaired = this.repairMalformedJson(line);
                        const parsed = JSON.parse(repaired);
                        if (parsed && parsed.id && parsed.type && parsed.devio_validation_key === validationKey) {
                            msg = parsed as AgencyMessage;
                            break;
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
                            if (parsed && parsed.id && parsed.type && parsed.devio_validation_key === validationKey) {
                                msg = parsed as AgencyMessage;
                                break;
                            }
                        } catch (e) {
                            try {
                                const repaired = this.repairMalformedJson(candidate);
                                const parsed = JSON.parse(repaired);
                                if (parsed && parsed.id && parsed.type && parsed.devio_validation_key === validationKey) {
                                    msg = parsed as AgencyMessage;
                                    break;
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

        return msg;
    }

    async applyResponse(response: ParsedResponse, msg: AgencyMessage, from: string, to: string, phase: string): Promise<void> {
        // Apply files atomically
        for (const file of response.files) {
            const dir = path.dirname(file.path);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(file.path, file.content, 'utf8');
        }

        await this.manager.appendInbox(msg);

        // If the agent is resolving a previous message, automatically close the original message
        if (msg.in_reply_to && msg.status === 'RESOLVED') {
            await this.manager.updateMessageStatus(msg.in_reply_to, 'RESOLVED');
        }
    }
}
