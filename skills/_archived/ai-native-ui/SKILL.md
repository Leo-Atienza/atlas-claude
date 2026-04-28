<!--
id: SK-086
name: ai-native-ui
description: AI-Native UI — Vercel AI SDK patterns for streaming UI. streamText, useChat, tool-to-component mapping, createStreamableValue, generative UI within PPR shells. Load when building AI-powered interfaces.
keywords: ai-sdk, stream-text, use-chat, generative-ui, tool-invocation, streaming-ui, llm, chatbot, ai-native, createStreamableValue, vercel-ai
version: 1.0.0
-->

# AI-Native UI

## When to Use This Skill

Load when building any UI with LLM integration: chat interfaces, AI-generated content, smart search, content generation tools, or any feature that streams AI responses to users.

This is **Tier 4 (Generative)** in the Vanguard architecture. Load `web-l100` (SK-083) for the full tier system.

---

## The Generative Tier

AI streams are a fundamentally different rendering model. Unlike T0-T3 where the final content is known at render time, T4 content builds up token-by-token with structural uncertainty. The UI must:

1. Show useful content immediately (PPR shell + cached content)
2. Progressively reveal AI-generated content as it streams
3. Handle tool invocations mid-stream (AI calls tools → UI renders components)
4. Gracefully handle interruption (user cancels, network drops)

---

## Core Pattern: streamText + Route Handler

### Server: Route Handler

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250514'),
    system: 'You are a helpful assistant.',
    messages,
    tools: {
      getWeather: {
        description: 'Get weather for a location',
        parameters: z.object({
          location: z.string().describe('City name'),
        }),
        execute: async ({ location }) => {
          const weather = await fetchWeather(location);
          return weather;
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
```

### Client: useChat Hook

```tsx
// components/chat.tsx
'use client';
import { useChat } from '@ai-sdk/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="chat">
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message message--${message.role}`}>
            {message.content}

            {/* Render tool invocations as components */}
            {message.toolInvocations?.map(invocation => (
              <ToolResult key={invocation.toolCallId} invocation={invocation} />
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} placeholder="Ask anything..." />
        {isLoading ? (
          <button type="button" onClick={stop}>Stop</button>
        ) : (
          <button type="submit">Send</button>
        )}
      </form>
    </div>
  );
}
```

---

## Tool Invocations → React Components

The killer pattern: AI calls tools, each tool invocation maps to a React component.

```tsx
// components/tool-result.tsx
function ToolResult({ invocation }: { invocation: ToolInvocation }) {
  // Tool is still being called — show loading state
  if (invocation.state === 'call') {
    return <ToolLoading name={invocation.toolName} />;
  }

  // Tool returned a result — render the appropriate component
  if (invocation.state === 'result') {
    switch (invocation.toolName) {
      case 'getWeather':
        return <WeatherCard data={invocation.result} />;
      case 'searchProducts':
        return <ProductGrid products={invocation.result} />;
      case 'getChart':
        return <Chart config={invocation.result} />;
      default:
        return <pre>{JSON.stringify(invocation.result, null, 2)}</pre>;
    }
  }

  return null;
}

function ToolLoading({ name }: { name: string }) {
  return (
    <div className="tool-loading">
      <div className="skeleton" style={{ height: name === 'getChart' ? '300px' : '120px' }} />
    </div>
  );
}
```

---

## Streaming Structured Objects

For streaming JSON objects (not just text) as they build up:

### Server: streamObject

```typescript
// app/api/analyze/route.ts
import { streamObject } from 'ai';
import { z } from 'zod';

const AnalysisSchema = z.object({
  summary: z.string(),
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  keyTopics: z.array(z.string()),
  confidence: z.number(),
});

export async function POST(req: Request) {
  const { text } = await req.json();

  const result = streamObject({
    model: anthropic('claude-sonnet-4-5-20250514'),
    schema: AnalysisSchema,
    prompt: `Analyze this text: ${text}`,
  });

  return result.toTextStreamResponse();
}
```

### Client: useObject

```tsx
'use client';
import { useObject } from '@ai-sdk/react';

function AnalysisPanel({ text }: { text: string }) {
  const { object, isLoading } = useObject({
    api: '/api/analyze',
    schema: AnalysisSchema,
    body: { text },
  });

  return (
    <div>
      {/* Fields appear progressively as AI generates them */}
      {object?.summary && <p>{object.summary}</p>}
      {object?.sentiment && <SentimentBadge value={object.sentiment} />}
      {object?.keyTopics && (
        <div className="topics">
          {object.keyTopics.map(topic => <Tag key={topic}>{topic}</Tag>)}
        </div>
      )}
      {object?.confidence != null && <ConfidenceBar value={object.confidence} />}
    </div>
  );
}
```

---

## Generative UI within PPR

The T4 tier integrated with T0-T2. Static shell loads instantly, AI content fills in.

```tsx
// app/dashboard/page.tsx
export default function AIAssistantPage() {
  return (
    <>
      {/* T0: Static shell — instant from CDN */}
      <header><h1>AI Assistant</h1></header>

      {/* T1: Cached suggestions */}
      <PopularQuestions />

      {/* T4: AI chat — streams in */}
      <Suspense fallback={<ChatSkeleton />}>
        <Chat />
      </Suspense>

      {/* T1: Cached documentation sidebar */}
      <DocsSidebar />
    </>
  );
}
```

The user sees the full UI shell instantly, popular questions load from cache, and the AI chat is ready for interaction — all within 100ms. AI responses then stream in 1-3 seconds.

---

## Multi-Stream Orchestration

Multiple independent AI streams in one UI:

```tsx
function AIDashboard() {
  const summary = useChat({ api: '/api/ai/summary', id: 'summary' });
  const insights = useChat({ api: '/api/ai/insights', id: 'insights' });
  const predictions = useChat({ api: '/api/ai/predictions', id: 'predictions' });

  // Trigger all three on page load
  useEffect(() => {
    summary.append({ role: 'user', content: 'Summarize today' });
    insights.append({ role: 'user', content: 'Key insights' });
    predictions.append({ role: 'user', content: 'Predictions' });
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <Panel title="Summary" messages={summary.messages} loading={summary.isLoading} />
      <Panel title="Insights" messages={insights.messages} loading={insights.isLoading} />
      <Panel title="Predictions" messages={predictions.messages} loading={predictions.isLoading} />
    </div>
  );
}
```

Each panel updates independently as its stream progresses.

---

## Error Handling & Cancellation

```tsx
const { messages, error, reload, stop, isLoading } = useChat({
  api: '/api/chat',
  onError: (error) => {
    console.error('Chat error:', error);
    // Show toast notification
  },
});

// Retry last message
{error && (
  <button onClick={reload}>Retry</button>
)}

// Cancel in-progress generation
{isLoading && (
  <button onClick={stop}>Stop generating</button>
)}
```

---

## Key Rules

1. **Use AI SDK UI (stable)**, not AI SDK RSC (experimental) for production
2. **Server returns data, client renders components** — clean separation of concerns
3. **Tool invocations are the bridge** between AI decisions and React components
4. **Always provide loading states** for tool invocations (skeleton matching final size)
5. **Wrap AI components in Suspense** for PPR integration
6. **Use `stop()`** — users expect to cancel long generations
7. **Stream objects when structure matters** — `streamObject` + `useObject` for dashboards, forms
8. **Cache common AI queries** — wrap with `use cache` for FAQ-style responses
