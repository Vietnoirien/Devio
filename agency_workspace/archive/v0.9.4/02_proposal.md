# Project Proposal: Devio Agency Orchestration Update v0.9.0

## Executive Summary
We are proposing an update to the Devio AI Development Agency orchestration model to streamline communication and improve development efficiency, directly addressing your previous frustrations with the orchestration workflow. We will deprecate the Coordinator role and introduce a new Secretary (Nyobe) role focused on workspace archiving and context paths. I, the CEO, will become your single point of contact, ensuring your requests are managed efficiently and correctly routed to the appropriate team members, with strict adherence to role boundaries and TDD integrated as a core practice.

## Scope of Work
**Included:**
- Redesigning the message bus routing protocol to center around the CEO.
- Completely deprecating and removing the `agency-coordinator` persona and replacing it with a new `agency-secretary` persona.
- Updating the `agency-ceo` skill to manage client requests and redirect them correctly (to Researcher, Trinity, Merovingien, etc.), with a strict new rule prohibiting the CEO from directly editing code, architecture, or internal reference files.
- Configuring the Lead Developer as the primary team portal communicating with the CEO.
- Enforcing strict Test-Driven Development (TDD) protocols across the development lifecycle.
- Updating the `agency-researcher` skill to conduct thorough research rather than simple page indexing.
- Enforcing a strict new protocol for all agents: NEVER INJECT MESSAGES ON THE BUS VIA FILE EDITION TOOLS OR COMMANDS. Only final JSON outputs are permitted.
- Version bumping deliverables to target v0.9.4 to include the hotfix for CEO delegation protocols.

**Not Included:**
- Changes to the core functionality of the Devio Antigravity Plugin outside of the agent routing/orchestration framework.
- Development of new personas beyond the requested 'Secretary'.

## Phased Roadmap

### Phase 1: Architectural Design & Role Redefinition
- **Duration:** 1 week
- **Objective:** Finalize the technical design of the new message bus routing and the new persona definitions.
- **Key Deliverables:** Updated `03_architecture.md` detailing the new message bus flow and exact changes to `SKILL.md` files for CEO, Coordinator (to be retired), and Secretary.
- **Acceptance Criteria:** Architectural design is approved by both QA and the client, ensuring strict role boundaries and TDD protocols are outlined.

### Phase 2: Implementation of Orchestration Changes (v0.9.0)
- **Duration:** 2 weeks
- **Objective:** Implement the planned changes using strict TDD.
- **Key Deliverables:** 
  - Updated `agency-ceo` skill.
  - New `agency-secretary` skill.
  - Updated `agency-researcher` skill for advanced searching.
  - Protocol updates across all skills to ban file edition on the message bus.
  - Test suites confirming the new routing behaviors.
- **Acceptance Criteria:** All test cases pass; the CEO can successfully route messages; the Secretary can successfully archive the workspace; the Lead Developer communicates with the CEO; Researcher performs deep searches; and all agents adhere to the strict JSON-only bus protocol.

### Phase 3: QA & Delivery
- **Duration:** 1 week
- **Objective:** Final testing and client delivery.
- **Key Deliverables:** QA Report (`05_qa_report.md`), Delivery Summary (`06_delivery_summary.md`), and the final v0.9.0 release package.
- **Acceptance Criteria:** Final package is approved by the client and the engagement is formally closed by the Secretary.

## Assumptions & Risks
**Assumptions:**
- The current message bus format (`inbox.jsonl`) will remain structurally similar, with only routing logic changes.
- The client is available for prompt approvals at the end of each major phase.

**Risks:**
- Modifying the core orchestration layer could break existing functional workflows if not carefully tested. *Mitigation: We are enforcing strict TDD as requested to catch integration issues early.*
- Potential delays if the new Secretary archiving logic conflicts with existing file permission setups.

## Investment Summary
| Phase | Description | Estimated Effort | Estimated Cost |
| :--- | :--- | :--- | :--- |
| Phase 1 | Architectural Design & Role Redefinition | 40 hours | €4,000 |
| Phase 2 | Implementation of Orchestration Changes | 80 hours | €8,000 |
| Phase 3 | QA & Delivery | 40 hours | €4,000 |
| **Total** | | **160 hours** | **€16,000** |

*Note: This is a time and materials estimate based on our standard agency rate. Final billing will reflect actual hours worked.*
