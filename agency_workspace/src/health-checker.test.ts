import { vi, describe, it, expect, beforeEach, type Mocked } from 'vitest';
import { HealthChecker } from './health-checker';
import { AgLinkClient } from './ag-link-client';

describe('HealthChecker', () => {
  let mockClient: Mocked<AgLinkClient>;

  beforeEach(() => {
    mockClient = {
      ping: vi.fn(),
      click: vi.fn(),
    } as any;
  });

  const port = 3717;

  it('should pass all checks if bridge is reachable, auth valid, and click succeeds', async () => {
    mockClient.ping.mockResolvedValue({ ok: true });
    mockClient.click.mockResolvedValue({ success: true });

    const checker = new HealthChecker(mockClient, port);
    const result = await checker.check();

    expect(result).toEqual({
      ok: true,
      checks: {
        bridgeReachable: true,
        authValid: true,
        newChatWorks: true,
        portUsed: port
      }
    });
  });

  it('should fail bridgeReachable and authValid if ping fails', async () => {
    mockClient.ping.mockResolvedValue({ ok: false });
    
    const checker = new HealthChecker(mockClient, port);
    const result = await checker.check();

    expect(result.ok).toBe(false);
    expect(result.checks.bridgeReachable).toBe(false);
    expect(result.checks.authValid).toBe(false);
    expect(result.errorMessage).toContain(port.toString());
    expect(result.errorMessage).toContain('Cannot reach Antigravity Link');
  });

  it('should fail authValid if ping returns status 401', async () => {
    mockClient.ping.mockResolvedValue({ ok: false, status: 401 });

    const checker = new HealthChecker(mockClient, port);
    const result = await checker.check();

    expect(result.ok).toBe(false);
    expect(result.checks.bridgeReachable).toBe(true);
    expect(result.checks.authValid).toBe(false);
    expect(result.errorMessage).toContain('Authentication failed');
  });

  it('should fail newChatWorks if click fails', async () => {
    mockClient.ping.mockResolvedValue({ ok: true });
    mockClient.click.mockRejectedValue(new Error('Click failed'));

    const checker = new HealthChecker(mockClient, port);
    const result = await checker.check();

    expect(result.ok).toBe(false);
    expect(result.checks.newChatWorks).toBe(false);
    expect(result.errorMessage).toContain('New Chat button');
  });
});
