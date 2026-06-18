import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrchestrationEngine } from './orchestration-engine';
import { INativeBridge } from './native-bridge';
import { ConversationManager } from './conversation-manager';
import { PromptBuilder } from './prompt-builder';
import { WorkspaceWriter } from './workspace-writer';

describe('OrchestrationEngine', () => {
    let bridge: INativeBridge;
    let convMgr: ConversationManager;
    let promptBldr: PromptBuilder;
    let writer: WorkspaceWriter;
    let engine: OrchestrationEngine;

    beforeEach(() => {
        bridge = {
            connectCDP: vi.fn(),
            captureSnapshot: vi.fn(),
            injectMessage: vi.fn(),
            clickButton: vi.fn()
        };
        convMgr = { openFreshChat: vi.fn() } as any;
        promptBldr = { buildPrompt: vi.fn().mockResolvedValue('the prompt') } as any;
        writer = { parseHtml: vi.fn().mockReturnValue({ text: 'res', files: [] }), applyResponse: vi.fn() } as any;

        engine = new OrchestrationEngine(bridge, convMgr, promptBldr, writer);
    });

    it('should orchestrate a single turn', async () => {
        // Mock captureSnapshot to simulate generating then done
        vi.mocked(bridge.captureSnapshot)
            .mockResolvedValueOnce({ html: 'gen', isGenerating: true })
            .mockResolvedValueOnce({ html: 'done html', isGenerating: false });

        await engine.runTurn('agency-developer', 'DEVELOPMENT', true);

        expect(convMgr.openFreshChat).toHaveBeenCalled();
        expect(promptBldr.buildPrompt).toHaveBeenCalledWith('agency-developer', 'DEVELOPMENT');
        expect(bridge.injectMessage).toHaveBeenCalledWith('the prompt');
        expect(bridge.captureSnapshot).toHaveBeenCalledTimes(2);
        expect(writer.parseHtml).toHaveBeenCalledWith('done html');
        expect(writer.applyResponse).toHaveBeenCalledWith({ text: 'res', files: [] }, 'agency-developer', 'agency-coordinator', 'DEVELOPMENT');
    });

    it('should not open fresh chat if freshConversationPerTurn is false', async () => {
        vi.mocked(bridge.captureSnapshot)
            .mockResolvedValueOnce({ html: 'done html', isGenerating: false });

        await engine.runTurn('agency-developer', 'DEVELOPMENT', false);

        expect(convMgr.openFreshChat).not.toHaveBeenCalled();
    });
});
