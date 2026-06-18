# Project Proposal — Devio Autonomous Agency Engine V3 (Native Merge)

**Prepared for:** Devio Client
**Prepared by:** Morpheus, Senior Client Partner — Devio
**Date:** 2026-06-18
**Version:** 3.0
**Engagement:** Antigravity IDE Plugin — Autonomous Orchestration Engine

---

## Executive Summary

Following your strategic decision to choose Option B, this proposal outlines the plan to natively merge the capabilities of the Antigravity Link extension directly into the Devio plugin. 

Instead of relying on a fragile HTTP bridge to a separate extension, Devio will integrate the underlying Chrome DevTools Protocol (CDP) services. This gives the Devio orchestration engine native, programmatic control over the Antigravity IDE chat interface, robust multi-window management, and its own built-in MCP server. The result is a premium, single-plugin experience that drives the agency loop autonomously without any setup friction (no network ports, no authentication tokens).

---

## Scope of Work

### What is included

- **Native Orchestration Engine** — a loop runner embedded in the VS Code extension host that manages the full phase lifecycle: BRIEF → RESEARCH → PROPOSAL → ARCHITECTURE → DEVELOPMENT → REVIEW → DELIVERY → DONE.
- **Native CDP Integration** — direct integration of the forked `cdp.ts` and related services. The engine communicates directly with the IDE's UI layer, eliminating HTTP polling.
- **Window Management** — intelligent scoring and targeting to handle multiple running Antigravity IDE instances seamlessly.
- **Prompt Builder & Workspace Writer** — assembles system context, agent tasks, and applies agent outputs atomically to the workspace files.
- **ConversationManager** — ensures each agent turn runs in a clean context to prevent cross-contamination between roles (e.g., Researcher context vs. Developer context).
- **Two User Settings** (VS Code Settings):
  - `devio.autonomyMode` — `"full"` (headless to DONE) or `"supervised"` (pauses at each phase transition for your approval).
  - `devio.freshConversationPerTurn` — boolean (default: `true`). Disabling this accumulates all turns in a single session.
- **Embedded MCP Server** — the Devio plugin will bundle and expose `mcp-server.mjs` natively.
- **Live webview updates** — the existing dashboard reflects engine progress in real time.

### What is NOT included

- A new webview UI redesign (the existing dashboard is retained and extended).
- Integration with external LLM APIs (OpenAI, Anthropic, etc.) — the engine drives your active Antigravity session only.
- Model selection automation — the model used is whichever is active in your Antigravity session.

---

## Phased Roadmap

### Phase 1 — Foundation: Native CDP Integration

**Objective:** Merge the forked CDP services into Devio and establish reliable, native communication with the IDE chat window.

**Duration:** 1 week

**Key Deliverables:**
- Merge `src/services/` and `src/server/` from the fork into Devio's architecture.
- `NativeBridge` class exposing `captureSnapshot()`, `injectMessage()`, and `connectCDP()` directly to the engine.
- `ConversationManager` implemented via native CDP commands (e.g., clicking "New Chat").
- Settings registration: `devio.autonomyMode`, `devio.freshConversationPerTurn`.

**Acceptance Criteria:**
- The plugin can natively read and write to the active Antigravity session without an external HTTP server.
- Window management correctly identifies and targets the active chat surface.

---

### Phase 2 — Core: Prompt Builder & Workspace Writer

**Objective:** Build the intelligence components that assemble prompts and apply agent outputs.

**Duration:** 1 week

**Key Deliverables:**
- `PromptBuilder` — reads SKILL.md and workspace files.
- `WorkspaceWriter` — parses tagged blocks in agent responses and atomically updates files and `inbox.jsonl`.
- Integration tests simulating CDP responses.

**Acceptance Criteria:**
- Given a phase and a set of workspace files, `PromptBuilder` produces a complete context prompt.
- `WorkspaceWriter` correctly applies file creations, modifications, and message appends.

---

### Phase 3 — Orchestrator: The Loop

**Objective:** Assemble the engine loop that chains phases together autonomously.

**Duration:** 1 week

**Key Deliverables:**
- `OrchestrationEngine` — reads `state.json`, activates the correct phase, drives the `NativeBridge`, and advances the state.
- Supervised mode approval UI in the webview.
- Error handling and escalation pathways.

**Acceptance Criteria:**
- In `full` mode: the agency runs end-to-end without human input.
- In `supervised` mode: pauses at phase boundaries for approval.

---

### Phase 4 — Polish, MCP & Delivery

**Objective:** Harden the engine, expose the MCP server, and package the final plugin.

**Duration:** 1 week

**Key Deliverables:**
- Integrate and bundle `mcp-server.mjs`.
- Comprehensive unit and integration tests.
- Deliverable `.vsix` package.

**Acceptance Criteria:**
- QA audit passes with no CRITICAL or HIGH findings.
- The built-in MCP server is accessible and functional.
- The `.vsix` installs cleanly and operates as a standalone solution.

---

## Assumptions & Risks

| # | Item | Type | Mitigation |
|:--|:-----|:-----|:-----------|
| 1 | Antigravity IDE is launched with `--remote-debugging-port` | Assumption | Plugin health check detects this and surfaces clear launch instructions if missing. |
| 2 | CDP DOM Selectors may change in future IDE updates | **RISK — Medium** | The Architect will design a resilient selector mapping configuration that can be updated without core engine changes. |
| 3 | Model selection is outside plugin control | **RISK — Low** | Documented as a known limitation; the user manually selects the model before execution. |

---

## Investment Summary

| Phase | Scope | Duration | Effort |
|:------|:------|:---------|:-------|
| 1 — Native CDP Integration | Merge services, Window Management, NativeBridge | 1 week | High |
| 2 — Prompt & Workspace Core | PromptBuilder, WorkspaceWriter | 1 week | High |
| 3 — Orchestrator Loop | State Machine, Supervised UI | 1 week | High |
| 4 — Polish & MCP Delivery | Testing, MCP Integration, Packaging | 1 week | Medium |
| **Total** | | **4 weeks** | |

**Budget:** Unlimited (per client confirmation).
**Timeline:** 4 weeks from Architecture approval.
