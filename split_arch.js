const fs = require('fs');

// Create memory files
const agents = ['agency-ceo', 'agency-architect', 'agency-lead-developer', 'agency-researcher', 'agency-developer', 'agency-qa', 'agency-designer', 'agency-secretary'];
agents.forEach(a => fs.writeFileSync(`agency_workspace/memory/${a}.md`, `# Memory for ${a}\n\n`));

// Read architecture
const arch = fs.readFileSync('agency_workspace/03_architecture.md', 'utf-8');

// Split into pieces
const roadmapIndex = arch.indexOf('## Phased Implementation Roadmap');
const roadmapPart = arch.substring(roadmapIndex);

const phase1Index = roadmapPart.indexOf('### Phase 1');
const phase2Index = roadmapPart.indexOf('### Phase 2');

// Write roadmap overview
const roadmapOverview = arch.substring(0, roadmapIndex) + '\n## Roadmap (See phase folders for details)\n';
fs.writeFileSync('agency_workspace/architecture/00_roadmap.md', roadmapOverview);

// We can just create placeholder files for tasks and I will ask the team to fill them in
const tasksPhase1 = ['task_1_ui_event', 'task_2_blackboard', 'task_3_event_bus'];
tasksPhase1.forEach(t => fs.writeFileSync(`agency_workspace/architecture/phase_1/${t}.md`, `# ${t}\n\n`));

const tasksPhase2 = ['task_4_base_agent', 'task_5_domain_supervisors'];
tasksPhase2.forEach(t => fs.writeFileSync(`agency_workspace/architecture/phase_2/${t}.md`, `# ${t}\n\n`));

// Create a placeholder intel file
fs.writeFileSync('agency_workspace/intelligence/00_intel_index.md', '# Intelligence Index\n\n');

