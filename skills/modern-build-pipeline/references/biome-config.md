# Biome 2.0 — Complete Configuration Reference

## Full Config for Next.js + React + TypeScript

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignore": [
      ".next",
      "node_modules",
      "dist",
      ".vercel",
      "coverage",
      "*.gen.ts",
      "*.d.ts"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "warn",
        "useExhaustiveDependencies": "warn",
        "noUndeclaredVariables": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error",
        "useImportType": "error",
        "useBlockStatements": "off",
        "noParameterAssign": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn",
        "noConsole": "warn",
        "noDoubleEquals": "error",
        "noAssignInExpressions": "error"
      },
      "complexity": {
        "noForEach": "off",
        "useFlatMap": "error"
      },
      "performance": {
        "noAccumulatingSpread": "error",
        "noDelete": "warn"
      },
      "security": {
        "noDangerouslySetInnerHtml": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSpacing": true
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none"
    }
  },
  "css": {
    "linter": {
      "enabled": true
    },
    "formatter": {
      "enabled": true,
      "indentStyle": "space",
      "indentWidth": 2
    }
  },
  "organizeImports": {
    "enabled": true
  },
  "overrides": [
    {
      "include": ["*.test.ts", "*.test.tsx", "*.spec.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"
          }
        }
      }
    }
  ]
}
```

## Common ESLint Rule Equivalents

| ESLint Rule | Biome Rule |
|---|---|
| `no-unused-vars` | `correctness/noUnusedVariables` |
| `no-unused-expressions` | `correctness/noUnusedPrivateClassMembers` |
| `prefer-const` | `style/useConst` |
| `no-console` | `suspicious/noConsole` |
| `eqeqeq` | `suspicious/noDoubleEquals` |
| `@typescript-eslint/no-explicit-any` | `suspicious/noExplicitAny` |
| `@typescript-eslint/consistent-type-imports` | `style/useImportType` |
| `react-hooks/exhaustive-deps` | `correctness/useExhaustiveDependencies` |
| `no-param-reassign` | `style/noParameterAssign` |
| `import/order` | `organizeImports` (built-in) |

## CI Integration

```yaml
# .github/workflows/ci.yml
- name: Lint and format check
  run: npx @biomejs/biome ci .
```

`biome ci` exits with non-zero code on any lint error or format violation — no `--fix` in CI.
