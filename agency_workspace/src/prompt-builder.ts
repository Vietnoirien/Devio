import * as path from 'path';

export class PromptBuilder {
    constructor(private workspacePath: string) {}

    async buildPrompt(persona: string, phase: string): Promise<{ prompt: string; validationKey: string }> {
        const validationKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const prompt = `Phase: ${phase}
Context: @.agent/skills/${persona}/SKILL.md
Context: @.agent/skills/agency-coordinator/references/message_types.md
History: @agency_workspace/inbox.jsonl

CRITICAL INSTRUCTION: You are ${persona}. You MUST ONLY perform ONE turn.
1. Read the history and decide your next action.
2. If your action requires creating or modifying files (e.g., writing code, updating markdown), output them FIRST. You MUST format each file EXACTLY like this:
file:///home/viet/git-perso/MaxApp/Devio/agency_workspace/path/to/file.ext
\`\`\`
... exact file content here ...
\`\`\`
3. AFTER your files (or if no files are needed), output EXACTLY ONE valid JSONL message representing your action on the message bus.
4. Your JSON MUST contain the exact key-value pair: "devio_validation_key": "${validationKey}"
5. Your JSON MUST strictly follow the Message Bus Protocol schema defined in message_types.md. Ensure all required fields (id, timestamp, from, to, phase, type, ref_doc, message, in_reply_to, status) are present with your dynamic data.
6. CRITICAL: You must properly escape all internal double quotes inside your JSON string values (e.g. use \\" for internal quotes).
7. STOP execution immediately after generating your JSONL message.`;

        return { prompt, validationKey };
    }
}
