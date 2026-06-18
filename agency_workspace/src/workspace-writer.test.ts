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

    describe('applyResponse', () => {
        it('should extract valid JSONL format from response text', async () => {
            const mockManager = { appendInbox: vi.fn() } as any;
            const writer = new WorkspaceWriter(mockManager);
            
            const response = {
                text: 'Some preamble\n{"id": "msg-123", "type": "INFO", "message": "hello"}\nSome trailing text',
                files: []
            };

            await writer.applyResponse(response, 'agentA', 'agentB', 'DEVELOPMENT');

            expect(mockManager.appendInbox).toHaveBeenCalledWith(expect.objectContaining({
                id: 'msg-123',
                type: 'INFO',
                message: 'hello'
            }));
        });

        it('should extract valid JSON object from text with thoughts and UI garbage', async () => {
            const mockManager = { appendInbox: vi.fn() } as any;
            const writer = new WorkspaceWriter(mockManager);
            
            const response = {
                text: `
<thought>
I need to do something
</thought>
{
  "id": "msg-456",
  "type": "REQUEST_CHANGE",
  "message": "please fix this"
}
thumb_upthumb_downReview Changes
`,
                files: []
            };

            await writer.applyResponse(response, 'agentA', 'agentB', 'DEVELOPMENT');

            expect(mockManager.appendInbox).toHaveBeenCalledWith(expect.objectContaining({
                id: 'msg-456',
                type: 'REQUEST_CHANGE',
                message: 'please fix this'
            }));
        });

        it('should throw an error if no valid JSON is found', async () => {
            const mockManager = { appendInbox: vi.fn() } as any;
            const writer = new WorkspaceWriter(mockManager);
            
            const response = {
                text: 'Just some text, no JSON here { broken ',
                files: []
            };

            await expect(writer.applyResponse(response, 'agentA', 'agentB', 'DEVELOPMENT')).rejects.toThrow('Failed to parse a valid AgencyMessage from response');
            expect(mockManager.appendInbox).not.toHaveBeenCalled();
        });
    });
});
