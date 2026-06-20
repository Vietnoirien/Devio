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
- **Antigravity AI Models (Dynamic Fetching)**: We must dynamically fetch the available model options directly from the IDE using native DevPort integration with ZERO hardcoded static lists or fallbacks. The exact workflow is:
  1) Call `bridge.captureSnapshot()` to retrieve the current DOM state and extract the model button's CSS selector using `snapshot.controlsMeta.model.selector`.
  2) Call `bridge.clickButton(snapshot.controlsMeta.model.selector)` to click the model button and open the model selection dropdown (VS Code QuickPick).
  3) Wait briefly for the UI to render the dropdown list.
  4) Call `bridge.captureSnapshot()` again to capture the newly visible dropdown elements, making sure to parse `snapshot.controlsHtml` (full body HTML) instead of just `snapshot.html` (which strips elements outside the cascade view).
  5) Parse the returned `snapshot.controlsHtml` (or `snapshot.html`) using cheerio to extract the text by targeting ONLY the custom React dropdown buttons (`button.px-2.py-1.flex.w-full.items-center.justify-between`) and extracting the text specifically from the `span.text-xs.font-medium span` elements. 
  **CRITICAL FIX FINDING:** The reason the model lists remained empty in the previous fix is because the Developer kept the `.monaco-list-row .label-name` extraction as the primary check. Cheerio parses the entire DOM without CSS visibility awareness, so `.monaco-list-row .label-name` matches hidden VS Code command palette elements (e.g., 'Devio: Start AI Agency'). This fills the `models` array with garbage commands instead of models, which prevents `models.length === 0` from triggering, entirely skipping the React extraction fallback. The Developer MUST completely delete the `.monaco-list-row` block from `native-bridge.ts`.
- **Plugin Settings Configuration**: LLM assignment must NOT be stored in the agent's `SKILL.md` file. It must be strictly defined in the plugin's `package.json`. 
  **CRITICAL ANTIGRAVITY IDE CONSTRAINT:** After extensive investigation, it is confirmed that Antigravity IDE completely rejects `type: "object"` for extension configuration settings in `package.json`, even when strictly locked down with `additionalProperties: false` and fully populated defaults. It will continually throw the "not a registered configuration" error. The true constraint is that configurations must be entirely flattened into individual primitive properties. 
  To successfully register the LLMs, the Developer MUST completely remove the `devio.agentLLMs` object configuration and replace it with 8 separate, flat string configurations using dot notation:
  - `"devio.agentLLMs.agency-architect": { "type": "string", "default": "" }`
  - `"devio.agentLLMs.agency-ceo": { "type": "string", "default": "" }`
  - `"devio.agentLLMs.agency-developer": { "type": "string", "default": "" }`
  - `"devio.agentLLMs.agency-lead-developer": { "type": "string", "default": "" }`
  - `"devio.agentLLMs.agency-qa": { "type": "string", "default": "" }`
  - `"devio.agentLLMs.agency-researcher": { "type": "string", "default": "" }`
  - `"devio.agentLLMs.agency-secretary": { "type": "string", "default": "" }`
  - `"devio.agentLLMs.agency-trinity": { "type": "string", "default": "" }`
  Furthermore, the `update` logic in `extension.ts` must be modified to target these flat keys individually (e.g., `config.update('agentLLMs.' + agent, model, ...)`).

- **Deterministic Await for UI Readiness & Model Registration**: 
  1) `openFreshChat()` is ALREADY deterministic. It polls the DOM (`msgs.length === 0`) and waits for the chat to actually clear before returning. No arbitrary `setTimeout` is needed.
  2) For `switchModel(targetModel)`, we can deterministically await model registration by continuously capturing snapshots and polling `snapshot.controlsMeta.model.text` until it matches the `targetModel`. This eliminates the arbitrary 1000ms delay.

---

## 7. Research Gaps

> Items the Researcher could not verify from public sources. These may need to be addressed during the BRIEF clarification phase.

- None. Research findings have fully clarified the deterministic mechanisms required to replace arbitrary timeouts.
- **Agent Roster Verification**: Rigorous inspection of `.agent/skills/` confirms there are exactly 8 active agents: `agency-architect`, `agency-ceo`, `agency-developer`, `agency-lead-developer`, `agency-qa`, `agency-researcher`, `agency-secretary`, and `agency-trinity`. The `agency-coordinator` does not exist and any reference to it is historically inaccurate.
