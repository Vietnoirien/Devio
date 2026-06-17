# Architecture Checklist

Used by the `agency-architect` persona to validate the CEO's proposal and produce a sound technical architecture.

---

## Section 1: Proposal Review (PROPOSAL Phase)

Run these checks on `02_proposal.md` before posting `APPROVE` to the CEO.

- [ ] **Timeline is realistic** — Are the phase durations achievable for the described scope? Apply a rough rule of thumb: 1 senior developer can deliver ~30 hours of net feature work per week. Flag anything that implies more.
- [ ] **Scope is precise** — Are the deliverables specific enough to build against? Vague statements like "improve performance" or "add AI features" must be challenged with a `REQUEST_CHANGE`.
- [ ] **Assumptions are surfaced** — Are the technical assumptions (existing infra, third-party integrations, team skills) stated explicitly?
- [ ] **Budget is sufficient** — Cross-reference the investment summary with your rough effort estimate. If the budget implies under-staffing for the scope, raise a `REQUEST_CHANGE`.
- [ ] **Dependencies are identified** — Are there external dependencies (third-party APIs, client data exports, legal approvals) that could block delivery?
- [ ] **Technology stack is current** — For every framework, runtime, or database explicitly named in the proposal (e.g., Next.js, Node.js, PostgreSQL, Python): verify it is on an **actively maintained, non-EOL version**. Check the official project's release/support schedule. If the proposal names a version that is End-of-Life or more than one major version behind the current stable release, post `REQUEST_CHANGE` — this is a security risk, not a preference.

---

## Section 2: Architecture Design Checks (ARCHITECTURE Phase)

Run these checks on your own `03_architecture.md` before posting `SUBMIT`.

### System Design
- [ ] **Single Responsibility** — Does each component have one clearly stated purpose?
- [ ] **Boundaries are explicit** — Are system boundaries (internal vs. external, public vs. private) clearly defined?
- [ ] **Data flows are documented** — Can you trace where every major piece of data enters, transforms, and exits the system?
- [ ] **No unnecessary complexity** — Is every component strictly necessary? Remove or defer anything that is not required for Phase 1.

### Technology Choices
- [ ] **Each tech choice has a rationale** — "We use PostgreSQL because the data is relational and the team has existing expertise" — not just "PostgreSQL".
- [ ] **Technology versions are current and supported** — For every framework, runtime, database, and infrastructure tool specified:
  1. Look up the official release calendar or support policy (e.g., Node.js LTS schedule, Next.js releases page, PostgreSQL versioning).
  2. Confirm the chosen version is **actively maintained** (i.e., receives security patches) — not EOL, not deprecated, not in "maintenance-only" mode with a stated end date within the project lifetime.
  3. Record the confirmed current stable/LTS version in `03_architecture.md` next to each technology choice.
  4. If you cannot confirm the version is current, **default to the latest stable LTS** and document why.
  > **Examples of disqualifying conditions:** Next.js 14 when Next.js 15 is the current stable; Node.js 16 (EOL Oct 2023); Python 3.8 (EOL Oct 2024); PostgreSQL 12 (EOL Nov 2024).
- [ ] **Open source licences are compatible** — Any OSS used must have a licence compatible with client delivery (MIT, Apache 2.0, BSD preferred; AGPL requires explicit client consent).
- [ ] **No vendor lock-in without explicit justification** — If a proprietary service is used, document what the migration path would be if the client needs to leave.

### Security (Pre-build)
- [ ] **Authentication** — Is the auth strategy defined? (JWT, OAuth2, session-based?) Are refresh token rotation and expiry addressed?
- [ ] **Authorisation** — Is role-based access control (RBAC) or attribute-based access control (ABAC) defined? Are permission boundaries explicit?
- [ ] **Secrets management** — Are secrets (API keys, DB passwords) stored via environment variables or a vault — never in code?
- [ ] **Input validation** — Is there a stated strategy for validating all external inputs?
- [ ] **Data at rest** — Is sensitive data encrypted at rest?
- [ ] **Data in transit** — Is TLS enforced on all network boundaries?

### Implementation Task List
- [ ] **Tasks are atomic** — Each task should be completable in 1–8 hours. Larger tasks must be split.
- [ ] **Dependencies are explicit** — Every task states which tasks must complete before it can start.
- [ ] **Acceptance criteria are testable** — Each task has at least one concrete, binary pass/fail criterion.

---

## Section 3: Post-Review Re-entry (REVIEW Phase)

If `agency-qa` escalates an architectural flaw back to you:

- [ ] **Identify the root cause** — Is this a design flaw in `03_architecture.md`, or a deviation by the Developer?
- [ ] **Scope the fix** — What is the minimum change to `03_architecture.md` that resolves the flaw?
- [ ] **Impact assess** — Does the fix require the Developer to change already-implemented code? If yes, document exactly what must change in an `INFO` message to `agency-developer`.
- [ ] **Update the doc** — Revise `03_architecture.md`. Never silently change the spec without logging it.
