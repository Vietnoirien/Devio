# Client Brief — V2 Revision

## 1. About Your Organisation

**Company name:** Devio Client
**Industry / sector:** Software Development / AI Tooling

---

## 2. The Problem You Want to Solve

**Core problem:**
The V1 plugin delivered a dashboard and a message form. It does not run the agency. The client wants the plugin to BE the agency runtime — activating agents in sequence, conducting conversations with them, processing their outputs, and advancing the project through phases autonomously. No human should need to intervene between steps unless they choose to.

**Who experiences this problem?**
Developers using the Devio framework inside Antigravity IDE.

**What is the cost of NOT solving it?**
The plugin is a glorified file viewer. The autonomous AI company vision is not realised.

---

## 3. The Vision

**What does the solution look like?**

The plugin contains an **orchestration engine** that:
1. Reads `state.json` to determine the current phase and active agent
2. Loads the active agent's `SKILL.md` and relevant workspace documents as context
3. Builds a structured prompt (system prompt + context + task instruction)
4. Calls the **Antigravity API** with that prompt and receives the agent's response
5. Parses the response to extract: files to write, messages to append to `inbox.jsonl`, state transitions
6. Applies all changes to the workspace atomically
7. Advances the phase and repeats — until `DONE` or a human escalation is required

**User settings (configurable in VS Code Settings):**
- `devio.antigravityModel` — which model to use for agent conversations (e.g. `gemini-2.5-pro`, `claude-sonnet-4`)
- `devio.autonomyMode` — `"full"` (runs headless to DONE) or `"supervised"` (pauses at each phase transition for user approval)

**API credentials — provided by Antigravity, NOT by the user:**
- The endpoint and API key are sourced from Antigravity's own IDE context.
- The Researcher must determine the exact mechanism (see Section 8).

**Trigger:**
The plugin itself. The user clicks "Run Agency" in the webview. The engine runs inside the extension host process.

**Integration:**
- Reads/writes `agency_workspace/` files (existing, working)
- Calls Antigravity API (the Researcher must document how)
- Reports progress live to the webview via existing IPC channel

---

## 4. Target Users

**Who:** Developers using Antigravity IDE with the Devio framework.
**Distribution:** Manual install (`.vsix` package).
**Technical level:** Developers.

---

## 5. Timeline & Budget

**Timeline:** As fast as possible. No hard deadline.
**Budget:** Unlimited.

---

## 6. Success Criteria

1. User clicks "Run Agency" in the plugin → agents execute in correct phase order without further human input (in `full` autonomy mode).
2. In `supervised` mode, the plugin pauses after each phase and prompts the user to approve before continuing.
3. Agent conversations are conducted via the Antigravity API — real LLM calls, not file writes.
4. All workspace files are correctly updated by the engine after each agent turn.
5. The webview reflects live progress — current phase, active agent, latest inbox messages — without a manual refresh.

---

## 7. Constraints

- Must integrate natively with Antigravity IDE (VS Code extension API).
- **API endpoint and key must come from Antigravity's own context** — the plugin must NOT ask the user to configure these manually.
- The model (`devio.antigravityModel`) and autonomy mode (`devio.autonomyMode`) are the only user-facing settings.

---

## 8. Open Research Questions — MANDATORY before Architecture begins

The Researcher must produce documented, verified answers to ALL of the following. Vague or assumed answers are not acceptable. Each answer must cite a source (URL, file path, or code example).

### 8.1 — Antigravity API: How to start a conversation

- What is the base URL of the Antigravity Link API? (The V1 code assumed `http://localhost:11434/v1/devio/invoke` — is this correct?)
- What HTTP method and endpoint starts a new agent conversation?
- What is the exact JSON payload schema? Include all required and optional fields.
- Does the API support a system prompt? If so, which field carries it?
- Is the response synchronous (single JSON body) or streaming (SSE/chunked)?

### 8.2 — Antigravity API: How credentials are exposed to extensions

- Does Antigravity expose a VS Code extension API (`vscode.extensions.getExtension('antigravity').exports`) that returns API config?
- Is the API key available as an environment variable inside the extension host process?
- Is there a configuration file or VS Code workspace setting that Antigravity populates?
- What is the exact call or lookup the plugin must make to obtain the endpoint URL and API key at runtime?

### 8.3 — Antigravity API: Response format and action parsing

- What does a successful response body look like? Provide a real example.
- How does the engine know the agent has finished its turn (e.g. a `finish_reason` field)?
- Is there a structured output mode (JSON schema / tool calls) that the engine can use to receive explicit file-write instructions, or must the engine parse free-form text?

### 8.4 — Antigravity MCP: Available tools

- Does Antigravity expose an MCP server? If so, what tools are available?
- Can the plugin call MCP tools directly to write workspace files, or is MCP only for the agent to call during its turn?

### 8.5 — Existing integration examples

- Is there any existing Antigravity extension, plugin, or SDK example that calls the API from a VS Code extension host? Provide the source.
- Does the Antigravity documentation include a "building extensions" or "Link API" guide?
