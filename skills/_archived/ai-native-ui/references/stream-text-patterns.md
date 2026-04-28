# streamText Patterns

## Basic Route Handler

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
    maxTokens: 2048,
    temperature: 0.7,
  });

  return result.toDataStreamResponse();
}
```

## With Tools

```typescript
import { z } from 'zod';

const result = streamText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  messages,
  tools: {
    getWeather: {
      description: 'Get current weather for a city',
      parameters: z.object({
        city: z.string().describe('City name'),
        units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
      }),
      execute: async ({ city, units }) => {
        const data = await fetchWeatherAPI(city, units);
        return { temperature: data.temp, condition: data.condition, city };
      },
    },
    searchProducts: {
      description: 'Search product catalog',
      parameters: z.object({
        query: z.string(),
        category: z.string().optional(),
        maxResults: z.number().default(5),
      }),
      execute: async ({ query, category, maxResults }) => {
        return db.products.findMany({
          where: { name: { contains: query }, category },
          take: maxResults,
        });
      },
    },
  },
  maxSteps: 5, // Allow multi-step tool use
});
```

## With Server Actions

```typescript
// app/actions.ts
'use server';

import { streamText } from 'ai';
import { createStreamableValue } from 'ai/rsc';

export async function generateSummary(text: string) {
  const stream = createStreamableValue('');

  (async () => {
    const result = streamText({
      model: anthropic('claude-sonnet-4-5-20250514'),
      prompt: `Summarize: ${text}`,
    });

    for await (const delta of result.textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}
```

## Middleware / Callbacks

```typescript
const result = streamText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  messages,
  onChunk: ({ chunk }) => {
    // Track token usage, log analytics
    if (chunk.type === 'text-delta') {
      analytics.track('ai_token', { length: chunk.textDelta.length });
    }
  },
  onFinish: async ({ text, usage, finishReason }) => {
    // Save to database after completion
    await db.conversations.create({
      data: { response: text, tokens: usage.totalTokens },
    });
  },
  onError: (error) => {
    console.error('Stream error:', error);
  },
});
```

## Caching AI Responses

```typescript
async function getCachedResponse(query: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('ai-responses')

  // Cache common queries (FAQ, documentation, etc.)
  const result = await generateText({
    model: anthropic('claude-haiku-3-5-20241022'),
    prompt: query,
  });

  return result.text;
}
```
