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
