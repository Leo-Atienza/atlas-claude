---
name: test-security
description: Run OWASP+ security vulnerability testing on a URL. Use when user wants to test security, find XSS, SQL injection, check headers, CSRF, authentication security, or data exposure.
allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(mkdir:*)
---

# Security Vulnerability Testing (OWASP+)

Run 55 security test cases across 5 parallel agents covering injection attacks, HTTP security headers, authentication security, data exposure, and client-side vulnerabilities.

**Authorization context**: This skill is designed for authorized security testing — pentesting engagements, security audits, and development/staging environments. Always test only URLs you own or have explicit permission to test.

## Setup

```bash
URL="${ARGUMENTS:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTDIR="test-results/test-security/$TIMESTAMP"
mkdir -p "$OUTDIR/screenshots" "$OUTDIR/snapshots" "$OUTDIR/traces"
```

## Parallel Execution — 5 Subagents

### Agent 1: Injection (`-s=sec-injection`)

Tests injection vulnerabilities across all input vectors.

```bash
playwright-cli -s=sec-injection open "$URL"
playwright-cli -s=sec-injection tracing-start
playwright-cli -s=sec-injection snapshot --filename="$OUTDIR/snapshots/injection-initial.yaml"
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-S1 | Reflected XSS in inputs + URL params | Fill every input with `<script>alert(1)</script>`, submit, check if script appears unescaped in DOM. Also test URL params: `?q=<script>alert(1)</script>` |
| TC-S2 | Stored XSS | Submit XSS payload, reload page, `run-code` to check for script execution or unescaped payload in DOM |
| TC-S3 | DOM-based XSS | Navigate to `URL#<img onerror=alert(1) src=x>`, check DOM. Try `javascript:` in URL inputs |
| TC-S4 | SVG XSS | If file upload exists: attempt upload with SVG containing `<svg onload=alert(1)>`. Also test `<svg>` in text inputs |
| TC-S5 | SQL injection | Fill inputs with `' OR 1=1--`, `'; DROP TABLE users--`, `' UNION SELECT null--`, check for database errors or unexpected data |
| TC-S6 | NoSQL injection | If JSON-based forms: test `{"$gt": ""}`, `{"$ne": null}` patterns via `run-code` with fetch API |
| TC-S7 | Command injection | Fill inputs with `; ls`, `` `whoami` ``, `$(cat /etc/passwd)`, check for command output in response |
| TC-S8 | HTML injection | Fill inputs with `<h1>injected</h1>`, `<iframe src=evil.com>`, verify HTML is escaped in output |
| TC-S9 | LDAP/XPath injection | Fill inputs with `*)(objectClass=*`, `' or '1'='1`, check for errors |
| TC-S10 | Template injection | Fill inputs with `{{7*7}}`, `${7*7}`, `<%= 7*7 %>`, check if output shows `49` |

```bash
playwright-cli -s=sec-injection tracing-stop
playwright-cli -s=sec-injection close
```

### Agent 2: Headers (`-s=sec-headers`)

Tests HTTP security headers and TLS configuration.

```bash
playwright-cli -s=sec-headers open "$URL"
playwright-cli -s=sec-headers tracing-start
```

**Test Cases:**

Use `run-code` with `fetch(url)` to inspect response headers, or `playwright-cli network` after page load.

| TC | Test | How to Check |
|----|------|-------------|
| TC-S11 | Content-Security-Policy present + configured | `run-code` to fetch and check CSP header exists, has script-src, style-src, default-src |
| TC-S12 | X-Frame-Options or CSP frame-ancestors | Check for `X-Frame-Options: DENY/SAMEORIGIN` or CSP `frame-ancestors` directive |
| TC-S13 | X-Content-Type-Options: nosniff | Check header present and value is `nosniff` |
| TC-S14 | Strict-Transport-Security (HSTS) | Check for HSTS header with `includeSubDomains` and reasonable `max-age` (≥31536000) |
| TC-S15 | Referrer-Policy | Check for `no-referrer`, `strict-origin`, or `strict-origin-when-cross-origin` |
| TC-S16 | Permissions-Policy | Check header restricts camera, microphone, geolocation |
| TC-S17 | X-XSS-Protection | Check header present (legacy but still checked) |
| TC-S18 | Cache-Control on sensitive pages | Check `no-store` or `no-cache` on pages with forms/auth |
| TC-S19 | HTTPS enforcement | `run-code` to try HTTP URL, verify redirect to HTTPS |
| TC-S20 | Mixed content | `run-code` to find any HTTP resources loaded on HTTPS page (scripts, images, stylesheets) |
| TC-S21 | CORS headers properly scoped | Check `Access-Control-Allow-Origin` is not `*` on authenticated endpoints |
| TC-S22 | Server header removed/generic | Check `Server` header doesn't expose version info (e.g., `Apache/2.4.51`) |

```bash
playwright-cli -s=sec-headers tracing-stop
playwright-cli -s=sec-headers close
```

### Agent 3: Auth (`-s=sec-auth`)

Tests authentication and session security.

```bash
playwright-cli -s=sec-auth open "$URL"
playwright-cli -s=sec-auth tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-S23 | CSRF tokens on state-changing forms | `run-code` to find forms with POST method, check for hidden CSRF token field |
| TC-S24 | CSRF token changes per session/request | Load page twice in different sessions, compare CSRF tokens |
| TC-S25 | Session cookie flags | `cookie-list` and check session cookies for HttpOnly, Secure, SameSite flags |
| TC-S26 | Session ID changes after login | Record session ID before login, login, compare session ID after |
| TC-S27 | Logout invalidates session | Login, save session cookie, logout, try using saved cookie, verify rejected |
| TC-S28 | Password field uses `type="password"` | `run-code` to find password fields, verify `type="password"` |
| TC-S29 | Login form served over HTTPS | Check login page URL starts with `https://` |
| TC-S30 | No user enumeration | Try login with invalid user vs invalid password, compare error messages — should be identical |
| TC-S31 | Account lockout after N failed attempts | Attempt 5+ failed logins, check if account locks or rate limits |
| TC-S32 | Password policy enforced | Try weak passwords ("123", "password", "a"), verify rejection |
| TC-S33 | No autocomplete on sensitive fields | `run-code` to check `autocomplete="off"` or `autocomplete="new-password"` on password/CC fields |
| TC-S34 | JWT not stored in localStorage | `localstorage-list` and check for JWT tokens (long base64 strings with two dots) |
| TC-S35 | OAuth redirect_uri validated | If OAuth present: try `redirect_uri=https://evil.com`, verify rejected |

```bash
playwright-cli -s=sec-auth tracing-stop
playwright-cli -s=sec-auth close
```

### Agent 4: Data (`-s=sec-data`)

Tests data exposure and privacy issues.

```bash
playwright-cli -s=sec-data open "$URL"
playwright-cli -s=sec-data tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-S36 | Sensitive data in URLs | Check current URL and all links for tokens, passwords, SSN patterns in query strings |
| TC-S37 | Sensitive data in localStorage/sessionStorage | `localstorage-list` and `sessionstorage-list`, look for PII, tokens, passwords |
| TC-S38 | API keys/secrets in page source or JS | `run-code` to get page HTML and inline scripts, regex for API key patterns (`sk_`, `api_key`, `secret`) |
| TC-S39 | Source maps in production | `run-code` to check for `.map` references in loaded scripts, try fetching them |
| TC-S40 | Stack traces/debug info in errors | Trigger 404/500 errors, check response for stack traces, file paths, debug info |
| TC-S41 | Directory listing enabled | Navigate to `/uploads/`, `/api/`, `/static/`, check for directory listing |
| TC-S42 | Server version in headers/errors | Check `Server`, `X-Powered-By` headers for version numbers |
| TC-S43 | Sensitive files accessible | Try fetching `/.env`, `/.git/config`, `/package.json`, `/wp-config.php`, check if accessible |
| TC-S44 | PII in HTML comments | `run-code` to extract all HTML comments, check for emails, phone numbers, internal notes |
| TC-S45 | Credit card/SSN fields autofill exclusion | Check `autocomplete="off"` on CC/SSN fields |

```bash
playwright-cli -s=sec-data tracing-stop
playwright-cli -s=sec-data close
```

### Agent 5: Client (`-s=sec-client`)

Tests client-side security vulnerabilities.

```bash
playwright-cli -s=sec-client open "$URL"
playwright-cli -s=sec-client tracing-start
```

**Test Cases:**

| TC | Test | How to Check |
|----|------|-------------|
| TC-S46 | Open redirects | Navigate to `?redirect=https://evil.com`, `?next=//evil.com`, verify no redirect to external domain |
| TC-S47 | Clickjacking protection | Verify X-Frame-Options header or CSP frame-ancestors prevents embedding in iframe |
| TC-S48 | Window.opener vulnerability | `run-code` to find external links without `rel="noopener noreferrer"` |
| TC-S49 | Insecure postMessage | `run-code` to find `addEventListener('message')` handlers, check if origin is validated |
| TC-S50 | eval()/innerHTML with user input | `run-code` to search page scripts for `eval(`, `innerHTML =`, `document.write(` patterns |
| TC-S51 | Subresource integrity (SRI) on CDN scripts | `run-code` to find external scripts from CDNs, check for `integrity` attribute |
| TC-S52 | Outdated JS libraries | `run-code` to detect library versions (jQuery, Bootstrap, Angular, React), flag known vulnerable versions |
| TC-S53 | WebSocket security | `run-code` to find WebSocket connections, verify `wss://` not `ws://` |
| TC-S54 | File upload without validation | If file upload exists: try uploading `.html`, `.svg`, `.exe` files |
| TC-S55 | Content-Disposition on downloads | Click download links, check `Content-Disposition: attachment` header via `run-code` with fetch |

```bash
playwright-cli -s=sec-client tracing-stop
playwright-cli -s=sec-client close
```

## Report Generation

After all 5 agents complete, merge results into `$OUTDIR/report.md` following the standard report format.

Security findings should be grouped by severity:
1. **Critical**: Active exploitable vulnerabilities (XSS, SQL injection, open redirect)
2. **Major**: Missing security controls (no CSP, no CSRF tokens, weak session management)
3. **Minor**: Best practice deviations (missing SRI, no X-XSS-Protection, verbose server header)
4. **Info**: Recommendations (version updates, configuration improvements)

## Cleanup

```bash
playwright-cli -s=sec-injection close 2>/dev/null
playwright-cli -s=sec-headers close 2>/dev/null
playwright-cli -s=sec-auth close 2>/dev/null
playwright-cli -s=sec-data close 2>/dev/null
playwright-cli -s=sec-client close 2>/dev/null
```
