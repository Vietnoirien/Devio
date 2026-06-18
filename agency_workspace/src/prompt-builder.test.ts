import { describe, it, expect, beforeEach } from 'vitest';
import { PromptBuilder } from './prompt-builder';

describe('PromptBuilder', () => {
    let builder: PromptBuilder;

    beforeEach(() => {
        builder = new PromptBuilder('/mock/workspace');
    });

    it('should build prompt using @mentions and a validation key for context', async () => {
        const result = await builder.buildPrompt('agency-developer', 'DEVELOPMENT');
        
        expect(result.prompt).toContain('Phase: DEVELOPMENT');
        expect(result.prompt).toContain('@.agent/skills/agency-developer/SKILL.md');
        expect(result.prompt).toContain('@agency_workspace/inbox.jsonl');
        expect(result.prompt).toContain('CRITICAL INSTRUCTION: You are agency-developer. You MUST ONLY perform ONE turn.');
        expect(result.validationKey).toBeDefined();
        expect(result.prompt).toContain(`"devio_validation_key": "${result.validationKey}"`);
    });
});
