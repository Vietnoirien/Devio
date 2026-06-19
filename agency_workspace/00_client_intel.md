# Client Intelligence Report — Devio User

**Prepared by:** agency-researcher (Sam)  
**Date:** 2026-06-19T21:59:35+02:00  
**Status:** COMPLETE  
**Sources:** `/home/viet/git-perso/MaxApp/Devio/agency_workspace/src`, `/home/viet/git-perso/MaxApp/Devio/devio-antigravity-link-extension/`

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

- Currently, the "Run Agency" button becomes a disabled loading circle and provides no way to abort execution.
- LLM models are not granularly controlled per agent, meaning the same model is used regardless of the agent's specific role or complexity.

---

## 5. Competitive Context

Advanced AI IDEs and orchestration platforms (like Cursor, GitHub Copilot Workspace) often provide granular model selection depending on the task (e.g., using a faster model for simple generation and a reasoning model for architecture) and a clear mechanism to cancel generation.

---

## 6. Key Facts for the Proposal

> Bullet points for quick reference by Lead Developer and Architect.

- **Dev Port Integration**: The Antigravity Link features have been merged internally. The `agency_workspace/src/native-bridge.ts` uses the Chrome DevTools Protocol (CDP) to connect directly to the IDE's DevPort (`devio.antigravityLinkPort`). It exposes methods like `captureSnapshot`, `injectMessage`, and `clickButton`.
- **LLM Switching Mechanism**: We can use `bridge.captureSnapshot()` to retrieve the current DOM state, extract the model button's CSS selector from `controlsMeta.model.selector`, click it using `bridge.clickButton(selector)` to open the dropdown, and then click the target LLM by its name using `bridge.clickButton('model_name')` (which resolves via the `text_hit` strategy).
- **Conversation Termination (Stop Button)**: Generation can be canceled directly over CDP by targeting the cancel button tooltip (`[data-tooltip-id="input-send-button-cancel-tooltip"]`) or using `controlsMeta.stop.selector` from the snapshot, and triggering it via `bridge.clickButton()`.
- **Run Agency Button Logic**: Handled in `agency_workspace/src/webview/App.tsx`. The UI must be updated to dispatch a `stopAgency` message when the button is clicked during execution, which breaks the local `isRunning` loop in `extension.ts` and invokes the native CDP stop click via `NativeBridge`.

---

## 7. Research Gaps

> Items the Researcher could not verify from public sources. These may need to be addressed during the BRIEF clarification phase.

- Exact configuration pattern for LLM mapping (e.g., whether to store it in `devio` workspace configurations or directly within the `SKILL.md` metadata).
