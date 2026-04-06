<!--
id: SK-045
name: advanced-javascript
description: Advanced JavaScript patterns — TC39 features, V8 optimization, concurrency, TypeScript, performance
keywords: javascript, typescript, tc39, v8, performance, workers, proxy, temporal, signals, branded-types, iterator, weakref, scheduler
version: 1.0.0
-->

# Advanced JavaScript

## When to Use This Skill

Apply when writing performance-critical JS/TS, using modern language features, optimizing for Core Web Vitals, or working with advanced TypeScript patterns.

Auto-activate when code uses: `using`, `Symbol.dispose`, `WeakRef`, `Proxy`, `SharedArrayBuffer`, `scheduler`, branded types, template literal types, `Temporal`, `Iterator.prototype`, `Set.prototype.union`, `AsyncDisposableStack`.

---

## ES2025-2026 Features (Use Now)

### Explicit Resource Management

The `using` and `await using` keywords call `[Symbol.dispose]()` / `[Symbol.asyncDispose]()` automatically on scope exit — no finally blocks needed.

```js
// Synchronous disposal
{
  using file = openFileSync('data.txt');
  // [Symbol.dispose]() called automatically on scope exit — even on throw
}

// Asynchronous disposal
async function process() {
  await using conn = await db.connect();
  // [Symbol.asyncDispose]() awaited automatically
}

// DisposableStack — coordinate multiple resources
await using stack = new AsyncDisposableStack();
const conn = stack.use(await db.connect());
const file = stack.use(await openFile());
// Both disposed in LIFO order on scope exit
stack.defer(() => metrics.record('cleanup'));

// Make your own disposables
class TempFile {
  constructor(path) { this.path = path; }
  [Symbol.dispose]() { fs.unlinkSync(this.path); }
}
```

**Rule**: Replace every try/finally cleanup pattern with `using`. It composes better, handles throws, and is statically analyzable.

---

### Iterator Helpers (Lazy, Chainable)

Generator iterators now have a full method suite. All operations are lazy — nothing executes until consumed.

```js
function* naturals() { let n = 1; while (true) yield n++; }

// Lazy pipeline — only processes what's needed
const first5Evens = naturals()
  .filter(n => n % 2 === 0)
  .take(5)
  .toArray(); // [2, 4, 6, 8, 10]

// Available methods
// .map(fn)         — transform each value
// .filter(fn)      — keep matching values
// .take(n)         — limit to n values
// .drop(n)         — skip first n values
// .flatMap(fn)     — map + flatten one level
// .reduce(fn, init) — fold to single value
// .forEach(fn)     — side-effect iteration
// .some(fn)        — short-circuit exists check
// .every(fn)       — short-circuit all check
// .find(fn)        — short-circuit search
// .toArray()       — materialize to array

// Works on any iterator, not just generators
const result = [1, 2, 3, 4, 5].values()
  .filter(n => n > 2)
  .map(n => n * 10)
  .toArray(); // [30, 40, 50]
```

**Rule**: Replace `.filter().map()` chains on arrays with iterator pipelines when the source is large or infinite — single pass, no intermediate arrays.

---

### New Set Methods

```js
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);

a.union(b);               // Set {1, 2, 3, 4}
a.intersection(b);        // Set {2, 3}
a.difference(b);          // Set {1}
a.symmetricDifference(b); // Set {1, 4}
a.isSubsetOf(b);          // false
a.isSupersetOf(b);        // false
a.isDisjointFrom(b);      // false (shares 2, 3)
```

All methods accept any iterable, not just other Sets. These replace all lodash set-operation helpers.

---

### Other ES2025 Highlights

**`Array.fromAsync(asyncIterable)`** — collect from async generators or readable streams:
```js
async function* pages() { /* yield fetched pages */ }
const allPages = await Array.fromAsync(pages());
```

**`Promise.try(fn)`** — wrap sync-or-async in promise chain for uniform error handling:
```js
// Before: if fn throws synchronously, it escapes the chain
// After:
Promise.try(() => JSON.parse(input))
  .then(process)
  .catch(handleError); // catches both sync throws and async rejections
```

**`Object.groupBy` / `Map.groupBy`** — native grouping, replaces lodash `_.groupBy`:
```js
const grouped = Object.groupBy(users, u => u.role);
// { admin: [...], editor: [...], viewer: [...] }
const byRole = Map.groupBy(users, u => u.role);
// Map { 'admin' => [...], ... }
```

**Immutable array methods** — return new arrays, never mutate:
```js
arr.toSorted((a, b) => a - b)    // vs .sort() which mutates
arr.toReversed()                  // vs .reverse()
arr.toSpliced(2, 1, 'new')       // vs .splice()
arr.with(2, 'value')             // replace at index
```

**`RegExp.escape(str)`** — safe dynamic regex construction:
```js
const userInput = 'hello.world (test)';
const re = new RegExp(RegExp.escape(userInput)); // no footgun
```

**`Float16Array`** — half-precision floats for WebGPU/ML workloads:
```js
const weights = new Float16Array(1024); // 2 bytes per element vs 4 for Float32
```

**`Map.prototype.getOrInsert(key, default)`** — atomic upsert:
```js
const counts = new Map();
counts.getOrInsert('key', 0);
// equivalent to: if (!counts.has('key')) counts.set('key', 0);
```

**`Math.sumPrecise(iterable)`** — compensated Kahan summation for financial/scientific:
```js
Math.sumPrecise([0.1, 0.2, 0.3]); // 0.6 (not 0.6000000000000001)
```

**`Uint8Array.fromBase64()` / `.toBase64()`** — replaces atob/btoa for binary:
```js
const bytes = Uint8Array.fromBase64('SGVsbG8=');
const b64 = bytes.toBase64(); // 'SGVsbG8='
```

---

## Polyfill-Ready Features (Stage 3-4)

Use these with polyfills today. Browsers are shipping them now.

### Temporal API — Replaces Date Entirely

`Date` is broken: no timezone support, mutable, wrong epoch math. `Temporal` fixes all of it.

```js
import { Temporal } from 'temporal-polyfill';

// Types
const today = Temporal.Now.plainDateISO();           // PlainDate: 2026-03-30
const now = Temporal.Now.plainDateTimeISO();         // PlainDateTime: 2026-03-30T14:23:01
const instant = Temporal.Now.instant();              // Instant: exact moment in time (ns precision)
const zoned = Temporal.Now.zonedDateTimeISO();       // ZonedDateTime: instant + timezone

// Zoned arithmetic (DST-safe)
const meeting = Temporal.ZonedDateTime.from('2026-04-01T09:00[America/New_York]');
const duration = Temporal.Duration.from({ hours: 2, minutes: 30 });
const end = meeting.add(duration);

// Comparison (no more .getTime() nonsense)
Temporal.PlainDate.compare(today, Temporal.PlainDate.from('2026-01-01')); // 1

// Duration arithmetic
const since = today.since(Temporal.PlainDate.from('2025-01-01'));
since.toString(); // 'P1Y2M29D' (ISO 8601)

// Polyfill: npm install temporal-polyfill
// Native: Chrome 144+, Firefox 139+
```

**Types reference:**
- `PlainDate` — calendar date only (no time, no timezone)
- `PlainTime` — time only
- `PlainDateTime` — date + time, no timezone
- `ZonedDateTime` — full: date + time + timezone (preferred for user-facing times)
- `Instant` — exact point in time, no calendar/timezone
- `Duration` — period of time

---

### Decorators (TS 5.x Native, Standard Semantics)

TC39 Stage 3 decorators ship with TypeScript 5.0+. Different from legacy experimental decorators.

```ts
// Method decorator — logging
function logged(target: any, ctx: ClassMethodDecoratorContext) {
  const name = String(ctx.name);
  return function(this: any, ...args: any[]) {
    console.log(`[${name}] called with`, args);
    const result = target.call(this, ...args);
    console.log(`[${name}] returned`, result);
    return result;
  };
}

// Field decorator — validation
function nonNegative(target: undefined, ctx: ClassFieldDecoratorContext) {
  return function(this: any, value: number) {
    if (value < 0) throw new RangeError(`${String(ctx.name)} must be >= 0`);
    return value;
  };
}

// Class decorator — singleton
function singleton<T extends { new(...args: any[]): {} }>(Base: T, _ctx: ClassDecoratorContext) {
  let instance: InstanceType<T>;
  return class extends Base {
    constructor(...args: any[]) {
      if (instance) return instance;
      super(...args);
      instance = this as any;
    }
  };
}

class Service {
  @nonNegative accessor count = 0;
  @logged greet(name: string) { return `Hello ${name}`; }
}

@singleton
class Config { /* ... */ }
```

**Note**: Enable with `"experimentalDecorators": false` (or omit — it's now default standard decorators) in tsconfig. Do NOT use legacy `"experimentalDecorators": true` for new code.

---

### `import defer` (Stage 3)

Delays module execution until the first property access. Parse + link happen eagerly; execution defers.

```js
import defer * as analytics from './analytics.js';
// Module parsed but not executed yet

button.addEventListener('click', () => {
  analytics.track('click'); // execution happens here, on first access
});
```

Use for heavy optional modules that may never be needed in a given session.

---

## Watch List — Do Not Ship Yet

These are in active development. Follow but don't use in production without a polyfill strategy.

| Feature | Stage | Status |
|---------|-------|--------|
| **Signals** | Stage 1 | Framework-agnostic reactive primitive. Co-designed by Angular, Vue, Solid, Svelte, MobX, Preact, Qwik. Reference impl: `@preact/signals-core`. Will unify framework reactivity. |
| **Pattern Matching** | Stage 2 | `match {}` expressions with destructuring and guards. Similar to Rust's `match`. |
| **Record & Tuple** | Stage 2 | Immutable value types (`#{ }` / `#[ ]`) with structural equality (`#{a:1} === #{a:1}`). |
| **Type Annotations** | Stage 1 | Native TS-style type syntax in JS files (stripped at runtime, no transpile). |

---

## V8 Optimization

### Hidden Classes and Inline Caches

V8 assigns a "hidden class" (also called a "shape" or "map") to every object based on its property layout. Inline Caches (ICs) record the shapes seen at each call site:

- **Monomorphic** (1 shape): fastest path — direct property offset lookup
- **Polymorphic** (2-4 shapes): IC switches on shape — slower but still fast
- **Megamorphic** (5+ shapes): falls back to hash lookup — **10-100x slower in hot loops**

```js
// WRONG — creates 3 different hidden classes
function makePoint(x, y, label) {
  const p = {};
  p.x = x;
  if (label) p.label = label; // conditional property → shape divergence
  p.y = y;                    // different order → new shape
  return p;
}

// RIGHT — always same shape, same order
function makePoint(x, y, label = null) {
  return { x, y, label }; // consistent layout every time
}

// RIGHT — use a class for hot-path objects
class Point {
  constructor(x, y, label = null) {
    this.x = x;
    this.y = y;
    this.label = label; // always defined, always same order
  }
}
```

**Rules:**
- Always initialize all properties in the **same order** in the constructor or object literal
- **Never `delete` properties** — it forces "dictionary mode" (hash table, not offset). Set to `null` or `undefined` instead
- Don't add properties after construction — declare all upfront
- Use classes with constructors for hot-path objects (not plain object factories)
- Avoid polymorphic function arguments in tight loops — keep shapes consistent

---

### Deoptimization Traps

These patterns cause V8 to bail out of optimized JIT code back to interpreter:

```js
// TRAP: arguments object in optimized functions
function sum() {
  let t = 0;
  for (let i = 0; i < arguments.length; i++) t += arguments[i]; // deopt
  return t;
}
// FIX: rest parameters
function sum(...args) {
  return args.reduce((t, n) => t + n, 0);
}

// TRAP: try/catch in hot functions (deoptimizes entire function in V8 < Node 18)
function hotPath(items) {
  try {
    for (const item of items) process(item); // whole loop can't be optimized
  } catch (e) { /* ... */ }
}
// FIX: extract hot code out of try blocks
function hotPath(items) {
  try {
    processAll(items); // try wraps only the call
  } catch (e) { /* ... */ }
}
function processAll(items) {
  for (const item of items) process(item); // this can be optimized
}

// TRAP: for...in on objects with prototype chain
for (const key in obj) { /* enumerates prototype chain too — slow */ }
// FIX:
for (const key of Object.keys(obj)) { /* own enumerable keys only */ }

// TRAP: hidden class transitions in object pools
const pool = Array.from({ length: 100 }, () => ({}));
pool[0].x = 1; // some get x...
pool[1].y = 2; // others get y... → megamorphic IC in consumer code
// FIX: pre-allocate all fields
const pool = Array.from({ length: 100 }, () => ({ x: 0, y: 0, active: false }));
```

---

### Turbofan Type Stability

V8's Turbofan optimizer needs type-stable code:

```js
// WRONG — type instability
function add(a, b) { return a + b; } // sometimes int+int, sometimes string+string → polymorphic
add(1, 2);       // IC sees int
add('a', 'b');   // IC sees string → megamorphic

// RIGHT — separate functions for different types, or use TypeScript to enforce
function addInts(a: number, b: number) { return a + b; }
function concat(a: string, b: string) { return a + b; }

// WRONG — SMI (small integer) overflow in tight loops
let count = 2_000_000_000;
count++; // transitions from SMI to HeapNumber → deopt
// FIX: use BigInt for large integers, or keep counts within SMI range (-2^31 to 2^31-1)
```

---

## Concurrency

### Web Workers + SharedArrayBuffer + Atomics

Enables true parallelism in the browser. Requires COOP/COEP headers.

```js
// main.js
const sab = new SharedArrayBuffer(4 * 4); // 4 x Int32
const shared = new Int32Array(sab);
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

worker.postMessage({ sab });
worker.onmessage = ({ data }) => console.log('worker result:', data);

// Atomic wait on main thread (use only in workers — blocks in browsers!)
// Atomics.wait(shared, 0, 0); // wait for index 0 to change from 0

// Non-blocking check
Atomics.waitAsync(shared, 0, 0).value.then(() => console.log('signaled'));

// worker.js
self.onmessage = ({ data: { sab } }) => {
  const arr = new Int32Array(sab);
  Atomics.add(arr, 0, 1);      // thread-safe increment
  Atomics.store(arr, 1, 42);   // atomic write
  Atomics.notify(arr, 0, 1);   // wake one thread waiting on index 0
  self.postMessage(Atomics.load(arr, 0));
};
```

**Required HTTP headers** (SharedArrayBuffer won't work without these):
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Atomics methods:**
- `Atomics.add/sub/and/or/xor(array, index, value)` — read-modify-write
- `Atomics.load/store(array, index)` — atomic read/write
- `Atomics.compareExchange(array, index, expected, replacement)` — CAS
- `Atomics.wait(array, index, value)` — block until changed (workers only)
- `Atomics.waitAsync(array, index, value)` — non-blocking, returns Promise
- `Atomics.notify(array, index, count)` — wake waiting threads

---

### Scheduler APIs (Critical for INP)

Interaction to Next Paint (INP) is the primary CWV performance signal. Long tasks block the main thread.

```js
// scheduler.yield() — cooperative yielding inside async functions
// Yields control back to the browser between chunks of work
async function processLargeList(items) {
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);
    if (i % 100 === 0) {
      await scheduler.yield(); // yield to browser, then resume
    }
  }
}

// scheduler.postTask() — priority-based task scheduling
// Priorities: 'user-blocking' > 'user-visible' > 'background'
scheduler.postTask(() => updateCriticalUI(), { priority: 'user-blocking' });
scheduler.postTask(() => renderBelowFold(), { priority: 'user-visible' });
scheduler.postTask(() => runAnalytics(), { priority: 'background' });

// Cancel a scheduled task
const controller = new TaskController();
scheduler.postTask(() => heavyWork(), {
  priority: 'background',
  signal: controller.signal,
});
controller.abort(); // cancel before it runs

// Polyfill for older browsers: scheduler-polyfill (npm)
// Native: Chrome 94+, limited Firefox support
```

**Rule**: Any task >50ms blocks INP. Chunk it with `scheduler.yield()`. Never use `setTimeout(fn, 0)` as a yielding mechanism in 2025+ — use the Scheduler API.

---

### AbortController Patterns

```js
// Chain multiple fetches with one abort signal
const controller = new AbortController();
const { signal } = controller;

const [users, posts] = await Promise.all([
  fetch('/api/users', { signal }),
  fetch('/api/posts', { signal }),
]);
// Cancel both: controller.abort()

// Timeout abort (no manual setTimeout needed)
const response = await fetch('/api/data', {
  signal: AbortSignal.timeout(5000), // auto-abort after 5s
});

// Combine multiple abort sources (either cancels)
const userCancel = new AbortController();
const combined = AbortSignal.any([
  userCancel.signal,
  AbortSignal.timeout(10_000),
]);
await fetch('/api/slow', { signal: combined });

// Cleanup event listeners
const removeListener = () => element.removeEventListener('click', handler);
signal.addEventListener('abort', removeListener);
// or: signal.throwIfAborted() inside async generator loops
```

---

## Streaming

### ReadableStream Pipelines

```js
// Full pipeline: fetch → decompress → decode → parse
const stream = response.body
  .pipeThrough(new DecompressionStream('gzip'))
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TransformStream({
    transform(chunk, controller) {
      for (const line of chunk.split('\n')) {
        if (line.trim()) controller.enqueue(JSON.parse(line));
      }
    },
  }));

// Consume with for-await
for await (const record of stream) {
  render(record); // streaming render as data arrives
}

// Client-side compression before upload
async function uploadCompressed(file) {
  const compressed = await new Response(
    file.stream().pipeThrough(new CompressionStream('gzip'))
  ).blob();
  return fetch('/upload', { method: 'POST', body: compressed });
}

// Custom ReadableStream — push-based
const readable = new ReadableStream({
  start(controller) {
    const timer = setInterval(() => {
      controller.enqueue(Date.now());
    }, 100);
    return () => clearInterval(timer); // cancel callback
  },
});

// Custom TransformStream — stateful transform
const csvToJson = new TransformStream({
  start() { this.headers = null; },
  transform(line, controller) {
    if (!this.headers) { this.headers = line.split(','); return; }
    const obj = Object.fromEntries(this.headers.map((h, i) => [h, line.split(',')[i]]));
    controller.enqueue(obj);
  },
});
```

---

## Memory Management

### WeakRef Cache Pattern

```js
class WeakCache {
  #map = new Map();
  #registry = new FinalizationRegistry(key => {
    this.#map.delete(key); // clean up when value is GC'd
  });

  set(key, value) {
    this.#map.set(key, new WeakRef(value));
    this.#registry.register(value, key); // watch for GC
  }

  get(key) {
    return this.#map.get(key)?.deref(); // undefined if GC'd
  }

  has(key) {
    return this.#map.get(key)?.deref() !== undefined;
  }
}

// Usage — values can be GC'd under memory pressure
const imageCache = new WeakCache();
imageCache.set('hero', largeBitmapObject);
const img = imageCache.get('hero'); // may return undefined
if (!img) { /* reload */ }
```

**Rules for WeakRef / FinalizationRegistry:**
- `WeakRef.deref()` — always handle `undefined` (GC may have collected it)
- `FinalizationRegistry` — use for **cleanup notification only** (logging, cache eviction), never for correctness-critical logic. GC timing is non-deterministic across engines and runs.
- `WeakMap` — preferred for private metadata on objects; no key enumeration means no leaks

```js
// WeakMap for private class state (pre-#private field era pattern, still valid)
const _state = new WeakMap();
class Connection {
  constructor(url) { _state.set(this, { url, open: false }); }
  open() { _state.get(this).open = true; }
}
// state is released when Connection instance is GC'd — no memory leak
```

---

## Proxy / Reflect

### Common Patterns

```js
// Validation proxy
function createValidated(target, rules) {
  return new Proxy(target, {
    set(obj, prop, value, receiver) {
      const rule = rules[prop];
      if (rule && !rule(value)) {
        throw new TypeError(`Invalid value for ${String(prop)}: ${value}`);
      }
      return Reflect.set(obj, prop, value, receiver); // always use Reflect for correct behavior
    },
  });
}
const user = createValidated({}, {
  age: v => typeof v === 'number' && v >= 0 && v <= 150,
  email: v => typeof v === 'string' && v.includes('@'),
});

// Lazy initialization proxy — property computed on first access
function lazy(factory) {
  const cache = {};
  return new Proxy({}, {
    get(target, prop) {
      if (!(prop in cache)) cache[prop] = factory(prop);
      return cache[prop];
    },
    has(target, prop) { return true; }
  });
}
const computed = lazy(key => expensiveCompute(key));
computed.result; // computes once, cached thereafter

// Readonly deep freeze proxy
function deepReadonly(obj) {
  return new Proxy(obj, {
    set() { throw new TypeError('Cannot mutate readonly object'); },
    deleteProperty() { throw new TypeError('Cannot mutate readonly object'); },
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      return value && typeof value === 'object' ? deepReadonly(value) : value;
    },
  });
}

// Revocable proxy — capability that can be permanently revoked
const { proxy, revoke } = Proxy.revocable(sensitiveApi, handler);
share(proxy); // give access
revoke();     // permanently revoke — any access throws TypeError
```

**Anti-pattern — never proxy in hot paths:**
```js
// WRONG: proxy in tight loop — trap overhead is measurable
const arr = new Proxy(realArray, { get(t, p) { return Reflect.get(t, p); } });
for (let i = 0; i < 1_000_000; i++) arr[i]; // every access goes through trap

// RIGHT: use proxy at boundaries, not in loops
const validated = createValidated(rawData, schema);
// pass validated.value into processing, not the proxy itself
const value = validated.value; // unwrap at boundary
processData(value);            // hot path uses plain value
```

---

## Advanced TypeScript

### Branded Types — Prevent ID Mixups

```ts
declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

type UserId  = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;
type ProductId = Brand<number, 'ProductId'>;

// Constructor functions (narrow to branded type)
const UserId   = (id: string): UserId   => id as UserId;
const OrderId  = (id: string): OrderId  => id as OrderId;
const ProductId = (id: number): ProductId => id as ProductId;

function getUser(id: UserId) { /* ... */ }
function getOrder(id: OrderId) { /* ... */ }

const uid = UserId('user_123');
const oid = OrderId('order_456');

getUser(uid);  // ok
getUser(oid);  // compile error: Argument of type 'OrderId' is not assignable to 'UserId'
getUser('raw-string'); // compile error
```

---

### `satisfies` Operator — Validate Without Widening

```ts
// Problem: `as Record<...>` widens types, losing literal inference
// Problem: full type annotation also widens

const ROUTES = {
  home:    { path: '/',        auth: false },
  profile: { path: '/profile', auth: true  },
  admin:   { path: '/admin',   auth: true  },
} satisfies Record<string, { path: string; auth: boolean }>;

// Type of ROUTES.home.path is '/' — literal preserved (not widened to string)
// Type validation still enforced — wrong shape gives compile error
// Best of both worlds: validation + precise inference

// Practical: config objects, route definitions, event maps
const EVENTS = {
  click:  (e: MouseEvent)    => void 0,
  input:  (e: InputEvent)    => void 0,
  keydown: (e: KeyboardEvent) => void 0,
} satisfies Record<string, (e: Event) => void>;
// EVENTS.click is typed as (e: MouseEvent) => void, not (e: Event) => void
```

---

### `const` Type Parameters — Preserve Literal Types

```ts
// Without const — widened to string[]
function tuple<T extends string[]>(...args: T) { return args; }
tuple('a', 'b'); // string[]

// With const — preserves literals as readonly tuple
function tuple<const T extends string[]>(...args: T) { return args; }
tuple('a', 'b'); // readonly ['a', 'b']

// Practical: route builders, event lists, SQL column names
function select<const T extends string[]>(table: string, ...cols: T): Query<T> {
  return new Query(table, cols);
}
select('users', 'id', 'name', 'email'); // Query<readonly ['id', 'name', 'email']>
```

---

### Template Literal Types — Parse Strings at Type Level

```ts
// Extract route params from path pattern
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type Params = ExtractParams<'/users/:userId/posts/:postId'>;
// type Params = "userId" | "postId"

// Typed event emitter
type EventMap = {
  'user:created': { id: string; name: string };
  'user:deleted': { id: string };
  'order:placed': { orderId: string; total: number };
};
type EventName = keyof EventMap; // 'user:created' | 'user:deleted' | 'order:placed'
type EventPayload<T extends EventName> = EventMap[T];

function emit<T extends EventName>(event: T, payload: EventPayload<T>) { /* ... */ }
emit('user:created', { id: '1', name: 'Alice' }); // ok
emit('user:created', { id: '1' });                 // error: missing name

// CSS property validator
type CSSProperty = `${'margin' | 'padding'}-${'top' | 'right' | 'bottom' | 'left'}`;
// 'margin-top' | 'margin-right' | ... | 'padding-left'

// SCREAMING_SNAKE from camelCase
type ScreamingSnake<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Head extends Uppercase<Head>
      ? `_${Uppercase<Head>}${ScreamingSnake<Tail>}`
      : `${Uppercase<Head>}${ScreamingSnake<Tail>}`
    : S;
type T = ScreamingSnake<'helloWorldFoo'>; // 'HELLO_WORLD_FOO'
```

---

### Conditional Types + `infer` — Utility Types

```ts
// Recursive Awaited (built-in since TS 4.5 — shown for pattern understanding)
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// Discriminate a union by a literal key
type DiscriminateUnion<T, K extends keyof T, V extends T[K]> =
  T extends Record<K, V> ? T : never;

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number };
type Circle = DiscriminateUnion<Shape, 'kind', 'circle'>;
// { kind: 'circle'; radius: number }

// DeepReadonly
type DeepReadonly<T> =
  T extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

// DeepPartial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Paths of an object (dotted notation)
type Paths<T, Prefix extends string = ''> = {
  [K in keyof T & string]:
    T[K] extends object
      ? Paths<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`;
}[keyof T & string];

type Config = { db: { host: string; port: number }; app: { name: string } };
type ConfigPaths = Paths<Config>; // 'db.host' | 'db.port' | 'app.name'
```

---

### Variadic Tuple Types

```ts
// Concat tuple types
type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U];
type AB = Concat<[string, number], [boolean, Date]>; // [string, number, boolean, Date]

// Typed curry
function curry<Args extends unknown[], Return>(
  fn: (...args: Args) => Return
) {
  return (...args: Args) => fn(...args);
}

// Spread in the middle
type WithMiddle<T extends unknown[]> = [string, ...T, number];
type Example = WithMiddle<[boolean, Date]>; // [string, boolean, Date, number]
```

---

## React Compiler (React 19+)

The React Compiler (formerly React Forget) performs static analysis to auto-memoize components. It eliminates the need for manual `useMemo`, `useCallback`, and `React.memo` in most cases.

**Impact (Meta production data):**
- 12% faster initial page loads
- 2.5x faster interactions

**Setup:**
```bash
npm install babel-plugin-react-compiler@latest
```

```js
// next.config.js
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
};
```

**Stop writing this in React 19+ with compiler enabled:**
```tsx
// BEFORE — manual memoization
const MemoList = React.memo(({ items }) => { /* ... */ });
const handleClick = useCallback(() => action(id), [id]);
const sorted = useMemo(() => items.toSorted(), [items]);

// AFTER — compiler handles it automatically
const List = ({ items }) => { /* ... */ }; // compiler memoizes
function Component({ id }) {
  const handleClick = () => action(id); // compiler memoizes
  const sorted = items.toSorted();      // compiler memoizes
}
```

**Rules the compiler enforces (your code must follow):**
- No mutation of props or state during render
- Hooks must follow the Rules of Hooks (no conditional calls)
- Components must be pure functions (same input → same output)

**Opt out a specific component:**
```tsx
function LegacyWidget() {
  'use no memo';
  // compiler skips this component
}
```

---

## Performance Micro-Patterns

### Data Structure Choice

```js
// O(n) → O(1): array search vs Map lookup
const userArray = [{ id: 'a', name: 'Alice' }, /* ... 10000 users */];
// WRONG: O(n) per lookup
const alice = userArray.find(u => u.id === 'a');

// RIGHT: O(1) per lookup after O(n) build
const userMap = new Map(userArray.map(u => [u.id, u]));
const alice = userMap.get('a'); // O(1)

// O(n) → O(1): array.includes vs Set.has
const allowed = new Set(['admin', 'editor', 'viewer']);
if (allowed.has(role)) { /* O(1) */ }
// vs ['admin', 'editor', 'viewer'].includes(role) // O(n) every time
```

### Loop Optimizations

```js
// Single-pass with flatMap instead of filter+map
const activeNames = users.flatMap(u => u.active ? [u.name] : []);
// vs users.filter(u => u.active).map(u => u.name) — two passes, two arrays

// Combine multiple conditions into one loop
// WRONG: three passes
const result = items
  .filter(isValid)
  .filter(isActive)
  .map(transform);

// RIGHT: one pass
const result = [];
for (const item of items) {
  if (isValid(item) && isActive(item)) result.push(transform(item));
}

// Cache expensive reads outside loops
// WRONG
for (const key of keys) {
  const val = localStorage.getItem('config'); // re-reads every iteration
  process(key, val);
}
// RIGHT
const config = localStorage.getItem('config');
for (const key of keys) {
  process(key, config);
}
```

### Scheduling Heuristics

```js
// requestAnimationFrame — visual updates only (runs before next paint)
function updateProgressBar(pct) {
  requestAnimationFrame(() => {
    progressEl.style.width = `${pct}%`;
  });
}

// requestIdleCallback — truly non-urgent background work
// May not run for seconds if the browser is busy
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    tasks.shift()();
  }
}, { timeout: 2000 }); // force-run after 2s max

// scheduler.postTask — predictable priority queue (preferred over rIC)
scheduler.postTask(() => prefetchData(), { priority: 'background' });
```

### String Performance

```js
// Array.join for building large strings (single allocation)
const parts = [];
for (const item of items) parts.push(format(item));
const output = parts.join('\n'); // ONE string allocation at end
// vs repeated concatenation: str += format(item) — O(n²) allocations

// Tagged template literals for SQL/HTML (safe + zero-cost abstraction)
function sql(strings, ...values) {
  return { text: strings.join('?'), params: values };
}
const query = sql`SELECT * FROM users WHERE id = ${userId} AND active = ${true}`;
```

---

## Node.js-Specific Patterns

### Async Iteration Over Streams

```js
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

// Process large files line-by-line without loading into memory
async function processLines(filePath) {
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    processLine(line);
  }
}

// Node.js streams are async iterables since v12
import { pipeline } from 'stream/promises'; // promisified pipeline
await pipeline(
  createReadStream('input.gz'),
  createGunzip(),
  createWriteStream('output.txt'),
);
```

### Worker Threads

```js
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

if (isMainThread) {
  const worker = new Worker(new URL(import.meta.url), {
    workerData: { items: heavyArray },
  });
  worker.on('message', result => console.log('done:', result));
  worker.on('error', err => console.error(err));
} else {
  const result = heavyProcess(workerData.items);
  parentPort.postMessage(result);
}
```

---

## DOM-Free Text Measurement — @chenglou/pretext

**When to use:** Any time you need text dimensions (height, line count, line breaks, overflow) without triggering browser layout reflow. Required for: virtual lists, Canvas/SVG text, CLS prevention, off-screen layout calculation.

**Install:** `npm install @chenglou/pretext`

### Core API

**Use case 1 — Measure height, no DOM needed**

`prepare()` once → `layout()` many times (pure arithmetic after prep):

```ts
import { prepare, layout } from '@chenglou/pretext';

const prepared = await prepare(text, '16px Inter', { maxWidth: 400 });
const { height, lineCount } = layout(prepared);
// ~19ms for prepare(), ~0.09ms per layout() call
```

**Use case 2 — Line-by-line control (Canvas, SVG, custom engines)**

```ts
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

const seg = await prepareWithSegments(text, '16px Inter');
const lines = layoutWithLines(seg, { maxWidth: 300 });
// lines: [{ text: '...', width: 298, x: 0, y: 0 }, ...]
```

**Use case 3 — Variable-width lines (text wrapping around an image)**

```ts
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';

const seg = await prepareWithSegments(text, '16px Inter');
for (const line of layoutNextLine(seg, widthPerLine)) {
  // widthPerLine can change per line (e.g. shrinks around a floated image)
}
```

### Performance profile

| Operation | Time |
|-----------|------|
| `prepare()` | ~19ms — one-time, cache per text+font combo |
| `layout()` | ~0.09ms — across 500 texts, pure arithmetic |

### Constraints

- Targets standard CSS: `white-space: normal`, `word-break: normal`, `overflow-wrap: break-word`
- Optional `pre-wrap` mode preserves spaces, tabs, and newlines
- Browser-only: uses font engine as reference during `prepare()`
- Avoid system fonts on macOS — named fonts (Inter, Geist) give best accuracy

### Patterns

**Virtual list item height (no DOM reflow):**

```ts
const heights = await Promise.all(
  items.map(item =>
    prepare(item.text, font, { maxWidth: colWidth })
      .then(p => layout(p).height)
  )
);
```

**Canvas text render:**

```ts
const seg = await prepareWithSegments(text, '14px monospace');
const lines = layoutWithLines(seg, { maxWidth: canvasWidth });
lines.forEach(({ text, x, y }) => ctx.fillText(text, x, y + lineHeight));
```

**CLS prevention (pre-measure before paint):**

```ts
// Measure before mount — pass height as inline style to reserve space
const { height } = layout(await prepare(content, font, { maxWidth: 640 }));
element.style.minHeight = `${height}px`;
```

**Text overflow detection:**

```ts
const { lineCount } = layout(await prepare(text, font, { maxWidth: 200 }));
const isOverflowing = lineCount > maxLines;
```

**Cache prepare() results when measuring many items with the same font:**

```ts
const cache = new Map<string, Awaited<ReturnType<typeof prepare>>>();

async function measuredHeight(text: string, font: string, maxWidth: number) {
  const key = `${text}::${font}::${maxWidth}`;
  if (!cache.has(key)) cache.set(key, await prepare(text, font, { maxWidth }));
  return layout(cache.get(key)!).height;
}
```

---

## Quick Reference

### Feature → Browser Support (as of 2026)

| Feature | Chrome | Firefox | Safari | Node |
|---------|--------|---------|--------|------|
| `using` / explicit resource mgmt | 120+ | 127+ | 17.4+ | 22+ |
| Iterator helpers | 117+ | 131+ | 17.4+ | 22+ |
| Set methods (union/intersection) | 122+ | 127+ | 17+ | 22+ |
| `Array.fromAsync` | 121+ | 115+ | 16.4+ | 22+ |
| `Promise.try` | 126+ | 128+ | 18+ | 22+ |
| `Object.groupBy` | 117+ | 119+ | 17.4+ | 21+ |
| `.toSorted()` / `.toReversed()` | 110+ | 115+ | 16+ | 20+ |
| `scheduler.yield()` | 115+ | — | — | — |
| `scheduler.postTask()` | 94+ | — | — | — |
| `Temporal` | 144+ | 139+ | — | polyfill |
| Decorators (standard) | 130+ | — | — | TS 5.x |
| `import defer` | — | — | — | proposal |

### Auto-Activation Triggers

This skill should activate automatically when code contains:
- `using ` or `await using ` keywords
- `Symbol.dispose` or `Symbol.asyncDispose`
- `WeakRef(` or `new WeakRef`
- `new Proxy(` in non-trivial context
- `SharedArrayBuffer` or `Atomics.`
- `scheduler.yield` or `scheduler.postTask`
- `Temporal.` namespace
- `Iterator.from` or `.filter().take()`
- `satisfies` keyword with complex types
- Branded type patterns (`[__brand]`)
- `FinalizationRegistry`
- `AbortSignal.any` or `AbortSignal.timeout`
