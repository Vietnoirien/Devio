import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptBuilder } from './prompt-builder';

vi.mock('vscode', () => {
  return {
    Uri: {
      joinPath: (baseUri: any, ...pathSegments: string[]) => {
        return {
          fsPath: `${baseUri.path}/${pathSegments.join('/')}`
        };
      }
    }
  };
});

describe('PromptBuilder', () => {
    let builder: PromptBuilder;

    beforeEach(() => {
        builder = new PromptBuilder('/mock/workspace', { path: '/mock-global-storage' } as any);
    });

    it('should build prompt using @mentions and a validation key for context', async () => {
        const result = await builder.buildPrompt('agency-developer', 'DEVELOPMENT');
        
        expect(result.prompt).toContain('Phase: DEVELOPMENT');
        expect(result.prompt).toContain('@/mock-global-storage/.agent/skills/agency-developer/SKILL.md');
        expect(result.prompt).toContain('@agency_workspace/inbox.jsonl');
        expect(result.prompt).toContain('CRITICAL INSTRUCTION: You are agency-developer.');
        expect(result.prompt).toContain('@/mock-global-storage/.agent/insights/agency-developer_performance.md');
        expect(result.validationKey).toBeDefined();
        expect(result.prompt).toContain(`"devio_validation_key": "${result.validationKey}"`);
    });

    it('should include company insight for coordinator and ceo', async () => {
        const resultCoord = await builder.buildPrompt('agency-ceo', 'DEVELOPMENT');
        expect(resultCoord.prompt).toContain('@/mock-global-storage/.agent/insights/agency_performance.md');

        const resultCeo = await builder.buildPrompt('agency-ceo', 'DEVELOPMENT');
        expect(resultCeo.prompt).toContain('@/mock-global-storage/.agent/insights/agency_performance.md');
    });

    it('should include special mandate for agency-trinity', async () => {
        const result = await builder.buildPrompt('agency-trinity', 'DONE');
        expect(result.prompt).toContain('[SPECIAL MANDATE]');
        expect(result.prompt).toContain('/mock-global-storage');
        expect(result.prompt).toContain('write all your reports and output files to the IDE global storage directory');
    });
});
