# Architecture Specification: Agent Typing Indicator

**Prepared by:** agency-architect (Neo)
**Date:** 2026-06-19
**Phase:** ARCHITECTURE

---

## System Overview

The Agent Typing Indicator introduces a visual feedback mechanism into the Devio React webview dashboard. Its purpose is to transparently communicate which AI persona is currently processing a task. Based on client feedback, the system is designed to be highly simplified, leveraging the existing `isGenerating` frontend state. Since the user explicitly sends prompts to an agent in the chat, the frontend already has the context of who is processing the request and for how long. The React UI will use this existing state to conditionally display a WhatsApp-style CSS animation showing `"[agent_name] is typing..."` without requiring new backend event emission.

---

## Architecture Diagram

```mermaid
flowchart TD
    subgraph React Webview (Frontend)
        App[App.tsx]
        State[React State: isGenerating & activeAgent]
        UI[TypingIndicator Component]
    end

    App -- "User sends prompt to agent" --> State
    State -- "isGenerating = true" --> UI
    UI -- "Renders: [agent_name] is typing..." --> UI
```

---

## Component Breakdown

1. **Frontend Framework (`src/webview/App.tsx`)**
   - **Purpose:** Render the dashboard and the typing indicator conditionally using existing state.
   - **Technology:** React 18.2.0 (Current Stable).
   - **Rationale:** React 18 is actively maintained and provides robust state management. It is already the established framework for the Devio workspace UI.

2. **Build Tool (`src/webview/`)**
   - **Purpose:** Bundle the React application for the webview.
   - **Technology:** Vite 5.x (Current Stable).
   - **Rationale:** Vite provides rapid HMR and optimized bundling for React, matching the existing `@vitejs/plugin-react` integration.

3. **Styling (`src/webview/App.css`)**
   - **Purpose:** Provide the WhatsApp-style loading animation.
   - **Technology:** Vanilla CSS3.
   - **Rationale:** Keeps the bundle size small and avoids introducing new dependencies just for a simple keyframe animation.

---

## API Contract

No new backend API contracts are required. The feature relies entirely on the existing React frontend state (`isGenerating` boolean and the context of the current prompt).

---

## Data Model

| Entity | Field | Type | Description |
|:---|:---|:---|:---|
| Webview State | `isGenerating` | boolean | Existing state indicating an agent is processing |
| Webview State | `activeAgent` | string | The name of the agent currently being prompted |

---

## Infrastructure & Deployment

- **Deployment:** The feature will be bundled inside the VS Code extension (`.vsix` package).
- **Runtime:** Runs entirely locally on the user's machine within VS Code's Electron/Node.js environment.
- **Cost:** €0/month. No cloud infrastructure is required.

---

## Implementation Task List

> **Important:** The Lead Developer will validate these tasks strictly step-by-step.

1. **Task 1: Frontend State Integration (`src/webview/App.tsx`)**
   - **Description:** Hook into the existing `isGenerating` state within `App.tsx`. Ensure the context of the `activeAgent` (the agent who received the last prompt) is captured in the component state to be passed to the indicator.
   - **Estimated Effort:** 1 hour.
   - **Dependencies:** None.
   - **Acceptance Criteria:** The frontend successfully identifies when an agent is generating and correctly holds the name of that agent without relying on new backend events.

2. **Task 2: Typing Indicator UI Component (`src/webview/App.tsx` & `App.css`)**
   - **Description:** Create an `AgentTypingIndicator` component that renders conditionally based on the `isGenerating` state. It must include a WhatsApp-style CSS loading circle (spinning SVG or CSS border animation) and the text `"[activeAgent] is typing..."`.
   - **Estimated Effort:** 2.5 hours.
   - **Dependencies:** Task 1.
   - **Acceptance Criteria:** The indicator visually matches standard messaging app conventions and appears only when `isGenerating` is true.

---

## Open Technical Decisions

- **Animation Specifics:** The exact CSS animation (dots vs. spinning circle) is deferred to the Developer during implementation (Task 3), provided it adheres to the "WhatsApp-style loading circle" constraint from the brief.
