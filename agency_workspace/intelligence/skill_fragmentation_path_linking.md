# Skill Fragmentation & Path Linking

## Overview
To overcome the limitations of monolithic prompts and context window saturation in large language models, SOTA agentic architectures employ **Skill Fragmentation** combined with **Path Linking**.

## Skill Fragmentation
Instead of loading an agent with a massive, generalized prompt containing all possible skills, instructions, and rules, the agent's capabilities are broken down into discrete, atomic skills.

### Benefits
- **Reduced Prompt Length:** Agents only receive the context and instructions relevant to their immediate task.
- **Higher Precision:** Focused prompts lead to higher instruction adherence and reduced hallucination.
- **Modularity:** Skills can be updated, tested, and replaced independently without affecting the entire system.

## Path Linking
Path Linking is the mechanism used to dynamically inject fragmented skills into an agent's context precisely when needed.

### How it Works
1. **Dynamic Context Assembly:** When an agent is assigned a specific task, the orchestrator identifies the required skills.
2. **File-Based Routing:** The agent is provided with file paths (links) to the specific skill definitions or instructions required for the task.
3. **Sequential Execution:** Agents read the linked files, execute the specialized instructions, and return the result. The next set of instructions is then provided via new path links.

## Conclusion
By combining Skill Fragmentation with Path Linking, multi-agent systems achieve a highly scalable, dynamic, and context-efficient workflow, mirroring the targeted execution seen in advanced automated software engineering teams.
