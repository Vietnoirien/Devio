import { describe, it, expect, vi } from 'vitest';
import { WorkspaceWriter } from './workspace-writer';
import * as fs from 'fs/promises';

vi.mock('fs/promises', () => ({
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined)
}));

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

    describe('extractMessage', () => {
        it('should extract valid JSONL format from response text requiring devio_validation_key', () => {
            const writer = new WorkspaceWriter(null as any);
            
            const response = {
                text: 'Some preamble\n{"id": "msg-123", "type": "INFO", "devio_validation_key": "key123"}\nSome trailing text',
                files: []
            };

            const msg = writer.extractMessage(response, 'key123');
            expect(msg).toMatchObject({ id: 'msg-123', type: 'INFO', devio_validation_key: 'key123' });
        });

        it('should extract valid JSON object from text with thoughts and UI garbage requiring devio_validation_key', () => {
            const writer = new WorkspaceWriter(null as any);
            
            const response = {
                text: `
<thought>
I need to do something
</thought>
{
  "id": "msg-456",
  "type": "REQUEST_CHANGE",
  "message": "Type '"test"' is not assignable",
  "devio_validation_key": "key456"
}
thumb_upthumb_downReview Changes
`,
                files: []
            };

            const msg = writer.extractMessage(response, 'key456');
            expect(msg).toMatchObject({ id: 'msg-456', type: 'REQUEST_CHANGE', message: 'Type \'"test"\' is not assignable', devio_validation_key: 'key456' });
        });

        it('should return null if valid JSON exists but validation key does not match', () => {
            const writer = new WorkspaceWriter(null as any);
            
            const response = {
                text: '{"id": "msg-123", "type": "INFO", "devio_validation_key": "wrong_key"}',
                files: []
            };

            const msg = writer.extractMessage(response, 'key123');
            expect(msg).toBeNull();
        });

        it('should return null if no valid JSON is found', () => {
            const writer = new WorkspaceWriter(null as any);
            
            const response = {
                text: 'Just some text, no JSON here { broken ',
                files: []
            };

            const msg = writer.extractMessage(response, 'key123');
            expect(msg).toBeNull();
        });
    });

    describe('applyResponse', () => {
        it('should apply extracted message and save files', async () => {
            const mockManager = { appendInbox: vi.fn() } as any;
            const writer = new WorkspaceWriter(mockManager);
            
            // Mock fs to not actually write
            const mockFs = require('fs/promises');

            const parsed = {
                text: 'hi',
                files: [{ path: '/tmp/test/file.txt', content: 'hello' }]
            };
            const extractedMsg = { id: 'msg-123', type: 'INFO', message: 'hello' } as any;

            await writer.applyResponse(parsed, extractedMsg, 'agentA', 'agentB', 'DEVELOPMENT');

            expect(mockManager.appendInbox).toHaveBeenCalledWith(expect.objectContaining({
                id: 'msg-123',
                type: 'INFO'
            }));
            expect(fs.writeFile).toHaveBeenCalledWith('/tmp/test/file.txt', 'hello', 'utf8');
        });
    });
});
