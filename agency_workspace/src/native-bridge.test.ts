import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeBridge } from './native-bridge';
import * as cdp from './services/cdp';
import * as antigravity from './services/antigravity';

vi.mock('./services/cdp');
vi.mock('./services/antigravity');

describe('NativeBridge', () => {
    let bridge: NativeBridge;

    beforeEach(() => {
        vi.resetAllMocks();
        bridge = new NativeBridge();
    });

    it('should connect to CDP successfully', async () => {
        const mockInstances = [
            { port: 9222, url: 'ws://127.0.0.1:9222/devtools/browser/123', id: '1', title: 'Antigravity' }
        ];
        const mockConnection = { id: '1', ws: {} as any, call: vi.fn(), contexts: [], title: 'Antigravity', url: 'ws://127.0.0.1:9222' };

        vi.mocked(cdp.discoverInstances).mockResolvedValue(mockInstances);
        vi.mocked(cdp.connectCDP).mockResolvedValue(mockConnection);

        await bridge.connectCDP(9222);

        expect(cdp.discoverInstances).toHaveBeenCalled();
        expect(cdp.connectCDP).toHaveBeenCalledWith(mockInstances[0].url, mockInstances[0].id, mockInstances[0].title);
    });

    it('should fail to connect if no instances found', async () => {
        vi.mocked(cdp.discoverInstances).mockResolvedValue([]);

        await expect(bridge.connectCDP(9222)).rejects.toThrow('No Antigravity IDE instances found');
    });

    it('should capture snapshot', async () => {
        const mockConnection = { id: '1', ws: {} as any, call: vi.fn(), contexts: [], title: 'Antigravity', url: 'ws://127.0.0.1:9222' };
        vi.mocked(cdp.discoverInstances).mockResolvedValue([{ port: 9222, url: 'ws', id: '1', title: 't' }]);
        vi.mocked(cdp.connectCDP).mockResolvedValue(mockConnection);

        const mockSnapshot = { html: '<p>test</p>', isGenerating: false } as any;
        vi.mocked(antigravity.captureSnapshot).mockResolvedValue(mockSnapshot);

        await bridge.connectCDP(9222);
        const snapshot = await bridge.captureSnapshot();

        expect(antigravity.captureSnapshot).toHaveBeenCalledWith(mockConnection);
        expect(snapshot).toEqual({ html: '<p>test</p>', isGenerating: false });
    });

    it('should throw if capturing before connect', async () => {
        await expect(bridge.captureSnapshot()).rejects.toThrow('Not connected to CDP');
    });

    it('should inject message', async () => {
        const mockConnection = { id: '1', ws: {} as any, call: vi.fn(), contexts: [], title: 'Antigravity', url: 'ws://127.0.0.1:9222' };
        vi.mocked(cdp.discoverInstances).mockResolvedValue([{ port: 9222, url: 'ws', id: '1', title: 't' }]);
        vi.mocked(cdp.connectCDP).mockResolvedValue(mockConnection);
        vi.mocked(antigravity.injectMessage).mockResolvedValue({ ok: true, method: 'enter_keypress' });

        await bridge.connectCDP(9222);
        await bridge.injectMessage('Hello world');

        expect(antigravity.injectMessage).toHaveBeenCalledWith(mockConnection, 'Hello world');
    });

    it('should click button', async () => {
        const mockConnection = { id: '1', ws: {} as any, call: vi.fn(), contexts: [], title: 'Antigravity', url: 'ws://127.0.0.1:9222' };
        vi.mocked(cdp.discoverInstances).mockResolvedValueOnce([{ port: 9222, url: 'ws://127.0.0.1:9222', id: '1', title: 'Antigravity' }]);
        vi.mocked(cdp.connectCDP).mockResolvedValueOnce(mockConnection);
        vi.mocked(antigravity.clickElement).mockResolvedValueOnce({ success: true, method: 'text_hit', target: 'Add context' });

        await bridge.connectCDP(9222);
        await bridge.clickButton('Add context');

        expect(antigravity.clickElement).toHaveBeenCalledWith(mockConnection, 'Add context', undefined, undefined, undefined, undefined);
    });

    it('should throw an informative error if clickButton fails', async () => {
        const mockConnection = { id: '1', ws: {} as any, call: vi.fn(), contexts: [], title: 'Antigravity', url: 'ws://127.0.0.1:9222' };
        vi.mocked(cdp.discoverInstances).mockResolvedValueOnce([{ port: 9222, url: 'ws://127.0.0.1:9222', id: '1', title: 'Antigravity' }]);
        vi.mocked(cdp.connectCDP).mockResolvedValueOnce(mockConnection);
        vi.mocked(antigravity.clickElement).mockResolvedValueOnce({ success: false, reason: 'Could not find element' });

        await bridge.connectCDP(9222);
        await expect(bridge.clickButton('Add context')).rejects.toThrow('Failed to click button: Could not find element');
    });


    it('should fetch available models dynamically', async () => {
        const mockConnection = { id: '1', ws: {} as any, call: vi.fn(), contexts: [], title: 'Antigravity', url: 'ws://127.0.0.1:9222' };
        vi.mocked(cdp.discoverInstances).mockResolvedValue([{ port: 9222, url: 'ws', id: '1', title: 't' }]);
        vi.mocked(cdp.connectCDP).mockResolvedValue(mockConnection);

        const firstSnapshot = {
            html: '',
            isGenerating: false,
            controlsMeta: {
                model: { selector: '.model-dropdown-button' }
            }
        } as any;
        const secondSnapshot = {
            controlsHtml: '<div><div class="monaco-list-row"><span class="label-name">Fake Command</span></div><button class="px-2 py-1 flex w-full items-center justify-between"><span class="text-xs font-medium"><span>Model A</span></span></button><button class="px-2 py-1 flex w-full items-center justify-between"><span class="text-xs font-medium"><span>Model B</span></span></button></div>',
            isGenerating: false
        } as any;

        vi.mocked(antigravity.captureSnapshot)
            .mockResolvedValueOnce(firstSnapshot)
            .mockResolvedValueOnce(secondSnapshot);
        
        mockConnection.call.mockResolvedValue({ result: { value: true } });

        await bridge.connectCDP(9222);
        const models = await (bridge as any).getAvailableModels();

        expect(antigravity.captureSnapshot).toHaveBeenCalledTimes(2);
        expect(models).toEqual(['Model A', 'Model B']);
    });
});
