import { INativeBridge } from './native-bridge';
import { ConversationManager } from './conversation-manager';
import { PromptBuilder } from './prompt-builder';
import { WorkspaceWriter } from './workspace-writer';
import * as vscode from 'vscode';

export class ModelSwitchTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ModelSwitchTimeoutError';
    }
}

export class OrchestrationEngine {
    private START_TIMEOUT_MS = 5000;
    private POLL_INTERVAL_MS = 1000;
    private isStopped = false;

    constructor(
        private bridge: INativeBridge,
        private convMgr: ConversationManager,
        private promptBuilder: PromptBuilder,
        private writer: WorkspaceWriter,
        private responseSelector?: string
    ) {}

    public stop() {
        this.isStopped = true;
    }

    async runTurn(persona: string, phase: string, freshConversationPerTurn: boolean): Promise<void> {
        this.isStopped = false;
        if (freshConversationPerTurn) {
            await this.convMgr.openFreshChat();
        }

        const targetModel = vscode.workspace.getConfiguration('devio.agentLLMs').get<string>(persona);
        if (targetModel) {
            try {
                if ((this.bridge as any).switchModel) {
                    await (this.bridge as any).switchModel(targetModel);
                    console.log(`Switched to model ${targetModel} for persona ${persona}`);
                    
                    // Task 1 & 2: Polling loop for model registration
                    let modelSwitched = false;
                    const startTime = Date.now();
                    while (!modelSwitched && !this.isStopped) {
                        if (Date.now() - startTime > 10000) {
                            throw new ModelSwitchTimeoutError(`Timeout waiting for model to switch to ${targetModel}`);
                        }
                        const snap = await this.bridge.captureSnapshot();
                        if (snap.controlsMeta?.model?.text === targetModel) {
                            modelSwitched = true;
                            break;
                        }
                        await new Promise(r => setTimeout(r, 100)); // Delay from Task 2 to avoid blocking
                    }
                }
            } catch (err: any) {
                if (err instanceof ModelSwitchTimeoutError) {
                    this.stop();
                    throw err; // Let it bubble up to extension.ts to handle UI update and bypass message injection
                }
                console.error(`Failed to switch model to ${targetModel}: ${err.message}`);
            }
        }


        const { prompt, validationKey } = await this.promptBuilder.buildPrompt(persona, phase);
        await this.bridge.injectMessage(prompt);

        let isDone = false;
        let finalMessage: any = null;
        let finalParsed: any = null;
        let lastError: any = null;
        
        while (!isDone) {
            if (this.isStopped) {
                return; // Gracefully abort
            }
            const snap = await this.bridge.captureSnapshot();
            
            if (snap.html) {
                const parsed = this.writer.parseHtml(snap.html, this.responseSelector);
                try {
                    const msg = await this.writer.extractMessage(parsed, validationKey);
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

        await this.writer.applyResponse(finalParsed, finalMessage, persona, 'agency-ceo', phase);
    }
}
