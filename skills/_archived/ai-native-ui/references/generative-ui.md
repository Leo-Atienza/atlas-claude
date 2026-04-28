# Generative UI Patterns

## streamObject + useObject for Progressive Rendering

Stream structured data that renders progressively:

```typescript
// Server
import { streamObject } from 'ai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamObject({
    model: anthropic('claude-sonnet-4-5-20250514'),
    schema: z.object({
      title: z.string(),
      sections: z.array(z.object({
        heading: z.string(),
        content: z.string(),
        importance: z.enum(['high', 'medium', 'low']),
      })),
      metadata: z.object({
        readTime: z.number(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      }),
    }),
    prompt,
  });

  return result.toTextStreamResponse();
}
```

```tsx
// Client — fields appear as AI generates them
'use client';
import { useObject } from '@ai-sdk/react';

function GeneratedArticle({ topic }: { topic: string }) {
  const { object, isLoading } = useObject({
    api: '/api/generate-article',
    schema: ArticleSchema,
    body: { prompt: `Write about ${topic}` },
  });

  return (
    <article>
      {/* Title appears first */}
      <h1>{object?.title ?? <span className="skeleton-text" />}</h1>

      {/* Metadata appears next */}
      {object?.metadata && (
        <div className="meta">
          <span>{object.metadata.readTime} min read</span>
          <span className={`badge badge--${object.metadata.difficulty}`}>
            {object.metadata.difficulty}
          </span>
        </div>
      )}

      {/* Sections stream in one by one */}
      {object?.sections?.map((section, i) => (
        <section key={i} className={`section section--${section.importance}`}>
          <h2>{section.heading}</h2>
          <p>{section.content}</p>
        </section>
      ))}

      {isLoading && <div className="skeleton" />}
    </article>
  );
}
```

## Generative UI within PPR Shell

```tsx
// app/research/page.tsx
export default function ResearchPage() {
  return (
    <>
      {/* T0: Static shell — instant */}
      <header><h1>AI Research Assistant</h1></header>

      {/* T1: Cached recent research */}
      <RecentResearch />

      {/* T4: Generative — AI research interface */}
      <Suspense fallback={<ResearchSkeleton />}>
        <ResearchInterface />
      </Suspense>
    </>
  );
}
```

The user sees the full page within 100ms. AI-generated content fills in 1-3 seconds as the user interacts.

## Streaming Notifications

Multiple independent streamable values:

```typescript
// Server action
'use server';
import { createStreamableValue } from 'ai/rsc';

export async function analyzeDocument(file: File) {
  const progress = createStreamableValue('Parsing document...');
  const results = createStreamableValue<AnalysisResult | null>(null);

  (async () => {
    progress.update('Extracting text...');
    const text = await extractText(file);

    progress.update('Analyzing content...');
    const analysis = await analyzeWithAI(text);
    results.update(analysis);

    progress.done('Complete');
    results.done(analysis);
  })();

  return { progress: progress.value, results: results.value };
}
```

```tsx
// Client
function DocumentAnalyzer() {
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState(null);

  async function handleUpload(file: File) {
    const { progress, results } = await analyzeDocument(file);

    // Read streaming values
    for await (const value of readStreamableValue(progress)) {
      setProgress(value);
    }
    for await (const value of readStreamableValue(results)) {
      if (value) setResults(value);
    }
  }

  return (
    <div>
      <FileUpload onUpload={handleUpload} />
      {progress && <ProgressBar label={progress} />}
      {results && <AnalysisResults data={results} />}
    </div>
  );
}
```
