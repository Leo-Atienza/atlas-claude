# Migration: ESLint + Prettier → Biome

## Step 1: Install Biome

```bash
npm install --save-dev --save-exact @biomejs/biome
npx @biomejs/biome init
```

## Step 2: Migrate ESLint Config

```bash
# Auto-migrate from ESLint config
npx @biomejs/biome migrate eslint --write
```

This reads your `.eslintrc` / `eslint.config.js` and translates rules to `biome.json`.

## Step 3: Migrate Prettier Config

```bash
# Auto-migrate from Prettier config
npx @biomejs/biome migrate prettier --write
```

This reads `.prettierrc` and maps formatting options to `biome.json`.

## Step 4: Verify

```bash
# Check everything
npx biome check .

# Fix everything
npx biome check --write .
```

## Step 5: Remove Old Tools

```bash
npm uninstall eslint prettier eslint-config-prettier eslint-plugin-react \
  eslint-plugin-react-hooks @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser eslint-plugin-import eslint-config-next
```

Delete:
- `.eslintrc` / `.eslintrc.json` / `.eslintrc.js` / `eslint.config.js`
- `.prettierrc` / `.prettierrc.json` / `.prettierrc.js`
- `.eslintignore`
- `.prettierignore`

## Step 6: Update Scripts

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

## Step 7: Update CI

Replace ESLint + Prettier CI steps with:

```yaml
- name: Lint and format
  run: npx @biomejs/biome ci .
```

## Step 8: VS Code

1. Uninstall ESLint and Prettier VS Code extensions
2. Install Biome extension (`biomejs.biome`)
3. Update `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

## Known Gaps (as of Biome 2.0)

- No Vue/Svelte/Astro support yet (2026 roadmap)
- No custom rule plugins yet (GritQL engine in development)
- Some ESLint-specific rules may not have equivalents — check `biome migrate` output for warnings
