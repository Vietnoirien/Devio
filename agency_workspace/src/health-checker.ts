import { AgLinkClient } from './ag-link-client';

export interface HealthResult {
  ok: boolean;
  checks: {
    bridgeReachable: boolean;
    authValid: boolean;
    newChatWorks: boolean;
    portUsed: number;
  };
  errorMessage?: string;
}

export class HealthChecker {
  constructor(private client: AgLinkClient, private port: number) {}

  async check(): Promise<HealthResult> {
    const checks = {
      bridgeReachable: false,
      authValid: false,
      newChatWorks: false,
      portUsed: this.port
    };

    const pingRes = await this.client.ping();
    
    if (pingRes.ok) {
      checks.bridgeReachable = true;
      checks.authValid = true;
    } else if (pingRes.status === 401) {
      checks.bridgeReachable = true;
      checks.authValid = false;
      return {
        ok: false,
        checks,
        errorMessage: 'Authentication failed. Please verify your DEVIO_AG_LINK_TOKEN.'
      };
    } else {
      return {
        ok: false,
        checks,
        errorMessage: `Cannot reach Antigravity Link at port ${this.port} — is the server running on port ${this.port}?`
      };
    }

    try {
      await this.client.click({ text: 'New Chat' });
      checks.newChatWorks = true;
    } catch (err: any) {
      checks.newChatWorks = false;
      return {
        ok: false,
        checks,
        errorMessage: 'New Chat button click failed. Is the IDE session ready?'
      };
    }

    return { ok: true, checks };
  }
}
