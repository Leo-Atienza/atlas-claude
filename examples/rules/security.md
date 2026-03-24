# Security Rules
> @import into project CLAUDE.md for security-critical projects.
> Based on G-PAT-014 (API Route Security Boundary) and security-gate.sh patterns.

- Validate and sanitize ALL user input at system boundaries. Trust internal code.
- Parameterized queries only. Never interpolate user data into SQL.
- Auth checks in middleware, not scattered across handlers.
- Check authorization on every request to a protected resource.
- Secure, httpOnly, sameSite cookies. Never localStorage for auth tokens.
- NEVER commit secrets. Rotate any accidentally committed secret immediately.
- NEVER log passwords, tokens, credit cards, SSNs, or PII.
- Error messages to clients: generic. Details: server-side logs only.
- Pin exact versions in production. Audit transitive deps before major updates.

## Blocked Patterns (enforced by security-gate.sh)
- `*.env*`, `*credentials*`, `*id_rsa*`, `*.pem`, `*.key` files
- AWS keys (`AKIA`), API tokens, private keys, DB connection strings
