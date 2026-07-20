# Hackathon Stack Presets

Five battle-tested stacks. One is auto-picked per theme during `/hackathon:ideate`. All hit a live URL within 15 minutes.

---

## Preset selection matrix

| Theme signal | Preset |
|---|---|
| "AI", "LLM", "GPT", "Claude", "chat", "copilot" | `web-ai` |
| "SaaS", "product", "auth", "payments", "users", "dashboard" | `saas` |
| "mobile", "iOS", "Android", "React Native", "on-the-go" | `mobile` |
| "data", "viz", "dashboard", "analytics", "charts", "maps" | `data-viz` |
| "agent", "autonomous", "tool-use", "multi-step", "workflow" | `agent` |
| theme-agnostic / unclear | `web-ai` (user's fastest path) |

---

## `web-ai` — AI-powered web app

**Use when:** the demo moment involves streaming AI output, a chat interface, or generative content.

### Scaffold
```bash
npx create-next-app@latest {name} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd {name}
npm install ai @ai-sdk/anthropic @ai-sdk/openai
npx shadcn@latest init -d
npx shadcn@latest add button input textarea card scroll-area
```

### Env setup
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### Starter files to create
- `src/app/api/chat/route.ts` — streaming chat endpoint using Vercel AI SDK
- `src/components/chat.tsx` — client chat UI with `useChat`
- `src/app/page.tsx` — hero + chat embed

### Deploy
```bash
vercel link && vercel --prod
```
Set env vars in Vercel dashboard. **Live URL = your demo URL.**

### Known failure modes
- Streaming UI flickers on Vercel Edge — test with longer responses early
- Anthropic rate limits on free tier — keep a mocked response fallback

---

## `saas` — Full SaaS with auth + DB + payments

**Use when:** the demo moment requires logged-in users, saved data, or a subscription flow.

### Scaffold
```bash
npx create-next-app@latest {name} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd {name}
npm install @supabase/supabase-js @supabase/ssr stripe
npx shadcn@latest init -d
npx shadcn@latest add button input form card dialog dropdown-menu
```

### Supabase setup
Use **Supabase MCP** to:
1. `create_project` or connect to existing
2. Run SQL migrations: users, subscriptions, core entity tables
3. Enable RLS with simple `auth.uid() = user_id` policies
4. `generate_typescript_types` → save to `src/lib/database.types.ts`

### Env setup
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Starter files
- `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
- `src/app/login/page.tsx` — magic-link only (skip OAuth)
- `src/app/api/checkout/route.ts` — Stripe Checkout
- `src/middleware.ts` — auth redirect

### Known failure modes
- OAuth callback URL mismatch in Supabase dashboard — always magic-link for hackathons
- Stripe webhook local testing needs Stripe CLI — for demo, use test-mode success URL

---

## `mobile` — Expo + Supabase app

**Use when:** the demo is a phone-first experience or the event has a mobile track.

### Scaffold
```bash
npx create-expo-app@latest {name} --template tabs
cd {name}
npx expo install expo-router expo-secure-store expo-linking expo-constants
npx expo install @supabase/supabase-js react-native-url-polyfill
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install react-native-safe-area-context react-native-screens
```

### Deploy
```bash
eas init
eas update --branch preview --message "Initial deploy"
```
Share the Expo Go link for demo. **No app-store submission during event.**

### Starter files
- `app/(auth)/login.tsx` — magic-link via Supabase
- `app/(tabs)/index.tsx` — home screen
- `lib/supabase.ts` — client with SecureStore persistence

### Known failure modes
- Simulator-only features don't work on physical devices — test on Expo Go ASAP
- Reanimated needs babel plugin — verify `babel.config.js` before first commit

---

## `data-viz` — Data dashboard

**Use when:** the demo moment is an interactive chart, map, or analytical explorer.

### Scaffold
```bash
npx create-next-app@latest {name} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd {name}
npm install @observablehq/plot d3 recharts date-fns
npx shadcn@latest init -d
npx shadcn@latest add card select tabs
```

### Starter files
- `src/lib/seed-data.ts` — generate 100–500 rows of realistic mock data
- `src/app/api/data/route.ts` — returns the seed data (swap for real source later)
- `src/components/viz/` — one component per chart type
- `src/app/page.tsx` — dashboard layout

### Known failure modes
- Observable Plot needs `"use client"` — don't try to render server-side
- Mock data must span realistic date ranges — judges notice flat or obviously-fake data

---

## `agent` — Autonomous agent / tool-use

**Use when:** the demo moment involves an LLM calling tools, multi-step reasoning, or orchestration.

### Scaffold
```bash
npx create-next-app@latest {name} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd {name}
npm install ai @ai-sdk/anthropic zod
npx shadcn@latest init -d
npx shadcn@latest add button card scroll-area badge
```

### Starter files
- `src/app/api/agent/route.ts` — streaming tool-use loop via `streamText` with `tools: {}`
- `src/lib/tools/` — one file per tool (each returns mock data during hackathon)
- `src/components/agent-timeline.tsx` — shows tool calls + results live
- `src/app/page.tsx` — input → live timeline

### Known failure modes
- Tool-use streaming delta format changes between SDK versions — pin AI SDK version
- Cost: agent loops can burn tokens fast — add a 5-step ceiling
- Live API calls fail during demo — every tool should have a mock-mode fallback

---

## Common deploy rules (all presets)

1. **Deploy before writing features.** The skill blocks Phase 4 (`/hackathon:build`) until a live URL exists.
2. **Env vars in deploy dashboard, not committed.** `.env.local` ignored by git from minute 1.
3. **Auto-deploy on push.** Vercel / EAS do this by default — don't break it.
4. **Keep one branch.** No feature branches during hackathons; atomic commits to `main`.
5. **Seed mock data early.** Realistic-looking data > real-but-sparse data.
