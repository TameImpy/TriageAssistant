# Triage Assistant — Claude Context

## What This Is

A multi-agent AI tool for reviewing AI software access requests. Employees submit requests;
a configurable team of AI agents reviews them in structured phases and produces a tiered
report with a clear recommendation for IT/Infosec.

## Stack

- Next.js 16 (App Router, src-dir layout)
- TypeScript 5 (strict mode)
- Anthropic Claude SDK (`@anthropic-ai/sdk`) — direct, not Vercel AI SDK
- Tailwind CSS v4 + shadcn/ui
- SQLite via `better-sqlite3` (synchronous)
- Zustand for client state (SSE accumulation)
- Zod for validation (API routes + agent config)
- React Hook Form + Zod resolver for forms

## Key Paths

| Path | Purpose |
|---|---|
| `src/lib/agents/orchestrator.ts` | Core: manages all 4 phases, emits SSEEvent values |
| `src/lib/agents/prompt-builder.ts` | Interpolates agent system prompt templates |
| `src/app/api/triage/[requestId]/route.ts` | SSE streaming endpoint |
| `src/config/agents.json` | Default agent roster (source of truth for defaults) |
| `src/config/agents.schema.ts` | Zod schema — single source of truth for AgentConfig type |
| `src/lib/db/schema.ts` | SQLite table definitions |
| `src/lib/streaming/events.ts` | Typed SSEEvent union |
| `src/hooks/useTriageStream.ts` | Client-side SSE consumer |
| `src/proxy.ts` | Auth proxy (Next.js 16 renamed middleware → proxy) |

## Agent Discussion Phases

1. **Intake** — non-voting agent generates follow-up questions (before triage)
2. **Analysis** — all enabled agents run in parallel (`Promise.all`), return structured JSON
3. **Discussion** — 2 sequential rounds, agents in descending `riskWeighting` order, token-streaming
4. **Synthesis** — single synthesis agent produces final FinalReport JSON

Phase 2 does NOT stream tokens (emits `agent_complete` events only).
Phase 3 DOES stream tokens via `agent_token` SSE events.

## Two User Experiences

- **Employee**: `/submit` → `/requests/[id]/clarify` → `/requests/[id]/status` (no discussion visible)
- **Reviewer**: `/requests` dashboard → `/requests/[id]` (live stream + full report)

## Request Status Flow

`draft` → `awaiting_clarification` → `in_progress` → `complete` | `error`

## Agent Config (runtime-editable)

Default config in `agents.json`. Runtime edits stored in `agent_configs` DB table.
`agent-loader.ts` checks DB first; falls back to `agents.json`.
Config snapshot saved on each completed request for audit.

## Database

Single SQLite file at `data/triage.db` (gitignored). Tables: `requests`, `messages`, `agent_configs`.
`better-sqlite3` is synchronous — no async/await needed for DB calls.
Migrations run automatically on server start via `src/lib/db/migrations.ts`.

## SSE Protocol

All triage progress sent as `text/event-stream`. Each event is a JSON line: `data: {...}\n\n`.
Event types defined in `src/lib/streaming/events.ts`. Client uses native fetch + ReadableStream
(not EventSource, because triage is triggered via POST) consumed via `useTriageStream` hook,
which writes into Zustand store.

## Conventions

- All Claude API calls are server-side only; `ANTHROPIC_API_KEY` never sent to client
- API route errors return `{ error: string }` with appropriate HTTP status
- All agent model calls use `claude-sonnet-4-6` by default; Synthesis Agent uses `claude-opus-4-6`
- TypeScript strict mode is on — no `any` types
- shadcn components live in `src/components/ui/`; custom components in named subdirectories

## Next.js 16 Notes

- `src/middleware.ts` → renamed to `src/proxy.ts`, export `proxy` not `middleware`
- `npm run dev/build/start` use direct `node node_modules/next/dist/bin/next` path (broken .bin symlinks)
- `npm run typecheck` uses `node node_modules/typescript/lib/tsc.js --noEmit`

## Environment Variables

```
ANTHROPIC_API_KEY=         # Required — Anthropic API key
AUTH_PASSWORD=             # Required — Single shared password for reviewer routes
NODE_ENV=development       # Set automatically by Next.js
```

## Running Locally

```bash
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY and AUTH_PASSWORD
npm install
npm run dev
```
