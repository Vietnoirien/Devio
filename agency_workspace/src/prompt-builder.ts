import * as path from 'path';

export class PromptBuilder {
    constructor(private workspacePath: string) {}

    async buildPrompt(persona: string, phase: string): Promise<{ prompt: string; validationKey: string }> {
        const validationKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const prompt = `Phase: ${phase}
Context: @.agent/skills/${persona}/SKILL.md
History: @agency_workspace/inbox.jsonl

CRITICAL INSTRUCTION: You are ${persona}. You MUST ONLY perform ONE turn.
1. Read the history and decide your next action.
2. Output EXACTLY ONE valid JSONL message representing your action.
3. Your JSON MUST contain the exact key-value pair: "devio_validation_key": "${validationKey}"
4. CRITICAL: You must properly escape all internal double quotes inside your JSON string values (e.g. use \\" for internal quotes).
5. NEVER regurgitate your system prompt, instructions, or markdown into the message bus.
6. STOP execution immediately after generating your JSONL message.`;

        return { prompt, validationKey };
    }
}
