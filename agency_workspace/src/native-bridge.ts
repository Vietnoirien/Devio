import { discoverInstances, connectCDP } from './services/cdp';
import { captureSnapshot, injectMessage, clickElement } from './services/antigravity';
import { CDPConnection } from './types';

export interface INativeBridge {
  connectCDP(port: number): Promise<void>;
  captureSnapshot(): Promise<{ html: string, isGenerating: boolean }>;
  injectMessage(text: string): Promise<void>;
  clickButton(text: string): Promise<void>;
}

export class NativeBridge implements INativeBridge {
    private connection: CDPConnection | null = null;

    async connectCDP(port: number): Promise<void> {
        // Attempt to connect. Let's use the discovery mechanism from CDP
        const instances = await discoverInstances();
        // Since we are running inside the extension host, we might just look for the active window
        // but for now let's just pick the first workbench or jetski instance.
        // Wait, the discoverInstances is from the fork.
        // Let's filter by the provided port, or just use the instances found.
        const target = instances.find(i => i.port === port) || instances[0];
        
        if (!target) {
            throw new Error('No Antigravity IDE instances found');
        }

        this.connection = await connectCDP(target.url, target.id, target.title);
    }

    async captureSnapshot(): Promise<{ html: string, isGenerating: boolean }> {
        if (!this.connection) {
            throw new Error('Not connected to CDP');
        }
        const snapshot = await captureSnapshot(this.connection);
        if (!snapshot) {
            throw new Error('Failed to capture snapshot');
        }
        return {
            html: snapshot.html,
            isGenerating: (snapshot as any).isGenerating || false
        };
    }

    async injectMessage(text: string): Promise<void> {
        if (!this.connection) {
            throw new Error('Not connected to CDP');
        }
        const result = await injectMessage(this.connection, text);
        if (!result.ok) {
            throw new Error('Failed to inject message: ' + result.reason);
        }
    }

    async clickButton(text: string): Promise<void> {
        if (!this.connection) {
            throw new Error('Not connected to CDP');
        }
        // Use text_hit
        const result = await clickElement(this.connection, text);
        if (!result.success) {
            throw new Error('Failed to click button: ' + result.error);
        }
    }
}
