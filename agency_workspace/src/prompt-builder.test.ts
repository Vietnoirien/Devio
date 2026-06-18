import { describe, it, expect, beforeEach } from 'vitest';
import { PromptBuilder } from './prompt-builder';

describe('PromptBuilder', () => {
    let builder: PromptBuilder;

    beforeEach(() => {
        builder = new PromptBuilder('/mock/workspace');
    });

    it('should build prompt using @mentions for context', async () => {
        const prompt = await builder.buildPrompt('agency-developer', 'DEVELOPMENT');
        
        expect(prompt).toContain('Phase: DEVELOPMENT');
        expect(prompt).toContain('@.agent/skills/agency-developer/SKILL.md');
        expect(prompt).toContain('@agency_workspace/inbox.jsonl');
        expect(prompt).toContain('CRITICAL INSTRUCTION: You are agency-developer. You MUST ONLY perform ONE turn.');
    });
});
