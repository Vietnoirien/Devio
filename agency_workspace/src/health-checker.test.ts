import { vi, describe, it, expect, beforeEach, type Mocked } from 'vitest';
import { HealthChecker } from './health-checker';
import { INativeBridge } from './native-bridge';

describe('HealthChecker', () => {
  let mockBridge: Mocked<INativeBridge>;

  beforeEach(() => {
    mockBridge = {
      connectCDP: vi.fn(),
      captureSnapshot: vi.fn(),
      injectMessage: vi.fn(),
      clickButton: vi.fn(),
    } as any;
  });

  const port = 9222;

  it('should pass all checks if bridge is reachable and click succeeds', async () => {
    mockBridge.connectCDP.mockResolvedValue();
    mockBridge.clickButton.mockResolvedValue();

    const checker = new HealthChecker(mockBridge, port, '/mock/workspace', '[data-tooltip-id="new-conversation-tooltip"]');
    const result = await checker.check();

    expect(result).toEqual({
      ok: true,
      checks: {
        bridgeReachable: true,
        authValid: true,
        newChatWorks: true,
        geminiMdValid: false,
        portUsed: port
      }
    });
  });

  it('should fail bridgeReachable if connectCDP fails', async () => {
    mockBridge.connectCDP.mockRejectedValue(new Error('Connection failed'));
    
    const checker = new HealthChecker(mockBridge, port, '/mock/workspace', '[data-tooltip-id="new-conversation-tooltip"]');
    const result = await checker.check();

    expect(result.ok).toBe(false);
    expect(result.checks.bridgeReachable).toBe(false);
    expect(result.checks.authValid).toBe(true);
    expect(result.errorMessage).toContain(port.toString());
    expect(result.errorMessage).toContain('Cannot reach Antigravity IDE');
  });

  it('should fail newChatWorks if clickButton fails', async () => {
    mockBridge.connectCDP.mockResolvedValue();
    mockBridge.clickButton.mockRejectedValue(new Error('Click failed'));

    const checker = new HealthChecker(mockBridge, port, '/mock/workspace', '[data-tooltip-id="new-conversation-tooltip"]');
    const result = await checker.check();

    expect(result.ok).toBe(false);
    expect(result.checks.newChatWorks).toBe(false);
    expect(result.errorMessage).toContain('[data-tooltip-id="new-conversation-tooltip"] button');
  });
});
