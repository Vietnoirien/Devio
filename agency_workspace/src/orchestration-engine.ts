import { INativeBridge } from './native-bridge';
import { ConversationManager } from './conversation-manager';
import { PromptBuilder } from './prompt-builder';
import { WorkspaceWriter } from './workspace-writer';

export class OrchestrationEngine {
    constructor(
        private bridge: INativeBridge,
        private convMgr: ConversationManager,
        private promptBuilder: PromptBuilder,
        private writer: WorkspaceWriter
    ) {}

    async runTurn(persona: string, phase: string, freshConversationPerTurn: boolean): Promise<void> {
        if (freshConversationPerTurn) {
            await this.convMgr.openFreshChat();
        }

        const prompt = await this.promptBuilder.buildPrompt(persona, phase);
        await this.bridge.injectMessage(prompt);

        // Wait for generation to start and then finish
        // We'll poll every 1s
        let isDone = false;
        let finalHtml = '';
        
        while (!isDone) {
            const snap = await this.bridge.captureSnapshot();
            if (!snap.isGenerating && snap.html) {
                // To be safe, ensure it actually started generating or we just assume it's done.
                // In a real implementation we might want a small initial delay to let isGenerating become true.
                finalHtml = snap.html;
                isDone = true;
            } else {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        const parsed = this.writer.parseHtml(finalHtml);
        await this.writer.applyResponse(parsed, persona, 'agency-coordinator', phase);
    }
}
