import { INativeBridge } from './native-bridge';
import * as cheerio from 'cheerio';

export class ConversationManager {
    private TIMEOUT_MS = 10000;
    private POLL_INTERVAL_MS = 500;

    constructor(private bridge: INativeBridge, private newChatSelector: string, private commands?: any, private responseSelector?: string) {}

    async openFreshChat(): Promise<void> {
        console.log(`Clicking new chat button: ${this.newChatSelector}`);
        
        let targetSelector = this.newChatSelector;
        if (targetSelector === 'New Chat') {
            targetSelector = '[data-tooltip-id="new-conversation-tooltip"]';
            console.log(`Overriding deprecated 'New Chat' setting with '${targetSelector}'`);
        }

        try {
            await this.bridge.clickButton(targetSelector);
        } catch (err: any) {
            throw new Error(`CRITICAL: Failed to clear conversation. Halting agency. Reason: ${err.message}`);
        }
        
        const deadline = Date.now() + this.TIMEOUT_MS;
        while (Date.now() < deadline) {
            const snapshot = await this.bridge.captureSnapshot();
            
            if (!snapshot.isGenerating && snapshot.html) {
                const $ = cheerio.load(snapshot.html);
                const selector = this.responseSelector || '.message, [data-testid*="message" i], article';
                const msgs = $(selector);
                
                // If there are no messages, the chat is empty
                if (msgs.length === 0) {
                    return;
                }
            }
            await new Promise(r => setTimeout(r, this.POLL_INTERVAL_MS));
        }
        throw new Error(`CRITICAL: Timed out waiting for fresh chat to be empty. Halting agency.`);
    }
}
