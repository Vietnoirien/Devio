# Devio User — Project Proposal

**Prepared by:** Devio AI Development Agency
**Date:** 2026-06-20
**Version:** 1.0

---

## Executive Summary

Devio proposes to update the Antigravity IDE Plugin to enhance user control and execution visibility. The update will introduce editable configuration fields in the settings tab for Autonomy Mode and Antigravity Link port, alongside a new step-by-step "supervised" execution mode. These enhancements will provide developers with granular control over the agency workflow and enable real-time inspection of agent activities.

---

## Scope of Work

### In Scope
- **Settings UI Configuration:** Update the React webview (`App.tsx`) to include editable state and bindings for `autonomyMode` and `antigravityLinkPort`.
- **Backend Integration:** Update `extension.ts` to dynamically retrieve, update, and persist these settings to the global VS Code configuration.
- **Step-by-Step Execution Mode:** Modify the orchestration loop in `extension.ts` to support a supervised mode, allowing the execution to pause after each turn and wait for the user to click "Continue".
- **Dynamic UI Adaptation:** Update the "Run Agency" button to dynamically switch to a "Continue" action when in supervised mode with an active session.

### Out of Scope
> [!IMPORTANT]
> The following items are explicitly **not** included in this engagement. Changes to scope require a written amendment.

- Changes to the core LLM orchestration logic beyond the pause mechanism.
- Enhancements to the visual design system of the webview beyond what is necessary for the new settings.
- Integration with third-party extensions other than the Antigravity Link extension.

---

## Phased Roadmap

### Phase 1 — UI and State Updates
**Duration:** 1 week
**Objective:** Add editable fields to the Settings tab and bind them to the extension's backend.

| Deliverable | Description | Acceptance Criteria |
|:---|:---|:---|
| Editable Settings UI | Update the webview to allow editing Autonomy Mode and Port. | Inputs are editable and trigger state changes. |
| Backend Settings Integration | Command handlers in `extension.ts` to read/write VS Code configurations. | VS Code settings.json correctly updates upon UI changes. |

---

### Phase 2 — Step-by-Step Execution Mode
**Duration:** 1 week
**Objective:** Implement the supervised execution loop and adapt the main action button.

| Deliverable | Description | Acceptance Criteria |
|:---|:---|:---|
| Paused Execution Loop | Modify `runAgency` in `extension.ts` to break the loop after one turn if in supervised mode. | Execution halts after one turn and prompts user to continue. |
| Dynamic Action Button | Update the main webview button to reflect the "Continue" state when paused. | Button reads "Continue" and resumes the execution loop. |

---

## Assumptions

The following assumptions underpin this proposal. If any assumption proves incorrect, scope and timeline may need to be revisited.

1. The existing communication bridge between the React webview and `extension.ts` is fully functional.
2. VS Code Configuration APIs are fully accessible within the existing extension architecture.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|:---|:---|:---|:---|
| Webview state sync issues | Low | Medium | Thorough testing of message passing between the webview and extension backend. |
| Unintended loop termination | Low | High | Ensure state management correctly distinguishes between a paused supervised step and a full agency stop. |

---

## Investment Summary

Given the client's confirmation of an unlimited budget and flexible timeline, the investment is structured on a Time & Materials basis. The estimates below represent the expected baseline for delivery.

| Phase | Duration | Estimated Cost |
|:---|:---|:---|
| Phase 1 — UI and State Updates | 1 week | €5,000 |
| Phase 2 — Step-by-Step Execution Mode | 1 week | €5,000 |
| **Total** | **2 weeks** | **€10,000** |

> Payment terms: 30% deposit upon signing, 40% at Phase 1 completion, 30% upon final delivery.

---

## Next Steps

1. Client reviews and approves this proposal.
2. Architecture specification phase begins.
3. Phase 1 begins.

---

*This proposal is valid for 30 days from the date of issue.*
