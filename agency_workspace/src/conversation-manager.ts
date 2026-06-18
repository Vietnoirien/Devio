import { AgLinkClient } from './ag-link-client';

export interface ConversationConfig {
  newChatSelector: string;
  timeoutMs: number;
  pollIntervalMs: number;
}

export class ConversationResetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversationResetError';
  }
}

export class ConversationManager {
  constructor(private client: AgLinkClient, private config: ConversationConfig) {}

  async openFreshChat(): Promise<void> {
    await this.client.click({ text: this.config.newChatSelector });

    const timeout = Math.min(this.config.timeoutMs, 10000);
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      const snap = await this.client.snapshot();
      if (snap.html.trim() === '') {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, this.config.pollIntervalMs));
    }

    throw new ConversationResetError(`Timed out waiting for blank conversation after ${timeout}ms`);
  }
}
