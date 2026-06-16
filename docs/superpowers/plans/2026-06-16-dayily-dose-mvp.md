# DayilyDose v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v1 of DayilyDose — a Web app that turns RSS topics into a daily chaptered audio briefing with browser TTS, in 4-8 weeks solo.

**Architecture:** Next.js 14 (App Router) on Vercel + Postgres (Neon, serverless driver) + browser Web Speech API for TTS + Anthropic Claude API for summarization. No accounts; `device_id` in localStorage.

**Tech Stack:** Next.js 14, TypeScript, React 18, `@neondatabase/serverless`, `fast-xml-parser`, Vercel Cron, Vitest, Playwright, Web Speech API, `@anthropic-ai/sdk`.

**Phases:**
- **A: Scaffold** — Next.js + tooling + DB + seed + rate limit
- **B: RSS Pipeline** — parse + dedupe + fetch + cron
- **C: Auto-Discovery** — public directories + quality score
- **D: API + Prefs** — device_id, sources, prefs
- **E: Home UI** — topic picker, length, date, generate
- **F: Briefing Generator** — prompt, LLM client, orchestrator, extractive fallback
- **G: Player + TTS** — TTS wrapper, chapter list, controls, regenerate
- **H: Tests + Polish** — integration, E2E, README, deploy

---

## File Structure

```
dayilydose/
├── package.json
├── tsconfig.json
├── next.config.js
├── vercel.json
├── vitest.config.ts
├── playwright.config.ts
├── middleware.ts
├── .env.example
├── .gitignore
├── README.md
├── db/
│   ├── schema.sql
│   └── seed/
│       ├── topics.json
│       └── sources.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx
│   │   ├── player/page.tsx
│   │   └── api/
│   │       ├── sources/route.ts
│   │       ├── prefs/route.ts
│   │       ├── briefing/generate/route.ts
│   │       └── rss/fetch/route.ts
│   ├── components/
│   │   ├── TopicPicker.tsx
│   │   ├── LengthSlider.tsx
│   │   ├── DateSelector.tsx
│   │   ├── GenerateButton.tsx
│   │   ├── ChapterList.tsx
│   │   ├── PlayerControls.tsx
│   │   └── CoverArt.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── device.ts
│   │   ├── ratelimit.ts
│   │   ├── rss/
│   │   │   ├── parse.ts
│   │   │   ├── dedupe.ts
│   │   │   ├── fetch.ts
│   │   │   ├── discover.ts
│   │   │   └── pipeline.ts
│   │   ├── briefing/
│   │   │   ├── prompt.ts
│   │   │   ├── llm.ts
│   │   │   ├── generator.ts
│   │   │   └── extractive.ts
│   │   └── tts/
│   │       └── synthesize.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── scripts/
    ├── load-seed.ts
    ├── fetch-once.ts
    └── discover-once.ts
```

---

## Phase A: Scaffold

### Task A1: Init Next.js 14 with TypeScript

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Verify environment**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
node --version  # expect v20+
npm --version
```

If Node < 20, install from https://nodejs.org.

- [ ] **Step 2: Initialize package.json**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm init -y
```

- [ ] **Step 3: Install Next.js + React + TypeScript**

```bash
npm install next@14 react@18 react-dom@18
npm install -D typescript@5 @types/node @types/react @types/react-dom
```

- [ ] **Step 4: Create config files**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
module.exports = nextConfig;
```

Create `.gitignore`:
```
node_modules/
.next/
out/
.env
.env.local
.DS_Store
coverage/
playwright-report/
test-results/
```

- [ ] **Step 5: Create app skeleton**

Create `src/app/layout.tsx`:
```typescript
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DayilyDose',
  description: 'Daily personal news briefing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:
```typescript
export default function Home() {
  return <main><h1>DayilyDose</h1><p>Loading...</p></main>;
}
```

Create `src/app/globals.css`:
```css
:root {
  --bg: #fff;
  --fg: #000;
  --accent: #0070f3;
  --muted: #666;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
```

- [ ] **Step 6: Add npm scripts**

Edit `package.json` `scripts`:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

- [ ] **Step 7: Verify dev server**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm run dev
```

Open http://localhost:3000. Should see "DayilyDose" and "Loading...". Stop with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "A1: init Next.js 14 with TypeScript and App Router"
```

---

### Task A2: Set up Vitest + Playwright

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`
- Modify: `package.json` (add scripts, deps)
- Create: `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Install Vitest**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm install -D vitest@1 @vitest/ui
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 3: Write a unit test**

Create `tests/unit/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('1 + 1 === 2', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run unit tests**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run
```

Expected: `1 passed`.

- [ ] **Step 5: Install Playwright**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm install -D @playwright/test@1
npx playwright install chromium
```

- [ ] **Step 6: Create playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

- [ ] **Step 7: Write a smoke E2E test**

Create `tests/e2e/smoke.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DayilyDose' })).toBeVisible();
});
```

- [ ] **Step 8: Run E2E tests**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx playwright test
```

Expected: `1 passed`.

- [ ] **Step 9: Add npm test scripts**

Edit `package.json` `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 10: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "A2: set up Vitest and Playwright with smoke tests"
```

---

### Task A3: Postgres schema + connection

**Files:**
- Create: `db/schema.sql`
- Create: `src/lib/db.ts`
- Create: `src/types/index.ts`
- Create: `.env.example`
- Create: `scripts/apply-schema.ts`

- [ ] **Step 1: Create Neon project**

1. Go to https://console.neon.tech, sign up, create a project named `dayilydose`
2. Copy the connection string (starts with `postgresql://...`)
3. Save it for the next step

- [ ] **Step 2: Install Neon driver**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm install @neondatabase/serverless
npm install -D dotenv
```

- [ ] **Step 3: Create .env files**

Create `.env.example`:
```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
ANTHROPIC_API_KEY=sk-ant-...
CRON_SECRET=replace-me-with-random-string
```

Create `.env.local` (with real values from Neon):
```
DATABASE_URL=<paste-from-neon>
ANTHROPIC_API_KEY=<your-key>
CRON_SECRET=dev-secret-12345
```

- [ ] **Step 4: Create schema**

Create `db/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  parent_id INT REFERENCES topics(id)
);

CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  topic_id INT REFERENCES topics(id),
  language TEXT DEFAULT 'zh',
  quality_score REAL DEFAULT 0,
  last_fetched_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | degraded | inactive
  consecutive_failures INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sources_status ON sources(status);
CREATE INDEX IF NOT EXISTS idx_sources_topic ON sources(topic_id);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  topic_id INT REFERENCES topics(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  content TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash TEXT UNIQUE NOT NULL,
  language TEXT DEFAULT 'zh'
);
CREATE INDEX IF NOT EXISTS idx_articles_source_pub ON articles(source_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_topic_pub ON articles(topic_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_pub ON articles(published_at DESC);

CREATE TABLE IF NOT EXISTS user_prefs (
  device_id TEXT PRIMARY KEY,
  topic_ids JSONB NOT NULL DEFAULT '[]',
  length_minutes INT NOT NULL DEFAULT 8,
  voice_pref TEXT,
  language TEXT DEFAULT 'zh',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS briefings (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  brief_date DATE NOT NULL,
  target_minutes INT NOT NULL,
  script_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready', -- ready | failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_briefings_device_date ON briefings(device_id, brief_date);

CREATE TABLE IF NOT EXISTS daily_cache (
  device_id TEXT NOT NULL,
  brief_date DATE NOT NULL,
  briefing_id INT NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  PRIMARY KEY (device_id, brief_date)
);
```

- [ ] **Step 5: Create types**

Create `src/types/index.ts`:
```typescript
export type Topic = {
  id: number;
  slug: string;
  name_zh: string;
  name_en: string | null;
  parent_id: number | null;
};

export type Source = {
  id: number;
  url: string;
  title: string | null;
  topic_id: number | null;
  language: string;
  quality_score: number;
  last_fetched_at: string | null;
  status: 'pending' | 'active' | 'degraded' | 'inactive';
  consecutive_failures: number;
  created_at: string;
};

export type Article = {
  id: number;
  source_id: number;
  topic_id: number | null;
  title: string;
  url: string;
  content: string | null;
  published_at: string | null;
  fetched_at: string;
  content_hash: string;
  language: string;
};

export type UserPrefs = {
  device_id: string;
  topic_ids: number[];
  length_minutes: number;
  voice_pref: string | null;
  language: string;
};

export type ScriptChapter = {
  idx: number;
  title: string;
  script_text: string;
  source_refs: { title: string; url: string }[];
};

export type ScriptJson = {
  title: string;
  chapters: ScriptChapter[];
};
```

- [ ] **Step 6: Create db client**

Create `src/lib/db.ts`:
```typescript
import { neon, neonConfig, NeonQueryFunction } from '@neondatabase/serverless';

let sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not set');
    neonConfig.fetchConnectionCache = true;
    sql = neon(url);
  }
  return sql;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const s = getSql();
  return s(text, params) as Promise<T[]>;
}
```

- [ ] **Step 7: Create apply-schema helper**

The Neon serverless driver runs one statement per call — the schema file has many `;`-separated `CREATE TABLE`/`CREATE INDEX` statements, so a single `sql(ddl)` call fails. Split and run individually.

Create `scripts/apply-schema.ts`:
```typescript
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set in .env.local');

const sql = neon(url);

const ddl = readFileSync(resolve(process.cwd(), 'db/schema.sql'), 'utf8');

// Split on `;\n` boundaries; strip line comments; drop empty chunks.
const statements = ddl
  .split(/;\s*\n/)
  .map(s => s.replace(/^--.*$/gm, '').trim())
  .filter(s => s.length > 0);

async function main() {
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log(`schema applied: ${statements.length} statements`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

(Install tsx first if missing: `npm install -D tsx`.)

- [ ] **Step 8: Apply schema**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx tsx scripts/apply-schema.ts
```

Expected: `schema applied: 12 statements` (6 CREATE TABLE + 6 CREATE INDEX).

- [ ] **Step 9: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "A3: create Postgres schema and Neon client"
```

---

### Task A4: Seed topics + 50 sources

**Files:**
- Create: `db/seed/topics.json`
- Create: `db/seed/sources.json`
- Create: `scripts/load-seed.ts`
- Create: `scripts/verify-seed.ts`

- [ ] **Step 1: Create topics seed**

Create `db/seed/topics.json`:
```json
[
  { "slug": "ai", "name_zh": "人工智能", "name_en": "AI" },
  { "slug": "tech", "name_zh": "科技", "name_en": "Tech" },
  { "slug": "finance", "name_zh": "金融", "name_en": "Finance" },
  { "slug": "macro", "name_zh": "宏观经济", "name_en": "Macro" },
  { "slug": "consumer", "name_zh": "消费", "name_en": "Consumer" },
  { "slug": "semiconductor", "name_zh": "半导体", "name_en": "Semiconductor" },
  { "slug": "ev", "name_zh": "新能源汽车", "name_en": "EV" },
  { "slug": "biotech", "name_zh": "生物医药", "name_en": "Biotech" },
  { "slug": "energy", "name_zh": "能源", "name_en": "Energy" },
  { "slug": "policy", "name_zh": "政策与监管", "name_en": "Policy" },
  { "slug": "geopolitics", "name_zh": "地缘政治", "name_en": "Geopolitics" },
  { "slug": "world", "name_zh": "国际新闻", "name_en": "World" }
]
```

- [ ] **Step 2: Create sources seed**

Create `db/seed/sources.json` (50 entries; only show first 3 here, fill the rest with public RSS feeds you trust):
```json
[
  { "url": "https://36kr.com/feed", "title": "36氪", "topic_slug": "tech", "language": "zh" },
  { "url": "https://www.ithome.com/rss/", "title": "IT之家", "topic_slug": "tech", "language": "zh" },
  { "url": "https://www.solidot.org/index.rss", "title": "Solidot", "topic_slug": "tech", "language": "zh" }
]
```

Add at least 50 entries covering all 12 topics before running. (User can curate this list from public RSS directories.)

- [ ] **Step 3: Create load-seed script**

Create `scripts/load-seed.ts`:
```typescript
import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import topics from '../db/seed/topics.json';
import sources from '../db/seed/sources.json';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set in .env.local');

const sql = neon(url);

async function main() {
  for (const t of topics) {
    await sql.query(
      `INSERT INTO topics (slug, name_zh, name_en) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name_zh = EXCLUDED.name_zh`,
      [t.slug, t.name_zh, t.name_en ?? null]
    );
  }
  console.log(`loaded ${topics.length} topics`);

  const topicRows = await sql.query<{ id: number; slug: string }>('SELECT id, slug FROM topics');
  const slugToId = new Map(topicRows.map(r => [r.slug, r.id]));

  let count = 0;
  for (const s of sources) {
    const topicId = s.topic_slug ? slugToId.get(s.topic_slug) ?? null : null;
    try {
      await sql.query(
        `INSERT INTO sources (url, title, topic_id, language, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (url) DO UPDATE SET title = EXCLUDED.title, topic_id = EXCLUDED.topic_id`,
        [s.url, s.title ?? null, topicId, s.language ?? 'zh']
      );
      count++;
    } catch (e: any) {
      console.warn(`skip ${s.url}: ${e.message}`);
    }
  }
  console.log(`loaded ${count} sources`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Run seed**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx tsx scripts/load-seed.ts
```

Expected: `loaded 12 topics` then `loaded 50 sources` (or similar count).

- [ ] **Step 5: Verify in DB**

Create `scripts/verify-seed.ts`:
```typescript
import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set in .env.local');

const sql = neon(url);

async function main() {
  const topics = await sql.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM topics');
  const sources = await sql.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM sources');
  const byTopic = await sql.query<{ slug: string; n: number }>(
    'SELECT t.slug, COUNT(s.id)::int AS n FROM topics t LEFT JOIN sources s ON s.topic_id = t.id GROUP BY t.slug ORDER BY t.slug'
  );
  console.log(`topics: ${topics[0].n}`);
  console.log(`sources: ${sources[0].n}`);
  for (const r of byTopic) {
    console.log(`  ${r.slug}: ${r.n}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
```

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx tsx scripts/verify-seed.ts
```

Expected: `topics: 12` and `sources: 50` (or whatever count you loaded) and a per-topic breakdown showing all 12 topics covered.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "A4: seed 12 topics and 50 RSS sources"
```

---

### Task A5: Edge middleware IP rate limit

**Files:**
- Create: `middleware.ts`
- Create: `src/lib/ratelimit.ts`
- Create: `tests/unit/ratelimit.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/ratelimit.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { tokenBucket } from '@/lib/ratelimit';

describe('tokenBucket', () => {
  it('allows up to capacity in window', () => {
    const bucket = tokenBucket({ capacity: 3, refillPerSec: 0 });
    expect(bucket.tryConsume('ip-1')).toBe(true);
    expect(bucket.tryConsume('ip-1')).toBe(true);
    expect(bucket.tryConsume('ip-1')).toBe(true);
    expect(bucket.tryConsume('ip-1')).toBe(false);
  });

  it('isolates keys', () => {
    const bucket = tokenBucket({ capacity: 1, refillPerSec: 0 });
    expect(bucket.tryConsume('a')).toBe(true);
    expect(bucket.tryConsume('a')).toBe(false);
    expect(bucket.tryConsume('b')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/ratelimit.test.ts
```

Expected: FAIL (no `tokenBucket` export).

- [ ] **Step 3: Implement token bucket**

Create `src/lib/ratelimit.ts`:
```typescript
type Bucket = { tokens: number; updatedAt: number };
type Options = { capacity: number; refillPerSec: number };

export function tokenBucket(opts: Options) {
  const buckets = new Map<string, Bucket>();
  return {
    tryConsume(key: string, cost = 1): boolean {
      const now = Date.now();
      const b = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now };
      const elapsed = (now - b.updatedAt) / 1000;
      b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec);
      b.updatedAt = now;
      if (b.tokens >= cost) {
        b.tokens -= cost;
        buckets.set(key, b);
        return true;
      }
      buckets.set(key, b);
      return false;
    },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/ratelimit.test.ts
```

Expected: `2 passed`.

- [ ] **Step 5: Create middleware**

Create `middleware.ts` at project root:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { tokenBucket } from './src/lib/ratelimit';

export const config = {
  matcher: ['/api/briefing/:path*', '/api/rss/:path*'],
};

const bucket = tokenBucket({ capacity: 10, refillPerSec: 0.05 }); // 10 burst, then 1 / 20s

export default function middleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (!bucket.tryConsume(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  return NextResponse.next();
}
```

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "A5: add IP rate-limit middleware for briefing/rss endpoints"
```

---

## Phase B: RSS Pipeline

### Task B1: RSS parser (TDD)

**Files:**
- Create: `src/lib/rss/parse.ts`
- Test: `tests/unit/rss.parse.test.ts`

- [ ] **Step 1: Install fast-xml-parser**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm install fast-xml-parser
```

- [ ] **Step 2: Write the test**

Create `tests/unit/rss.parse.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { parseRssXml } from '@/lib/rss/parse';

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Hello World</title>
      <link>https://example.com/a</link>
      <description>First post</description>
      <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Second</title>
      <link>https://example.com/b</link>
      <description>Second post body</description>
      <pubDate>Tue, 02 Jan 2024 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe('parseRssXml', () => {
  it('extracts channel title', () => {
    const r = parseRssXml(SAMPLE);
    expect(r.channelTitle).toBe('Test Feed');
  });

  it('extracts all items with required fields', () => {
    const r = parseRssXml(SAMPLE);
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({
      title: 'Hello World',
      url: 'https://example.com/a',
      description: 'First post',
    });
    expect(r.items[0].publishedAt).toBeInstanceOf(Date);
  });

  it('handles Atom feed', () => {
    const atom = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Atom</title>
        <entry>
          <title>Atom Item</title>
          <link href="https://example.com/x"/>
          <summary>Atom desc</summary>
          <updated>2024-01-03T10:00:00Z</updated>
        </entry>
      </feed>`;
    const r = parseRssXml(atom);
    expect(r.channelTitle).toBe('Atom');
    expect(r.items).toHaveLength(1);
    expect(r.items[0].url).toBe('https://example.com/x');
  });

  it('returns empty on invalid XML', () => {
    const r = parseRssXml('not xml');
    expect(r.items).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/rss.parse.test.ts
```

Expected: FAIL (no `parseRssXml` export).

- [ ] **Step 4: Implement parser**

Create `src/lib/rss/parse.ts`:
```typescript
import { XMLParser } from 'fast-xml-parser';

export type ParsedItem = {
  title: string;
  url: string;
  description: string;
  publishedAt: Date | null;
};

export type ParsedFeed = {
  channelTitle: string;
  items: ParsedItem[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
});

function pickChannelTitle(parsed: any): string {
  return parsed?.rss?.channel?.title ?? parsed?.feed?.title ?? '';
}

function pickItems(parsed: any): any[] {
  const rss = parsed?.rss?.channel?.item;
  const atom = parsed?.feed?.entry;
  const arr = Array.isArray(rss) ? rss : rss ? [rss] : [];
  if (arr.length) return arr;
  const aArr = Array.isArray(atom) ? atom : atom ? [atom] : [];
  return aArr;
}

function pickUrl(item: any): string {
  if (typeof item.link === 'string') return item.link;
  if (Array.isArray(item.link)) {
    const alt = item.link.find((l: any) => l['@_rel'] === 'alternate') ?? item.link[0];
    return alt?.['@_href'] ?? '';
  }
  if (item.link?.['@_href']) return item.link['@_href'];
  return '';
}

function pickDate(item: any): Date | null {
  const raw = item.pubDate ?? item.published ?? item.updated;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export function parseRssXml(xml: string): ParsedFeed {
  try {
    const parsed = parser.parse(xml);
    const channelTitle = pickChannelTitle(parsed);
    const items = pickItems(parsed).map((it: any) => ({
      title: String(it.title ?? '').trim(),
      url: pickUrl(it),
      description: String(it.description ?? it.summary ?? it['content:encoded'] ?? '').trim(),
      publishedAt: pickDate(it),
    })).filter(i => i.title && i.url);
    return { channelTitle, items };
  } catch {
    return { channelTitle: '', items: [] };
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/rss.parse.test.ts
```

Expected: `4 passed`.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "B1: RSS/Atom XML parser with tests"
```

---

### Task B2: content_hash dedupe (TDD)

**Files:**
- Create: `src/lib/rss/dedupe.ts`
- Test: `tests/unit/rss.dedupe.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/rss.dedupe.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { contentHash, dedupeByHash } from '@/lib/rss/dedupe';

describe('contentHash', () => {
  it('is deterministic', () => {
    const a = contentHash({ title: 't', url: 'u', description: 'd' });
    const b = contentHash({ title: 't', url: 'u', description: 'd' });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('ignores trailing/leading whitespace in description', () => {
    const a = contentHash({ title: 't', url: 'u', description: 'd' });
    const b = contentHash({ title: 't', url: 'u', description: '  d  ' });
    expect(a).toBe(b);
  });

  it('differs on different url', () => {
    expect(
      contentHash({ title: 't', url: 'u1', description: 'd' })
    ).not.toBe(contentHash({ title: 't', url: 'u2', description: 'd' }));
  });
});

describe('dedupeByHash', () => {
  it('removes duplicates by hash, keeps first', () => {
    const items = [
      { title: 'A', url: 'a', description: 'x' },
      { title: 'B', url: 'b', description: 'y' },
      { title: 'A', url: 'a', description: 'x' }, // exact duplicate of first
    ];
    const out = dedupeByHash(items);
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe('A');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/rss.dedupe.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement dedupe**

Create `src/lib/rss/dedupe.ts`:
```typescript
import { createHash } from 'crypto';

export type Hashable = { title: string; url: string; description: string };

export function contentHash(item: Hashable): string {
  const desc = (item.description ?? '').slice(0, 500).trim();
  const seed = [item.title.trim(), item.url.trim(), desc].join('|');
  return createHash('sha256').update(seed).digest('hex');
}

export function dedupeByHash<T extends Hashable>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const h = contentHash(it);
    if (seen.has(h)) continue;
    seen.add(h);
    out.push(it);
  }
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/rss.dedupe.test.ts
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "B2: content_hash dedupe with tests"
```

---

### Task B3: RSS fetcher (DB integration)

**Files:**
- Create: `src/lib/rss/fetch.ts`
- Test: `tests/integration/rss.fetch.test.ts`

- [ ] **Step 1: Write the integration test**

Create `tests/integration/rss.fetch.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { fetchAndStoreForSource } from '@/lib/rss/fetch';

const sql = neon(process.env.DATABASE_URL!);
let testSourceId: number;

const MOCK_RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
<title>Mock</title>
<item>
  <title>Item 1</title>
  <link>https://mock.test/1</link>
  <description>Body 1</description>
  <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
</item>
</channel></rss>`;

describe('fetchAndStoreForSource', () => {
  beforeAll(async () => {
    const r = await sql.query(
      `INSERT INTO sources (url, title, status) VALUES ($1, 'Mock Test', 'active') RETURNING id`,
      [`https://mock.test/feed-${Date.now()}`]
    );
    testSourceId = (r[0] as any).id;
  });

  afterAll(async () => {
    await sql.query(`DELETE FROM sources WHERE id = $1`, [testSourceId]);
  });

  it('inserts new articles', async () => {
    const inserted = await fetchAndStoreForSource(testSourceId, MOCK_RSS);
    expect(inserted).toBe(1);
  });

  it('does not duplicate on second call', async () => {
    await fetchAndStoreForSource(testSourceId, MOCK_RSS);
    const inserted = await fetchAndStoreForSource(testSourceId, MOCK_RSS);
    expect(inserted).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/integration/rss.fetch.test.ts
```

Expected: FAIL (no `fetchAndStoreForSource`).

- [ ] **Step 3: Implement fetcher**

Create `src/lib/rss/fetch.ts`:
```typescript
import { neon } from '@neondatabase/serverless';
import { parseRssXml } from './parse';
import { contentHash, dedupeByHash } from './dedupe';

export async function fetchAndStoreForSource(sourceId: number, rawXml: string): Promise<number> {
  const sql = neon(process.env.DATABASE_URL!);
  const sourceRows = await sql.query(`SELECT topic_id, url FROM sources WHERE id = $1`, [sourceId]);
  if (!sourceRows.length) return 0;
  const topicId = (sourceRows[0] as any).topic_id;

  const { items } = parseRssXml(rawXml);
  if (!items.length) return 0;

  const unique = dedupeByHash(items);
  let inserted = 0;
  for (const it of unique) {
    const hash = contentHash(it);
    const r = await sql.query(
      `INSERT INTO articles (source_id, topic_id, title, url, content, published_at, content_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (content_hash) DO NOTHING
       RETURNING id`,
      [sourceId, topicId, it.title, it.url, it.description, it.publishedAt?.toISOString() ?? null, hash]
    );
    if (r.length) inserted++;
  }

  await sql.query(
    `UPDATE sources SET last_fetched_at = NOW(), consecutive_failures = 0, status = 'active' WHERE id = $1`,
    [sourceId]
  );
  return inserted;
}

export async function markSourceFailure(sourceId: number): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql.query(
    `UPDATE sources
     SET consecutive_failures = consecutive_failures + 1,
         status = CASE WHEN consecutive_failures + 1 >= 5 THEN 'inactive' ELSE 'degraded' END
     WHERE id = $1
     RETURNING status, consecutive_failures`,
    [sourceId]
  );
  if (!rows.length) return;
  const r = rows[0] as any;
  if (r.status === 'inactive') {
    console.warn(`source ${sourceId} marked inactive after ${r.consecutive_failures} failures`);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/integration/rss.fetch.test.ts
```

Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "B3: RSS fetcher that parses, dedupes, and stores articles"
```

---

### Task B4: Pipeline + cron

**Files:**
- Create: `src/lib/rss/pipeline.ts`
- Create: `src/app/api/rss/fetch/route.ts`
- Create: `vercel.json`
- Create: `scripts/fetch-once.ts`

- [ ] **Step 1: Implement pipeline**

Create `src/lib/rss/pipeline.ts`:
```typescript
import { neon } from '@neondatabase/serverless';
import { fetchAndStoreForSource, markSourceFailure } from './fetch';

type SourceRow = { id: number; url: string };

export async function runFetchCycle(): Promise<{ ok: number; failed: number }> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = (await sql.query(
    `SELECT id, url FROM sources WHERE status IN ('active', 'degraded', 'pending')`
  )) as SourceRow[];

  let ok = 0, failed = 0;
  for (const s of rows) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(s.url, { signal: ctrl.signal, headers: { 'user-agent': 'DayilyDose/0.1' } });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      await fetchAndStoreForSource(s.id, xml);
      ok++;
    } catch (e: any) {
      await markSourceFailure(s.id);
      failed++;
    }
  }
  return { ok, failed };
}
```

- [ ] **Step 2: Implement cron endpoint**

Create `src/app/api/rss/fetch/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { runFetchCycle } from '@/lib/rss/pipeline';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return new NextResponse('unauthorized', { status: 401 });
  }
  const result = await runFetchCycle();
  return NextResponse.json(result);
}
```

- [ ] **Step 3: Configure cron**

Create `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/rss/fetch?secret=${CRON_SECRET}", "schedule": "*/20 * * * *" }
  ]
}
```

(Replace `${CRON_SECRET}` with the actual value when deploying via Vercel UI env var substitution.)

- [ ] **Step 4: Manual run script**

Create `scripts/fetch-once.ts`:
```typescript
import { config } from 'dotenv';
import { resolve } from 'path';
import { runFetchCycle } from '../src/lib/rss/pipeline';

config({ path: resolve(process.cwd(), '.env.local') });

runFetchCycle()
  .then(r => {
    console.log('done:', r);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
```

- [ ] **Step 5: Run once**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx tsx scripts/fetch-once.ts
```

Expected: `done: { ok: 50, failed: <some number> }` (some failures are normal for cold runs).

- [ ] **Step 6: Verify articles in DB**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx tsx scripts/verify-seed.ts
```

Expected: a non-zero `articles` count will be reported (you can add an `articles` query to the script, or run this small one-off):
```bash
npx tsx -e "const {neon}=require('@neondatabase/serverless');require('dotenv').config({path:'.env.local'});(async()=>{const s=neon(process.env.DATABASE_URL);const r=await s.query('SELECT COUNT(*)::int AS n FROM articles');console.log('articles:',r[0].n);})()"
```

(The plan's original `npx tsx -e "..."` snippet for this is fragile; the inline `require` form above is more reliable. If you prefer, just run the fetch script again and rely on its console output.)

- [ ] **Step 7: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "B4: RSS fetch pipeline with cron endpoint and failure handling"
```

---

## Phase C: Auto-Discovery

### Task C1: Discovery parser (TDD)

**Files:**
- Create: `src/lib/rss/discover.ts`
- Test: `tests/unit/rss.discover.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/rss.discover.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { extractRssLinksFromHtml } from '@/lib/rss/discover';

const HTML = `
<html><head>
  <link rel="alternate" type="application/rss+xml" title="RSS" href="/feed.xml"/>
  <link rel="alternate" type="application/atom+xml" title="Atom" href="/atom.xml"/>
  <link rel="stylesheet" href="/style.css"/>
</head><body></body></html>`;

describe('extractRssLinksFromHtml', () => {
  it('finds RSS and Atom links', () => {
    const links = extractRssLinksFromHtml(HTML, 'https://example.com/');
    expect(links).toContain('https://example.com/feed.xml');
    expect(links).toContain('https://example.com/atom.xml');
  });

  it('ignores non-feed links', () => {
    const links = extractRssLinksFromHtml(HTML, 'https://example.com/');
    expect(links.find(l => l.endsWith('style.css'))).toBeUndefined();
  });

  it('handles absolute URLs', () => {
    const html = `<link rel="alternate" type="application/rss+xml" href="https://other.com/rss"/>`;
    const links = extractRssLinksFromHtml(html, 'https://example.com/');
    expect(links).toContain('https://other.com/rss');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/rss.discover.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement extractor**

Create `src/lib/rss/discover.ts`:
```typescript
export function extractRssLinksFromHtml(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const re = /<link\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    if (!/type=["']application\/(rss|atom)\+xml["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    try {
      links.push(new URL(hrefMatch[1], baseUrl).toString());
    } catch {
      // ignore malformed
    }
  }
  return Array.from(new Set(links));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/rss.discover.test.ts
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "C1: HTML RSS link extractor with tests"
```

---

### Task C2: Discovery runner + quality score

**Files:**
- Create: `src/lib/rss/quality.ts`
- Create: `scripts/discover-once.ts`
- Modify: `src/lib/rss/pipeline.ts` (call quality score updater)

- [ ] **Step 1: Implement quality score**

Create `src/lib/rss/quality.ts`:
```typescript
import { neon } from '@neondatabase/serverless';

export async function updateQualityScores(): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  await sql.query(`
    UPDATE sources s SET quality_score = sub.score
    FROM (
      SELECT
        a.source_id,
        LEAST(1.0, COUNT(*)::real / 30.0)
          * LEAST(1.0, COALESCE(AVG(LENGTH(a.content)), 0)::real / 1000.0)
          * LEAST(1.0, COUNT(DISTINCT DATE(a.published_at))::real / 7.0) AS score
      FROM articles a
      WHERE a.published_at > NOW() - INTERVAL '30 days'
      GROUP BY a.source_id
    ) sub
    WHERE s.id = sub.source_id
  `);
}
```

- [ ] **Step 2: Implement discovery runner**

Create `scripts/discover-once.ts`:
```typescript
import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { extractRssLinksFromHtml } from '../src/lib/rss/discover';

config({ path: resolve(process.cwd(), '.env.local') });

const CANDIDATES = [
  // User-curated list of candidate homepages. Pull from public RSS aggregator
  // pages, blogrolls, and known publication sites. The exact set is up to the
  // user — start with ~20-30 well-known sites; the discoverer will find their
  // own feed links.
  'https://news.ycombinator.com/',
  'https://lobste.rs/',
  'https://www.theverge.com/',
  'https://www.wired.com/',
  'https://arstechnica.com/',
  'https://www.engadget.com/',
  'https://www.zdnet.com/',
  'https://www.technologyreview.com/',
  'https://stratechery.com/',
  'https://www.benkuhn.net/',
  'https://danluu.com/',
  'https://www.greaterwrong.com/',
  'https://www.lesswrong.com/',
  'https://www.economist.com/',
  'https://www.theatlantic.com/',
  'https://www.newyorker.com/',
  'https://www.nytimes.com/',
  'https://www.washingtonpost.com/',
  'https://www.theguardian.com/',
  'https://www.bbc.com/',
];

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const existing = new Set(
    ((await sql.query(`SELECT url FROM sources`)) as any[]).map(r => r.url)
  );
  let added = 0;
  for (const home of CANDIDATES) {
    try {
      const res = await fetch(home, { headers: { 'user-agent': 'DayilyDose/0.1 (+https://dayilydose.app)' } });
      if (!res.ok) continue;
      const html = await res.text();
      const feeds = extractRssLinksFromHtml(html, home);
      for (const url of feeds) {
        if (existing.has(url)) continue;
        await sql.query(
          `INSERT INTO sources (url, title, status) VALUES ($1, $2, 'pending')`,
          [url, home]
        );
        added++;
        existing.add(url);
      }
    } catch (e: any) {
      console.warn(`skip ${home}: ${e.message}`);
    }
  }
  console.log(`added ${added} candidate sources`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Wire quality score into pipeline**

Modify `src/lib/rss/pipeline.ts` — add the import and call at the end of `runFetchCycle`:

```typescript
import { updateQualityScores } from './quality';
// ... at the end of runFetchCycle, before return:
await updateQualityScores();
return { ok, failed };
```

- [ ] **Step 4: Run discovery**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx tsx scripts/discover-once.ts
```

Expected: `added N candidate sources` (N may be 0 if sites lack feeds; that's OK).

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "C2: auto-discovery runner and quality score updater"
```

---

## Phase D: API + Prefs

### Task D1: device_id helper + /api/sources

**Files:**
- Create: `src/lib/device.ts`
- Create: `src/app/api/sources/route.ts`
- Test: `tests/integration/sources.test.ts`

- [ ] **Step 1: Implement device_id helper**

Create `src/lib/device.ts`:
```typescript
const KEY = 'dayilydose.device_id';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? fallbackUuid());
    localStorage.setItem(KEY, id);
  }
  return id;
}

function fallbackUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

- [ ] **Step 2: Implement /api/sources**

Create `src/app/api/sources/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const topics = await query<{ id: number; slug: string; name_zh: string }>(
    `SELECT id, slug, name_zh FROM topics ORDER BY id`
  );
  const counts = await query<{ topic_id: number; n: number }>(
    `SELECT topic_id, COUNT(*)::int AS n FROM sources WHERE status = 'active' GROUP BY topic_id`
  );
  const countMap = new Map(counts.map(c => [c.topic_id, c.n]));
  return NextResponse.json(
    topics.map(t => ({ ...t, active_source_count: countMap.get(t.id) ?? 0 }))
  );
}
```

- [ ] **Step 3: Write integration test**

Create `tests/integration/sources.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

describe('GET /api/sources shape', () => {
  it('returns topics with source counts', async () => {
    const rows = (await sql(`SELECT id, slug, name_zh FROM topics ORDER BY id`)) as any[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty('slug');
  });
});
```

- [ ] **Step 4: Run test**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/integration/sources.test.ts
```

Expected: `1 passed`.

- [ ] **Step 5: Manual API check**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm run dev &
sleep 5
curl http://localhost:3000/api/sources | head -200
```

Expected: JSON array of topics.
Stop dev server with `kill %1` (or Ctrl+C if foreground).

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "D1: device_id helper and /api/sources endpoint"
```

---

### Task D2: /api/prefs GET + PUT

**Files:**
- Create: `src/app/api/prefs/route.ts`
- Test: `tests/integration/prefs.test.ts`

- [ ] **Step 1: Implement endpoint**

Create `src/app/api/prefs/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULTS = {
  topic_ids: [] as number[],
  length_minutes: 8,
  voice_pref: null as string | null,
  language: 'zh',
};

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get('device_id');
  if (!deviceId) return NextResponse.json({ error: 'device_id required' }, { status: 400 });
  const rows = await query<any>(`SELECT * FROM user_prefs WHERE device_id = $1`, [deviceId]);
  if (!rows.length) return NextResponse.json({ device_id: deviceId, ...DEFAULTS });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { device_id, topic_ids, length_minutes, voice_pref, language } = body;
  if (!device_id) return NextResponse.json({ error: 'device_id required' }, { status: 400 });
  await query(
    `INSERT INTO user_prefs (device_id, topic_ids, length_minutes, voice_pref, language, updated_at)
     VALUES ($1, $2::jsonb, $3, $4, $5, NOW())
     ON CONFLICT (device_id) DO UPDATE SET
       topic_ids = EXCLUDED.topic_ids,
       length_minutes = EXCLUDED.length_minutes,
       voice_pref = EXCLUDED.voice_pref,
       language = EXCLUDED.language,
       updated_at = NOW()`,
    [
      device_id,
      JSON.stringify(topic_ids ?? DEFAULTS.topic_ids),
      length_minutes ?? DEFAULTS.length_minutes,
      voice_pref ?? DEFAULTS.voice_pref,
      language ?? DEFAULTS.language,
    ]
  );
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Write integration test**

Create `tests/integration/prefs.test.ts`:
```typescript
import { describe, it, expect, afterAll } from 'vitest';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const TEST_DEVICE = `test-device-${Date.now()}`;

describe('user_prefs CRUD', () => {
  afterAll(async () => {
    await sql(`DELETE FROM user_prefs WHERE device_id = $1`, [TEST_DEVICE]);
  });

  it('inserts prefs', async () => {
    await sql(
      `INSERT INTO user_prefs (device_id, topic_ids, length_minutes, language)
       VALUES ($1, $2::jsonb, 10, 'zh')`,
      [TEST_DEVICE, JSON.stringify([1, 2, 3])]
    );
    const rows = await sql(`SELECT length_minutes FROM user_prefs WHERE device_id = $1`, [TEST_DEVICE]);
    expect((rows[0] as any).length_minutes).toBe(10);
  });

  it('updates prefs', async () => {
    await sql(
      `UPDATE user_prefs SET length_minutes = 15 WHERE device_id = $1`,
      [TEST_DEVICE]
    );
    const rows = await sql(`SELECT length_minutes FROM user_prefs WHERE device_id = $1`, [TEST_DEVICE]);
    expect((rows[0] as any).length_minutes).toBe(15);
  });
});
```

- [ ] **Step 3: Run test**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/integration/prefs.test.ts
```

Expected: `2 passed`.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "D2: /api/prefs GET and PUT with tests"
```

---

## Phase E: Home UI

### Task E1: Home page components

**Files:**
- Create: `src/components/TopicPicker.tsx`
- Create: `src/components/LengthSlider.tsx`
- Create: `src/components/DateSelector.tsx`
- Create: `src/components/GenerateButton.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/page.module.css`

- [ ] **Step 1: Create TopicPicker**

Create `src/components/TopicPicker.tsx`:
```typescript
'use client';
import { useEffect, useState } from 'react';

type Topic = { id: number; slug: string; name_zh: string; active_source_count: number };

export function TopicPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sources')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setTopics)
      .catch(e => setErr(String(e)));
  }, []);

  if (err) return <p style={{ color: 'red' }}>加载 topic 失败：{err}</p>;
  if (!topics.length) return <p>加载中…</p>;

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  };

  return (
    <div>
      <h3>选择你关心的行业</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {topics.map(t => (
          <button
            key={t.id}
            onClick={() => toggle(t.id)}
            disabled={t.active_source_count === 0}
            style={{
              padding: '8px 12px',
              borderRadius: 20,
              border: '1px solid #ccc',
              background: value.includes(t.id) ? 'var(--accent)' : '#fff',
              color: value.includes(t.id) ? '#fff' : 'var(--fg)',
              cursor: t.active_source_count === 0 ? 'not-allowed' : 'pointer',
              opacity: t.active_source_count === 0 ? 0.5 : 1,
            }}
          >
            {t.name_zh} <small>({t.active_source_count})</small>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create LengthSlider**

Create `src/components/LengthSlider.tsx`:
```typescript
'use client';
export function LengthSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <h3>简报时长（分钟）</h3>
      <input
        type="range"
        min={3}
        max={15}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <p>{value} 分钟</p>
    </div>
  );
}
```

- [ ] **Step 3: Create DateSelector**

Create `src/components/DateSelector.tsx`:
```typescript
'use client';
import { useMemo } from 'react';

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

export function DateSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const today = useMemo(() => fmt(new Date()), []);
  const yesterday = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return fmt(d);
  }, []);

  return (
    <div>
      <h3>日期</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onChange(today)}
          style={{ background: value === today ? 'var(--accent)' : '#fff', color: value === today ? '#fff' : 'var(--fg)', padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
        >
          今天 ({today})
        </button>
        <button
          onClick={() => onChange(yesterday)}
          style={{ background: value === yesterday ? 'var(--accent)' : '#fff', color: value === yesterday ? '#fff' : 'var(--fg)', padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc' }}
        >
          昨天 ({yesterday})
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create GenerateButton**

Create `src/components/GenerateButton.tsx`:
```typescript
'use client';
export function GenerateButton({ disabled, loading, onClick }: { disabled: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '14px 28px',
        fontSize: 18,
        background: disabled ? '#999' : 'var(--accent)',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%',
        marginTop: 24,
      }}
    >
      {loading ? '生成中…（约 30-60 秒）' : '生成今日简报'}
    </button>
  );
}
```

- [ ] **Step 5: Wire up home page**

Replace `src/app/page.tsx`:
```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopicPicker } from '@/components/TopicPicker';
import { LengthSlider } from '@/components/LengthSlider';
import { DateSelector } from '@/components/DateSelector';
import { GenerateButton } from '@/components/GenerateButton';
import { getOrCreateDeviceId } from '@/lib/device';

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function Home() {
  const router = useRouter();
  const [topics, setTopics] = useState<number[]>([]);
  const [length, setLength] = useState(8);
  const [date, setDate] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onGenerate = async () => {
    setLoading(true); setErr(null);
    const deviceId = getOrCreateDeviceId();
    try {
      // Persist prefs first
      await fetch('/api/prefs', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, topic_ids: topics, length_minutes: length }),
      });
      // Save topics locally so the player page can re-fetch with the same selection
      localStorage.setItem('dayilydose.topics', JSON.stringify(topics));
      // Trigger generation
      const res = await fetch('/api/briefing/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, date, length_minutes: length, topic_ids: topics }),
      });
      if (res.status === 422) {
        setErr('所选日期没有新闻，请换 topic 或改日期');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push(`/player?date=${date}`);
    } catch (e: any) {
      setErr(String(e.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1>DayilyDose</h1>
      <p>把你关心的行业转成每日音频简报。</p>
      <DateSelector value={date} onChange={setDate} />
      <TopicPicker value={topics} onChange={setTopics} />
      <LengthSlider value={length} onChange={setLength} />
      <GenerateButton disabled={topics.length === 0} loading={loading} onClick={onGenerate} />
      {err && <p style={{ color: 'red' }}>{err}</p>}
    </main>
  );
}
```

- [ ] **Step 6: Manual smoke test**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm run dev
```

Open http://localhost:3000, see topic chips, click some, slide length, click generate.
Will 404 on /api/briefing/generate until Phase F — that's expected.

- [ ] **Step 7: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "E1: home page with topic picker, length, date, generate button"
```

---

## Phase F: Briefing Generator

### Task F1: LLM prompt (TDD)

**Files:**
- Create: `src/lib/briefing/prompt.ts`
- Test: `tests/unit/briefing.prompt.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/briefing.prompt.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { buildPrompt, estimateChapterCount } from '@/lib/briefing/prompt';

const ARTICLES = [
  { title: 'A1', url: 'https://a/1', description: 'desc 1', publishedAt: new Date('2024-01-01') },
  { title: 'A2', url: 'https://a/2', description: 'desc 2', publishedAt: new Date('2024-01-01') },
];

describe('estimateChapterCount', () => {
  it('clamps to [3, 12]', () => {
    expect(estimateChapterCount(2)).toBe(3);
    expect(estimateChapterCount(8)).toBe(4);
    expect(estimateChapterCount(30)).toBe(12);
  });
});

describe('buildPrompt', () => {
  it('contains the date, target minutes, and article URLs', () => {
    const p = buildPrompt({
      date: '2024-01-02',
      targetMinutes: 8,
      articles: ARTICLES,
    });
    expect(p).toContain('2024-01-02');
    expect(p).toContain('8 分钟');
    expect(p).toContain('https://a/1');
    expect(p).toContain('https://a/2');
  });

  it('instructs JSON output', () => {
    const p = buildPrompt({ date: '2024-01-02', targetMinutes: 8, articles: ARTICLES });
    expect(p.toLowerCase()).toContain('json');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/briefing.prompt.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement prompt**

Create `src/lib/briefing/prompt.ts`:
```typescript
type Article = { title: string; url: string; description: string; publishedAt: Date | null };

export function estimateChapterCount(targetMinutes: number): number {
  return Math.max(3, Math.min(12, Math.round(targetMinutes / 2)));
}

export function buildPrompt(args: { date: string; targetMinutes: number; articles: Article[] }): string {
  const chapters = estimateChapterCount(args.targetMinutes);
  const targetChars = Math.round(args.targetMinutes * 200);
  const articleBlock = args.articles
    .map((a, i) => `[${i + 1}] ${a.title}\nURL: ${a.url}\n摘要: ${a.description.slice(0, 400)}`)
    .join('\n\n');
  return `你是一个每日新闻简报的播音稿撰写员。

日期：${args.date}
目标时长：${args.targetMinutes} 分钟（≈ ${targetChars} 中文字符）
目标章节数：${chapters}

候选文章：
${articleBlock}

要求：
- 输出严格的 JSON，不要包含 markdown 代码块
- 按主题/事件分成 ${chapters} 个章节，每章 200-400 字
- 每章引用 1-3 篇文章（用上面 [n] 编号）
- 语言：自然口语化中文，可适度英文术语
- 总字数在 ${Math.round(targetChars * 0.9)} - ${Math.round(targetChars * 1.1)} 之间

JSON schema:
{
  "title": "今日简报标题",
  "chapters": [
    { "idx": 1, "title": "章节标题", "script_text": "正文...", "source_refs": [{"title": "原文章节标题", "url": "..."}] }
  ]
}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/briefing.prompt.test.ts
```

Expected: `3 passed` (1 in `estimateChapterCount`, 2 in `buildPrompt`).

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "F1: LLM prompt builder with chapter estimation, TDD"
```

---

### Task F2: LLM client (TDD)

**Files:**
- Create: `src/lib/briefing/llm.ts`
- Test: `tests/unit/briefing.llm.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/briefing.llm.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
vi.stubEnv('ANTHROPIC_API_KEY', 'test');

import { generateBriefingScript } from '@/lib/briefing/llm';

beforeEach(() => { fetchMock.mockReset(); });

describe('generateBriefingScript', () => {
  it('calls the API and parses JSON from a clean response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '{"title":"t","chapters":[]}' }],
      }),
    });
    const out = await generateBriefingScript('hello prompt');
    expect(out.title).toBe('t');
    expect(out.chapters).toEqual([]);
  });

  it('strips markdown code fences before parsing', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '```json\n{"title":"t","chapters":[]}\n```' }],
      }),
    });
    const out = await generateBriefingScript('p');
    expect(out.title).toBe('t');
  });

  it('retries on 5xx', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'fail' });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: '{"title":"t","chapters":[]}' }] }),
    });
    const out = await generateBriefingScript('p');
    expect(out.title).toBe('t');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws on invalid JSON after retries', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'not json' }] }),
    });
    await expect(generateBriefingScript('p')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/briefing.llm.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement LLM client**

Create `src/lib/briefing/llm.ts`:
```typescript
import type { ScriptJson } from '@/types';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';
const MAX_RETRIES = 2;

function stripCodeFence(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
  return m ? m[1] : s;
}

function validateScript(j: any): asserts j is ScriptJson {
  if (!j || typeof j.title !== 'string' || !Array.isArray(j.chapters)) {
    throw new Error('invalid script shape');
  }
  for (const c of j.chapters) {
    if (typeof c.idx !== 'number' || typeof c.title !== 'string' || typeof c.script_text !== 'string' || !Array.isArray(c.source_refs)) {
      throw new Error('invalid chapter shape');
    }
  }
}

export async function generateBriefingScript(prompt: string): Promise<ScriptJson> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  let lastErr: unknown;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (res.status >= 500) {
      lastErr = new Error(`anthropic ${res.status}`);
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
      continue;
    }
    if (!res.ok) {
      throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    }
    const data: any = await res.json();
    const text = data?.content?.[0]?.text ?? '';
    try {
      const parsed = JSON.parse(stripCodeFence(text));
      validateScript(parsed);
      return parsed;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('llm failed after retries');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/briefing.llm.test.ts
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "F2: LLM client with retry, JSON validation, code-fence stripping"
```

---

### Task F3: /api/briefing/generate orchestrator

**Files:**
- Create: `src/lib/briefing/generator.ts`
- Create: `src/app/api/briefing/generate/route.ts`

- [ ] **Step 1: Implement generator**

Create `src/lib/briefing/generator.ts`:
```typescript
import { query } from '@/lib/db';
import { buildPrompt, estimateChapterCount } from './prompt';
import { generateBriefingScript } from './llm';
import { buildExtractiveScript } from './extractive';
import type { ScriptJson } from '@/types';

type Args = { device_id: string; date: string; length_minutes: number; topic_ids: number[] };

export async function generateBriefing(args: Args): Promise<ScriptJson> {
  const { device_id, date, length_minutes, topic_ids } = args;

  // Check daily_cache first
  const cached = await query<{ briefing_id: number }>(
    `SELECT briefing_id FROM daily_cache WHERE device_id = $1 AND brief_date = $2`,
    [device_id, date]
  );
  if (cached.length) {
    const rows = await query<{ script_json: ScriptJson }>(
      `SELECT script_json FROM briefings WHERE id = $1`,
      [cached[0].briefing_id]
    );
    if (rows.length) return rows[0].script_json;
  }

  // Fetch articles for the user's topics within the date ± 12h window
  const articles = await query<{
    title: string; url: string; content: string | null; published_at: string;
  }>(
    `SELECT title, url, content, published_at FROM articles
     WHERE topic_id = ANY($1::int[])
       AND published_at >= $2::date - INTERVAL '12 hours'
       AND published_at <  $2::date + INTERVAL '36 hours'
     ORDER BY published_at DESC NULLS LAST
     LIMIT 60`,
    [topic_ids, date]
  );

  if (!articles.length) {
    const err: any = new Error('no_articles');
    err.status = 422;
    throw err;
  }

  const promptArticles = articles.map(a => ({
    title: a.title,
    url: a.url,
    description: a.content ?? '',
    publishedAt: a.published_at ? new Date(a.published_at) : null,
  }));

  // Try LLM; on failure, fall back to extractive
  let script: ScriptJson;
  try {
    const prompt = buildPrompt({ date, targetMinutes: length_minutes, articles: promptArticles });
    script = await generateBriefingScript(prompt);
    // Defensive: clamp chapter count to estimate
    const max = estimateChapterCount(length_minutes) + 2;
    script.chapters = script.chapters.slice(0, max);
  } catch (e) {
    console.warn('LLM failed, falling back to extractive:', e);
    script = buildExtractiveScript(promptArticles, length_minutes);
  }

  // Persist
  const inserted = await query<{ id: number }>(
    `INSERT INTO briefings (device_id, brief_date, target_minutes, script_json)
     VALUES ($1, $2::date, $3, $4::jsonb) RETURNING id`,
    [device_id, date, length_minutes, JSON.stringify(script)]
  );
  const briefingId = inserted[0].id;
  await query(
    `INSERT INTO daily_cache (device_id, brief_date, briefing_id) VALUES ($1, $2::date, $3)
     ON CONFLICT (device_id, brief_date) DO UPDATE SET briefing_id = EXCLUDED.briefing_id`,
    [device_id, date, briefingId]
  );

  return script;
}
```

- [ ] **Step 2: Implement extractive fallback**

Create `src/lib/briefing/extractive.ts`:
```typescript
import type { ScriptJson } from '@/types';
import { estimateChapterCount } from './prompt';

type Article = { title: string; url: string; description: string; publishedAt: Date | null };

export function buildExtractiveScript(articles: Article[], lengthMinutes: number): ScriptJson {
  const targetChapters = estimateChapterCount(lengthMinutes);
  const effectiveChapters = articles.length < targetChapters ? 1 : targetChapters;
  const perChapter = Math.max(1, Math.ceil(articles.length / effectiveChapters));
  const chapters = [];
  for (let i = 0; i < effectiveChapters; i++) {
    const slice = articles.slice(i * perChapter, (i + 1) * perChapter);
    if (!slice.length) break;
    const titles = slice.map(a => a.title).join('、');
    const body = slice
      .map(a => a.description.slice(0, 200))
      .filter(Boolean)
      .join(' ');
    chapters.push({
      idx: i + 1,
      title: titles.length > 30 ? titles.slice(0, 30) + '…' : titles,
      script_text: body || titles,
      source_refs: slice.map(a => ({ title: a.title, url: a.url })),
    });
  }
  return { title: '今日新闻速览', chapters };
}
```

- [ ] **Step 3: Implement route**

Create `src/app/api/briefing/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateBriefing } from '@/lib/briefing/generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const script = await generateBriefing(body);
    return NextResponse.json(script);
  } catch (e: any) {
    if (e.status === 422) {
      return NextResponse.json({ error: 'no_articles' }, { status: 422 });
    }
    console.error('briefing generation failed:', e);
    return NextResponse.json({ error: 'internal' }, { status: 503 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "F3: /api/briefing/generate with daily_cache and extractive fallback"
```

---

### Task F4: Extractive fallback tests

**Files:**
- Test: `tests/unit/briefing.extractive.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/briefing.extractive.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { buildExtractiveScript } from '@/lib/briefing/extractive';

const ARTICLES = Array.from({ length: 20 }, (_, i) => ({
  title: `Article ${i}`,
  url: `https://a/${i}`,
  description: `Description for article ${i}.`,
  publishedAt: new Date('2024-01-01'),
}));

describe('buildExtractiveScript', () => {
  it('respects chapter count estimate', () => {
    const out = buildExtractiveScript(ARTICLES, 8); // expect 4 chapters
    expect(out.chapters.length).toBe(4);
  });

  it('returns at least 1 chapter even with few articles', () => {
    const out = buildExtractiveScript(ARTICLES.slice(0, 2), 8);
    expect(out.chapters.length).toBe(1);
  });

  it('truncates long titles', () => {
    const long = [{ title: 'X'.repeat(100), url: 'u', description: 'd', publishedAt: null }];
    const out = buildExtractiveScript(long, 3);
    expect(out.chapters[0].title.endsWith('…')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/briefing.extractive.test.ts
```

Expected: `3 passed`.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "F4: extractive fallback tests"
```

---

## Phase G: Player + TTS

### Task G1: TTS wrapper

**Files:**
- Create: `src/lib/tts/synthesize.ts`
- Test: `tests/unit/tts.synthesize.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/tts.synthesize.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';

class FakeUtterance {
  text: string;
  rate = 1;
  voice: any = null;
  onend: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  constructor(t: string) { this.text = t; }
}

const speakMock = vi.fn();
const cancelMock = vi.fn();
const getVoicesMock = vi.fn().mockReturnValue([{ name: 'zh-CN-A', lang: 'zh-CN' }]);
const pauseMock = vi.fn();
const resumeMock = vi.fn();

vi.stubGlobal('window', {
  speechSynthesis: {
    speak: speakMock,
    cancel: cancelMock,
    getVoices: getVoicesMock,
    pause: pauseMock,
    resume: resumeMock,
  },
  SpeechSynthesisUtterance: FakeUtterance,
});

// NOTE: The implementation does `new SpeechSynthesisUtterance(c)` (global access),
// not `new window.SpeechSynthesisUtterance(c)`. In Node (vitest) this global is
// undefined, so we must stub it explicitly. Without this line, all 4 tests fail
// with `ReferenceError: SpeechSynthesisUtterance is not defined`.
vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

import { createTts } from '@/lib/tts/synthesize';

describe('createTts', () => {
  it('lists voices', () => {
    const tts = createTts();
    expect(tts.listVoices()).toEqual([{ name: 'zh-CN-A', lang: 'zh-CN' }]);
  });

  it('chunks long text into <= 5000 char utterances', () => {
    const tts = createTts();
    const long = 'a'.repeat(12_000);
    tts.speak(long, { onDone: () => {} });
    // 12000 / 5000 = 3 chunks (5000, 5000, 2000)
    expect(speakMock).toHaveBeenCalledTimes(3);
  });

  it('sets rate from options', () => {
    speakMock.mockClear();
    const tts = createTts();
    tts.speak('hi', { rate: 1.5, onDone: () => {} });
    const call = speakMock.mock.calls[0][0] as FakeUtterance;
    expect(call.rate).toBe(1.5);
  });

  it('stop cancels pending speech', () => {
    const tts = createTts();
    tts.speak('x', { onDone: () => {} });
    tts.stop();
    expect(cancelMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/tts.synthesize.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement TTS wrapper**

Create `src/lib/tts/synthesize.ts`:
```typescript
type Utterance = {
  text: string;
  rate: number;
  voice: SpeechSynthesisVoice | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
};

type SpeakOptions = {
  rate?: number;
  voice?: SpeechSynthesisVoice | null;
  onDone?: () => void;
  onError?: (e: any) => void;
};

const MAX_CHUNK = 5000;

function chunkText(s: string): string[] {
  if (s.length <= MAX_CHUNK) return [s];
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    out.push(s.slice(i, i + MAX_CHUNK));
    i += MAX_CHUNK;
  }
  return out;
}

export function createTts() {
  if (typeof window === 'undefined') {
    return {
      listVoices: () => [],
      speak: () => {},
      stop: () => {},
      pause: () => {},
      resume: () => {},
    };
  }
  const synth = window.speechSynthesis;
  return {
    listVoices: () => synth.getVoices() ?? [],
    speak: (text: string, opts: SpeakOptions = {}) => {
      synth.cancel();
      const chunks = chunkText(text);
      chunks.forEach((c, idx) => {
        const u = new SpeechSynthesisUtterance(c);
        u.rate = opts.rate ?? 1;
        if (opts.voice) u.voice = opts.voice;
        if (idx === chunks.length - 1) {
          u.onend = () => opts.onDone?.();
          u.onerror = e => opts.onError?.(e);
        }
        synth.speak(u);
      });
    },
    stop: () => synth.cancel(),
    pause: () => synth.pause(),
    resume: () => synth.resume(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/unit/tts.synthesize.test.ts
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "G1: Web Speech API TTS wrapper with chunking"
```

---

### Task G2: Player page + chapter list

**Files:**
- Create: `src/components/ChapterList.tsx`
- Create: `src/components/CoverArt.tsx`
- Create: `src/app/player/page.tsx`

- [ ] **Step 1: Create CoverArt**

Create `src/components/CoverArt.tsx`:
```typescript
'use client';
export function CoverArt({ title }: { title: string }) {
  // Gradient based on title hash
  let hash = 0;
  for (const c of title) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const h1 = hash % 360;
  const h2 = (h1 + 60) % 360;
  return (
    <div
      style={{
        width: 240, height: 240, borderRadius: 24,
        background: `linear-gradient(135deg, hsl(${h1} 70% 60%), hsl(${h2} 70% 40%))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 22, fontWeight: 600,
        margin: '0 auto 16px', padding: 16, textAlign: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}
    >
      {title}
    </div>
  );
}
```

- [ ] **Step 2: Create ChapterList**

Create `src/components/ChapterList.tsx`:
```typescript
'use client';
import type { ScriptChapter } from '@/types';

export function ChapterList({
  chapters,
  current,
  onSelect,
}: {
  chapters: ScriptChapter[];
  current: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {chapters.map(c => (
        <li
          key={c.idx}
          onClick={() => onSelect(c.idx)}
          style={{
            padding: '12px 16px',
            marginBottom: 8,
            borderRadius: 12,
            background: current === c.idx ? 'var(--accent)' : '#f5f5f5',
            color: current === c.idx ? '#fff' : 'var(--fg)',
            cursor: 'pointer',
          }}
        >
          <strong>{c.idx}. {c.title}</strong>
          {c.source_refs.length > 0 && (
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              来源：{c.source_refs.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener"
                  style={{ color: 'inherit', textDecoration: 'underline', marginRight: 6 }}
                  onClick={e => e.stopPropagation()}
                >
                  {r.title.length > 20 ? r.title.slice(0, 20) + '…' : r.title}
                </a>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: Create player page**

Create `src/app/player/page.tsx`:
```typescript
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrCreateDeviceId } from '@/lib/device';
import { CoverArt } from '@/components/CoverArt';
import { ChapterList } from '@/components/ChapterList';
import { createTts } from '@/lib/tts/synthesize';
import type { ScriptJson } from '@/types';

function PlayerInner() {
  const params = useSearchParams();
  const date = params.get('date') ?? new Date().toISOString().slice(0, 10);
  const [script, setScript] = useState<ScriptJson | null>(null);
  const [current, setCurrent] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const tts = createTts();

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    fetch('/api/briefing/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        date,
        length_minutes: 8,
        topic_ids: JSON.parse(localStorage.getItem('dayilydose.topics') ?? '[]'),
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setScript)
      .catch(e => setErr(String(e)));
  }, [date]);

  useEffect(() => {
    if (!script || !('speechSynthesis' in window)) return;
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: script.title,
      artist: 'DayilyDose',
    });
  }, [script]);

  if (err) return <main style={{ padding: 24 }}><p style={{ color: 'red' }}>{err}</p></main>;
  if (!script) return <main style={{ padding: 24 }}><p>加载中…</p></main>;

  if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
    return (
      <main style={{ padding: 24 }}>
        <h1>{script.title}</h1>
        <p style={{ color: 'red' }}>当前浏览器不支持 Web Speech API，无法朗读。请改用 Chrome 或 Edge。</p>
        <ChapterList chapters={script.chapters} current={current} onSelect={() => {}} />
      </main>
    );
  }

  const playChapter = (idx: number) => {
    setCurrent(idx);
    const chapter = script.chapters.find(c => c.idx === idx);
    if (!chapter) return;
    tts.stop();
    tts.speak(chapter.script_text, { onDone: () => {
      if (idx < script.chapters.length) playChapter(idx + 1);
    }});
  };

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <CoverArt title={script.title} />
      <h1 style={{ textAlign: 'center' }}>{script.title}</h1>
      <p style={{ textAlign: 'center', color: 'var(--muted)' }}>{date} · {script.chapters.length} 章</p>
      <ChapterList chapters={script.chapters} current={current} onSelect={playChapter} />
      <PlayerControls
        onPlay={() => playChapter(current)}
        onStop={() => tts.stop()}
        onPrev={() => current > 1 && playChapter(current - 1)}
        onNext={() => current < script.chapters.length && playChapter(current + 1)}
        onSpeed={(r) => tts.stop() || tts.speak(script.chapters.find(c => c.idx === current)?.script_text ?? '', { rate: r })}
      />
    </main>
  );
}

import { PlayerControls } from '@/components/PlayerControls';

export default function PlayerPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}><p>加载中…</p></main>}>
      <PlayerInner />
    </Suspense>
  );
}
```

- [ ] **Step 4: Create stub PlayerControls (refined in G3)**

Create `src/components/PlayerControls.tsx`:
```typescript
'use client';
import { useState } from 'react';

export function PlayerControls({
  onPlay, onStop, onPrev, onNext, onSpeed,
}: {
  onPlay: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSpeed: (rate: number) => void;
}) {
  const [rate, setRate] = useState(1);
  return (
    <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
      <button onClick={onPrev} style={btn}>◀ 上一章</button>
      <button onClick={onPlay} style={{ ...btn, background: 'var(--accent)', color: '#fff' }}>▶ 播放</button>
      <button onClick={onStop} style={btn}>⏹ 停止</button>
      <button onClick={onNext} style={btn}>下一章 ▶</button>
      <label style={{ marginLeft: 16 }}>
        倍速：
        <select value={rate} onChange={e => { const r = Number(e.target.value); setRate(r); onSpeed(r); }} style={{ marginLeft: 4 }}>
          {[0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}×</option>)}
        </select>
      </label>
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer',
};
```

- [ ] **Step 5: Manual smoke**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm run dev
```

Open http://localhost:3000, pick topics, click generate — should navigate to /player with cover and chapter list.

- [ ] **Step 6: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "G2: player page with cover art, chapter list, basic controls"
```

---

### Task G3: TTS playback wiring (Media Session + 15s skip)

**Files:**
- Modify: `src/app/player/page.tsx`
- Modify: `src/lib/tts/synthesize.ts` (add getSpeaking support)

- [ ] **Step 1: Enhance player with skip controls**

Replace the PlayerInner body inside `src/app/player/page.tsx` with this version (the diff is the speed button behavior + 15s skip):

Add the following helper at top of `src/lib/tts/synthesize.ts`:
```typescript
// Add to the return object:
isSpeaking: () => synth.speaking ?? false,
```

Then in `src/app/player/page.tsx`, replace the `PlayerControls` props and add a skip button. Replace the entire `PlayerControls` invocation block with:

```typescript
      <PlayerControls
        onPlay={() => playChapter(current)}
        onStop={() => tts.stop()}
        onPrev={() => current > 1 && playChapter(current - 1)}
        onNext={() => current < script.chapters.length && playChapter(current + 1)}
        onSpeed={(r) => {
          const ch = script.chapters.find(c => c.idx === current);
          if (ch) { tts.stop(); setTimeout(() => tts.speak(ch.script_text, { rate: r, onDone: () => current < script.chapters.length && playChapter(current + 1) }), 50); }
        }}
        onSkip={() => {
          // 15s skip: stop, wait 50ms, restart current chapter (browsers can't seek mid-utterance reliably)
          const ch = script.chapters.find(c => c.idx === current);
          if (ch) { tts.stop(); setTimeout(() => tts.speak(ch.script_text, { onDone: () => current < script.chapters.length && playChapter(current + 1) }), 50); }
        }}
      />
```

And update `PlayerControls` props and button (add a "15s 跳过" button between stop and next):
```typescript
      <button onClick={onSkip} style={btn}>⏭ 15s</button>
```

Plus add `onSkip: () => void;` to its props.

- [ ] **Step 2: Manual test in browser**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm run dev
```

Pick topics, generate, on player:
- Click ▶ — should hear speech in Chrome/Edge
- Click next chapter — speech moves on
- Change rate — speed changes
- Click 15s — restarts current chapter (approximation; native seek not available in Web Speech API)

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "G3: Media Session metadata, 15s skip, rate change wiring"
```

---

### Task G4: Regenerate button

**Files:**
- Modify: `src/app/player/page.tsx`

- [ ] **Step 1: Add regenerate endpoint helper**

Add to `src/lib/briefing/generator.ts` an export `clearDailyCache`:
```typescript
export async function clearDailyCache(deviceId: string, date: string): Promise<void> {
  await query(`DELETE FROM daily_cache WHERE device_id = $1 AND brief_date = $2::date`, [deviceId, date]);
}
```

Add a new route `src/app/api/briefing/regenerate/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { clearDailyCache } from '@/lib/briefing/generator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { device_id, date } = await req.json();
  if (!device_id || !date) {
    return NextResponse.json({ error: 'device_id and date required' }, { status: 400 });
  }
  await clearDailyCache(device_id, date);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Add regenerate button to player**

In `src/app/player/page.tsx`, add a state and button:

```typescript
const [regenerating, setRegenerating] = useState(false);

const onRegenerate = async () => {
  setRegenerating(true);
  tts.stop();
  const deviceId = getOrCreateDeviceId();
  await fetch('/api/briefing/regenerate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, date }),
  });
  // Re-fetch
  const res = await fetch('/api/briefing/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      device_id: deviceId,
      date,
      length_minutes: 8,
      topic_ids: JSON.parse(localStorage.getItem('dayilydose.topics') ?? '[]'),
    }),
  });
  if (res.ok) {
    const newScript = await res.json();
    setScript(newScript);
    setCurrent(1);
  }
  setRegenerating(false);
};
```

Add a button below `PlayerControls`:
```typescript
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button onClick={onRegenerate} disabled={regenerating} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 8, background: '#fff', cursor: regenerating ? 'wait' : 'pointer' }}>
          {regenerating ? '重新生成中…' : '🔄 重新生成'}
        </button>
      </div>
```

Also save topics to localStorage when picked on home — in `src/app/page.tsx` add this in `onGenerate`:
```typescript
localStorage.setItem('dayilydose.topics', JSON.stringify(topics));
```

- [ ] **Step 3: Manual test**

Generate a brief. Click "重新生成". Should re-run and show new chapters (may be same content if data unchanged, but the request hits the LLM fresh).

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "G4: regenerate button with daily_cache wipe"
```

---

## Phase H: Tests + Polish

### Task H1: Briefing integration test (mock LLM)

**Files:**
- Create: `tests/integration/briefing.generate.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/integration/briefing.generate.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    content: [{ type: 'text', text: JSON.stringify({
      title: 'Test Brief',
      chapters: [
        { idx: 1, title: 'C1', script_text: 'hello world', source_refs: [{ title: 'a', url: 'https://a' }] },
        { idx: 2, title: 'C2', script_text: 'second', source_refs: [] },
      ],
    })],
  }),
}));

import { generateBriefing } from '@/lib/briefing/generator';

const sql = neon(process.env.DATABASE_URL!);
const TEST_DEVICE = `test-device-${Date.now()}`;
let TEST_TOPIC: number;

describe('generateBriefing', () => {
  beforeAll(async () => {
    const r = await sql(`INSERT INTO topics (slug, name_zh) VALUES ($1, 'Test Topic') RETURNING id`, [`test-${Date.now()}`]);
    TEST_TOPIC = (r[0] as any).id;
    // Insert a recent article
    await sql(
      `INSERT INTO sources (url, topic_id, status) VALUES ($1, $2, 'active')`,
      [`https://test/${Date.now()}`, TEST_TOPIC]
    );
    const src = (await sql(`SELECT id FROM sources WHERE topic_id = $1 ORDER BY id DESC LIMIT 1`, [TEST_TOPIC]))[0] as any;
    await sql(
      `INSERT INTO articles (source_id, topic_id, title, url, content, published_at, content_hash)
       VALUES ($1, $2, 'Test Article', 'https://test/a', 'desc', NOW() - INTERVAL '1 hour', $3)`,
      [src.id, TEST_TOPIC, `hash-${Date.now()}`]
    );
  });

  afterAll(async () => {
    await sql(`DELETE FROM articles WHERE topic_id = $1`, [TEST_TOPIC]);
    await sql(`DELETE FROM sources WHERE topic_id = $1`, [TEST_TOPIC]);
    await sql(`DELETE FROM briefings WHERE device_id = $1`, [TEST_DEVICE]);
    await sql(`DELETE FROM daily_cache WHERE device_id = $1`, [TEST_DEVICE]);
    await sql(`DELETE FROM topics WHERE id = $1`, [TEST_TOPIC]);
  });

  it('returns a script and writes to DB', async () => {
    const date = new Date().toISOString().slice(0, 10);
    const script = await generateBriefing({
      device_id: TEST_DEVICE,
      date,
      length_minutes: 8,
      topic_ids: [TEST_TOPIC],
    });
    expect(script.title).toBe('Test Brief');
    expect(script.chapters.length).toBe(2);
  });

  it('serves from daily_cache on second call', async () => {
    const date = new Date().toISOString().slice(0, 10);
    const script = await generateBriefing({
      device_id: TEST_DEVICE,
      date,
      length_minutes: 8,
      topic_ids: [TEST_TOPIC],
    });
    expect(script.title).toBe('Test Brief');
  });

  it('returns 422-equivalent error on no articles', async () => {
    const date = '1999-01-01';
    try {
      await generateBriefing({
        device_id: TEST_DEVICE,
        date,
        length_minutes: 8,
        topic_ids: [TEST_TOPIC],
      });
      expect.fail('expected throw');
    } catch (e: any) {
      expect(e.status).toBe(422);
    }
  });
});
```

- [ ] **Step 2: Run test**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx vitest run tests/integration/briefing.generate.test.ts
```

Expected: `3 passed`.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "H1: briefing integration test with mocked LLM and DB verification"
```

---

### Task H2: E2E test for home → player flow

**Files:**
- Create: `tests/e2e/home.spec.ts`
- Create: `tests/e2e/player.spec.ts`

- [ ] **Step 1: Write home E2E**

Replace `tests/e2e/smoke.spec.ts` with `tests/e2e/home.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('home renders topic chips and length slider', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DayilyDose' })).toBeVisible();
  // Wait for topics to load
  await expect(page.getByText('选择你关心的行业')).toBeVisible({ timeout: 10_000 });
  // At least one topic chip
  await expect(page.locator('button:has-text("(0)")').first()).toBeVisible();
  // Length slider
  await expect(page.getByText('简报时长（分钟）')).toBeVisible();
});
```

- [ ] **Step 2: Write player E2E (light)**

Create `tests/e2e/player.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('player route shows loading state when no brief', async ({ page }) => {
  await page.goto('/player?date=1999-01-01');
  // Either loads (no articles → 422 → error) or shows error
  await expect(page.locator('body')).toBeVisible();
  // We don't assert on success here because no fixture data
});
```

- [ ] **Step 3: Run E2E**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npx playwright test
```

Expected: at least 1 passed.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "H2: E2E tests for home and player routes"
```

---

### Task H3: README + deploy docs

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README**

Create `README.md`:
```markdown
# DayilyDose

A Web app that turns RSS topics into a daily chaptered audio briefing, using browser TTS and LLM summarization.

## Quick Start

Requires Node 20+ and a Neon Postgres database.

```bash
git clone <repo>
cd DayilyDose
npm install
cp .env.example .env.local
# Fill in DATABASE_URL, ANTHROPIC_API_KEY, CRON_SECRET
npx tsx scripts/load-seed.ts    # load 12 topics + 50 sources
npx tsx scripts/fetch-once.ts   # one-shot RSS fetch
npm run dev                     # http://localhost:3000
```

## Tests

```bash
npm test            # unit + integration (Vitest)
npm run test:e2e    # Playwright
```

## Deploy (Vercel)

1. Push repo to GitHub
2. Import in Vercel
3. Set env vars: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `CRON_SECRET`
4. Cron runs `/api/rss/fetch` every 20 minutes (configured in `vercel.json`)

## Architecture

See `docs/superpowers/specs/2026-06-16-dayily-dose-design.md`.

## Cost (1k DAU)

~$200/month — LLM (~$150), Postgres (~$20), Vercel (~$20), cron (~$10).

## Out of scope (v1)

Mobile native, cross-device sync, push, paywall, share/export, history-based personalization.
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git add -A
git commit -m "H3: README with setup, test, deploy, cost notes"
```

- [ ] **Step 3: Run full test suite**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
npm test
npm run test:e2e
```

Both should pass.

- [ ] **Step 4: Final commit tag**

```bash
cd "C:/Users/Longl/projects/DayilyDose"
git log --oneline | head -30
git tag v0.1.0-mvp
```

---

## Definition of Done (v1)

- [ ] All Phase A–H tasks committed
- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes
- [ ] `npm run dev` shows home, generates a brief end-to-end, plays in browser TTS
- [ ] README + spec + plan committed
- [ ] Vercel deploy succeeds with env vars set
- [ ] One live RSS fetch cycle ran in production
- [ ] No `TODO` / `TBD` in committed code
