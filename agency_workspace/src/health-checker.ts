import { INativeBridge } from './native-bridge';

export interface HealthResult {
  ok: boolean;
  checks: {
    bridgeReachable: boolean;
    authValid: boolean;
    newChatWorks: boolean;
    geminiMdValid: boolean;
    portUsed: number;
  };
  errorMessage?: string;
}

import * as fs from 'fs/promises';
import * as path from 'path';

export const IDEAL_GEMINI_MD = `You are a stateless execution engine. You will adopt the exact persona provided in the prompt. Do not introduce yourself, do not apologize, and NEVER use phrases like "As an AI" or "As your pair-programming assistant". Output exactly the required format and nothing else.`;

export class HealthChecker {
  constructor(private bridge: INativeBridge, private port: number, private workspaceRoot: string) {}

  async check(): Promise<HealthResult> {
    const checks = {
      bridgeReachable: false,
      authValid: true,
      newChatWorks: false,
      geminiMdValid: false,
      portUsed: this.port
    };

    try {
      const geminiMdPath = path.join(this.workspaceRoot, 'GEMINI.md');
      const content = await fs.readFile(geminiMdPath, 'utf8');
      if (content.trim() === IDEAL_GEMINI_MD.trim()) {
        checks.geminiMdValid = true;
      }
    } catch (e) {
      // File missing or unreadable
      checks.geminiMdValid = false;
    }

    try {
      await this.bridge.connectCDP(this.port);
      checks.bridgeReachable = true;
    } catch (err: any) {
      return {
        ok: false,
        checks,
        errorMessage: `Cannot reach Antigravity IDE at CDP port ${this.port}. Error: ${err.message}`
      };
    }

    try {
      await this.bridge.clickButton('New Conversation');
      checks.newChatWorks = true;
    } catch (err: any) {
      checks.newChatWorks = false;
      return {
        ok: false,
        checks,
        errorMessage: 'New Conversation button click failed. Is the IDE session ready?'
      };
    }

    return { ok: true, checks };
  }
}
