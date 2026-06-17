# Coding Standards

Used by the `agency-developer` persona to ensure all produced code meets Devio's quality baseline.

---

## 1. File & Module Organisation

- **One concern per file.** A file should do one thing. If you find yourself writing "and also" when describing a file's purpose, split it.
- **Directory structure must mirror the architecture.** The folder layout in `agency_workspace/src/` must reflect the components described in `03_architecture.md`. Don't invent new top-level directories without logging the reason in `04_dev_log.md`.
- **Index files are for re-exports only.** `index.ts` / `index.js` / `__init__.py` should only re-export from sibling files, never contain business logic.

---

## 2. Naming

| Element | Convention | Example |
|:---|:---|:---|
| Files | `kebab-case` | `user-service.ts` |
| Functions / Methods | `camelCase` | `getUserById()` |
| Classes / Types | `PascalCase` | `UserRepository` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Variables | `camelCase`, descriptive | `activeUserCount` not `n` |
| Boolean variables | Prefix with `is`, `has`, `can` | `isAuthenticated`, `hasPermission` |

**No abbreviations.** Write `configuration`, not `cfg`. Write `response`, not `res` (except in well-known Express/Fastify patterns where the convention is universal).

---

## 3. Comments

- **Comment the "why", not the "what".** The code shows what it does. Comments explain why a non-obvious decision was made.
- **Required comments:**
  - Any workaround for a known library bug or API limitation
  - Any performance-critical section with the reasoning
  - Any TODO with a specific reason (e.g., `// TODO: Replace with webhook once client upgrades their Stripe plan`)
- **Forbidden comments:**
  - Commented-out code blocks. Delete unused code; version control has history.
  - Redundant comments: `// increment counter` above `counter++`

---

## 4. Error Handling

Every call to an external system (database, API, filesystem, queue) **must**:

1. Catch errors explicitly — never swallow exceptions silently.
2. Log the error with enough context to diagnose it (which operation, which input caused it).
3. Return a meaningful error to the caller — never expose raw stack traces to end users.
4. Use typed error classes where the language supports it (not raw `Error` strings).

```typescript
// ✅ Correct
try {
  const user = await db.users.findById(userId);
  if (!user) throw new NotFoundError(`User ${userId} not found`);
  return user;
} catch (err) {
  logger.error({ err, userId }, 'Failed to fetch user');
  throw err; // re-throw for the caller to handle
}

// ❌ Wrong
const user = await db.users.findById(userId); // unhandled rejection
```

---

## 5. Security (Implementation Level)

- **Never hardcode secrets.** Use `process.env` (Node) or equivalent. Reference the architecture's secrets management strategy.
- **Validate all external input.** Use a schema validation library (e.g., Zod, Joi, Pydantic). Never trust user input, query params, or webhook payloads.
- **Sanitise before rendering.** Any user-supplied string rendered into HTML must be sanitised. Use established libraries — never write your own sanitiser.
- **Parameterise all queries.** Never concatenate user input into SQL or NoSQL queries. Use prepared statements or ORM query builders exclusively.

---

## 6. Test-Driven Development (TDD) — MANDATORY

> **Rule: No implementation code may be written before a failing test exists for it.** This is not optional. Skipping TDD is a `HIGH` defect in QA review.

### The Cycle — Three States, Always In Order

```
🔴 RED    → Write a test that describes the desired behaviour. Run it. It MUST fail.
🟢 GREEN  → Write the minimum code to make the test pass. Run it. It MUST pass.
🔵 REFACTOR → Clean up the code (naming, duplication, structure). Re-run. Still MUST pass.
```

Never write implementation code without first being in RED state. Never commit code that is in RED state.

### What Each Cycle Step Means in Practice

#### 🔴 RED — Write the Test First

1. Read the task's acceptance criteria from `03_architecture.md`.
2. Translate **one** acceptance criterion into a test case.
3. Write the test in the corresponding test file (see naming convention below).
4. Run the test suite. **The new test MUST fail** — if it passes without implementation, the test is testing nothing.
5. Document `🔴 RED` in the dev log for this task.

#### 🟢 GREEN — Write the Minimum Implementation

1. Write the **smallest possible** implementation code that makes the failing test pass.
2. Do not implement anything not required by the current failing test.
3. Run the test suite. **All tests MUST pass**, including pre-existing ones (no regressions).
4. Document `🟢 GREEN` in the dev log for this task.

#### 🔵 REFACTOR — Clean Without Breaking

1. Review the implementation and test for:
   - Duplicated logic (extract to a shared utility)
   - Misleading names (rename to express intent)
   - Unnecessary complexity (simplify)
2. Do **not** add new behaviour during refactor.
3. Re-run the full test suite. **All tests MUST still pass.**
4. Document `🔵 REFACTOR` in the dev log, noting what was cleaned up.
5. Repeat the cycle for the next acceptance criterion.

---

### Test File Naming & Location

| Language / Framework | Convention | Example |
|:---|:---|:---|
| TypeScript / Node.js (Vitest / Jest) | `[filename].test.ts` co-located with source | `user-service.test.ts` |
| TypeScript (integration) | `[feature].integration.test.ts` in `tests/` | `ticket-creation.integration.test.ts` |
| E2E (Playwright) | `[flow].spec.ts` in `tests/e2e/` | `ticket-flow.spec.ts` |
| Python (pytest) | `test_[module].py` co-located or in `tests/` | `test_user_service.py` |

### Anatomy of a Valid Test

Every test MUST follow the **Arrange → Act → Assert** (AAA) pattern:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTicket } from './ticket-service';
import { mockDb } from '../test-utils/mock-db';

describe('createTicket', () => {
  beforeEach(() => mockDb.reset());

  // 🔴 RED: Write this BEFORE implementing createTicket
  it('should return a ticket with status OPEN when created successfully', async () => {
    // Arrange
    const input = {
      equipmentId: 'equip-123',
      title: 'Pompe en panne',
      description: 'La pompe ne démarre plus depuis hier matin.',
      priority: 'HIGH',
      customerId: 'cust-456',
    };

    // Act
    const result = await createTicket(input);

    // Assert
    expect(result.status).toBe('OPEN');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should throw ValidationError when title is shorter than 5 characters', async () => {
    // Arrange
    const input = { ...validInput, title: 'Bug' };

    // Act & Assert
    await expect(createTicket(input)).rejects.toThrow('ValidationError');
  });
});
```

### Forbidden Test Patterns

These patterns indicate TDD was NOT followed and are `HIGH` defects during QA review:

| Anti-pattern | Why it is wrong |
|:---|:---|
| Test written after implementation | The test cannot falsify — you already know it passes. |
| Test with no assertion (`expect`) | This is not a test. It is dead code. |
| `expect(true).toBe(true)` | Trivially passing assertion. Test does nothing. |
| Mocking the thing under test | You are testing a mock, not the code. |
| `test.skip` / `xit` in committed code | A skipped test is a hidden broken test. |
| Test file with zero failing cases ever documented in dev log | Indicates tests were written retroactively. |

### Minimum Coverage Requirements

| Layer | Minimum coverage |
|:---|:---|
| Service / Business logic | **80% line coverage** |
| API route handlers | **Every happy path + every documented error path** |
| Utility functions | **100% line coverage** |
| UI components | Playwright E2E for all critical user flows |

> Coverage % is a floor, not a goal. 80% coverage with meaningful tests is better than 100% coverage with trivial assertions.

---

## 7. Dev Log (`04_dev_log.md`)

Append a new entry for each task completed. **TDD state transitions are mandatory entries:**

```markdown
## Task: [Task Name from Architecture]

**TDD cycle:**
- 🔴 RED: [test name] — `[test file path]` — confirmed failing with: `[error message or assertion failure]`
- 🟢 GREEN: [implementation file] — all tests pass
- 🔵 REFACTOR: [what was cleaned up, or "none needed"]

**Files created/modified:**
- `src/tickets/ticket-service.ts` — new
- `src/tickets/ticket-service.test.ts` — new

**Implementation decisions:**
- Used soft-delete (added `deleted_at` column) rather than hard delete,
  per the architecture spec's data retention requirement.

**Deviations from spec:**
- None.
```

If you deviate from the spec, you **must** state the reason. If the deviation is significant, post `INFO` to `agency-architect` explaining the change.

