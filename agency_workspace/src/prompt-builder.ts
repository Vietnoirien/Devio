import * as fs from 'fs/promises';
import * as path from 'path';

export class PromptBuilder {
    constructor(private workspacePath: string) {}

    async buildPrompt(persona: string, phase: string): Promise<string> {
        // Read SKILL.md
        // Let's assume skill files are in .agent/skills/
        const skillPath = path.join(this.workspacePath, '.agent', 'skills', persona, 'SKILL.md');
        let skillContent = '';
        try {
            skillContent = await fs.readFile(skillPath, 'utf8');
        } catch (e) {
            // Ignore missing skill
            console.warn(`WARN: Missing skill file for ${persona}`);
        }

        const inboxPath = path.join(this.workspacePath, 'agency_workspace', 'inbox.jsonl');
        let inboxContent = '';
        try {
            inboxContent = await fs.readFile(inboxPath, 'utf8');
        } catch (e) {
            // Ignore missing inbox
        }

        return `Phase: ${phase}\n\n${skillContent}\n\n${inboxContent}`;
    }
}
