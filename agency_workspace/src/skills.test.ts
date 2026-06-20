import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Agency Skills', () => {
  it('agency-ceo SKILL.md should instruct the CEO to manage client requests and redirect to Lead Developer and Trinity', () => {
    const skillPath = path.join(__dirname, '../../.agent/skills/agency-ceo/SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    expect(content).toContain('manage client requests and redirect to the Lead Developer (Merovingien), Trinity (HR), Designer (Tank), and Accountant (Councillor Hamann) as needed');
  });

  describe('Task 2: agency-secretary and agency-coordinator', () => {
    it('agency-secretary SKILL.md should exist and contain correct instructions', () => {
      const skillPath = path.join(__dirname, '../../.agent/skills/agency-secretary/SKILL.md');
      expect(fs.existsSync(skillPath)).toBe(true);
      const content = fs.readFileSync(skillPath, 'utf8');
      expect(content).toContain('Archiving triggers ONLY in the DONE phase after agency-trinity has completed her job');
      expect(content).toContain('the CEO or Lead Developer can ask the Secretary (Nyobe) for the context path');
    });

    it('agency-coordinator skill should be completely removed', () => {
      const skillDir = path.join(__dirname, '../../.agent/skills/agency-coordinator');
      expect(fs.existsSync(skillDir)).toBe(false);
    });

    it('agency-coordinator insights should be completely removed', () => {
      const insightsPath = path.join(__dirname, '../../.agent/insights/agency-coordinator_performance.md');
      expect(fs.existsSync(insightsPath)).toBe(false);
    });
  });

  describe('Task 3: Update agency-researcher skill', () => {
    it('agency-researcher SKILL.md should require advanced research techniques and on-page content extraction', () => {
      const skillPath = path.join(__dirname, '../../.agent/skills/agency-researcher/SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf8');
      expect(content).toContain('advanced, in-depth research techniques, including actually searching and extracting content from pages on the net, rather than superficial searches');
    });
  });

  describe('Task 4: Enforce Global "No File Edition" Message Bus Rule', () => {
    it('every agent SKILL.md should contain the critical rule about no file edition', () => {
      const skillsDir = path.join(__dirname, '../../.agent/skills');
      const agents = fs.readdirSync(skillsDir);
      
      agents.forEach(agent => {
        const skillPath = path.join(skillsDir, agent, 'SKILL.md');
        if (fs.existsSync(skillPath)) {
          const content = fs.readFileSync(skillPath, 'utf8');
          expect(content).toContain('NEVER INJECT MESSAGE ON THE BUS BY FILE EDITION TOOLS OR COMMAND');
        }
      });
    });

    it('agency-researcher SKILL.md should explicitly mandate proper JSON output', () => {
      const skillPath = path.join(__dirname, '../../.agent/skills/agency-researcher/SKILL.md');
      const content = fs.readFileSync(skillPath, 'utf8');
      expect(content).toContain('strictly mandate the use of the proper JSON output mechanism');
    });
  });
});
