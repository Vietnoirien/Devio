import { discoverInstances, connectCDP } from './services/cdp';
import { captureSnapshot, injectMessage, clickElement } from './services/antigravity';
import * as cheerio from 'cheerio';
import { CDPConnection } from './types';

export interface INativeBridge {
  connectCDP(port: number): Promise<void>;
  captureSnapshot(): Promise<{ html: string, isGenerating: boolean, controlsMeta?: any }>;
  injectMessage(text: string): Promise<void>;
  clickButton(text: string): Promise<void>;
  getAvailableModels(): Promise<string[]>;
  switchModel(modelName: string): Promise<void>;
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

    async captureSnapshot(): Promise<{ html: string, isGenerating: boolean, controlsMeta?: any }> {
        if (!this.connection) {
            throw new Error('Not connected to CDP');
        }
        const snapshot = await captureSnapshot(this.connection);
        if (!snapshot) {
            throw new Error('Failed to capture snapshot');
        }
        return {
            html: snapshot.html,
            isGenerating: (snapshot as any).isGenerating || false,
            controlsMeta: snapshot.controlsMeta
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

    async clickButton(textOrSelector: string): Promise<void> {
        if (!this.connection) {
            throw new Error('Not connected to CDP');
        }
        const isSelector = textOrSelector.startsWith('[') || textOrSelector.startsWith('.') || textOrSelector.startsWith('#') || textOrSelector.includes(':nth-of-type') || textOrSelector.includes(' > ');
        
        if (isSelector) {
            // Direct native DOM click evaluation (matches scratch.ts success)
            const evalResult = await this.connection.call("Runtime.evaluate", {
                expression: `
                    (() => {
                        let el = document.querySelector('${textOrSelector.replace(/'/g, "\\'")}');
                        if (!el) return false;
                        el.click();
                        return true;
                    })()
                `,
                returnByValue: true
            });
            
            if (!evalResult.result.value) {
                throw new Error(`Failed to click button: selector ${textOrSelector} not found or click failed`);
            }
            return;
        }

        // Fallback to text-based matching if not a selector
        const result = await clickElement(this.connection, textOrSelector, undefined, undefined, undefined, undefined);
        if (!result.success) {
            throw new Error('Failed to click button: ' + (result.error || result.reason || 'Unknown error'));
        }
    }

    async getAvailableModels(): Promise<string[]> {
        if (!this.connection) {
            throw new Error('Not connected to CDP');
        }

        const snapshot = await captureSnapshot(this.connection);
        if (!snapshot || !snapshot.controlsMeta || !snapshot.controlsMeta.model || !snapshot.controlsMeta.model.selector) {
            throw new Error('Failed to extract model selector from IDE controlsMeta');
        }

        const selector = snapshot.controlsMeta.model.selector;
        await this.clickButton(selector);

        // Wait briefly for UI to render
        await new Promise(resolve => setTimeout(resolve, 500));

        const openSnapshot = await captureSnapshot(this.connection);
        if (!openSnapshot || (!openSnapshot.html && !openSnapshot.controlsHtml)) {
            throw new Error('Failed to capture snapshot of model dropdown');
        }

        const $ = cheerio.load(openSnapshot.controlsHtml || openSnapshot.html || '');
        const models: string[] = [];
        
        $('button.px-2.py-1.flex.w-full.items-center.justify-between').each((_, element) => {
            const text = $(element).find('span.text-xs.font-medium span').text().trim();
            if (text) {
                models.push(text);
            }
        });

        return models;
    }

    async switchModel(modelName: string): Promise<void> {
        if (!this.connection) {
            throw new Error('Not connected to CDP');
        }

        const snapshot = await captureSnapshot(this.connection);
        if (!snapshot || !snapshot.controlsMeta || !snapshot.controlsMeta.model || !snapshot.controlsMeta.model.selector) {
            throw new Error('Failed to extract model selector from IDE controlsMeta');
        }

        const selector = snapshot.controlsMeta.model.selector;
        await this.clickButton(selector);

        // Wait briefly for UI to render
        await new Promise(resolve => setTimeout(resolve, 500));

        const res = await this.connection.call("Runtime.evaluate", {
            expression: `
                (() => {
                    const btns = document.querySelectorAll('button.px-2.py-1.flex.w-full.items-center.justify-between');
                    for (const btn of btns) {
                        if ((btn.innerText || '').includes('${modelName}') || (btn.textContent || '').includes('${modelName}')) {
                            btn.click();
                            return true;
                        }
                    }
                    return false;
                })()
            `,
            returnByValue: true
        });

        if (!res || !res.result || !res.result.value) {
            throw new Error('Failed to click model button: Could not find element matching ' + modelName);
        }
    }
}
