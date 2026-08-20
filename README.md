# PinfoHealth AI

**One calm question at a time.** A Socratic AI wellness companion for anyone who could use a grounded ear — university students first, but everyone in between. Built for the DoGoodie $5 Impact Hack.

### The Problem

Feeling overwhelmed is common; knowing what to do about it is not. Students and working adults under pressure face a well-known gap: professional mental-health support is expensive, scarce, and often stigmatized, while the free advice that is available is almost always **generic** — "exercise more," "take a break" — too vague to act on in the moment, and too big to fit into a life that is already full. The result is someone who is stuck, not for lack of effort, but for lack of a specific next step.

### What PinfoHealth does about it

PinfoHealth inverts the default. It does not diagnose, prescribe, or lecture — it asks. One focused question at a time, it helps you name what is actually going on (physical exhaustion, mental/emotional pressure, or a specific event), then offers exactly **one** small, concrete action you can take in under **two minutes**, phrased in your own words. Specificity is the mechanism: a specific action is actionable, a generic one is not. Each micro-step is delivered as a shareable takeaway card you can complete and carry with you.

### The impact

- **On the person** — an anonymous, judgment-free first step that is available on demand, needs no appointment, and fits in the space between classes, shifts, and deadlines — turning "I'm overwhelmed" into "here is one thing I can do right now."
- **On safety** — the one moment it must not be an AI, it is not. Language suggesting self-harm or immediate danger is intercepted before the model ever sees it and answered with verified NCMH crisis hotline numbers, 24/7.
- **On scale** — each exchange costs a fraction of a cent, so the entire $5 hackathon budget funds thousands of conversations, and every session is logged as an anonymous counter — turning a wellness chat into measurable, reportable impact.

> **Important:** PinfoHealth is an AI wellness companion, **not** a therapist, doctor, or medical professional. It never gives medical advice. Crisis language is intercepted before the AI ever sees it and returns verified helpline numbers immediately.

---

## Screenshots

<!-- Add screenshots here once captured:
![Landing page](docs/screenshots/landing.png)
![Chat with generative UI](docs/screenshots/chat.png)
![Takeaway card](docs/screenshots/takeaway.png)
-->

*Screenshots coming soon.*

---

## Features

- **Socratic, not prescriptive** — one focused question at a time, no advice dumps, no labels.
- **One micro-step, under 2 minutes** — a single concrete action phrased in the person's own words.
- **Generative UI in chat** — the AI can embed interactive components: guided box breathing, a micro-habit "Done" card, mood check-in, quick polls, and a 5-4-3-2-1 grounding exercise.
- **Downloadable Takeaway Card** — at the end of a session, a shareable PNG card with the one micro-habit you received.
- **Crisis interception** — verified NCMH helpline numbers returned before the LLM is ever called.
- **Anonymous & ephemeral** — no accounts, no message persistence. Conversations exist only in the browser session.
- **Safety by default** — server-side rate limiting, strict CORS, sliding-window context, no message logging.
- **Dark mode** — respects system preference, fully responsive on any device.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router, html2canvas |
| Backend | Node.js 20 (ES modules), Fastify, @fastify/cors, @fastify/rate-limit |
| Database | Neon (serverless Postgres) — anonymous event counters only |
| LLM | Google Gemini (`GEMINI_MODEL` configurable) |

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS)
- A Google AI Studio API key (`GEMINI_API_KEY`)
- A Neon (serverless Postgres) connection string (`DATABASE_URL`)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in GEMINI_API_KEY, DATABASE_URL
npm run dev            # local dev with auto-reload
# production: npm start
```

Create the `impact_events` table in Neon using `backend/db/migrations/001_create_impact_events.sql`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your running backend (e.g. http://localhost:3000)
npm run dev            # local dev server (default http://localhost:5173)
# production build: npm run build → dist/
```

Open the frontend dev server, click **Start a conversation**, and chat.

---

## Environment Variables

### Backend (`backend/.env.example`)

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `GEMINI_MODEL` | No | Gemini model ID (default `gemini-3.1-flash-lite`) |
| `DATABASE_URL` | Yes | Neon pooled connection string (include `?sslmode=require`) |
| `ALLOWED_ORIGIN` | Yes* | Exact deployed frontend origin — never `*`. Defaults to `http://localhost:5173` locally |
| `PORT` | No | Server port (default `3000`; injected by host in production) |

### Frontend (`frontend/.env.example`)

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | Yes | URL of the deployed backend. Baked in at build time — set it *before* building |

> Never commit `.env` files. Keep secrets in the hosting platform's environment settings.

---

## Usage

1. **Start a session** — tap "Start a conversation". A fresh, anonymous session begins instantly.
2. **Share what's on your mind** — type naturally. No forms, no categories.
3. **Get a question back** — PinfoHealth replies with one specific question.
4. **Clarity emerges** — after 2–4 exchanges, the picture sharpens.
5. **One tiny action** — you receive a single concrete step, sometimes with an interactive component to complete it (breathing exercise, grounding, etc.).
6. **Take it with you** — answer the quick feedback prompt to get a downloadable Takeaway Card (PNG) with your micro-step.

---

## API Reference

### `POST /api/chat`

Streams an SSE response. Request:

```json
{
  "sessionId": "string — client-generated UUID",
  "messages": [{ "role": "user|assistant", "content": "string" }]
}
```

Validation: roles restricted to `user`/`assistant`, content ≤ 2000 chars, messages ≤ 20. The server truncates to the **6 most recent** messages (sliding window) before calling the LLM.

**Flow:**
1. Crisis pre-filter runs against the latest user message.
   - **Match** → `200` JSON `{ "type": "crisis", "reply": "<helpline text>" }` (no LLM call).
   - **No match** → proceed.
2. LLM response streams as `text/event-stream`:
   ```
   data: {"type":"text","delta":"..."}
   data: {"type":"ui","component":"breathing-exercise","props":{...}}
   data: [DONE]
   ```
3. On success, one `message_sent` row is inserted into `impact_events`.

### `POST /api/feedback`

```json
{ "sessionId": "string", "helpful": true }
```

Inserts `feedback_yes` or `feedback_no`. Returns `{ "ok": true }`.

### `POST /api/ui-event`

Logs a generative UI interaction (analytics only). Request:

```json
{
  "sessionId": "string",
  "eventType": "ui_breathing_complete | ui_habit_done | ui_mood_select | ui_poll_vote | ui_grounding_done",
  "metadata": { "component": "string", "action": "string" }
}
```

### `GET /health`

Returns `{ "status": "ok" }` with zero dependencies — no DB or LLM call.

### `GET /api/impact-summary`

Public, read-only. Returns anonymous impact counters straight from the database (no message content — only event counts):

```json
{
  "ok": true,
  "data": { "session_started": 42, "message_sent": 118, "feedback_yes": 9 }
}
```

This powers the public impact dashboard at `/impact`.

---

## Generative UI Components

The AI can embed interactive components inline with its reply using an allowlist — it cannot generate arbitrary code. Available components:

| Component | What it does |
|---|---|
| `breathing-exercise` | Animated box breathing (inhale/hold/exhale cycles) |
| `micro-habit-card` | The one micro-step with a "Done" button |
| `mood-button` | Quick emoji mood check-in |
| `quick-poll` | Binary/ternary choice to tailor next steps |
| `grounding-54321` | Guided 5-4-3-2-1 sensory grounding |

Interactions are logged as anonymous events for impact measurement.

---

## Database (Neon)

One table, anonymous counters only — **no message content is ever stored**.

```sql
CREATE TABLE IF NOT EXISTS impact_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'session_started','message_sent','feedback_yes','feedback_no',
      'ui_breathing_complete','ui_habit_done','ui_mood_select',
      'ui_poll_vote','ui_grounding_done'
    )
  ),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Safety & Privacy

- **Crisis interception** — keywords indicating self-harm, suicidal intent, or immediate danger are caught before the LLM sees them, and verified helpline numbers are returned instantly.
- **No message persistence** — conversations live only in the browser's React state. Nothing is written to a database, file, or log.
- **No request-body logging** — the server logs method, path, status, and duration only.
- **Sliding window** — only the 6 most recent messages are ever sent to the LLM, enforced server-side.
- **Strict CORS** — exactly one allowed origin (the deployed frontend), never `*`.
- **Server-side rate limiting** — `@fastify/rate-limit`, ~20 requests/hour per IP on `/api/chat`.
- **No tracking** — no cookies, no fingerprinting, no third-party scripts.

### Crisis response (verbatim)

If a message trips the pre-filter, the app replies with this exact text:

```
I hear that things feel really heavy right now, and I'm glad you said
something. I'm just an AI wellness companion though, not the right kind
of support for this — please reach out to the NCMH Crisis Hotline: 1553
(or 1800-1888-1553), or 0917-899-8727. They're available 24/7. If you're
in immediate danger, please contact emergency services or go to the
nearest hospital. You don't have to go through this alone.
```

---

## Project Structure

```
pinfohealth-ai/
├── backend/                    # Fastify API
│   ├── src/
│   │   ├── server.js           # bootstrap, CORS, rate-limit, /health
│   │   ├── config.js           # ALL env var access (single source)
│   │   ├── db.js               # Neon pool (SSL required)
│   │   ├── modules/
│   │   │   ├── chat/           # POST /api/chat, streaming, prompts
│   │   │   ├── safety/         # crisis pre-filter (runs before LLM)
│   │   │   └── impact/         # feedback + UI-event logging
│   │   └── middleware/rate-limit.js
│   ├── db/migrations/001_create_impact_events.sql
│   └── package.json
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── App.jsx             # landing + chat routes
│   │   ├── components/         # ChatWindow, MessageBubble, FeedbackPrompt,
│   │   │   └── ui/             #   TakeawayCard, Logo, ThemeToggle
│   │   │                       #   generative UI ComponentRegistry
│   │   └── lib/api.js          # SSE client, conversation state
│   └── package.json
├── docs/MASTER_PLAN.md         # product rationale & day-by-day plan
├── PROJECT_DOCS.md             # detailed internal documentation
└── AGENTS.md                   # binding build spec
```

---

## Deployment

Three independent services, deployed in order (each depends on the previous output):

1. **Database (Neon)** — create the project, run the migration, copy the pooled connection string.
2. **Backend** — deploy the `backend/` directory to your chosen Node hosting; supply `GEMINI_API_KEY`, `DATABASE_URL`, and an initial `ALLOWED_ORIGIN` (placeholder).
3. **Frontend** — deploy the `frontend/` directory to your chosen static host; set `VITE_API_URL` to the backend URL **before the first build**.
4. **Finalize CORS** — update the backend's `ALLOWED_ORIGIN` to the deployed frontend URL and redeploy.

---

## License

[MIT](LICENSE)

---

## Acknowledgments

- Built for the **DoGoodie $5 Impact Hack** — impact over revenue.
- Crisis support resources: **NCMH Crisis Hotline** — 1553 / 1800-1888-1553 / 0917-899-8727, available 24/7.