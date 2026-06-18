import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationManager } from './conversation-manager';
import { INativeBridge } from './native-bridge';

describe('ConversationManager', () => {
    let bridge: INativeBridge;
    let manager: ConversationManager;

    beforeEach(() => {
        bridge = {
            connectCDP: vi.fn(),
            captureSnapshot: vi.fn(),
            injectMessage: vi.fn(),
            clickButton: vi.fn()
        };
        manager = new ConversationManager(bridge, 'Add context');
    });

    it('should click new conversation button and wait for clear', async () => {
        vi.mocked(bridge.captureSnapshot).mockResolvedValueOnce({ html: '<div class="message">msgs</div>', isGenerating: false })
                                        .mockResolvedValueOnce({ html: '<div></div>', isGenerating: false });
        
        await manager.openFreshChat();
        
        expect(bridge.clickButton).toHaveBeenCalledWith('Add context');
        expect(bridge.captureSnapshot).toHaveBeenCalledTimes(2);
    });

    it('should catch timeout and emit warning without throwing', async () => {
        // Mock captureSnapshot to always return html with messages so it loops until timeout
        vi.mocked(bridge.captureSnapshot).mockResolvedValue({ html: '<div class="message">msgs</div>', isGenerating: false });
        
        // Temporarily reduce timeout for test
        (manager as any).TIMEOUT_MS = 100;
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(manager.openFreshChat()).resolves.not.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('WARN: ConversationManager.openFreshChat timed out'));
    });
});
