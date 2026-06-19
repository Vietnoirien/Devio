# Project Proposal: LLM Switching and Stop Button Integration

## Executive Summary
This proposal outlines the strategy for implementing granular, per-agent LLM selection and an interactive stop button for the Devio AI Agency Extension. By allowing different models to be assigned based on agent roles, Devio User will optimize task execution—using fast models for simple tasks and advanced models for complex architectural work. Furthermore, replacing the static "Run Agency" loading indicator with a functional stop button will give users immediate control to gracefully terminate both the agency orchestration loop and the active conversation, significantly enhancing workspace control and transparency.

## Scope of Work
**Included:**
- Implementation of a granular LLM switching mechanism capable of reading model configurations per agent from `SKILL.md` metadata or VS Code settings.
- Native integration using `native-bridge.ts` via the Chrome DevTools Protocol (CDP) to connect directly to the IDE's DevPort. LLM switching will be achieved by capturing a DOM snapshot, extracting the model selector, and triggering `bridge.clickButton()`.
- Refactoring the `App.tsx` "Run Agency" button into a dynamic start/stop toggle.
- Updating `extension.ts` orchestration logic to break the execution loop upon receiving a `stopAgency` event.
- Integration with CDP via `bridge.clickButton()` to directly click the cancel button in the DOM and halt the active cascading conversation seamlessly.

**Not Included:**
- Modifications to core Antigravity AI reasoning algorithms.
- Developing a visual UI editor for setting up `SKILL.md` metadata (relies on manual config or VS Code settings).

## Phased Roadmap

### Phase 1: Architecture & UI Refactoring
- **Objective:** Finalize the technical design and update the React webview UI.
- **Duration:** 1 week
- **Key Deliverables:** Updated architectural spec, revised `App.tsx` replacing the loading circle with a stop toggle button dispatching `stopAgency` events.
- **Acceptance Criteria:** Stop button is visually present during agency execution and triggers the correct stop payload.

### Phase 2: Engine Integration & LLM Switching
- **Objective:** Implement native DevPort integration for LLM switching and termination logic.
- **Duration:** 2 weeks
- **Key Deliverables:** 
  - Updates to `extension.ts` to parse per-agent LLM settings.
  - Native integration via `native-bridge.ts` using CDP and `bridge.clickButton()` to enforce model switches.
  - Direct interaction with the DOM cancel button via CDP to halt generation and break the `isRunning` loop.
- **Acceptance Criteria:** Models switch seamlessly per agent execution; clicking the stop button immediately halts both the agency loop and the active conversation.

## Assumptions & Risks
**Assumptions:**
- The `native-bridge.ts` CDP connection to the IDE's DevPort is stable and provides consistent access to DOM elements.
- The React webview framework allows robust message passing to the VS Code backend during high-load executions.

**Risks:**
- Rapidly switching LLMs via UI simulation over CDP could introduce latency or synchronization issues if the DOM state is not fully ready. We will mitigate this by implementing robust state verification using `bridge.captureSnapshot()` before proceeding with generation.

## Investment Summary
| Phase | Objective | Estimated Cost |
|:---|:---|:---|
| Phase 1 | Architecture & UI Refactoring | Unlimited Budget Allocation |
| Phase 2 | Engine Integration & LLM Switching | Unlimited Budget Allocation |
| **Total** | | **Unlimited** |
