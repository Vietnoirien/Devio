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

        engine = new OrchestrationEngine(bridge, convMgr, promptBldr, writer, '.custom-message');
    });

    it('should orchestrate a single turn and wait for generation to start and finish', async () => {
        // Mock captureSnapshot to simulate:
        // 1. Not generating yet (waiting to start)
        // 2. Generating
        // 3. Done
        vi.mocked(bridge.captureSnapshot)
            .mockResolvedValueOnce({ html: 'pre', isGenerating: false })
            .mockResolvedValueOnce({ html: 'gen', isGenerating: true })
            .mockResolvedValueOnce({ html: 'done html', isGenerating: false });

        // Temporarily reduce timeout for test
        (engine as any).POLL_INTERVAL_MS = 10;
        (engine as any).START_TIMEOUT_MS = 100;

        await engine.runTurn('agency-developer', 'DEVELOPMENT', true);

        expect(convMgr.openFreshChat).toHaveBeenCalled();
        expect(promptBldr.buildPrompt).toHaveBeenCalledWith('agency-developer', 'DEVELOPMENT');
        expect(bridge.injectMessage).toHaveBeenCalledWith('the prompt');
        expect(bridge.captureSnapshot).toHaveBeenCalledTimes(3);
        expect(writer.parseHtml).toHaveBeenCalledWith('done html', '.custom-message');
        expect(writer.applyResponse).toHaveBeenCalledWith({ text: 'res', files: [] }, 'agency-developer', 'agency-coordinator', 'DEVELOPMENT');
    });

    it('should proceed if generation never starts but timeout is reached', async () => {
        // Mock to always return false
        vi.mocked(bridge.captureSnapshot).mockResolvedValue({ html: 'done html', isGenerating: false });

        (engine as any).POLL_INTERVAL_MS = 10;
        (engine as any).START_TIMEOUT_MS = 50;

        await engine.runTurn('agency-developer', 'DEVELOPMENT', false);

        expect(convMgr.openFreshChat).not.toHaveBeenCalled();
        expect(writer.parseHtml).toHaveBeenCalledWith('done html', '.custom-message');
    });
});
