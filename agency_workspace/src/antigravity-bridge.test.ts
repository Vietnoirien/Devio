import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockSecretsGet = vi.fn();
const mockContext: any = {
  secrets: {
    get: mockSecretsGet
  }
};

import { AntigravityBridge } from './antigravity-bridge';

describe('AntigravityBridge', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockSecretsGet.mockReset();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should successfully post to Antigravity Link API with Bearer token', async () => {
    mockSecretsGet.mockResolvedValue('fake-secret-token');
    
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ status: 'success' })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const bridge = new AntigravityBridge(mockContext);
    
    const payload = {
      agent: 'agency-architect',
      action: 'process_inbox',
      workspace_path: '/path/to/ws',
      context: { current_phase: 'DEVELOPMENT' }
    };
    
    const result = await bridge.invokeAgent(payload);
    
    expect(mockSecretsGet).toHaveBeenCalledWith('ANTIGRAVITY_API_KEY');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/v1/devio/invoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-secret-token'
      },
      body: JSON.stringify(payload)
    });
    expect(result).toEqual({ status: 'success' });
  });

  it('should throw an error if API key is not found', async () => {
    mockSecretsGet.mockResolvedValue(undefined);
    const bridge = new AntigravityBridge(mockContext);
    
    await expect(bridge.invokeAgent({} as any)).rejects.toThrow('Antigravity API key not found in SecretStorage.');
  });
  
  it('should throw an error if HTTP response is not ok', async () => {
    mockSecretsGet.mockResolvedValue('fake-secret-token');
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const bridge = new AntigravityBridge(mockContext);
    await expect(bridge.invokeAgent({} as any)).rejects.toThrow('Antigravity Link API error: 500 Internal Server Error');
  });
});
