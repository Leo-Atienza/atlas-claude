<!--
id: SK-056
name: vitest-testing
description: Vitest — fast unit testing with Testing Library integration and test pyramid strategy
keywords: vitest, testing, unit-test, component-test, testing-library, mock, coverage, tdd, test-pyramid, react-testing
version: 1.0.0
-->

# Vitest Testing

## When to Use This Skill

Apply when writing tests for any Vite-based or modern JS/TS project. Vitest is the 2026 default (6x faster than Jest, native ESM, shared Vite config). **Test pyramid: Vitest for unit + component, Playwright for E2E.** Auto-activate on keywords: vitest, test, describe, it, expect, mock, coverage.

**Related skills:** Playwright (SK-009) for E2E browser testing.

## Installation

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

## Configuration

```ts
// vitest.config.ts (or in vite.config.ts)
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,                  // no import { describe, it, expect }
    environment: 'jsdom',           // 'node' for server code
    setupFiles: './src/test/setup.ts',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',               // or 'istanbul'
      reporter: ['text', 'html', 'lcov'],
      thresholds: { lines: 80, branches: 80, functions: 80 },
    },
    css: true,                      // process CSS imports
  },
});
```

**Setup file:**
```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

## Basic Test Structure (Arrange-Act-Assert)

```ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('calculateTotal', () => {
  it('returns sum of item prices', () => {
    // Arrange
    const items = [{ price: 10 }, { price: 20 }, { price: 30 }];
    // Act
    const total = calculateTotal(items);
    // Assert
    expect(total).toBe(60);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('throws on negative prices', () => {
    expect(() => calculateTotal([{ price: -5 }])).toThrow('Invalid price');
  });
});
```

## Component Testing with Testing Library

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments count on button click', async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={0} />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('calls onChange callback with new value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Counter initialCount={5} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(onChange).toHaveBeenCalledWith(6);
  });
});
```

## Mocking

**Module mocks:**
```ts
import { vi, describe, it, expect } from 'vitest';

// Mock entire module
vi.mock('./api', () => ({
  fetchUser: vi.fn(),
}));
import { fetchUser } from './api';

describe('UserService', () => {
  it('fetches and transforms user', async () => {
    vi.mocked(fetchUser).mockResolvedValue({ id: '1', name: 'Alice' });
    const result = await getUser('1');
    expect(result.displayName).toBe('Alice');
  });
});
```

**Spy on methods:**
```ts
const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
// ... test code that should log error ...
expect(spy).toHaveBeenCalledWith(expect.stringContaining('failed'));
spy.mockRestore();
```

**Mock timers:**
```ts
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

it('debounces input', async () => {
  const callback = vi.fn();
  const debounced = debounce(callback, 300);

  debounced('hello');
  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(300);
  expect(callback).toHaveBeenCalledWith('hello');
});
```

**Mock fetch:**
```ts
import { vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ id: '1', name: 'Alice' }),
});
```

## Async Testing

```ts
it('resolves with user data', async () => {
  const user = await fetchUser('1');
  expect(user).toEqual({ id: '1', name: 'Alice' });
});

it('rejects on not found', async () => {
  await expect(fetchUser('999')).rejects.toThrow('Not found');
});

// Wait for condition
import { waitFor } from '@testing-library/react';
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Testing Hooks

```tsx
import { renderHook, act } from '@testing-library/react';

it('increments counter', () => {
  const { result } = renderHook(() => useCounter(0));
  expect(result.current.count).toBe(0);

  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

## Testing with TanStack Query

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

it('displays user data', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, json: () => ({ name: 'Alice' }) });
  render(<UserProfile userId="1" />, { wrapper: createWrapper() });
  expect(await screen.findByText('Alice')).toBeInTheDocument();
});
```

## Snapshot Testing

```ts
it('matches snapshot', () => {
  const { container } = render(<Button variant="primary">Click</Button>);
  expect(container.firstChild).toMatchSnapshot();
});

// Inline snapshot (preferred — visible in test file)
it('serializes config', () => {
  expect(getConfig()).toMatchInlineSnapshot(`
    {
      "debug": false,
      "port": 3000,
    }
  `);
});
```

## Coverage

```bash
vitest run --coverage           # run with coverage
vitest --coverage --watch       # watch mode with coverage
```

## Test Pyramid Strategy

```
         /  E2E  \          Playwright — critical user flows (5-10 tests)
        /----------\
       / Component  \       Vitest + Testing Library — UI behavior (many)
      /--------------\
     /    Unit Tests   \    Vitest — pure functions, utils, hooks (most)
    /--------------------\
```

**Rules:**
- Unit tests: pure functions, utilities, hooks, reducers. Fast, isolated.
- Component tests: render + interact + assert. Mock external deps, not internal state.
- E2E tests: critical user paths only (auth flow, checkout, data CRUD). Slow, flaky risk.
- **Test behavior, not implementation.** Query by role/text, not class/id.
- **One assertion cluster per test.** Multiple related expects OK, but one logical check.
- **Co-locate tests:** `foo.ts` → `foo.test.ts` in same directory.

## CLI Commands

```bash
vitest                   # watch mode (default)
vitest run               # single run (CI)
vitest run src/utils     # run tests in specific directory
vitest -t "calculates"   # run tests matching name
vitest --reporter=verbose # detailed output
vitest bench             # run benchmarks
```

## Performance Tips

- Vitest runs tests in worker threads — parallel by default
- Use `--pool=threads` (default) for speed, `--pool=forks` for isolation
- `--sequence.concurrent` to run tests within a file concurrently
- `vi.mock` is hoisted automatically — no need for manual hoisting
- Avoid `beforeAll` database seeding — use per-test factories instead
