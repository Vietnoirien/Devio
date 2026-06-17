# State Schema Reference

This document describes the schema and valid values for `agency_workspace/state.json`.
The `agency-coordinator` reads and writes this file to manage the agency lifecycle.

---

## Schema

```json
{
  "phase": "string — current phase name",
  "owner": "string — active persona skill name",
  "project": "string — human-readable project name",
  "client": "string — client name or organisation",
  "started_at": "ISO-8601 datetime",
  "updated_at": "ISO-8601 datetime",
  "blocked_by": ["msg-NNN", "..."],
  "history": [
    {
      "phase": "string",
      "completed_at": "ISO-8601 datetime",
      "approved_by": ["agency-<persona>", "..."]
    }
  ]
}
```

---

## Field Descriptions

| Field | Type | Description |
|:---|:---|:---|
| `phase` | string | The current active phase. Must be one of the valid phases listed below. |
| `owner` | string | The persona skill that is currently responsible for producing output. |
| `project` | string | A short name for the client engagement (e.g., `"acme-ecommerce-platform"`). |
| `client` | string | Client name or organisation. Set during the BRIEF phase. |
| `started_at` | ISO-8601 | When the engagement was first initialised. |
| `updated_at` | ISO-8601 | Last time `state.json` was modified. Always update this on every write. |
| `blocked_by` | array | List of `msg-NNN` IDs that are currently blocking phase advancement. Updated by coordinator after each inbox scan. Empty array `[]` means no blockers. |
| `history` | array | Append-only log of completed phases with their completion time and approving agents. Never delete entries from this array. |

---

## Valid Phases & Owners

| Phase | Owner | Description |
|:---|:---|:---|
| `BRIEF` | `agency-ceo` | Waiting for client to fill out `01_brief.md` |
| `RESEARCH` | `agency-researcher` | Researcher performs client due diligence and produces `00_client_intel.md` |
| `PROPOSAL` | `agency-ceo` | CEO drafts and negotiates the business proposal |
| `ARCHITECTURE` | `agency-architect` | Architect designs the technical solution |
| `DEVELOPMENT` | `agency-developer` | Developer implements the solution |
| `REVIEW` | `agency-qa` | QA audits code, security, and architecture alignment |
| `DELIVERY` | `agency-ceo` | CEO compiles and presents final client package |
| `DONE` | `—` | Engagement complete. No further writes. |

---

## Example: Initial State

```json
{
  "phase": "BRIEF",
  "owner": "agency-ceo",
  "project": "",
  "client": "",
  "started_at": "2026-06-17T11:00:00Z",
  "updated_at": "2026-06-17T11:00:00Z",
  "blocked_by": [],
  "history": []
}
```

## Example: After RESEARCH Phase

```json
{
  "phase": "PROPOSAL",
  "owner": "agency-ceo",
  "project": "acme-ecommerce-platform",
  "client": "Acme Corp",
  "started_at": "2026-06-17T11:00:00Z",
  "updated_at": "2026-06-17T12:30:00Z",
  "blocked_by": [],
  "history": [
    {
      "phase": "BRIEF",
      "completed_at": "2026-06-17T11:30:00Z",
      "approved_by": ["agency-ceo"]
    },
    {
      "phase": "RESEARCH",
      "completed_at": "2026-06-17T12:30:00Z",
      "approved_by": ["agency-researcher"]
    }
  ]
}
```

## Example: Mid-Project State (Blocked)

```json
{
  "phase": "PROPOSAL",
  "owner": "agency-ceo",
  "project": "acme-ecommerce-platform",
  "client": "Acme Corp",
  "started_at": "2026-06-17T11:00:00Z",
  "updated_at": "2026-06-17T13:45:00Z",
  "blocked_by": ["msg-005"],
  "history": [
    {
      "phase": "BRIEF",
      "completed_at": "2026-06-17T11:30:00Z",
      "approved_by": ["agency-ceo"]
    },
    {
      "phase": "RESEARCH",
      "completed_at": "2026-06-17T12:30:00Z",
      "approved_by": ["agency-researcher"]
    }
  ]
}
```

---

## Write Rules for the Coordinator

1. **Always update `updated_at`** on every write to `state.json`.
2. **Recalculate `blocked_by`** after every inbox scan — list all `msg-NNN` IDs with `"status": "OPEN"` for the current phase.
3. **Append to `history`** when a phase completes — never modify past history entries.
4. **Never skip phases** — transitions must be sequential: `BRIEF → RESEARCH → PROPOSAL → ARCHITECTURE → DEVELOPMENT → REVIEW → DELIVERY → DONE`.
