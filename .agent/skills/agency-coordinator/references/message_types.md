# Message Types Reference

This document defines all valid message types for the Devio Agency Message Bus (`inbox.jsonl`).
The `agency-coordinator` skill uses this reference to interpret and route messages.

---

## Type Definitions

### `SUBMIT`
**Sender:** Any agent completing a deliverable.
**Purpose:** Signals that a document or artifact is ready for peer review (or client delivery). Opens the review window for the current phase. To deliver to the client, use `"to": "client"`.
**Status on creation:** `OPEN`
**Required fields:** `ref_doc` pointing to the deliverable file.
**Resolves when:** At least one `APPROVE` is posted in response by a qualified reviewer for that phase.

```json
{
  "id": "msg-004",
  "from": "agency-ceo",
  "to": "agency-architect",
  "phase": "PROPOSAL",
  "type": "SUBMIT",
  "ref_doc": "02_proposal.md",
  "message": "Proposal v1 is ready for your technical review. Pay attention to Phase 2 timeline.",
  "status": "OPEN"
}
```

---

### `CLIENT_DELIVERY` (Example of SUBMIT to Client)
**Sender:** `agency-ceo`
**Purpose:** Delivers the final package to the client and stops the loop.
**Required fields:** `"to": "client"`.

```json
{
  "id": "msg-005",
  "from": "agency-ceo",
  "to": "client",
  "phase": "DELIVERY",
  "type": "SUBMIT",
  "ref_doc": "06_delivery_summary.md",
  "message": "The project is complete. Please review the delivery summary and provide your final approval.",
  "status": "OPEN"
}
```

---

### `REQUEST_CHANGE`
**Sender:** Any reviewing agent.
**Purpose:** Formally disputes a deliverable and blocks phase advancement. The author must post a `REVISION` to resolve it.
**Routing Rule:** The Coordinator MUST first route ALL `REQUEST_CHANGE` messages to `agency-researcher` to gather intelligence. The researcher will post an `INFO` message with their findings back to the Coordinator, who will then route the original `REQUEST_CHANGE` to the target author.
**Status on creation:** `OPEN`
**Resolves when:** A matching `REVISION` is posted by the original author with `in_reply_to` referencing this message's `id`, AND the reviewer subsequently posts `APPROVE`.

```json
{
  "id": "msg-005",
  "from": "agency-architect",
  "to": "agency-ceo",
  "phase": "PROPOSAL",
  "type": "REQUEST_CHANGE",
  "ref_doc": "02_proposal.md",
  "message": "Phase 2 at 2 weeks is not achievable given the stated DB migration scope. Recommend 4 weeks minimum.",
  "status": "OPEN"
}
```

---

### `REVISION`
**Sender:** The agent who produced the challenged deliverable.
**Purpose:** Acknowledges a `REQUEST_CHANGE`, describes what was modified, and prompts the reviewer to re-assess.
**Status on creation:** `RESOLVED` (it resolves the author's obligation; the reviewer must still `APPROVE`).
**Required fields:** `in_reply_to` referencing the `REQUEST_CHANGE` message id.

```json
{
  "id": "msg-006",
  "from": "agency-ceo",
  "to": "agency-architect",
  "phase": "PROPOSAL",
  "type": "REVISION",
  "ref_doc": "02_proposal.md",
  "in_reply_to": "msg-005",
  "message": "Phase 2 revised to 4 weeks. Budget updated to reflect extra sprint. Document updated.",
  "status": "RESOLVED"
}
```

---

### `APPROVE`
**Sender:** A reviewing agent.
**Purpose:** Signs off on a deliverable. Phase advances when all required reviewers for that phase have posted `APPROVE`.
**Status on creation:** `RESOLVED`

```json
{
  "id": "msg-007",
  "from": "agency-architect",
  "to": "agency-coordinator",
  "phase": "PROPOSAL",
  "type": "APPROVE",
  "ref_doc": "02_proposal.md",
  "message": "Proposal v2 looks good. Timeline is realistic. Technical assumptions are sound. Approved.",
  "status": "RESOLVED"
}
```

---

### `ESCALATE`
**Sender:** Any agent.
**Purpose:** Signals a deadlock, ambiguity, or decision that requires human (client/partner) input. **Fully stops the agency loop** until the human resolves it.
**Status on creation:** `OPEN`
**Resolves when:** Human provides a decision, which is posted as a `REVISION` with `status: "RESOLVED"`.

```json
{
  "id": "msg-012",
  "from": "agency-qa",
  "to": "client",
  "phase": "REVIEW",
  "type": "ESCALATE",
  "ref_doc": "03_architecture.md",
  "message": "Authentication design uses JWT with no refresh token rotation. This is a OWASP A07 violation. Fixing this requires an architectural change. Human decision needed on auth strategy.",
  "status": "OPEN"
}
```

---

### `INFO`
**Sender:** Any agent.
**Purpose:** Shares context or constraints with another agent without requiring action. Does **not** block phase advancement.
**Status on creation:** `RESOLVED` (informational only)

```json
{
  "id": "msg-003",
  "from": "agency-ceo",
  "to": "agency-architect",
  "phase": "PROPOSAL",
  "type": "INFO",
  "ref_doc": null,
  "message": "Client has a hard budget ceiling of €25,000. Any architecture proposal must fit within this constraint. Cloud costs must be estimated.",
  "status": "RESOLVED"
}
```

---

### `REQUEST_RESEARCH`
**Sender:** Lead Developer (`agency-lead-developer`) or any agent needing deep-dive research.
**Purpose:** Proactively requests a targeted research deep-dive on specific functional components (e.g., UI design) before architecture finalization or development.
**Routing Rule:** Routed to `agency-researcher`.
**Status on creation:** `OPEN`
**Resolves when:** The Researcher posts an `INFO` message with findings, with `in_reply_to` referencing this message's ID.

```json
{
  "id": "msg-015",
  "from": "agency-lead-developer",
  "to": "agency-researcher",
  "phase": "PROPOSAL",
  "type": "REQUEST_RESEARCH",
  "ref_doc": "02_proposal.md",
  "message": "Please research the UI design constraints for the new dashboard.",
  "status": "OPEN"
}
```

---

### `CHALLENGE_SPEC`
**Sender:** Lead Developer (`agency-lead-developer`) or Developer (`agency-developer`).
**Purpose:** Flags a structural flaw, ambiguity, or a missing essential component in the architectural specification, forcing a task-by-task re-evaluation.
**Routing Rule:** Routed to `agency-architect`.
**Status on creation:** `OPEN`
**Resolves when:** The Architect posts a `REVISION` updating the spec, and the challenger subsequently posts `APPROVE`.

```json
{
  "id": "msg-016",
  "from": "agency-lead-developer",
  "to": "agency-architect",
  "phase": "ARCHITECTURE",
  "type": "CHALLENGE_SPEC",
  "ref_doc": "03_architecture.md",
  "message": "Task 4 is ambiguous regarding the data source. Please clarify the integration points.",
  "status": "OPEN"
}
```

---

## Message Lifecycle Summary

```
SUBMIT (OPEN)
  ↓ reviewer reads
REQUEST_CHANGE (OPEN) ← blocks phase
  ↓ author reads
REVISION (RESOLVED) ← unblocks author obligation
  ↓ reviewer re-reads
APPROVE (RESOLVED) ← unblocks phase
```

---

## ID Naming Convention

Message IDs must follow the format `msg-NNN` where NNN is a zero-padded sequential integer (e.g., `msg-001`, `msg-042`). Read `inbox.jsonl` and increment from the last ID found.
