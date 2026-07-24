# Security Rules

> On-demand reference. Loaded when touching auth, secrets, user input, or API boundaries.

## Input & Output

- Validate and sanitize ALL user input at system boundaries. Trust internal code.
- Parameterized queries only. Never interpolate user data into SQL.
- Error messages to clients: generic. Details: server-side logs only.

## Auth & Secrets

- Auth checks in middleware, not scattered across handlers.
- Check authorization on every request to a protected resource.
- Secure, httpOnly, sameSite cookies. Never localStorage for auth tokens.
- NEVER commit secrets. Rotate any accidentally committed secret immediately.
- NEVER log passwords, tokens, credit cards, SSNs, or PII.

## Dependencies & Config

- Pin exact versions in production. Audit transitive deps before major updates.
- Blocked patterns (enforced by context-guard.js): `*.env*`, `*credentials*`, `*id_rsa*`, `*.pem`, `*.key`, AWS keys (`AKIA`), API tokens, private keys, DB connection strings.

## Security Skill Triggers

| Trigger | Skill |
|---|---|
| Reviewing any PR/diff | `differential-review` |
| Before marking feature complete | `sharp-edges` |
| Auditing secrets/config | `insecure-defaults` |
| Found a vulnerability | `variant-analysis` |
| Writing auth/crypto code | `insecure-defaults` + `sharp-edges` |
