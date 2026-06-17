# Security Checklist

Used by the `agency-qa` persona during the ARCHITECTURE review and REVIEW (code audit) phases.
Inspired by OWASP Top 10 (2021) and CWE Top 25.

---

## Section 1: Architecture Review (ARCHITECTURE Phase)

Run before posting `APPROVE` to the Architect.

### Authentication & Session Management
- [ ] **A07** — Is the authentication mechanism defined? (JWT, OAuth2, session cookie?)
- [ ] **A07** — If JWT: are tokens short-lived (≤ 15min access, ≤ 7 days refresh)? Is refresh token rotation specified?
- [ ] **A07** — Are passwords hashed using a modern algorithm (bcrypt, argon2, scrypt)? MD5/SHA1 are disqualifying.
- [ ] **A07** — Is there a defined logout / token revocation mechanism?

### Authorisation
- [ ] **A01** — Is a role or permission model defined for every protected resource?
- [ ] **A01** — Are there explicit statements about which roles can access which API endpoints and data?
- [ ] **A01** — Are multi-tenant boundaries (if applicable) enforced at the data layer, not just the API layer?

### Data & Privacy
- [ ] **A02** — Is sensitive data (PII, payment info, credentials) encrypted at rest?
- [ ] **A02** — Is TLS enforced for all data in transit between all components?
- [ ] **A04** — Is the data model explicit about which fields are sensitive and how they are handled?
- [ ] **GDPR** — If the client is EU-based or handles EU data: is there a stated data retention policy? Is there a right-to-erasure mechanism?

### Infrastructure
- [ ] **A05** — Are default credentials or open ports explicitly forbidden in the deployment spec?
- [ ] **A09** — Is centralised logging planned? Are logs shipped somewhere persistent?
- [ ] **A09** — Is there a monitoring/alerting strategy for security events (failed logins, rate limit hits)?

### Technology Stack Currency (OWASP A06 — Vulnerable & Outdated Components)

> **This check is mandatory. Use web search to verify every item — do not rely on memory.**

For each framework, runtime, database, and major library named in `03_architecture.md`:

- [ ] **Runtime / Language** — Verify the proposed Node.js / Python / Java / PHP version is on the official LTS support schedule and has not reached End-of-Life.
- [ ] **Web Framework** — Verify the proposed framework version (e.g., Next.js, NestJS, Django, Laravel) is the current stable or LTS release. Check the project's official releases page.
- [ ] **Database engine** — Verify the proposed database version (e.g., PostgreSQL, MySQL, MongoDB) is actively maintained and within its support window.
- [ ] **Container base image** — If a Dockerfile or base image is specified, verify it is based on a current, supported OS image (e.g., `node:22-alpine`, not `node:14-alpine`).
- [ ] **Any version more than one major release behind the current stable, or past its stated EOL date, is a `HIGH` finding and blocks phase advancement.**

> **How to verify:** Search `[technology] release schedule` or `[technology] end of life` and check the official project documentation. Do not approve if you cannot confirm the version is currently supported.

---

## Section 2: Code Review (REVIEW Phase)

Run on all files in `agency_workspace/src/`. Cross-reference against `03_architecture.md`.

### Injection (OWASP A03 / CWE-89)
- [ ] All database queries use parameterised statements or ORM query builders — no string concatenation.
- [ ] All shell/command invocations (if any) use argument arrays, not string interpolation.
- [ ] All template rendering sanitises user-supplied data before output.

### Authentication Implementation (OWASP A07)
- [ ] Passwords are never stored in plaintext anywhere (logs, DB, response bodies).
- [ ] JWT secret/private key is loaded from environment variable, not hardcoded.
- [ ] Token expiry is enforced server-side — the server does not trust client-supplied expiry claims.
- [ ] Rate limiting is applied to authentication endpoints.

### Authorisation Implementation (OWASP A01)
- [ ] Every protected route/handler verifies the caller's permissions before processing.
- [ ] Authorisation checks happen at the resource level — not just route level (e.g., user A cannot access user B's records by ID-guessing).
- [ ] Admin-only functions are protected and not exposed in public-facing API schemas.

### Secrets & Configuration (OWASP A02)
- [ ] No hardcoded API keys, database passwords, or secrets in any source file.
- [ ] `.env` files are listed in `.gitignore` and not committed.
- [ ] No secrets appear in log output.

### Input Validation (OWASP A03)
- [ ] All API inputs are validated against a schema before processing.
- [ ] File uploads (if any) validate file type by content inspection, not just extension.
- [ ] Pagination/limit parameters have server-enforced maximums to prevent DoS via large queries.

### Error Handling (OWASP A05 / CWE-209)
- [ ] Error responses never expose stack traces, internal paths, or raw database errors to the client.
- [ ] Errors are logged server-side with sufficient context for diagnosis.
- [ ] All async operations have explicit error handling (no unhandled promise rejections).

### Dependency Safety
- [ ] All production dependencies are listed in a manifest file (`package.json`, `requirements.txt`, etc.).
- [ ] No dependencies with known critical CVEs — run `npm audit`, `pip audit`, or equivalent and resolve all CRITICAL/HIGH findings.
- [ ] No `latest` version pinning — all dependencies use exact or bounded version constraints.
- [ ] **Framework and runtime versions are current** — Re-run the Technology Stack Currency check from Section 1 against the actual `package.json` / lock file versions, not just the architecture spec. Flag any discrepancy where the implemented version differs from what the Architect specified.

### Architecture Alignment
- [ ] The implemented component structure matches `03_architecture.md`.
- [ ] Any deviations from the spec are documented in `04_dev_log.md`.
- [ ] All API endpoints described in the architecture are implemented (no silent omissions).
- [ ] All data model entities and fields described in the architecture exist in the implementation.

### TDD Compliance

> Skipping TDD is a `HIGH` finding. Verify against `04_dev_log.md`.

- [ ] Every task in the Implementation Task List has a corresponding `🔴 RED` entry in `04_dev_log.md` naming the failing test and the error it produced.
- [ ] Every `🔴 RED` entry is followed by a `🟢 GREEN` entry — no task has RED without GREEN.
- [ ] Test files exist co-located with (or alongside) every implemented service or business logic module.
- [ ] The `SUBMIT` message from the Developer includes: total test count, coverage % for business logic, and TDD attestation.
- [ ] No `test.skip`, `xit`, or `it.todo` calls in committed test files (skipped tests mask failures).
- [ ] No trivially-passing assertions (`expect(true).toBe(true)`, `expect(undefined).toBeUndefined()` on non-computed values).
- [ ] Business logic coverage ≥ 80% (check coverage report attached to or referenced in the SUBMIT message).

---

## Severity Classification

| Severity | Category | Action |
|:---|:---|:---|
| `CRITICAL` | OWASP A01, A02, A03, A07 | Must fix before APPROVE. Post `REQUEST_CHANGE`. |
| `HIGH` | OWASP A04, A05, A06, A08 — includes EOL/outdated frameworks, unpatched CVEs | Must fix before APPROVE. Post `REQUEST_CHANGE`. |
| `MEDIUM` | OWASP A09, A10 | Must fix before APPROVE. Post `REQUEST_CHANGE`. |
| `LOW` | Style, minor coverage gap | Document in report. Do NOT block. |
| `INFO` | Future recommendation | Document in report. Do NOT block. |

> **A06 (Vulnerable & Outdated Components) is always at least `HIGH`.** An End-of-Life framework or runtime with known unpatched CVEs escalates to `CRITICAL`.
