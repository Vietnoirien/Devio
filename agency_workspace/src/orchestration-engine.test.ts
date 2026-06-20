import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrchestrationEngine } from './orchestration-engine';
import { INativeBridge } from './native-bridge';
import { ConversationManager } from './conversation-manager';
import { PromptBuilder } from './prompt-builder';
import { WorkspaceWriter } from './workspace-writer';

vi.mock('vscode', () => {
    return {
        workspace: {
            getConfiguration: vi.fn().mockReturnValue({
                get: vi.fn().mockImplementation((key: string) => {
                    if (key === 'agency-developer') return 'Gemini 3.5 Flash';
                    return undefined;
                })
            })
        }
    };
});

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
            clickButton: vi.fn(),
            getAvailableModels: vi.fn(),
            switchModel: vi.fn()
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
        const calls: string[] = [];
        vi.mocked(convMgr.openFreshChat).mockImplementation(async () => { calls.push('openFreshChat'); });
        vi.mocked(bridge.switchModel).mockImplementation(async () => { calls.push('switchModel'); });

        // Mock captureSnapshot to simulate:
        // 1. Polling for model update
        // 2. Not generating yet (waiting to start)
        // 3. Generating
        // 4. Done
        vi.mocked(bridge.captureSnapshot)
            .mockResolvedValueOnce({ controlsMeta: { model: { text: 'Gemini 3.5 Flash' } } } as any)
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

        expect(calls).toEqual(['openFreshChat', 'switchModel']);
        expect(bridge.switchModel).toHaveBeenCalledWith('Gemini 3.5 Flash');
        expect(convMgr.openFreshChat).toHaveBeenCalled();
        expect(promptBldr.buildPrompt).toHaveBeenCalledWith('agency-developer', 'DEVELOPMENT');
        expect(bridge.injectMessage).toHaveBeenCalledWith('the prompt');
        expect(bridge.captureSnapshot).toHaveBeenCalledTimes(4);
        expect(writer.parseHtml).toHaveBeenCalledWith('done html', '.custom-message');
        // Extract message should have been called
        expect(writer.extractMessage).toHaveBeenCalledWith({ text: 'res', files: [] }, 'key123');
        // Because extractMessage succeeded, applyResponse should be called with the parsed response AND the extracted message
        expect(writer.applyResponse).toHaveBeenCalledWith(
            { text: 'res', files: [] }, 
            { id: '1', type: 'INFO', message: 'test', timestamp: '', from: '', to: '', phase: '', ref_doc: null, in_reply_to: null, status: 'OPEN' } as any, 
            'agency-developer', 
            'agency-ceo', 
            'DEVELOPMENT',
            expect.any(Number)
        );
    });

    it('should proceed if generation never starts but timeout is reached', async () => {
        // Mock to always return false
        vi.mocked(bridge.captureSnapshot).mockResolvedValue({ controlsMeta: { model: { text: 'Gemini 3.5 Flash' } }, html: 'done html', isGenerating: false } as any);
        vi.mocked(writer.extractMessage).mockReturnValue({ id: '1', type: 'INFO', message: 'test', timestamp: '', from: '', to: '', phase: '', ref_doc: null, in_reply_to: null, status: 'OPEN' } as any);

        (engine as any).POLL_INTERVAL_MS = 10;
        (engine as any).START_TIMEOUT_MS = 50;

        // Temporarily reduce finishDeadline by overriding Date.now or just mocking the loop condition?
        // Actually, since extractMessage returns a valid message and isGenerating is false, it will finish on the very first iteration!
        await engine.runTurn('agency-developer', 'DEVELOPMENT', false);

        expect(convMgr.openFreshChat).not.toHaveBeenCalled();
        expect(writer.parseHtml).toHaveBeenCalledWith('done html', '.custom-message');
    });

    it('should throw ModelSwitchTimeoutError, call stop, and bypass injectMessage if model polling times out', async () => {
        vi.mocked(bridge.captureSnapshot).mockResolvedValue({ controlsMeta: { model: { text: 'Old Model' } } } as any);
        const stopSpy = vi.spyOn(engine, 'stop');

        // Fast timeout for test
        (engine as any).POLL_INTERVAL_MS = 10;
        
        // Mock Date.now to simulate 10s passing instantly
        let now = 1000;
        const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
            now += 15000; // Jump 15 seconds
            return now;
        });

        let error: any;
        try {
            await engine.runTurn('agency-developer', 'DEVELOPMENT', false);
        } catch (e) {
            error = e;
        }

        dateSpy.mockRestore();

        expect(error).toBeDefined();
        expect(error.name).toBe('ModelSwitchTimeoutError');
        expect(stopSpy).toHaveBeenCalled();
        expect(bridge.injectMessage).not.toHaveBeenCalled();
    });
});
