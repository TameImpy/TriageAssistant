# Triage Assistant — Tasks & Acceptance Tests

Status legend: [ ] not started | [x] complete | [~] in progress

---

## TASK 1 — Project Bootstrap
- [ ] Scaffold Next.js 15 app with TypeScript, Tailwind, App Router, src-dir
- [ ] Install all dependencies
- [ ] Configure tsconfig paths and Tailwind
- [ ] Install and initialise shadcn/ui components (Button, Card, Badge, Textarea, Input,
      Select, Separator, Accordion, Progress, Skeleton, Dialog, Tooltip)

**Tests:**
- `npm run dev` starts on port 3000 with no console errors
- `npx tsc --noEmit` passes with zero errors
- `/` renders without a white screen or hydration error
- All shadcn components importable without module-not-found errors

---

## TASK 2 — Database Layer
- [ ] Create `src/lib/db/client.ts` — better-sqlite3 singleton
- [ ] Create `src/lib/db/schema.ts` — CREATE TABLE statements for requests, messages, agent_configs
- [ ] Create `src/lib/db/migrations.ts` — idempotent migration runner (runs on server start)
- [ ] Create `src/lib/db/requests.ts` — CRUD: createRequest, getRequest, listRequests, updateRequest
- [ ] Create `src/lib/db/messages.ts` — CRUD: saveMessage, getMessagesByRequest

**Tests:**
- Migration runner creates all 3 tables; running it twice does not throw
- `createRequest` returns object with nanoid `id`
- `getRequest(id)` returns null for unknown id; returns full object for known id
- `listRequests()` returns array sorted by `created_at DESC`
- `saveMessage` persists a message; `getMessagesByRequest` retrieves it
- `updateRequest` changes only specified fields; others remain unchanged

---

## TASK 3 — Agent Config System
- [ ] Create `src/config/agents.schema.ts` — Zod schema (AgentConfig type)
- [ ] Create `src/config/agents.json` — 6 default agents (Infosec, Legal, Data & Eng,
      Commercial, Editorial, HR disabled)
- [ ] Create `src/lib/config/agent-loader.ts` — loads + validates agents.json

**Tests:**
- `agents.json` loads and passes Zod validation without errors
- `agent-loader.ts` throws a descriptive error if a required field is missing
- All 6 agents have unique `id` values
- HR agent has `enabled: false`; all others have `enabled: true`
- Infosec has the highest `riskWeighting` (9); Commercial and Editorial have 5

---

## TASK 4 — Requests API
- [ ] `POST /api/requests` — validates body with Zod, creates DB record, returns `{ id, status }`
- [ ] `GET /api/requests` — returns array of all requests with id, tool_name, status, created_at, risk_level
- [ ] `GET /api/requests/[requestId]` — returns full request object including messages

**Tests:**
- POST with valid body → 201 + `{ id, status: "draft" }`
- POST missing required field (e.g. `tool_name`) → 400 with field-level error detail
- GET /api/requests → 200 with array (empty array if no requests)
- GET /api/requests/[nonExistentId] → 404
- GET /api/requests/[existingId] → 200 with full object matching what was POSTed

---

## TASK 5 — Intake Form (Employee)
- [ ] Create `src/app/submit/page.tsx` with `IntakeForm.tsx`
- [ ] Form fields: tool name, URL, requester name/team/role, justification (min 100 chars),
      data types (checkboxes), user count, data leaves company (Y/N/unsure), cost, replaces tool,
      docs URL
- [ ] Client-side Zod validation via React Hook Form; inline error messages
- [ ] On submit: POST /api/requests, redirect to `/requests/[id]/status`

**Tests:**
- Submitting with all required fields empty shows validation errors on each field
- `business_justification` under 100 chars shows a character-count error
- Valid form submission POSTs to /api/requests and redirects to status page
- Status page URL contains the returned request ID
- Form does not submit while POST is in-flight (button disabled)

---

## TASK 6 — Intake Agent
- [ ] Create `src/lib/agents/intake-agent.ts`
- [ ] Accepts enriched request object; returns `IntakeQuestion[]` via structured JSON output
- [ ] Each question: `{ id, question, rationale, answeredBy, required }`
- [ ] Maximum 6 questions; does not re-ask anything already clearly answered in the form
- [ ] Second-pass "ready" check: returns `{ ready: true }` or another round of questions
- [ ] Create `POST /api/intake` route

**Tests:**
- POST /api/intake with complete, detailed submission → returns `{ ready: true }` or ≤6 questions
- Questions array never contains a question answerable directly from the form fields provided
- Each question object has all required fields (id, question, rationale, answeredBy, required)
- POST /api/intake with deliberately sparse submission → returns at least 2 follow-up questions
- Intake questions are saved to the request record in DB

---

## TASK 7 — Clarification Flow (Employee)
- [ ] Create `src/app/requests/[requestId]/clarify/page.tsx`
- [ ] Renders `ClarificationForm.tsx` with Intake Agent questions
- [ ] On submit: saves answers to DB, triggers second intake pass
- [ ] If intake ready: updates request status, redirects to `/requests/[id]/status`
- [ ] Employee status page at `/requests/[requestId]/status`

**Tests:**
- Clarify page loads with correct questions from the request record
- Submitting answers saves `intake_answers` to DB
- After answering, request status transitions from `awaiting_clarification`
- Status page shows a progress indicator (not a blank page)
- Status page does NOT render any agent message content or discussion text
- Navigating directly to `/requests/[id]` (reviewer URL) without auth password is blocked

---

## TASK 8 — Orchestrator & Agent Runners
- [ ] Create `src/lib/agents/orchestrator.ts` — async generator, emits SSEEvent values
- [ ] Create `src/lib/agents/prompt-builder.ts` — template interpolation
- [ ] Create `src/lib/agents/analysis-agent.ts` — Phase 2 parallel runner (non-streaming)
- [ ] Create `src/lib/agents/discussion-agent.ts` — Phase 3 sequential runner (streaming)
- [ ] Create `src/lib/agents/synthesis-agent.ts` — Phase 4 report generator

**Tests:**
- Orchestrator emits `phase_start` events for phases 2, 3, and 4 in order
- Phase 2 emits one `agent_complete` event per enabled agent
- `agent_complete` events for Phase 2 each include a `structuredData` object with
  `{ summary, concerns, questions_for_peers, risk_score, stance }`
- Phase 3 emits `agent_start` and `agent_complete` for each agent × 2 rounds
- Phase 3 agents speak in descending `riskWeighting` order (Infosec before Legal, etc.)
- Phase 4 emits `report_ready` with a valid FinalReport object
- All discussion messages are persisted to DB after orchestrator completes
- If one agent call throws (e.g. simulated API error), remaining agents still run;
  error is noted in report under that agent's section

---

## TASK 9 — SSE Streaming Endpoint
- [ ] Create `src/lib/streaming/events.ts` — typed SSEEvent union
- [ ] Create `src/lib/streaming/sse.ts` — ReadableStream emitter helpers
- [ ] Create `POST /api/triage/[requestId]` route — runs orchestrator, streams SSE events
- [ ] Update request status to `in_progress` on start, `complete` or `error` on finish

**Tests:**
- POST /api/triage/[id] response has `Content-Type: text/event-stream`
- Response stream includes `data:` prefixed JSON lines parseable as SSEEvent
- Each SSEEvent parses against the TypeScript union without type errors
- Stream terminates (connection closes) after `report_ready` event
- Request status in DB is `complete` after stream ends
- POST to a non-existent requestId → 404 before stream opens
- POST to a request with status `in_progress` → 409 (prevents double-run)

---

## TASK 10 — Discussion UI (Reviewer)
- [ ] Create `src/hooks/useTriageStream.ts` — EventSource consumer, writes to Zustand
- [ ] Create `src/hooks/useRequestStore.ts` — Zustand store
- [ ] Create `DiscussionFeed.tsx`, `AgentMessage.tsx`, `PhaseHeader.tsx`, `TypingIndicator.tsx`
- [ ] Create `/requests/[requestId]/page.tsx` — reviewer detail page

**Tests:**
- DiscussionFeed renders a PhaseHeader when a `phase_start` event is received
- TypingIndicator appears when `agent_start` event fires; disappears on `agent_complete`
- AgentMessage renders agent name, avatar initials, and message content
- Tokens from `agent_token` events accumulate in the correct agent's message bubble
- Page shows a "Start Triage" button if request is in `awaiting_clarification` (ready) status
- Clicking "Start Triage" triggers POST /api/triage/[id] and opens the SSE stream
- Page handles `error` SSE events by showing an inline error message (not a white screen)

---

## TASK 11 — Final Report
- [ ] Create `FinalReport.tsx`, `RiskMatrix.tsx`, `AgentPOV.tsx`, `RecommendationBadge.tsx`
- [ ] Report renders after `report_ready` SSE event is received
- [ ] RecommendationBadge colour-coded: green (APPROVE), amber (CONDITIONS/DEFER), red (REJECT)
- [ ] Sections 5, 6, 7 use shadcn Accordion (collapsed by default)
- [ ] Copy-to-clipboard copies plain-text version; print button triggers `window.print()`

**Tests:**
- FinalReport renders all 7 sections given a valid FinalReport JSON object
- APPROVE recommendation → RecommendationBadge has green styling
- REJECT → red; APPROVE WITH CONDITIONS / DEFER → amber
- Sections 5, 6, 7 are collapsed by default; clicking expands them
- Copy-to-clipboard writes non-empty string to clipboard
- Risk matrix renders one row per risk item in the report

---

## TASK 12 — Reviewer Dashboard
- [ ] Create `/requests/page.tsx` with request list
- [ ] Shows: tool name, requester, team, status badge, risk level badge, created date
- [ ] Filter by status (all / pending / complete) and risk level (all / high / medium / low)
- [ ] Clicking a row navigates to `/requests/[id]`

**Tests:**
- Dashboard loads and shows all requests from GET /api/requests
- Status and risk badges render with correct colour coding
- Filtering by status=complete hides all non-complete requests
- Filtering by risk=high hides requests with medium or low risk
- Empty state renders a message (not a blank table) when no requests match filters
- Clicking a row navigates to the correct detail page

---

## TASK 13 — Agent Configuration Panel
- [ ] Create `AgentConfigPanel.tsx` and `AgentCard.tsx`
- [ ] Accessible from reviewer dashboard (settings/agents page)
- [ ] Shows all agents with current enabled state, name, riskWeighting
- [ ] Editable fields: enabled toggle, systemPromptTemplate, focusAreas, riskWeighting,
      voteWeight, dealbreakers, requiredQuestions
- [ ] PATCH /api/agents/[id] saves to DB agent_configs table
- [ ] Changes reflected on next triage run

**Tests:**
- Config panel lists all 6 agents from agents.json
- Toggling enabled state and saving → PATCH /api/agents/[id] called with correct body
- PATCH /api/agents/[id] → 200; record updated in DB
- PATCH /api/agents/[id] with invalid config (missing required field) → 400
- Refreshing config panel after PATCH shows updated values
- Running triage after changing an agent's systemPromptTemplate uses updated prompt
  (verify by checking that the agent's phase 2 structured_data in DB reflects new focus)

---

## TASK 14 — Error Handling & Polish
- [ ] All API routes return consistent `{ error: string }` JSON on failure
- [ ] All pages have loading skeletons (no bare loading spinners or blank white states)
- [ ] Failed Claude API call within triage marks that agent as "unavailable" in report
- [ ] Triage timeout: if entire triage exceeds 3 minutes, stream closes with error event
- [ ] `.env.example` with all required vars documented
- [ ] Basic auth middleware: `/requests` and `/api` routes require `AUTH_PASSWORD` cookie
- [ ] `CLAUDE.md` and `README.md` present and accurate

**Tests:**
- Navigating to `/requests` without auth cookie → redirected to login page
- Valid password → auth cookie set; subsequent requests pass through
- Invalid `ANTHROPIC_API_KEY` in .env → triage emits `error` SSE event with descriptive message;
  request status set to `error`; page shows inline error (not white screen)
- Skeleton screens visible during initial data fetch on dashboard and detail pages
- `npx tsc --noEmit` still passes with zero errors after all tasks complete
