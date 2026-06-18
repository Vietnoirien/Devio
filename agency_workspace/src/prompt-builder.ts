import * as vscode from 'vscode';

export class PromptBuilder {
    constructor(private workspacePath: string, private globalStorageUri: vscode.Uri) {}

    async buildPrompt(persona: string, phase: string): Promise<{ prompt: string; validationKey: string }> {
        const validationKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        const skillPath = vscode.Uri.joinPath(this.globalStorageUri, '.agent', 'skills', persona, 'SKILL.md').fsPath;
        const typesPath = vscode.Uri.joinPath(this.globalStorageUri, '.agent', 'skills', 'agency-coordinator', 'references', 'message_types.md').fsPath;

        const prompt = `Phase: ${phase}
Context: @${skillPath}
Context: @${typesPath}
History: @agency_workspace/inbox.jsonl

CRITICAL INSTRUCTION: You are ${persona}.
1. Read the history and decide your next action.
2. USE YOUR BUILT-IN TOOLS (e.g. replace_file_content, run_command, search_web) to perform the actual work (writing code, researching, etc.) BEFORE generating your final response. You may use as many tool calls and turns as necessary to complete your task.
3. Once the work is fully complete, output EXACTLY ONE valid JSONL message representing your action on the message bus.
4. Your JSON MUST contain the exact key-value pair: "devio_validation_key": "${validationKey}"
5. Your JSON MUST strictly follow the Message Bus Protocol schema defined in message_types.md. Ensure all required fields (id, timestamp, from, to, phase, type, ref_doc, message, in_reply_to, status) are present with your dynamic data.
6. CRITICAL: You must properly escape all internal double quotes inside your JSON string values (e.g. use \\" for internal quotes).`;

        return { prompt, validationKey };
    }
}
