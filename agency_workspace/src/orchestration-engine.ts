import { INativeBridge } from './native-bridge';
import { ConversationManager } from './conversation-manager';
import { PromptBuilder } from './prompt-builder';
import { WorkspaceWriter } from './workspace-writer';

export class OrchestrationEngine {
    private START_TIMEOUT_MS = 5000;
    private POLL_INTERVAL_MS = 1000;

    constructor(
        private bridge: INativeBridge,
        private convMgr: ConversationManager,
        private promptBuilder: PromptBuilder,
        private writer: WorkspaceWriter,
        private responseSelector?: string
    ) {}

    async runTurn(persona: string, phase: string, freshConversationPerTurn: boolean): Promise<void> {
        if (freshConversationPerTurn) {
            await this.convMgr.openFreshChat();
        }

        const { prompt, validationKey } = await this.promptBuilder.buildPrompt(persona, phase);
        await this.bridge.injectMessage(prompt);

        let isDone = false;
        let finalMessage: any = null;
        let finalParsed: any = null;
        let lastError: any = null;
        
        const finishDeadline = Date.now() + 120000; // 120s max to generate a response
        
        while (!isDone && Date.now() < finishDeadline) {
            const snap = await this.bridge.captureSnapshot();
            
            if (snap.html) {
                const parsed = this.writer.parseHtml(snap.html, this.responseSelector);
                try {
                    const msg = this.writer.extractMessage(parsed, validationKey);
                    if (msg) {
                        // Valid message found! Ensure generation has stopped to avoid truncations
                        if (!snap.isGenerating) {
                            finalMessage = msg;
                            finalParsed = parsed;
                            isDone = true;
                            break;
                        }
                    }
                } catch(e) {
                    lastError = e;
                }
            }
            
            await new Promise(r => setTimeout(r, this.POLL_INTERVAL_MS));
        }

        if (!finalMessage) {
            throw new Error(`CRITICAL: Timed out or failed to extract a valid AgencyMessage. Last error: ${lastError?.message}`);
        }

        await this.writer.applyResponse(finalParsed, finalMessage, persona, 'agency-coordinator', phase);
    }
}
