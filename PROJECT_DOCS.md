  # PinfoHealth AI — Project Documentation

## Overview
A Socratic AI wellness companion for university students and anyone needing a calm, grounded ear. Built for the DoGoodie $5 Impact Hack (7-day hackathon).

## Tech Stack
- **Frontend:** React + Vite → deploys to Vercel
- **Backend:** Node.js 20 LTS, Fastify, ES modules → deploys separately (independent service)
- **Database:** Neon (serverless Postgres) — anonymous event counters only
- **LLM:** Google Gemini API (`gemini-2.5-flash-lite` tier)

## Architecture
Three independent services (not monolithic):
1. **Frontend** (Vercel) — static SPA, calls backend via `VITE_API_URL`
2. **Backend** (separate hosting) — Fastify API, CORS locked to frontend origin
3. **Database** (Neon) — single table `impact_events` for anonymous counters

## Repository Structure
```
pinfohealth-ai/
├── backend/          # Fastify API
│   ├── src/
│   │   ├── server.js          # bootstrap, CORS, /health
│   │   ├── config.js          # ALL env var access (single source)
│   │   ├── db.js              # Neon pool (SSL required)
│   │   ├── modules/
│   │   │   ├── chat/          # POST /api/chat + streaming
│   │   │   ├── safety/        # crisis pre-filter (runs before LLM)
│   │   │   └── impact/        # POST /api/feedback + DB writes
│   │   └── middleware/rate-limit.js
│   ├── db/migrations/001_create_impact_events.sql
│   └── package.json
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── App.jsx            # Landing + Chat routes
│   │   ├── components/        # ChatWindow, MessageBubble, FeedbackPrompt, Logo, ThemeToggle
│   │   └── lib/api.js         # fetch/SSE client, conversation state
│   └── package.json
├── docs/MASTER_PLAN.md        # Full product rationale & day-by-day plan
└── AGENTS.md                  # Binding spec for AI agents
```

## Key Environment Variables
| Variable | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Backend (secret) | Google AI Studio key |
| `DATABASE_URL` | Backend (secret) | Neon pooled connection string (with `sslmode=require`) |
| `ALLOWED_ORIGIN` | Backend | Exact deployed frontend URL (never `*`) |
| `PORT` | Backend | Injected by host |
| `VITE_API_URL` | Frontend (build-time) | Deployed backend URL — set in Vercel before first deploy |

## API Contract
### `POST /api/chat`
**Request:** `{ "sessionId": "uuid", "messages": [{ "role": "user|assistant", "content": "string" }] }`
- Validates: array, roles, content ≤2000 chars, length ≤20
- Server truncates to last 6 messages (sliding window)
- Crisis pre-filter runs first — on match returns hardcoded helpline reply, **no LLM call**
- Normal: streams SSE `data: {"delta":"..."}` → `data: [DONE]`
- Logs `message_sent` event on success

### `POST /api/feedback`
**Request:** `{ "sessionId": "uuid", "helpful": boolean }`
Writes `feedback_yes` or `feedback_no` event.

### `GET /health`
Returns `{ "status": "ok" }` — zero dependencies.

## Database (Neon)
Single table — **no message content stored**:
```sql
CREATE TABLE impact_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('session_started','message_sent','feedback_yes','feedback_no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Non-Negotiable Rules
1. **Never persist chat content** — only in frontend React state
2. **Crisis pre-filter runs before LLM** — hardcoded reply, no LLM call, no logging
3. **Crisis helpline text is immutable** — reproduce exactly from `AGENTS.md`
4. **No request body logging** — only method, path, status, duration
5. **Sliding window = 6 messages** enforced server-side
6. **CORS = exactly one origin** (deployed frontend URL)
7. **No auth, no accounts, no localStorage for messages, no extra tables**
8. **Generic errors only** — catch/log internally, return `{ "error": "..." }`
9. **Rate limit = server-side** (`@fastify/rate-limit`, ~20 req/hr per IP)
10. **Neon SSL required** — `ssl: { rejectUnauthorized: false }` in `db.js`

## System Prompt (verbatim in `backend/src/modules/chat/prompts.js`)
- First reply: ONE open, specific question (physical/mental/specific event)
- 2–4 exchanges to clarify
- Then ONE micro-action (<2 min, in user's words)
- No clinical language, no medical advice, 2–4 sentences, grounded peer tone

## Crisis Pre-Filter (verbatim in `backend/src/modules/safety/crisis-check.js`)
Matches self-harm, suicidal intent, hopelessness+plan, abuse, immediate danger.
Returns exact helpline text:
```
I hear that things feel really heavy right now, and I'm glad you said
something. I'm just an AI wellness companion though, not the right kind
of support for this — please reach out to the NCMH Crisis Hotline: 1553
(or 1800-1888-1553), or 0917-899-8727. They're available 24/7. If you're
in immediate danger, please contact emergency services or go to the
nearest hospital. You don't have to go through this alone.
```

## Commands
```bash
# Backend
cd backend && npm install
npm run dev        # local with auto-reload
npm start           # production (what host runs)

# Frontend
cd frontend && npm install
npm run dev         # local dev server
npm run build       # production build → dist/ (what Vercel runs)
```

## Deployment Order (independent services)
1. **Neon** — create project, run migration, copy pooled connection string
2. **Backend host** — deploy, set `GEMINI_API_KEY`, `DATABASE_URL`, `ALLOWED_ORIGIN` (placeholder)
3. **Vercel** — deploy `frontend/`, set `VITE_API_URL` = backend URL **before first build**
4. **Update backend** — set `ALLOWED_ORIGIN` = actual Vercel URL, redeploy

## Definition of Done
- [ ] Frontend builds, backend starts cleanly
- [ ] Crisis trigger returns hardcoded reply, **no Gemini call**
- [ ] First AI reply asks a question (no advice)
- [ ] 8-message history → only last 6 sent to LLM
- [ ] `POST /api/feedback` creates row in `impact_events`
- [ ] Zero chat content in DB, logs, files
- [ ] Cross-origin works (Vercel → backend), other origins rejected
- [ ] No `.env` committed; `.env.example` has placeholders only

## Keywords
`wellness`, `socratic`, `ai-companion`, `crisis-interception`, `anonymous`, `ephemeral`, `student-mental-health`, `impact-hack`, `gemini`, `fastify`, `react`, `neon`, `vercel`