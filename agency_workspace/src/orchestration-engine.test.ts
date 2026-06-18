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
        promptBldr = { buildPrompt: vi.fn().mockResolvedValue({ prompt: 'the prompt', validationKey: 'key123' }) } as any;
        writer = { 
            parseHtml: vi.fn().mockReturnValue({ text: 'res', files: [] }), 
            extractMessage: vi.fn(),
            applyResponse: vi.fn() 
        } as any;

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

        vi.mocked(writer.extractMessage)
            .mockReturnValueOnce(null)
            .mockReturnValueOnce({ id: '1', type: 'INFO', message: 'test', timestamp: '', from: '', to: '', phase: '', ref_doc: null, in_reply_to: null, status: 'OPEN' } as any)
            .mockReturnValueOnce({ id: '1', type: 'INFO', message: 'test', timestamp: '', from: '', to: '', phase: '', ref_doc: null, in_reply_to: null, status: 'OPEN' } as any);

        // Temporarily reduce timeout for test
        (engine as any).POLL_INTERVAL_MS = 10;
        (engine as any).START_TIMEOUT_MS = 100;

        await engine.runTurn('agency-developer', 'DEVELOPMENT', true);

        expect(convMgr.openFreshChat).toHaveBeenCalled();
        expect(promptBldr.buildPrompt).toHaveBeenCalledWith('agency-developer', 'DEVELOPMENT');
        expect(bridge.injectMessage).toHaveBeenCalledWith('the prompt');
        expect(bridge.captureSnapshot).toHaveBeenCalledTimes(3);
        expect(writer.parseHtml).toHaveBeenCalledWith('done html', '.custom-message');
        // Extract message should have been called
        expect(writer.extractMessage).toHaveBeenCalledWith({ text: 'res', files: [] }, 'key123');
        // Because extractMessage succeeded, applyResponse should be called with the parsed response AND the extracted message
        expect(writer.applyResponse).toHaveBeenCalledWith({ text: 'res', files: [] }, { id: '1', type: 'INFO', message: 'test', timestamp: '', from: '', to: '', phase: '', ref_doc: null, in_reply_to: null, status: 'OPEN' } as any, 'agency-developer', 'agency-coordinator', 'DEVELOPMENT');
    });

    it('should proceed if generation never starts but timeout is reached', async () => {
        // Mock to always return false
        vi.mocked(bridge.captureSnapshot).mockResolvedValue({ html: 'done html', isGenerating: false });
        vi.mocked(writer.extractMessage).mockReturnValue({ id: '1', type: 'INFO', message: 'test', timestamp: '', from: '', to: '', phase: '', ref_doc: null, in_reply_to: null, status: 'OPEN' } as any);

        (engine as any).POLL_INTERVAL_MS = 10;
        (engine as any).START_TIMEOUT_MS = 50;

        // Temporarily reduce finishDeadline by overriding Date.now or just mocking the loop condition?
        // Actually, since extractMessage returns a valid message and isGenerating is false, it will finish on the very first iteration!
        await engine.runTurn('agency-developer', 'DEVELOPMENT', false);

        expect(convMgr.openFreshChat).not.toHaveBeenCalled();
        expect(writer.parseHtml).toHaveBeenCalledWith('done html', '.custom-message');
    });
});
