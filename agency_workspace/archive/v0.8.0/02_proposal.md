# Client Proposal — Integration of Lead Developer "Le Merovingien"

**Prepared by:** Devio AI Development Agency
**Date:** 2026-06-19
**Version:** 3.0

---

## Executive Summary

Devio proposes the integration of a new Lead Developer agent, "Le Merovingien", into the agency's automated workflow for version 0.8.0. This new role will serve as a crucial bridge between high-level business goals and technical execution, acting as a Pragmatic Architect, Technical Liaison, and Delivery Facilitator. By enforcing radical transparency, standardization, and mandatory technical reviews during the early phases of the project lifecycle, Le Merovingien will ensure that research translates into actionable, professional-grade roadmaps and robust technical deliveries.

---

## Scope of Work

### Included in Scope
- Creation of the `agency-lead-developer` profile ("Le Merovingien") with a dedicated `SKILL.md` file.
- Implementation of the **Pragmatic Architect** responsibility: Translating vague client requests into concrete technical requirements.
- Implementation of the **Delivery Facilitator** responsibility: Removing bottlenecks, guarding against scope creep, and ensuring a smooth development lifecycle.
- Implementation of the **Technical Liaison** responsibility: Active communication with the CEO to relay project scope changes and request client clarifications.
- Update of the agency phase protocols to include mandatory review steps by the Lead Developer during the `PROPOSAL` and `ARCHITECTURE` phases.
- **Active Research Validation:** The Lead Developer will proactively request deep-dive research for every functional component (including UI designs) to guarantee thorough investigation before architecture finalization.
- **Task-by-Task Architecture Specification:** Enforcing a rigorous step-by-step and task-by-task structure for `03_architecture.md`, which the Lead Developer will validate individually against research findings and client requirements.
- Definition and configuration of direct communication channels between Le Merovingien, the CEO, and the Architect.
- Adoption of best practices for agency workflows, including "Single Source of Truth" documentation, radical transparency, and iterative sprints.

### Not in Scope
> [!IMPORTANT]
> The following items are explicitly **not** included in this engagement.
- Replacement of the existing Architect or Developer roles (Le Merovingien acts as a coordinator/reviewer for these roles).
- Real-time client calls or direct client communication by the Lead Developer (all client communication remains the responsibility of the CEO).

---

## Phased Roadmap

### Phase 1 — Lead Developer Profile & Workflow Definition
**Duration:** 1 week
**Objective:** Define the core skills and communication protocols for Le Merovingien.

| Deliverable | Description | Acceptance Criteria |
|:---|:---|:---|
| `agency-lead-developer` Skill | Dedicated instruction file for Le Merovingien. | The Lead Developer understands their role as Pragmatic Architect, Technical Liaison, and Delivery Facilitator. |
| Workflow Standardization | Updates to agency documentation to enforce a "Single Source of Truth" and radical transparency. | Clear protocols exist for how the Lead Developer accesses project context and architectural decisions. |

---

### Phase 2 — Phase Protocol Updates & Integration
**Duration:** 1 week
**Objective:** Integrate Le Merovingien into the `PROPOSAL` and `ARCHITECTURE` phases with strict task-by-task validation.

| Deliverable | Description | Acceptance Criteria |
|:---|:---|:---|
| `PROPOSAL` Phase Updates | The Lead Developer actively requests component-specific deep-dives from the Researcher and collaborates with the CEO. | The Lead Developer can successfully query the CEO and ensure all UI and functional elements are deeply researched. |
| `ARCHITECTURE` Phase Updates | The Lead Developer works alongside the Architect to validate `03_architecture.md` on a task-by-task basis. | The architectural spec is structured step-by-step and individually validated by the Lead Developer to prevent missing essential components before handoff. |

---

## Assumptions & Risks

### Assumptions
1. The Devio agency message bus (`inbox.jsonl`) and state management can support the addition of a new mandatory reviewer in existing phases without causing deadlocks.
2. The Coordinator's routing logic can be easily updated to enforce Le Merovingien's review steps.

### Risks

| Risk | Probability | Impact | Mitigation |
|:---|:---|:---|:---|
| Orchestration Deadlocks | Medium | High | The Coordinator will be programmed with strict phase transition rules to ensure the Lead Developer's reviews do not block other independent tasks indefinitely. |
| Role Overlap with Architect | High | Medium | The `SKILL.md` files for both the Architect and Lead Developer will clearly delineate responsibilities (Architect designs the system; Lead Developer validates feasibility and translates to roadmap). |

---

## Investment Summary

| Phase | Duration | Estimated Cost |
|:---|:---|:---|
| Phase 1 — Profile & Workflow Definition | 1 week | Covered by open budget |
| Phase 2 — Phase Protocol Updates | 1 week | Covered by open budget |
| **Total** | **2 weeks** | **Unlimited (per client brief)** |

> Payment Terms: 30% upfront, 40% upon Phase 1 completion, 30% upon final delivery.

---

## Next Steps

1. The Client reviews and approves this proposal.
2. The Architect reviews the proposal for technical feasibility, specifically regarding the updates to the Coordinator's routing logic.
3. Upon approval, the ARCHITECTURE phase commences to design the system updates.

---

*This proposal is valid for 30 days from the date of issue.*
