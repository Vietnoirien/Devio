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

    async applyResponse(response: ParsedResponse, from: string, to: string, phase: string): Promise<void> {
        // Apply files atomically
        for (const file of response.files) {
            const dir = path.dirname(file.path);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(file.path, file.content, 'utf8');
        }

        // Add to inbox
        const msg: AgencyMessage = {
            id: `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            from,
            to,
            phase,
            type: "INFO",
            ref_doc: null,
            message: response.text,
            in_reply_to: null,
            status: "RESOLVED"
        };
        await this.manager.appendInbox(msg);
    }
}
