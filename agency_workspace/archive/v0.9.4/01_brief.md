# Project Brief: Devio Agency Orchestration Update

## Client
Devio Client

## Business Goal
Update the Devio AI Development Agency orchestration model to improve efficiency and reduce client frustration. The previous 'Coordinator' role must be deprecated and replaced by a 'Secretary' (Nyobe) role responsible solely for workspace archiving and context paths. The CEO will become the single point of contact for the client and the primary router of tasks.

## Target Audience
Internal Devio agency personas and the Devio Client.

## Existing Systems & Constraints
- The current message bus uses `inbox.jsonl`.
- The current `agency-ceo` skill must be retired/replaced.
- The `agency-ceo` must be updated to handle routing.
- The `agency-secretary` must be implemented or formally defined to handle archiving.
- TDD (Test-Driven Development) MUST be a core part of the development process.
- Strict role boundaries must be maintained.
- Deliverables must be continuously versioned (targeting v0.9.0).

## Timeline Expectations
As soon as possible. Start work immediately.

## Budget
Not specified; assume standard time and materials.

## Success Criteria
- The client can talk directly to the CEO.
- The CEO successfully manages and routes client requests.
- The Lead Developer acts as the team portal to the CEO.
- The Secretary handles workspace archiving and state resets.
- Development follows strict TDD protocols.
