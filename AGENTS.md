# AGENTS.md — PinfoHealth AI

You are implementing PinfoHealth AI, a Socratic AI wellness companion for university students, for a 7-day hackathon (DoGoodie $5 Impact Hack). This file governs **how** to build it. The full product rationale, rubric strategy, and day-by-day plan live in `docs/MASTER_PLAN.md` — read that before making any decision that changes scope, not just implementation details.

This file is binding spec, not suggestion. Where it says "never," treat that as a hard constraint.

---

## Tech Stack (fixed — do not substitute without asking)

- **Backend runtime:** Node.js LTS (20.x+), ES modules (`"type": "module"`)
- **Backend framework:** Fastify
- **Frontend:** React + Vite
- **Database:** Neon (serverless Postgres) — used for **exactly one purpose**: anonymous event counters. Never a store for message content.
- **LLM:** Google Gemini API. Confirm the current model string in Google AI Studio before the first call — `gemini-2.5-flash-lite` is the intended tier (cheapest standard model) but exact model IDs change more often than this file does.
- **Hosting — three independent services, not one:**
  - Backend → **Render** (Web Service, Node runtime), via `backend/render.yaml`
  - Frontend → **Vercel**, via `frontend/vercel.json`
  - Database → **Neon**, created directly at neon.tech — not tied to either hosting platform

Do not introduce Redis, Upstash, MongoDB, an auth provider, or any service beyond these three without explicit human sign-off. If you think one is needed, stop and ask.

---

## Repository Layout

```
pinfohealth-ai/
├── backend/                           # deploys to Render
│   ├── src/
│   │   ├── server.js                  # Fastify bootstrap, CORS, /health
│   │   ├── config.js                  # ALL env var access — nowhere else
│   │   ├── db.js                      # Neon connection pool (SSL required — see below)
│   │   ├── modules/
│   │   │   ├── chat/
│   │   │   │   ├── chat.routes.js     # POST /api/chat
│   │   │   │   ├── chat.service.js    # sliding window, LLM call, streaming
│   │   │   │   └── prompts.js         # system prompt — implement verbatim
│   │   │   ├── safety/
│   │   │   │   └── crisis-check.js    # pre-LLM keyword pass + hardcoded reply
│   │   │   └── impact/
│   │   │       ├── impact.routes.js   # POST /api/feedback
│   │   │       └── impact.repository.js  # inserts into impact_events only
│   │   └── middleware/
│   │       └── rate-limit.js
│   ├── db/
│   │   └── migrations/001_create_impact_events.sql
│   ├── package.json
│   ├── render.yaml
│   └── .env.example
├── frontend/                          # deploys to Vercel
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── FeedbackPrompt.jsx
│   │   └── lib/api.js                 # fetch/SSE client, holds conversation state
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── .env.example
├── docs/
│   └── MASTER_PLAN.md
└── AGENTS.md
```

Don't collapse `chat` / `safety` / `impact` into one file, and don't reach across module boundaries except through their exported functions.

---

## Non-Negotiable Rules

1. **Never persist chat message content.** Not to a database, not to a file, not to a log. Conversation history exists only in the frontend's React state and is sent with each request.
2. **Never let the LLM see a message that trips the crisis pre-filter.** `crisis-check.js` runs synchronously before any LLM call. On a match, return the hardcoded response (below) verbatim and stop — no LLM call, no exception.
3. **Never alter the crisis hotline numbers or redirect copy.** Reproduce the text in `## Crisis Pre-Filter` below exactly.
4. **Never log request bodies.** Fastify's logger should log method, path, status, and duration only. Message content must not enter logs, error trackers, or crash reports.
5. **Never exceed the sliding-window cap.** `MAX_HISTORY_MESSAGES = 6` — the 6 most recent entries in `messages`, counting both `user` and `assistant` turns. Enforce server-side; never trust client-supplied array length.
6. **CORS allows exactly one origin — the deployed Vercel URL — never `*`.** Frontend and backend are on different domains by construction now (a `.vercel.app` origin calling a `.onrender.com` API), so this isn't optional hardening, it's the thing that makes the app work at all. Read `ALLOWED_ORIGIN` from `config.js`; don't hardcode it.
7. **Never add scope that was explicitly cut.** No login/auth, no user accounts, no localStorage/persistent client storage of message content, no database table containing message text, no admin dashboard UI, no i18n scaffolding, no mobile app wrapper.
8. **Never return raw error detail to the client.** Catch and log internally (per rule 4); return a generic `{ "error": "..." }` shape only.
9. **Rate limiting is server-side, not client-side.** `@fastify/rate-limit` is the actual enforcement; client-side throttling is a UX nicety only.
10. **Neon connections require SSL.** Omitting it doesn't degrade gracefully — every query fails immediately. Configure `db.js` with `ssl: { rejectUnauthorized: false }` (or Neon's documented pooled-connection settings) from the start.

---

## API Contract

### `POST /api/chat`

Request:
```json
{
  "sessionId": "string — client-generated UUID, not tied to any identity",
  "messages": [
    { "role": "user", "content": "string" }
  ]
}
```

Validation before anything else runs:
- Reject if `messages` is missing, not an array, or any entry has `role` outside `["user","assistant"]`.
- Reject if any single `content` exceeds 2000 characters.
- Reject if `messages.length` exceeds 20 (defensive cap before sliding-window logic applies).
- Truncate to the last `MAX_HISTORY_MESSAGES` entries server-side regardless of what the client sent.

Flow:
1. Run `crisis-check.js` against the latest `user` message.
   - **Match:** respond `200` with `{ "type": "crisis", "reply": "<verbatim text>" }` as plain JSON (not streamed). Do not call the LLM. Do not log the message.
   - **No match:** proceed.
2. Call the LLM with the system prompt + truncated window, streamed.
3. Response is `text/event-stream`: each chunk as `data: {"delta":"..."}\n\n`, terminated with `data: [DONE]\n\n`.
4. On successful completion of a normal (non-crisis) exchange, insert one `message_sent` row into `impact_events`.

### `POST /api/feedback`

Request: `{ "sessionId": "string", "helpful": true }`

Inserts one row: `feedback_yes` if `helpful === true`, else `feedback_no`. Response: `{ "ok": true }`.

### `GET /health`

Returns `{ "status": "ok" }`, `200`. Zero dependencies — no DB call, no LLM call — so it never fails for reasons unrelated to actual health. Used by Render's health check and any keep-alive ping.

---

## Environment Variables

| Name | Set where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Render, secret | Google AI Studio key |
| `DATABASE_URL` | Render, secret | Neon's pooled connection string — include `?sslmode=require` if Neon's dashboard provides it that way |
| `ALLOWED_ORIGIN` | Render | The deployed Vercel URL, exact — never `*` |
| `PORT` | Render | Injected automatically — the server must bind to `process.env.PORT` |
| `VITE_API_URL` | Vercel, build-time | The deployed Render backend URL. Vite bakes this in at build time — it must be set in Vercel's project settings *before* the first deploy, not after |

`config.js` is the only backend file that reads `process.env`. Everything else imports from `config.js`.

---

## Database (Neon)

One migration, one table. Do not add others without explicit sign-off.

```sql
CREATE TABLE IF NOT EXISTS impact_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('session_started','message_sent','feedback_yes','feedback_no')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

`db.js` — connection setup, SSL is not optional:
```js
import pg from 'pg';
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

`impact.repository.js` exposes one function: `logEvent(eventType)`. Nothing else touches this table.

---

## System Prompt (implement verbatim in `prompts.js`)

```
You are PinfoHealth AI, a warm, non-judgmental peer wellness companion for
university students. You are not a therapist, doctor, or medical
professional, and you must never present yourself as one.

Every conversation:
1. Your first reply asks ONE open, specific question — is this physical
   exhaustion, academic/mental pressure, or a specific event? Do not offer
   any advice or suggestion yet.
2. Keep asking short, specific follow-up questions until you have a clear,
   concrete picture. This usually takes 2–4 exchanges.
3. Once specific, offer exactly ONE small, concrete action doable in under
   2 minutes, phrased using the person's own words. Never more than one
   suggestion at a time.
4. Never use clinical or diagnostic language. Reflect their words back —
   don't label them.
5. Never give medical advice, medication guidance, or treatment
   recommendations of any kind.
6. Keep every reply to 2–4 sentences.
7. Tone: a grounded, kind senior student who's been through the same
   academic grind — not clinical, not overly cheerful, not preachy.

Note: messages indicating possible self-harm, suicidal intent, or
immediate danger are intercepted BEFORE reaching you — you will not see
those messages.
```

---

## Crisis Pre-Filter (`crisis-check.js`)

Runs synchronously, before the LLM call, on every request. Match on category-level patterns: direct statements of self-harm or suicidal intent, hopelessness paired with a plan, mentions of abuse or immediate danger. Bias toward over-triggering.

On match, return this exact text as `reply`:

```
I hear that things feel really heavy right now, and I'm glad you said
something. I'm just an AI wellness companion though, not the right kind
of support for this — please reach out to the NCMH Crisis Hotline: 1553
(or 1800-1888-1553), or 0917-899-8727. They're available 24/7. If you're
in immediate danger, please contact emergency services or go to the
nearest hospital. You don't have to go through this alone.
```

---

## Safety & Budget — all four must be verifiably present

1. **Sliding window** — `MAX_HISTORY_MESSAGES = 6`, enforced server-side.
2. **Rate limiting** — `@fastify/rate-limit`, e.g. 20 requests/hour per IP on `/api/chat`.
3. **Hard budget cap** — a human action in the Google AI Studio console, not code.
4. **Crisis bypass** — see above.

---

## Coding Conventions

- ES modules, `async`/`await` throughout.
- One module, one responsibility, matching the folder layout above.
- Fastify plugins for CORS, rate-limit, and logging config registered only in `server.js`.
- Small functions — split any file doing more than one job.
- Frontend: never `dangerouslySetInnerHTML` for LLM output.

---

## Commands

```bash
# backend
cd backend && npm install
npm run dev        # local dev, auto-reload
npm start           # production start — this is what Render runs

# frontend
cd frontend && npm install
npm run dev          # local dev server
npm run build         # production build → dist/ — this is what Vercel runs
```

---

## Definition of Done

- [ ] `npm run build` (frontend) and `npm start` (backend) both succeed with no errors
- [ ] A message matching the crisis pre-filter returns the hardcoded reply and does **not** trigger any outbound Gemini API call
- [ ] A normal message never gets advice on the AI's first reply — it asks a question first
- [ ] Sending an 8-message conversation results in only the most recent 6 being forwarded to the LLM
- [ ] `POST /api/feedback` produces a new row, confirmed via `SELECT event_type, COUNT(*) FROM impact_events GROUP BY event_type;` on Neon
- [ ] No file anywhere in the repo writes chat message content to disk, database, or a persistent log
- [ ] A cross-origin request from the deployed Vercel URL to the deployed Render URL succeeds, and a request from any other origin is rejected
- [ ] No `.env` file is committed; `.env.example` files list variable names with placeholder values only

---

## Deployment

Three independent pieces, deployed in this order (each depends on the previous one's output):

1. **Neon** — create the project, run the migration, copy the pooled connection string.
2. **Render** — deploy `backend/render.yaml` as a Blueprint; supply `GEMINI_API_KEY` and `DATABASE_URL` (the Neon string from step 1) when prompted.
3. **Vercel** — deploy the `frontend/` directory; set `VITE_API_URL` to the Render URL from step 2 in the project's environment variables *before* the first build.
4. Go back to Render and update `ALLOWED_ORIGIN` to the Vercel URL from step 3, then redeploy.

If you change an env var name or add a service, update `backend/render.yaml` and `frontend/vercel.json` in the same change — they must stay the source of truth for their respective platforms.

---

## When Unsure

If a task isn't covered by this file or `docs/MASTER_PLAN.md`, or a request seems to conflict with a "Non-Negotiable Rule" above, stop and ask rather than guessing. Scope creep and silent architecture changes are the two failure modes this file exists to prevent.