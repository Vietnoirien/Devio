# Client Intelligence Report — Devio User

**Prepared by:** agency-researcher (Sam)  
**Date:** 2026-06-20T14:50:00+02:00  
**Status:** COMPLETE  
**Sources:** `agency_workspace/src/webview/App.tsx`, `agency_workspace/src/extension.ts`, `package.json`

---

## 1. Company Overview

| Field | Value |
|:---|:---|
| Company Name | Devio User |
| Website | N/A |
| Industry / Sector | Software Development |
| Country / Region | N/A |
| Estimated Size | N/A |
| Years in Operation | N/A |

The client uses the Devio workspace, powered by the Devio AI Agency Extension and the Antigravity Link extension, to automate development workflows through autonomous agent orchestration.

---

## 2. Products & Services

- **Devio AI Agency Extension**: A VS Code extension orchestrating an autonomous agency workflow.
- **Antigravity Link Extension**: A bridge to the Antigravity AI interface, exposing MCP tools and HTTP endpoints.

---

## 3. Current Digital Presence

| Dimension | Assessment |
|:---|:---|
| Website Quality | N/A |
| Mobile Friendly | N/A |
| Technology Stack (visible) | TypeScript, VS Code Extension API, React Webview, Express/WebSockets |
| Existing Portal / E-commerce | N/A |
| Social Media Activity | N/A |
| Content / SEO Strategy | N/A |

The current digital workspace uses a React webview (`App.tsx`) to trigger the agency loop, running in `extension.ts`, which communicates with `devio-antigravity-link-extension` to inject prompts and monitor generation states.

---

## 4. Pain Points & Opportunities (Inferred)

> These are inferences from public data — not confirmed by the client.

- **Settings Tab Constraints**: The Autonomy Mode setting and the Antigravity Link port input are currently hardcoded or disabled/read-only in the UI settings tab. Users have to manually open VS Code's settings.json to change them, which is a subpar UX.
- **Continuous Execution Loop**: Currently, clicking the "Run Agency" button triggers an infinite loop that continues execution until the client is addressed or a manual stop event is sent. There is no middle-ground step-by-step or supervised mode where the user can inspect intermediate agent prompts and step forward prompt-by-prompt.

---

## 5. Competitive Context

Advanced agentic tools and developer automation dashboards (e.g., Cursor, GitHub Copilot Workspace, custom developer playgrounds) offer both fully autonomous and step-by-step (supervised) execution modes. This allows developers to debug, preview, and approve or revise agent messages before they are processed by the LLM.

---

## 6. Key Facts for the Proposal

> Bullet points for quick reference by Lead Developer and Architect.

### Settings UI Configuration
- **Front-end State & Rendering (`App.tsx`)**:
  - Add state variables `autonomyMode` (default `'supervised'`) and `antigravityLinkPort` (default `'3717'`) in `App.tsx`.
  - Listen to `settingsData` message events and populate these values dynamically.
  - Remove the `disabled` property from the Autonomy Mode select drop-down, and hook its `onChange` event to `handleAutonomyModeChange` which dispatches a `saveAutonomyMode` command with the new mode.
  - Remove the `disabled` property and static value from the Antigravity Link Port input field, change its type to `number`, and hook its `onChange` event to `handlePortChange` which dispatches a `saveAntigravityLinkPort` command with the updated port number.
- **Backend Configuration & Persistence (`extension.ts` & `package.json`)**:
  - Retrieve the current configuration values for `devio.autonomyMode` and `devio.antigravityLinkPort` in the `getSettingsData` message handler and include them in the `settingsData` postMessage payload to the webview.
  - Add command handlers for `saveAutonomyMode` and `saveAntigravityLinkPort` in `extension.ts` to update the global VS Code configuration dynamically using `vscode.workspace.getConfiguration('devio').update(...)`.

### Step-by-Step Execution Mode
- **Orchestration Loop Modification (`extension.ts`)**:
  - In `extension.ts`, under the `runAgency` message handler, check the active `devio.autonomyMode` value after running each turn via `await orchestrationEngine.runTurn(...)`.
  - If `autonomyMode === 'supervised'`, break the execution loop immediately after running a single turn, reset `isRunning` to `false`, and display a `vscode.window.showInformationMessage('Step complete. Press Run Agency / Continue to proceed.')`.
  - This effectively turns the "Run Agency" button into a "Run Step" / "Continue" action when in supervised mode, leaving the user time to inspect the conversation history before advancing.
- **Dynamic Button UI**:
  - The "Run Agency" button in the webview can dynamically adjust its tooltip or title label to "Continue" if `autonomyMode === 'supervised'` and there are messages in the conversation (signaling that the agency has already initiated work).

---

## 7. Research Gaps

> Items the Researcher could not verify from public sources. These may need to be addressed during the BRIEF clarification phase.

- None. The frontend state hooks, extension IPC messages, and VS Code Configuration APIs are fully documented and ready for integration.

---

## 8. Native 'isGenerating' State Handling

Based on a component-specific deep-dive into the codebase:
- **Detection Mechanism**: Natively, the `isGenerating` boolean indicates whether the Antigravity Link LLM is actively streaming or generating a response. It is determined by the presence and visibility of the cancel button element (which has the selector `[data-tooltip-id="input-send-button-cancel-tooltip"]`) in the Antigravity IDE UI. If this button exists and is visible (`offsetParent !== null`), the state is considered generating.
- **Orchestration Loop Sync**: The `OrchestrationEngine.runTurn()` method in `orchestration-engine.ts` polls `captureSnapshot` and blocks until `!snap.isGenerating` is true to guarantee that the LLM response is complete and not truncated before extracting the message and saving it.
- **Supervised Mode Behavior**: Since `runTurn()` only returns when the current turn is fully complete (which means the LLM generation has finished and `isGenerating` has already naturally transitioned back to `false`), no manual or custom toggling of `isGenerating` is required during the pause state. The backend in `extension.ts` will break the loop and post `{ type: 'agencyRunning', isRunning: false }` to the webview. This naturally hides the typing animation and restores the Run/Continue button.
