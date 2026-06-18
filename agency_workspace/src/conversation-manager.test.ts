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
        manager = new ConversationManager(bridge, '[data-tooltip-id="new-conversation-tooltip"]');
    });

    it('should click new conversation button and wait for clear', async () => {
        // First call: Chat has messages
        // Second call: Chat is empty, but the DOM still has a wrapper with class="message-container" (no actual .message elements inside)
        vi.mocked(bridge.captureSnapshot).mockResolvedValueOnce({ html: '<div class="message-container"><div class="message">msgs</div></div>', isGenerating: false })
                                        .mockResolvedValueOnce({ html: '<div class="message-container"></div>', isGenerating: false });
        
        // Use a short timeout so the test doesn't hang forever if it fails
        (manager as any).TIMEOUT_MS = 200;
        (manager as any).POLL_INTERVAL_MS = 10;
        
        await manager.openFreshChat();
        
        expect(bridge.clickButton).toHaveBeenCalledWith('[data-tooltip-id="new-conversation-tooltip"]');
        expect(bridge.captureSnapshot).toHaveBeenCalledTimes(2);
    });

    it('should throw error on timeout', async () => {
        // Mock captureSnapshot to always return html with messages so it loops until timeout
        vi.mocked(bridge.captureSnapshot).mockResolvedValue({ html: '<div class="message">msgs</div>', isGenerating: false });
        
        // Temporarily reduce timeout for test
        (manager as any).TIMEOUT_MS = 100;

        await expect(manager.openFreshChat()).rejects.toThrow('CRITICAL: Timed out waiting for fresh chat');
    });

    it('should throw error if clickButton fails', async () => {
        vi.mocked(bridge.clickButton).mockRejectedValueOnce(new Error('Click failed'));
        
        await expect(manager.openFreshChat()).rejects.toThrow('CRITICAL: Failed to clear conversation');
    });
});
