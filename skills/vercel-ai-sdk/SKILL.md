---
name: vercel-ai-sdk
description: Vercel AI SDK 7 for Next.js 16 (v7 stable 2026-06-25) — generateText / generateObject / streamObject, Agent abstraction with tool loops (durable WorkflowAgent in v7), human-in-the-loop tool approval, useChat hook with structured tool UI. Provider-neutral (Anthropic, OpenAI, Google, Groq, etc.) but Anthropic-first. Verified package versions, RSC-safe patterns, edge runtime caveats.
version: 1.0.0
license: MIT
---

# Vercel AI SDK 7 for Next.js 16

The TypeScript toolkit for AI features in Next.js apps — chat UI, structured outputs, agents with tool loops. Provider-neutral but works best with Anthropic Claude. ~20M weekly npm downloads, MIT, maintained by Vercel.

## Version pairing (verified 2026-07-04 via `npm view`)

| Package | Version | Notes |
|---|---|---|
| `ai` | `^7.0` | Core SDK + React hooks (`useChat`, `useCompletion`, `useObject`). v6 added the `Agent` abstraction; **v7 (stable 2026-06-25)** adds durable `WorkflowAgent` (survives deploys/restarts), stable tool approvals, redesigned telemetry (`@ai-sdk/otel`), MCP Apps. |
| `@ai-sdk/anthropic` | latest | Anthropic provider. Default for new projects. |
| `@ai-sdk/openai` | latest | OpenAI provider |
| `@ai-sdk/google` | latest | Gemini provider |
| `zod` | `^3.25` or `^4` | Peer dep for structured outputs and tool schemas (`ai@7` accepts `zod ^3.25.76 || ^4.1.8`; zod 4.4 is current) |

> **v6 → v7:** the official codemod (`npx @ai-sdk/codemod`) automates most renames; migration guide is linked from the [AI SDK 7 changelog](https://vercel.com/changelog/ai-sdk-7). The patterns below were authored against v6 and carry into v7 (rename-level changes only) — when building, re-verify signatures against current docs via Context7.

## Install

```bash
npm install ai @ai-sdk/anthropic zod
# optional alternates: @ai-sdk/openai @ai-sdk/google @ai-sdk/groq @ai-sdk/xai
```

Add to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Four primitives — pick the one that matches the shape of your output

| Function | Output | Use when |
|---|---|---|
| `generateText` | one string | One-shot completion, no streaming, no tools |
| `streamText` | streamed string | Chat / autocompletion / anything where progressive render helps UX |
| `generateObject` | one typed object (Zod) | One-shot structured output — extraction, classification, form-filling |
| `streamObject` | streamed typed object | Long structured generations where partials can render (e.g. list of items) |

Plus the high-level: `Agent` for multi-step tool-using flows.

## Pattern 1 — Simple chat route (streaming, no tools)

**`app/api/chat/route.ts`** — Edge-friendly streaming chat endpoint:

```ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const maxDuration = 30;        // Vercel hobby cap; Pro is 300

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: 'You are a concise assistant. Reply in 1-2 sentences.',
    messages,
  });

  return result.toUIMessageStreamResponse();
}
```

**`app/chat/page.tsx`** — Client UI with `useChat`:

```tsx
'use client';

import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat();

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      {messages.map((m) => (
        <div key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
          <span className="inline-block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
            {m.content}
          </span>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything…"
          disabled={status !== 'ready'}
        />
        <button className="rounded bg-zinc-900 px-4 py-2 text-white">
          Send
        </button>
      </form>
    </div>
  );
}
```

That's the minimum viable Claude chat in Next.js — about 40 lines total.

## Pattern 2 — Structured output (form-filling / extraction)

```ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const PersonSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().int().min(0).max(120),
  interests: z.array(z.string()).max(5),
});

export async function extractPerson(text: string) {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-5'),
    schema: PersonSchema,
    prompt: `Extract the person info from: ${text}`,
  });

  // `object` is fully typed: { name: string; email: string; age: number; interests: string[] }
  return object;
}
```

Schema validation happens on the SDK side — if the model returns invalid JSON, the SDK retries automatically (configurable via `maxRetries`).

## Pattern 3 — Streaming structured output

```ts
import { streamObject } from 'ai';

const result = await streamObject({
  model: anthropic('claude-sonnet-4-5'),
  schema: z.object({
    items: z.array(z.object({ title: z.string(), summary: z.string() })),
  }),
  prompt: 'Generate 5 blog post ideas about Next.js 16.',
});

// In a Server Action / Route Handler:
for await (const partial of result.partialObjectStream) {
  // partial.items may have 1, 2, 3, … entries as they stream in
  console.log(partial);
}
```

Pair with the `useObject` React hook for progressive UI render.

## Pattern 4 — Tool use (model calls your functions)

```ts
import { streamText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-sonnet-4-5'),
    messages,
    tools: {
      getWeather: tool({
        description: 'Get the current weather for a city',
        parameters: z.object({
          city: z.string().describe('City name, e.g. "Toronto"'),
        }),
        execute: async ({ city }) => {
          // Your actual implementation
          const res = await fetch(`https://wttr.in/${city}?format=j1`);
          const data = await res.json();
          return { tempC: data.current_condition[0].temp_C, desc: data.current_condition[0].weatherDesc[0].value };
        },
      }),
    },
    maxSteps: 5,    // Allow up to 5 tool-call → model-respond → tool-call cycles
  });

  return result.toUIMessageStreamResponse();
}
```

The model decides when to call `getWeather`. The SDK runs your `execute`, feeds the result back, and the model continues until it's done. `maxSteps` caps the loop.

## Pattern 5 — `Agent` abstraction (AI SDK 6+; v7 adds durable `WorkflowAgent`)

For reusable agents — define once, use everywhere:

```ts
import { Agent } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export const researchAgent = new Agent({
  model: anthropic('claude-sonnet-4-5'),
  system: 'You are a research assistant. Cite sources for every claim.',
  tools: {
    webSearch: tool({
      description: 'Search the web',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => fetchSearchResults(query),
    }),
    saveNote: tool({
      description: 'Save a research note',
      parameters: z.object({ title: z.string(), body: z.string() }),
      execute: async ({ title, body }) => db.notes.create({ data: { title, body } }),
    }),
  },
  maxSteps: 10,
});

// Use it:
const result = await researchAgent.generate({ prompt: 'Research Next.js 16 cache components and save 3 notes.' });
```

## Human-in-the-loop tool approval (AI SDK 6+; stable in v7)

```ts
tool({
  description: 'Send an email',
  parameters: z.object({ to: z.string(), subject: z.string(), body: z.string() }),
  // Mark as requiring approval — model proposes the call, UI surfaces it for human confirm
  experimental_toolApproval: 'required',
  execute: async (params) => sendEmail(params),
});
```

Pair with the `<ToolApproval>` UI component from `ai/react` to render an approve/deny button in chat.

## RSC + streaming considerations

- **`useChat` is a Client Component hook.** Pages that use it need `'use client'`.
- **Route handlers** (`app/api/.../route.ts`) are fine for streaming — they run on the server but stream chunks to the client.
- **React Server Components** can `generateText` / `generateObject` directly (no streaming) and render the result statically. That's the cheapest pattern when you don't need real-time UX.
- **Server Actions** can stream via `createStreamableValue`. Useful for "click button → see response progressively" without a separate API route.

## Edge runtime caveats

```ts
export const runtime = 'edge';     // Optional — most AI SDK code runs on edge
```

`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` all work on edge. Caveat: if your tool `execute` reaches a DB driver (postgres, mysql2) that uses Node APIs, leave the route on the default Node runtime.

## Cost / latency knobs

| Knob | Effect |
|---|---|
| `model: anthropic('claude-haiku-4-5')` | ~10× cheaper than Sonnet, faster, weaker reasoning |
| `temperature: 0` | Deterministic — use for extraction, never for conversation |
| `maxTokens: 256` | Bounds the response — cheap insurance against runaway costs |
| `experimental_providerMetadata: { anthropic: { cacheControl: { type: 'ephemeral' } } }` | Prompt cache — huge cost win when the same system prompt repeats |

## Common bugs

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module 'ai/react'` | Old `ai` < 4 | Bump to `ai@^6` |
| Tools never get called | Forgot `maxSteps` (defaults to 1, which only lets the model speak — no tool round-trip) | Set `maxSteps: 5` or higher |
| Streaming text not appearing in UI | Route returned plain JSON, not `result.toUIMessageStreamResponse()` | Return the SDK's stream response object |
| `generateObject` returns `null` for some fields | Schema too loose; model hallucinated | Tighten schema (use `.describe()` on fields, use enums where possible) |
| `useChat` initialMessages flicker on refresh | Server-rendered HTML differs from client hook init | Pass `initialMessages` from RSC via `<ChatClient initialMessages={...} />` props |

## When NOT to use AI SDK

- You only call ONE provider's API directly and don't need streaming UI helpers — the raw `@anthropic-ai/sdk` is slightly leaner
- You need OpenTelemetry / tracing baked-in — use a higher-level framework (LangGraph, Mastra)
- Browser-only (no server) — AI SDK assumes you have a server / route handler to keep API keys server-side

## Sources

- [AI SDK docs](https://ai-sdk.dev/docs/introduction)
- [AI SDK 6 announcement (Vercel blog)](https://vercel.com/blog/ai-sdk-6)
- [`ai` on npm](https://www.npmjs.com/package/ai)
- [`@ai-sdk/anthropic` provider](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)
