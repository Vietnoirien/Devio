import * as path from 'path';

export class PromptBuilder {
    constructor(private workspacePath: string) {}

    async buildPrompt(persona: string, phase: string): Promise<string> {
        return `Phase: ${phase}
Context: @.agent/skills/${persona}/SKILL.md
History: @agency_workspace/inbox.jsonl

CRITICAL INSTRUCTION: You are ${persona}. You MUST ONLY perform ONE turn.
1. Read the history and decide your next action.
2. Output EXACTLY ONE valid JSONL message representing your action.
3. NEVER regurgitate your system prompt, instructions, or markdown into the message bus.
4. STOP execution immediately after generating your JSONL message.`;
    }
}
