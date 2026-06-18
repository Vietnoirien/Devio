import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptBuilder } from './prompt-builder';
import * as fs from 'fs/promises';
import * as path from 'path';

vi.mock('fs/promises');

describe('PromptBuilder', () => {
    let builder: PromptBuilder;

    beforeEach(() => {
        vi.resetAllMocks();
        builder = new PromptBuilder('/mock/workspace');
    });

    it('should build prompt by merging skill and inbox', async () => {
        vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
            if (filePath.toString().includes('SKILL.md')) {
                return '# Skill Details';
            }
            if (filePath.toString().includes('inbox.jsonl')) {
                return JSON.stringify({ message: "Hello" });
            }
            throw new Error("Not found");
        });

        const prompt = await builder.buildPrompt('agency-developer', 'DEVELOPMENT');
        
        expect(prompt).toContain('# Skill Details');
        expect(prompt).toContain('{"message":"Hello"}');
    });
});
