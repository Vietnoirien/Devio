import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgLinkClient } from './ag-link-client';

describe('AgLinkClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const baseUrl = 'https://localhost:3717';
  const token = 'fake-token';

  it('ping() should return ok: true when bridge is reachable', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ version: '1.0.20' })
    });

    const client = new AgLinkClient(baseUrl, token);
    const result = await client.ping();

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/snapshot`, expect.objectContaining({
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }));
    expect(result).toEqual({ ok: true, version: '1.0.20' });
  });

  it('ping() should return ok: false on network error without throwing', async () => {
    (global.fetch as any).mockRejectedValue(new Error('fetch failed'));

    const client = new AgLinkClient(baseUrl, token);
    const result = await client.ping();

    expect(result).toEqual({ ok: false });
  });

  it('send() should call POST /send and return success', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, method: 'send' })
    });

    const client = new AgLinkClient(baseUrl, token);
    const result = await client.send('hello');

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/send`, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: 'hello' })
    }));
    expect(result).toEqual({ success: true, method: 'send' });
  });

  it('snapshot() should return SnapshotResponse', async () => {
    const mockSnap = { html: 'foo', controlsHtml: 'bar', isGenerating: false, controlsMeta: { isGenerating: false, model: { text: 'm', selector: 's' } } };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockSnap)
    });

    const client = new AgLinkClient(baseUrl, token);
    const result = await client.snapshot();

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/snapshot`, expect.objectContaining({
      method: 'GET'
    }));
    expect(result).toEqual(mockSnap);
  });

  it('click() should call POST /click', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true })
    });

    const client = new AgLinkClient(baseUrl, token);
    const result = await client.click({ text: 'Add context' });

    expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/click`, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ text: 'Add context' })
    }));
    expect(result).toEqual({ success: true });
  });

  it('waitForCompletion() should poll until isGenerating is false', async () => {
    const mockSnapTrue = { isGenerating: true };
    const mockSnapFalse = { isGenerating: false, html: 'done' };
    
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(mockSnapTrue) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(mockSnapTrue) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(mockSnapTrue) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue(mockSnapFalse) });

    const client = new AgLinkClient(baseUrl, token);
    const result = await client.waitForCompletion({ pollIntervalMs: 10, timeoutMs: 1000 });
    
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(result).toEqual(mockSnapFalse);
  });

  it('waitForCompletion() should throw TimeoutError if timeoutMs is exceeded', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ isGenerating: true })
    });

    const client = new AgLinkClient(baseUrl, token);
    const start = Date.now();
    await expect(client.waitForCompletion({ pollIntervalMs: 10, timeoutMs: 50 }))
      .rejects.toThrow('TimeoutError');
    expect(Date.now() - start).toBeGreaterThanOrEqual(50);
  });
});
