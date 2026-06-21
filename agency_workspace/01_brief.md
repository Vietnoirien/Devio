# Project Brief: Devio Plugin Complete Revamp

## 1. Business Goal
Complete removal and reconstruction of the actual bugged Devio plugin system. The goal is to transition from horizontal, untestable individual features to a structured roadmap with vertical tasking (one file per task), approaching the system design shown in the provided SOTA video reference. The objective is to fragment skills, reduce prompt length, and integrate task-related series of skills through path linking.

## 2. Key Requirements
- **Vertical Tasking:** Each vertical task must have its own detailed file (one file per task) rather than cramming everything into a single architecture document. A vertical task must operate on all the app layers and be fully testable at the end of the task.
- **Skill Fragmentation & Path Linking:** Completely change the current system to approach the video's methodology. Reduce individual skills into fragmented, task-related series that are relayed to agents via path linking, mitigating excessively long prompts.
- **Roles & Personas:** Completely redefine all agent roles based on the video's methodology. Do not reuse the existing horizontal personas.
- **System Reconstruction:** Full removal and reconstruction of the current bugged workflow system, rather than just patching missing agent inclusion.
- **Independent SOTA Research:** Explore State-of-the-Art (SOTA) agentic systems, prompting strategies, directory structures, path linking mechanisms, and testing verification methods based on the YouTube reference. The agency must self-resolve technical implementation details via internet research rather than requiring client intervention.

## 3. Reference Material
- Video Analysis: https://www.youtube.com/watch?v=-QFHIoCo-Ko

## 4. Phase
Currently transitioning to the PROPOSAL phase. The BRIEF is now complete and validated. The client has mandated that the agency must perform SOTA research to determine the structural implementation details (directory structure, testing, path linking mechanisms) instead of asking the client. The next step is to delegate this deep-dive research to the Researcher (via the Lead Developer) to finalize the intelligence before drafting the proposal.
