import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConversationManager, ConversationResetError } from './conversation-manager';
import { AgLinkClient } from './ag-link-client';

describe('ConversationManager', () => {
  let mockClient: vi.Mocked<AgLinkClient>;

  beforeEach(() => {
    mockClient = {
      click: vi.fn(),
      snapshot: vi.fn(),
    } as any;
  });

  const config = {
    newChatSelector: 'New Chat',
    timeoutMs: 10000,
    pollIntervalMs: 10
  };

  it('openFreshChat() should click New Chat and wait until html is empty', async () => {
    mockClient.click.mockResolvedValue({ success: true });
    
    mockClient.snapshot
      .mockResolvedValueOnce({ html: 'not empty', controlsHtml: '', isGenerating: false, controlsMeta: {} as any })
      .mockResolvedValueOnce({ html: 'not empty', controlsHtml: '', isGenerating: false, controlsMeta: {} as any })
      .mockResolvedValueOnce({ html: '   ', controlsHtml: '', isGenerating: false, controlsMeta: {} as any });

    const manager = new ConversationManager(mockClient, config);
    await manager.openFreshChat();

    expect(mockClient.click).toHaveBeenCalledWith({ text: 'New Chat' });
    expect(mockClient.snapshot).toHaveBeenCalledTimes(3);
  });

  it('openFreshChat() should throw ConversationResetError if it times out', async () => {
    mockClient.click.mockResolvedValue({ success: true });
    mockClient.snapshot.mockResolvedValue({ html: 'still here', controlsHtml: '', isGenerating: false, controlsMeta: {} as any });

    const manager = new ConversationManager(mockClient, { ...config, timeoutMs: 50 });
    
    const start = Date.now();
    await expect(manager.openFreshChat()).rejects.toThrow(ConversationResetError);
    expect(Date.now() - start).toBeGreaterThanOrEqual(50);
  });
});
