import { INativeBridge } from './native-bridge';

export class ConversationManager {
    private TIMEOUT_MS = 10000;
    private POLL_INTERVAL_MS = 500;

    constructor(private bridge: INativeBridge, private newChatSelector: string) {}

    async openFreshChat(): Promise<void> {
        try {
            await this.bridge.clickButton(this.newChatSelector);
            
            const deadline = Date.now() + this.TIMEOUT_MS;
            while (Date.now() < deadline) {
                const snapshot = await this.bridge.captureSnapshot();
                // A fresh chat might just have empty html or no messages
                if (!snapshot.html || snapshot.html.trim() === '' || !snapshot.html.includes('message')) {
                    return;
                }
                await new Promise(r => setTimeout(r, this.POLL_INTERVAL_MS));
            }
            throw new Error(`ConversationManager.openFreshChat timed out after ${this.TIMEOUT_MS}ms`);
        } catch (e: any) {
            console.warn(`WARN: ${e.message}`);
            // Architecture: emit a WARN to the webview — it must NOT propagate the error to OrchestrationEngine.
        }
    }
}
