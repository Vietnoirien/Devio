# Devio User — Project Proposal

**Prepared by:** Devio AI Development Agency
**Date:** 2026-06-20
**Version:** 1.0

---

## Executive Summary

Devio proposes a major update (v0.11.0) to expand the agency's orchestration capabilities and enhance the document viewer. We will integrate two new specialized agents, a Designer ("Tank") and an Accountant ("Councillor Hamann"), to elevate aesthetic quality and provide realistic project quoting. Concurrently, we will transition to a fully autonomous file viewer that automatically retrieves edited files, applies syntax highlighting via a custom React tokenizer, renders markdown, and provides explicit agent edit attribution.

---

## Scope of Work

### In Scope
- **Agent Integration**: Implementation of the Designer agent ("Tank") for UI/UX oversight and Accountant agent ("Councillor Hamann") for quote calculations.
- **Autonomous File Retrieval**: Automatic extraction of modified files by scanning the workspace post-turn and attaching them to the `AgencyMessage`.
- **Rich File Presentation**: Dynamic file type detection, custom single-pass Regex syntax highlighting in React, and full markdown rendering.
- **Agent Attribution**: An attribution bar and edit history log in the webview to track which agent made specific changes during which phase.

### Out of Scope
> [!IMPORTANT]
> The following items are explicitly **not** included in this engagement. Changes to scope require a written amendment.

- Legacy chat history migration or formatting of past conversations.
- WebSockets or external API polling for state emission (we rely on native DevPort/CDP integration).
- Any external script or CDN-loaded highlighters (due to VS Code CSP restrictions).

---

## Phased Roadmap

### Phase 1 — Expansion of Agent Orchestration
**Duration:** 1 week
**Objective:** Integrate new specialized agents into the Devio workflow.

| Deliverable | Description | Acceptance Criteria |
|:---|:---|:---|
| Designer Agent Integration | Add "Tank" to handle UI/UX across phases. | The agency-designer skill is created and successfully registers in the settings UI. |
| Accountant Agent Integration | Add "Councillor Hamann" to calculate quotes. | The agency-accountant skill is created and quotes are correctly calculated using French/European senior AI dev rates. |

---

### Phase 2 — Fully Autonomous File Viewer
**Duration:** 2 weeks
**Objective:** Automate file tracking and enhance the visual presentation of code and documents.

| Deliverable | Description | Acceptance Criteria |
|:---|:---|:---|
| Autonomous File Retrieval | Automatic tracking of edited files without explicit prompt requests. | The extension host captures pre-turn timestamps and appends modified files to the `AgencyMessage`. |
| Syntax Highlighting & Markdown | Custom React-based regex tokenizer and markdown parser. | Code blocks are correctly colored per language and markdown is fully rendered without CSP errors. |
| Agent Attribution | Visual indicators linking edits to specific agents. | The webview displays a clear attribution bar and edit history log for each file. |

---

## Assumptions

The following assumptions underpin this proposal. If any assumption proves incorrect, scope and timeline may need to be revisited.

1. The Google Antigravity DevPort and native CDP connection will consistently allow workspace scanning post-turn without performance degradation.
2. The current React webview architecture (Vite) is sufficient to handle the custom Regex tokenizer without heavy performance overhead.
3. This is Devio Internal Work; therefore, strict budget constraints and timeline ceilings are waived, though estimated below for completeness.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|:---|:---|:---|:---|
| Heavy file scanning causing latency | Medium | High | Exclude massive directories (`.git`, `node_modules`, `dist`) from the post-turn scan. |
| CSP blocking custom highlighter | Low | High | Build the tokenizer entirely in native React without relying on external CDNs. |

---

## Investment Summary

Since this is Devio Internal Work, no formal budget limits apply. However, per the requirements for Councillor Hamann, the equivalent cost is modeled on a team rate of 1,500 € HT per day (2 senior AI-powered French developers).

| Phase | Duration | Estimated Cost |
|:---|:---|:---|
| Phase 1 — Expansion of Agent Orchestration | 1 week (5 days) | €7,500 |
| Phase 2 — Fully Autonomous File Viewer | 2 weeks (10 days) | €15,000 |
| **Total** | **3 weeks** | **€22,500** |

> Payment terms: Internal Work (N/A). 

---

## Next Steps

1. Lead Developer and Architect review this proposal for technical feasibility.
2. Client reviews and approves this proposal.
3. Transition to ARCHITECTURE phase.
