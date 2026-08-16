# PinfoHealth AI — Master Plan & Implementation Blueprint
### DoGoodie $5 Impact Hack · Render + Node.js Edition

This supersedes the earlier Vercel-based draft. Platform and runtime changed; the product, safety, and scoring strategy underneath did not — those were sound and are carried over. Read this as the single source of truth from here on.

---

## 0. What Changed, and Why It's Actually a Good Trade

Render runs your Node app as a real, persistent process — not a stateless function that spins up per-request the way Vercel's does. That resolves the earlier statefulness problem cleanly: in-memory rate limiting, which silently failed on serverless, now genuinely works, because there's one continuously-running process to hold it in.

The trade-off: Render's free tier sleeps a service after 15 minutes of no traffic, and the first request after that takes up to a minute to respond. That's a real UX consideration for a judge testing cold, and the plan below designs around it rather than ignoring it (§4.8, §10).

---

## 1. Scope: In vs. Out

**In:**
- Chat UI: streaming replies, typing indicator, landing disclaimer
- Client-held conversation state — no login, no accounts
- One Node.js API service: guardrailed, streamed LLM call
- Hardcoded system prompt (Socratic-only persona + guardrails)
- A hardcoded, non-LLM crisis-redirect response
- In-memory per-IP rate limiting (legitimate now — see §0)
- A hard dollar cap set at the LLM provider console
- A minimal Postgres table logging four anonymous event counts
- End-of-session Yes/No feedback
- Two Render services (static frontend + Node API), deployed via a Blueprint

**Out — cut on purpose:**
- **Login/accounts** — no identity needed for this to work.
- **Storing chat content anywhere** — the sliding-window history lives in the browser tab's state and is sent with each request. The only thing that touches the database is anonymous event counters (§4.6) — never message text.
- **A hand-managed Redis/rate-limit service** — in-memory is correct and sufficient for a single free-tier instance; the scaling path if you ever need it is one file (§4.8).
- **Cross-session memory** — a returning user starts fresh, by design.
- **A native/PWA app** — responsive web is enough.
- **UI localization (i18n)** — not a 7-day item; the AI's replies can still flex into Taglish naturally, that's prompting, not UI work.
- **A custom admin dashboard** — Render's own dashboard + a single SQL query (§4.6) already gives you the numbers.
- **"High concurrency" as an engineering target** — don't build for load this project won't see. The honest, checkable claim is: Node's event loop handles concurrent requests natively on a single process, and the service scales vertically (more RAM/CPU) or horizontally (more instances) with a plan change, not a rewrite.

---

## 2. Rubric-to-Decision Map

| # | Category | Generic default | What this spec does instead |
|---|---|---|---|
| 1 | Tech-Enabled Execution | "uses an LLM API" | Streamed Node.js chat service + a real, computed cost-per-conversation figure + a designed $0→paid scaling path |
| 2 | Creativity/Novelty | Generic "AI wellness chatbot" | Strict Socratic-only interaction contract (§3.1) + micro-habits scoped to real student contexts |
| 3 | Measurable Impact | Vague "engagement" | Explicit event schema (§4.6) → 4 concrete submission numbers, durable across restarts |
| 4 | Organizing/Influence | Absent | 3-tactic distribution plan run on Days 5–6 (§6) |
| 5 | Execution Quality | "it works" | Risk-ordered 7-day plan; safety and deploy validated early, not on Day 7 |
| 6 | Evidence/Documentation | Screenshots promised, unscoped | Exact screenshot list mapped to Render + Postgres (§8) |
| 7 | Reflection & Future Potential | Not addressed | Scaffold referencing real data you'll actually have (§9) |

---

## 3. Product Spec

### 3.1 The interaction contract — your novelty lever
A hard rule baked into the system prompt, not left to the model's discretion:
- The AI **cannot offer advice on its first reply.** It must ask one open, specific question first (physical exhaustion vs. mental load vs. a specific event).
- It keeps asking short Socratic follow-ups (2–4 exchanges) until the friction is specific, not generic.
- Only then does it offer **exactly one** micro-habit, under 2 minutes, phrased in the person's own words, scoped to real student contexts (between classes, before an exam, on a commute).
- Never assigns a clinical label. Reflects language back — doesn't diagnose.

**Optional creative flourish, cheap to build:** after feedback, show *"This conversation cost less than ₱1 in AI credits."* True (§4.7), on-theme, and it puts your budget engineering somewhere the user actually sees it.

### 3.2 Screens
1. **Landing** — one-paragraph pitch, liability disclaimer, single "Start" action, no sign-up.
2. **Chat** — streaming assistant replies, typing indicator, a static "I am an AI, not a doctor" footer always visible.
3. **End-of-session** — Yes/No "did this help you reset today?" shown after a natural pause, not forced.

### 3.3 System Prompt Spec

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

**Hardcoded crisis-redirect (bypasses the LLM call entirely):**

```
I hear that things feel really heavy right now, and I'm glad you said
something. I'm just an AI wellness companion though, not the right kind
of support for this — please reach out to the NCMH Crisis Hotline: 1553
(or 1800-1888-1553), or 0917-899-8727. They're available 24/7. If you're
in immediate danger, please contact emergency services or go to the
nearest hospital. You don't have to go through this alone.
```

Route the pre-filter on general categories — direct statements of self-harm/suicidal intent, hopelessness paired with a plan, mentions of abuse or immediate danger — as a fast first pass, backed by the system-prompt instruction as a second layer for context the keyword pass might miss. Never rely on the LLM alone here.

---

## 4. Technical Architecture (Render + Node.js)

### 4.1 Two services, zero-cost start
- **Frontend — Render Static Site.** React (Vite) build, served from Render's CDN. Free with no time limit and no spin-down — the landing page always loads instantly, even cold.
- **Backend — Render Web Service.** A persistent Node.js process (Fastify) exposing one chat endpoint. Free tier, single instance, spins down after 15 minutes idle.
- **Database — Render PostgreSQL (free tier).** Used for exactly one thing: four anonymous event counters. Never touches message content.

Splitting frontend and backend this way means the only place a judge ever sees a cold-start delay is the first chat message, not the page load — and that's manageable with a loading state (§4.8).

### 4.2 Stack

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **Fastify** | Matches your existing toolset from Knowneksyon; plugin architecture maps cleanly onto the modular-domain folders below; official `@fastify/rate-limit` plugin covers §4.5 pillar 2 out of the box. (Express works identically well if you'd rather lean on more generic tutorials under time pressure — either is fine, this just matches what you already know.) |
| Frontend | **React + Vite**, plain fetch/EventSource for streaming | Minimal build tooling, fast dev loop, deploys as a Render Static Site with zero server needed for the frontend at all |
| LLM | **Gemini 2.5 Flash-Lite** (or your OpenAI equivalent) | Cheapest standard-tier model available — see cost math §4.7 |
| Rate limiting | **In-memory, via `@fastify/rate-limit`** | Legitimate on Render because the process persists between requests, unlike serverless. Single free instance = no distributed-state problem. |
| Budget cap | **Hard cap in the LLM provider console** | The real backstop — set this before writing a line of chat code |
| Impact tracking | **Postgres table, insert-only** (§4.6) | Durable across the service's sleep/wake cycles, unlike the free Key Value store, which loses data on restart |
| Hosting | **Render**, both services in the same region | One dashboard, one Blueprint file, straightforward CORS between the two |

### 4.3 Folder Structure

```
pinfohealth-ai/
├── backend/
│   ├── src/
│   │   ├── server.js                  # Fastify bootstrap, CORS, /health
│   │   ├── config.js                  # env vars
│   │   ├── modules/
│   │   │   ├── chat/
│   │   │   │   ├── chat.routes.js
│   │   │   │   ├── chat.service.js    # sliding window + LLM call + streaming
│   │   │   │   └── prompts.js         # persona + guardrails + Socratic rules
│   │   │   ├── safety/
│   │   │   │   └── crisis-check.js    # pre-LLM keyword pass + hardcoded reply
│   │   │   └── impact/
│   │   │       ├── impact.routes.js
│   │   │       └── impact.repository.js  # inserts into impact_events
│   │   └── middleware/
│   │       └── rate-limit.js          # @fastify/rate-limit config
│   ├── db/
│   │   └── migrations/001_create_impact_events.sql
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── FeedbackPrompt.jsx
│   │   └── lib/api.js                 # fetch wrapper + stream handling
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── render.yaml
└── README.md
```

### 4.4 Render Blueprint (`render.yaml`)

This is your literal deployment blueprint — commit it at the repo root and Render can stand up both services plus the database from one file. Treat the exact field names as a strong starting point: confirm them against Render's current Blueprint schema (or just let Render auto-generate the file when you connect the repo via "New → Blueprint" in the dashboard) on Day 1, since platform schemas do shift.

```yaml
databases:
  - name: pinfohealth-events
    plan: free

services:
  - type: web
    name: pinfohealth-api
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: GEMINI_API_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: pinfohealth-events
          property: connectionString
      - key: ALLOWED_ORIGIN
        value: https://pinfohealth-app.onrender.com

  - type: web
    name: pinfohealth-app
    runtime: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://pinfohealth-api.onrender.com
```

Prefer a region close to your users if it's available on your plan (Render offers a Singapore region) — noticeably lower latency for testers in the Philippines than a US/EU default.

### 4.5 Safety & Budget — four pillars

1. **Sliding-window context** — never send more than the last 6 messages to the LLM; caps token usage regardless of conversation length.
2. **In-memory per-IP rate limiting** (`@fastify/rate-limit`, e.g. 20 req/hour) — correct and sufficient on a single persistent instance.
3. **Hard budget cap at the provider** — the real backstop, set in the Google AI Studio/Cloud or OpenAI console.
4. **Hardcoded crisis bypass** — see §3.3. The one case that never depends on the LLM's judgment alone.

### 4.6 Impact Measurement — durable counters, not chat logs

One table, insert-only, no personal content ever written to it:

```sql
CREATE TABLE IF NOT EXISTS impact_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('session_started','message_sent','feedback_yes','feedback_no')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The backend inserts a row on each of the four events. For your submission numbers, one query:

```sql
SELECT event_type, COUNT(*) FROM impact_events GROUP BY event_type;
```

This survives the free service sleeping and waking (unlike the Key Value store) because it's a real Postgres instance, not in-memory cache. Screenshot the query result — that's your impact evidence.

### 4.7 Cost Math

A single turn: roughly ~500 tokens of system prompt + sliding-window history in, ~250 tokens of reply out. At Gemini 2.5 Flash-Lite's published rate (~$0.10/M input, ~$0.40/M output), that's well under $0.0005 per exchange — $5 funds **several thousand** conversational turns, not "hundreds." Compute your real number once the prompt is locked in and put it in the submission. Make sure some genuine paid spend actually shows on the billing dashboard before you screenshot it — a $0.00 balance because everything landed in a free tier doesn't demonstrate the $5 being put to work.

### 4.8 The $0 → Scale Path (make this explicit in your submission — it's a strong "future potential" answer)

| If this happens | Do this | Code changes needed |
|---|---|---|
| Real traffic, spin-down annoys judges/users | Upgrade backend to Starter ($7/mo) | None — plan change only |
| Need multiple backend instances | Swap rate-limit store from in-memory to Render's Key Value/Redis | One file, since the limiter is written against a small store interface |
| Want accounts or persistent chat history later | Add tables to the Postgres instance already provisioned | No new infra, just migrations |
| Judging window is coming and you want to kill the cold start for that window only | Ping `/health` every ~10 minutes via a free Render Cron Job during the demo period | None — and it fits inside the 750 free monthly instance-hours, since that's nearly full-month coverage for one service |

---

## 5. Organizing / Distribution Plan

Run this deliberately on Days 5–6, not as an afterthought:

1. **Personal seed asks.** Message ~10–15 specific classmates or org-mates directly — not a cold group post — asking them to try it and send one honest reaction. Personal asks get replies; broadcasts get silence.
2. **One or two targeted group-chat shares.** Post in a section or org group chat with a direct call to action ("2 minutes, tap Yes/No at the end"). Use a shortened/trackable link if you can.
3. **Testimonial capture.** Ask 3–5 testers if you can quote (anonymized, or with permission) their reaction — this single step produces both Organizing and Documentation evidence at once.

---

## 6. Day-by-Day Plan (risk-ordered)

| Day | Focus |
|---|---|
| 1 | Render account + Fastify skeleton + a streamed Gemini call working locally. Set the hard budget cap in the provider console immediately. Draft `render.yaml`. |
| 2 | Build the crisis pre-filter + finalize the system prompt. Deliberately try to break it — ask for a diagnosis, express distress, push it to advise on turn one. |
| 3 | Frontend chat UI: landing, disclaimer, streaming render, typing indicator, client-side sliding-window state. |
| 4 | Deploy both services via the Blueprint. Wire CORS between them, connect Postgres, confirm the four impact events fire and persist across a manual spin-down/wake cycle. |
| 5 | Round 1 real-user testing: 5–10 close testers. Watch for the cold-start delay; add a "waking up, first message may take a bit" loading state if it's jarring. |
| 6 | Distribution push (§5) + monitor the Postgres counts + collect testimonials. |
| 7 | Buffer. Set up the keep-alive Cron Job for your judging window if needed. Finalize documentation, screenshots, repo cleanup, write the reflection while it's fresh, submit. |

---

## 7. Evidence & Submission Checklist

- [ ] Live Render Static Site URL (frontend)
- [ ] Public (or judge-shared) repo link
- [ ] Screenshot of the `impact_events` count query (§4.6)
- [ ] LLM provider billing dashboard screenshot showing real dollars spent
- [ ] Render dashboard screenshot showing both services deployed and live
- [ ] 2–3 anonymized tester reactions
- [ ] Short screen recording or GIF of the app in use
- [ ] README section explicitly naming the safety design (crisis redirect, guardrails) — surface this to judges directly

---

## 8. Reflection Scaffold

Answer honestly once you have real data:

- What actually broke or surprised you technically? (The cold-start UX is a fair, genuine answer here if it came up.)
- What was your real measured cost-per-session vs. the §4.7 prediction?
- What's the one drop-off point your `impact_events` numbers showed, and what would you test to fix it?
- What would you build with $50 instead of $5? Answer concretely using the §4.8 scaling path you already designed for.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM cost overrun | Hard cap at provider (primary) + rate limiter (secondary) |
| Crisis message mishandled | Hardcoded pre-filter bypass — never solely LLM judgment |
| Cold-start delay during live judging | Keep-alive Cron Job during the demo window only (§4.8) |
| Low real-user turnout | Personal outreach over cold broadcast (§5) |
| Impact numbers lost to a restart | Postgres counters, not the in-memory Key Value store (§4.6) |
| Late-breaking deploy issues | Deploy on Day 4 via the Blueprint, not Day 7 |

---

## 10. Suggested Tightening of Your Application Answers

- **Q3 ($5 spend):** swap "hundreds" for the computed figure from §4.7 once you have it.
- **Q4 (tech stack):** replace "high-concurrency Node.js backend" with the checkable version: "a persistent Node.js (Fastify) service on Render, backed by a free Postgres instance for anonymous impact metrics, deployed via Render's Blueprint system."
- **Q8 (what could go wrong):** add the crisis-disclosure case explicitly, and the cold-start UX risk — naming both shows you designed around real failure modes, not hypothetical ones.

---

**Next step:** confirm this architecture (or flag anything you want changed), and we start Day 1.