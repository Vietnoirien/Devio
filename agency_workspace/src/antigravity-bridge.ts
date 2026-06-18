import * as vscode from 'vscode';

export interface AgentPayload {
  agent: string;
  action: string;
  workspace_path: string;
  context: {
    current_phase: string;
    [key: string]: any;
  };
}

export class AntigravityBridge {
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Invokes an agent via the local Antigravity Link HTTP API.
   * Retrieves the secure API key from vscode SecretStorage.
   */
  async invokeAgent(payload: AgentPayload): Promise<any> {
    const apiKey = await this.context.secrets.get('ANTIGRAVITY_API_KEY');
    if (!apiKey) {
      throw new Error('Antigravity API key not found in SecretStorage.');
    }

    try {
      const response = await fetch('http://localhost:11434/v1/devio/invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Antigravity Link API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      if (err.message.startsWith('Antigravity Link API error')) {
        throw err;
      }
      throw new Error(`Failed to invoke Antigravity API: ${err.message}`);
    }
  }
}
