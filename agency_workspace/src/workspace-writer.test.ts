import { describe, it, expect, vi } from 'vitest';
import { WorkspaceWriter } from './workspace-writer';

describe('WorkspaceWriter', () => {
    it('should parse simple html without code blocks', () => {
        const writer = new WorkspaceWriter(null as any);
        const html = '<div class="message"><p>Hello world</p></div>';
        const parsed = writer.parseHtml(html, '.message');
        
        expect(parsed.text).toBe('Hello world');
        expect(parsed.files).toHaveLength(0);
    });

    it('should parse html with tagged file blocks', () => {
        const writer = new WorkspaceWriter(null as any);
        const html = `
            <div class="message">
                <p>Here is your file:</p>
                <p>file:///path/to/file.ts</p>
                <pre><code>const a = 1;</code></pre>
            </div>
        `;
        const parsed = writer.parseHtml(html, '.message');
        
        expect(parsed.text).toContain('Here is your file:');
        expect(parsed.files).toHaveLength(1);
        expect(parsed.files[0].path).toBe('/path/to/file.ts');
        expect(parsed.files[0].content).toBe('const a = 1;');
    });
});
