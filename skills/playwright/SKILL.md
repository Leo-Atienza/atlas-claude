---
name: playwright
description: "Complete browser automation and testing with Playwright. Four modes: CLI tool (playwright-cli commands for interactive browser control), JS script-based automation (write JS to /tmp, execute via run.js with dev server auto-detection), Python automation (with_server.py for server lifecycle management, reconnaissance-then-action pattern), and UI test suites (15 categories, 482 test cases covering forms, a11y, responsive, security, performance, SEO, UX). Use for web testing, form filling, screenshots, data extraction, responsive design validation, accessibility audits, and any browser automation task."
allowed-tools: Bash(playwright-cli:*)
metadata:
  author: merged
  version: "3.0.0"
---

# Playwright — Browser Automation & Testing

Four complementary modes for browser automation: CLI commands, JS scripts, Python automation, and UI test suites.

## Table of Contents

1. [CLI Commands (playwright-cli)](#cli-commands)
2. [Script-Based Automation (JS)](#script-based-automation)
3. [Python Automation](#python-automation)
4. [UI Test Suites](#ui-test-suites)

---

## CLI Commands

Interactive browser control via `playwright-cli`.

### Quick Start

```bash
playwright-cli open
playwright-cli goto https://playwright.dev
playwright-cli click e15
playwright-cli type "page.click"
playwright-cli press Enter
playwright-cli screenshot
playwright-cli close
```

### Core Commands

```bash
playwright-cli open [url]           # Open browser (optionally navigate)
playwright-cli goto <url>           # Navigate to URL
playwright-cli click e3             # Click element by ref
playwright-cli dblclick e7          # Double-click
playwright-cli fill e5 "text"       # Fill input field
playwright-cli type "text"          # Type text
playwright-cli select e9 "value"    # Select option
playwright-cli upload ./file.pdf    # Upload file
playwright-cli check e12            # Check checkbox
playwright-cli uncheck e12          # Uncheck checkbox
playwright-cli hover e4             # Hover element
playwright-cli drag e2 e8           # Drag and drop
playwright-cli snapshot             # Capture page state
playwright-cli eval "document.title"  # Execute JS
playwright-cli close                # Close browser
```

### Navigation & Keyboard

```bash
playwright-cli go-back | go-forward | reload
playwright-cli press Enter | ArrowDown | Tab
playwright-cli keydown Shift | keyup Shift
```

### Mouse

```bash
playwright-cli mousemove 150 300 | mousedown | mouseup
playwright-cli mousewheel 0 100
```

### Screenshots & PDF

```bash
playwright-cli screenshot [element-ref] [--filename=page.png]
playwright-cli pdf --filename=page.pdf
```

### Tabs

```bash
playwright-cli tab-list | tab-new [url] | tab-close [index] | tab-select <index>
```

### Storage (Cookies, LocalStorage, SessionStorage)

```bash
# Cookies
playwright-cli cookie-list [--domain=] | cookie-get <name> | cookie-set <name> <value> | cookie-delete <name> | cookie-clear

# LocalStorage
playwright-cli localstorage-list | localstorage-get <key> | localstorage-set <key> <value> | localstorage-delete <key> | localstorage-clear

# SessionStorage
playwright-cli sessionstorage-list | sessionstorage-get <key> | sessionstorage-set <key> <value> | sessionstorage-delete <key> | sessionstorage-clear

# State save/load
playwright-cli state-save [file.json] | state-load <file.json>
```

### Network Mocking

```bash
playwright-cli route "**/*.jpg" --status=404
playwright-cli route "https://api.example.com/**" --body='{"mock": true}'
playwright-cli route-list | unroute [pattern]
```

### DevTools

```bash
playwright-cli console [level] | network
playwright-cli run-code "async page => ..."
playwright-cli tracing-start | tracing-stop
playwright-cli video-start | video-stop <file.webm>
```

### Browser Sessions

```bash
playwright-cli open --browser=chrome|firefox|webkit|msedge
playwright-cli open --persistent | --profile=/path
playwright-cli -s=mysession open url --persistent
playwright-cli list | close-all | kill-all
```

### Snapshots

After each command, playwright-cli provides a page state snapshot (YAML). Use `--filename=` for workflow artifacts.

### CLI References

| Topic | File |
|-------|------|
| Request Mocking | `references/request-mocking.md` |
| Running Code | `references/running-code.md` |
| Session Management | `references/session-management.md` |
| Storage State | `references/storage-state.md` |
| Test Generation | `references/test-generation.md` |
| Tracing | `references/tracing.md` |
| Video Recording | `references/video-recording.md` |

---

## Script-Based Automation

Write custom Playwright scripts, execute via `run.js`. Auto-detects dev servers.

**Path:** This skill directory is `$SKILL_DIR` (e.g., `~/.claude/skills/playwright`).

### Critical Workflow

1. **Auto-detect dev servers FIRST** (for localhost testing):
   ```bash
   cd $SKILL_DIR && node -e "require('./lib/helpers').detectDevServers().then(s => console.log(JSON.stringify(s)))"
   ```
2. **Write scripts to `/tmp`** — NEVER to skill directory or project
3. **Use visible browser by default** — `headless: false`
4. **Parameterize URLs** — `const TARGET_URL = 'http://localhost:3001';`

### Setup (First Time)

```bash
cd $SKILL_DIR && npm run setup
```

### Execution Pattern

```bash
# Write script to /tmp, then execute:
cd $SKILL_DIR && node run.js /tmp/playwright-test-page.js

# Inline execution for quick tasks:
cd $SKILL_DIR && node run.js "
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://localhost:3001');
await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
await browser.close();
"
```

### Common Patterns

**Responsive test:**
```javascript
// /tmp/playwright-test-responsive.js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ];
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(TARGET_URL);
    await page.screenshot({ path: `/tmp/${vp.name.toLowerCase()}.png`, fullPage: true });
  }
  await browser.close();
})();
```

**Login flow:**
```javascript
// /tmp/playwright-test-login.js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3001';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(`${TARGET_URL}/login`);
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('Login successful');
  await browser.close();
})();
```

### Available Helpers

```javascript
const helpers = require('./lib/helpers');
const servers = await helpers.detectDevServers();
await helpers.safeClick(page, 'button.submit', { retries: 3 });
await helpers.safeType(page, '#username', 'testuser');
await helpers.takeScreenshot(page, 'test-result');
await helpers.handleCookieBanner(page);
const data = await helpers.extractTableData(page, 'table.results');
```

### Custom HTTP Headers

```bash
PW_HEADER_NAME=X-Automated-By PW_HEADER_VALUE=playwright-skill \
  cd $SKILL_DIR && node run.js /tmp/my-script.js

PW_EXTRA_HEADERS='{"X-Automated-By":"playwright-skill","X-Debug":"true"}' \
  cd $SKILL_DIR && node run.js /tmp/my-script.js
```

### Advanced API

See [API_REFERENCE.md](API_REFERENCE.md) for selectors, network interception, auth, visual regression, mobile emulation, performance testing, debugging, and CI/CD.

---

## Python Automation

Write native Python Playwright scripts for testing local web applications. Includes server lifecycle management.

### Decision Tree

```
User task → Is it static HTML?
    ├─ Yes → Read HTML file directly to identify selectors
    │         ├─ Success → Write Playwright script using selectors
    │         └─ Fails/Incomplete → Treat as dynamic (below)
    └─ No (dynamic webapp) → Is the server already running?
        ├─ No → Use with_server.py (see below)
        └─ Yes → Reconnaissance-then-action:
            1. Navigate and wait for networkidle
            2. Take screenshot or inspect DOM
            3. Identify selectors from rendered state
            4. Execute actions with discovered selectors
```

### Server Lifecycle (with_server.py)

Manages starting/stopping dev servers automatically. Run `--help` first:

```bash
python lib/with_server.py --help
```

**Single server:**
```bash
python lib/with_server.py --server "npm run dev" --port 5173 -- python /tmp/my_automation.py
```

**Multiple servers (backend + frontend):**
```bash
python lib/with_server.py \
  --server "cd backend && python server.py" --port 3000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python /tmp/my_automation.py
```

### Python Script Pattern

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')  # CRITICAL: Wait for JS
    # ... automation logic
    browser.close()
```

### Reconnaissance-Then-Action

1. **Inspect rendered DOM:**
   ```python
   page.screenshot(path='/tmp/inspect.png', full_page=True)
   content = page.content()
   page.locator('button').all()
   ```
2. **Identify selectors** from inspection results
3. **Execute actions** using discovered selectors

**Common pitfall:** Don't inspect DOM before `networkidle` on dynamic apps.

### Python Examples

Available in `examples/`:
- `element_discovery.py` — Discovering buttons, links, inputs on a page
- `static_html_automation.py` — Using `file://` URLs for local HTML
- `console_logging.py` — Capturing console logs during automation

---

## UI Test Suites

15 test categories with ~482 total test cases. Sub-skills in `test-suites/`.

### Category A: UI Functional Testing

| Skill | Command | Tests | Description |
|-------|---------|-------|-------------|
| Form Testing | `/test-forms <url>` | 27 | Form validation, input handling, submit states |
| Accessibility | `/test-a11y <url>` | 40 | WCAG 2.1 AA+ compliance |
| Responsive | `/test-responsive <url>` | 72 | Multi-viewport responsive design |
| User Flows | `/test-flows <url>` | 30 | Auth, navigation, SPA behavior |
| Cross-Browser | `/test-cross-browser <url>` | 30 | Chromium, Firefox, WebKit consistency |
| Security | `/test-security <url>` | 55 | OWASP+ vulnerability detection |
| Performance | `/test-perf <url>` | 25 | Core Web Vitals, runtime perf |
| SEO | `/test-seo <url>` | 27 | Meta tags, structured data, crawlability |
| UI States | `/test-states <url>` | 35 | Loading, empty, error, overlay states |
| Links | `/test-links <url>` | 23 | Link integrity, broken links |
| Regression | `/test-regression <url>` | 8 | Baseline comparison, structural diff |

### Category B: UX Design Quality

| Skill | Command | Tests | Description |
|-------|---------|-------|-------------|
| Heatmap | `/test-heatmap <url>` | 24 | Attention prediction, visual hierarchy |
| UX Writing | `/test-ux-writing <url>` | 26 | Micro-copy quality, CTA effectiveness |
| Consistency | `/test-consistency <url>` | 30 | Design system consistency audit |
| Conversion | `/test-conversion <url>` | 30 | Conversion optimization, cognitive load |

### Full Suite

```bash
/test-all <url>   # Runs all 15 skills in phased parallel execution
```

### Output

All results saved to `test-results/<skill-name>/<timestamp>/`:
- `report.md` — Pass/fail with severity and fix suggestions
- `screenshots/` — Visual evidence
- `snapshots/` — Accessibility tree captures
- `traces/` — Playwright execution traces
- `videos/` — Recorded flows

### UI Testing References

| Topic | File |
|-------|------|
| Common Setup | `references/ui-testing-common-setup.md` |
| Evidence Capture | `references/ui-testing-evidence-capture.md` |
| Report Format | `references/ui-testing-report-format.md` |

---

## Tips

- **CRITICAL: Detect servers FIRST** for localhost testing
- **Write test files to `/tmp`** — never clutter skill dir or project
- **Default: visible browser** — `headless: false` unless user requests headless
- **Parameterize URLs** — `TARGET_URL` constant at top of every script
- **Wait strategies** — Use `waitForURL`, `waitForSelector`, `waitForLoadState` over fixed timeouts
- **slowMo: 100** — Makes actions visible for debugging
- **Error handling** — Always use try-catch for robust automation

## Troubleshooting

```bash
# Playwright not installed
cd $SKILL_DIR && npm run setup

# Module not found — ensure running from skill dir via run.js
# Browser doesn't open — check headless: false, ensure display available
# Element not found — add wait: page.waitForSelector('.el', { timeout: 10000 })
```
