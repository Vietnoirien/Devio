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

        const prompt = await this.promptBuilder.buildPrompt(persona, phase);
        await this.bridge.injectMessage(prompt);

        // Wait for generation to start (isGenerating becomes true)
        const startDeadline = Date.now() + this.START_TIMEOUT_MS;
        let started = false;
        while (Date.now() < startDeadline) {
            const snap = await this.bridge.captureSnapshot();
            if (snap.isGenerating) {
                started = true;
                break;
            }
            await new Promise(r => setTimeout(r, this.POLL_INTERVAL_MS));
        }

        if (!started) {
            console.warn('WARN: Timed out waiting for generation to start. Proceeding anyway.');
        }

        // Wait for generation to finish (isGenerating becomes false)
        let isDone = false;
        let finalHtml = '';
        
        while (!isDone) {
            const snap = await this.bridge.captureSnapshot();
            if (!snap.isGenerating && snap.html) {
                finalHtml = snap.html;
                isDone = true;
            } else {
                await new Promise(r => setTimeout(r, this.POLL_INTERVAL_MS));
            }
        }

        const parsed = this.writer.parseHtml(finalHtml, this.responseSelector);
        await this.writer.applyResponse(parsed, persona, 'agency-coordinator', phase);
    }
}
