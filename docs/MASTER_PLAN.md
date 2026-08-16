# PinfoHealth AI — Master Plan & Implementation Blueprint (v3)
### DoGoodie $5 Impact Hack · Render (API) + Vercel (Frontend) + Neon (Database)

This supersedes both earlier drafts. Treat this as the single source of truth from here on — the product, safety, and scoring strategy carry over unchanged from the prior versions; only the hosting topology changed.

---

## 0. What Changed This Revision

Two swaps from the previous edition:
- **Frontend** moved from a Render Static Site to **Vercel**.
- **Database** moved from Render's free Postgres to **Neon**, because Render's free Postgres expires 30 days after creation and is then deleted unless upgraded to a paid plan — a real problem for anything meant to outlive the hackathon judging window. Neon's free tier is a permanent tier, not a trial: no expiration, scale-to-zero after 5 minutes idle, roughly half-second wake time on the next query.

Everything else — the Socratic interaction contract, the safety layer, the rubric strategy, the day-by-day plan — is unchanged.

---

## 1. Scope: In vs. Out

**In:**
- Chat UI: streaming replies, typing indicator, landing disclaimer
- Client-held conversation state — no login, no accounts
- One Node.js API service: guardrailed, streamed LLM call
- Hardcoded system prompt (Socratic-only persona + guardrails)
- A hardcoded, non-LLM crisis-redirect response
- In-memory per-IP rate limiting
- A hard dollar cap set at the LLM provider console
- A minimal Postgres table logging four anonymous event counts
- End-of-session Yes/No feedback
- Three free-tier services (Vercel frontend, Render backend, Neon database), each independently deployed

**Out — cut on purpose:**
- **Login/accounts** — no identity needed.
- **Storing chat content anywhere** — the sliding-window history lives in the browser tab's state, sent per request. The only thing that touches the database is anonymous event counters — never message text.
- **A hand-managed Redis/rate-limit service** — in-memory is correct on a single persistent Render instance.
- **Cross-session memory** — a returning user starts fresh, by design.
- **A native/PWA app, UI localization, a custom admin dashboard** — none earn their build time in 7 days.
- **"High concurrency" as an engineering target** — the honest, checkable claim is that Node's event loop handles concurrent requests natively, and each of the three services scales independently with a plan change, not a rewrite.

---

## 2. Rubric-to-Decision Map

| # | Category | Generic default | What this spec does instead |
|---|---|---|---|
| 1 | Tech-Enabled Execution | "uses an LLM API" | Streamed Node.js chat service + a real cost-per-conversation figure + a three-service architecture that scales independently, piece by piece |
| 2 | Creativity/Novelty | Generic "AI wellness chatbot" | Strict Socratic-only interaction contract (§3.1) + micro-habits scoped to real student contexts |
| 3 | Measurable Impact | Vague "engagement" | Explicit event schema (§4.6) → 4 concrete submission numbers, durable regardless of any service sleeping |
| 4 | Organizing/Influence | Absent | 3-tactic distribution plan on Days 5–6 (§6) |
| 5 | Execution Quality | "it works" | Risk-ordered 7-day plan; three independent deploys validated by Day 4, not Day 7 |
| 6 | Evidence/Documentation | Screenshots promised, unscoped | Exact screenshot list mapped to Render, Vercel, and Neon (§8) |
| 7 | Reflection & Future Potential | Not addressed | Scaffold referencing real data you'll actually have (§9) |

---

## 3. Product Spec

### 3.1 The interaction contract — your novelty lever
A hard rule in the system prompt, not left to the model's discretion:
- The AI **cannot offer advice on its first reply.** It asks one open, specific question first (physical exhaustion vs. mental load vs. a specific event).
- Short Socratic follow-ups (2–4 exchanges) until the friction is specific, not generic.
- Then, **exactly one** micro-habit, under 2 minutes, in the person's own words, scoped to real student contexts.
- Never a clinical label. Reflects language back — doesn't diagnose.

**Optional creative flourish:** after feedback, show *"This conversation cost less than ₱1 in AI credits."* True (§4.7), on-theme, and puts your budget engineering somewhere the user actually sees it.

### 3.2 Screens
1. **Landing** — pitch, disclaimer, single "Start" action, no sign-up.
2. **Chat** — streaming replies, typing indicator, static "I am an AI, not a doctor" footer.
3. **End-of-session** — Yes/No "did this help you reset today?" after a natural pause.

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

Route the pre-filter on general categories — direct statements of self-harm/suicidal intent, hopelessness with a plan, mentions of abuse or immediate danger. Bias toward over-triggering. Never rely on the LLM alone for this.

---

## 4. Technical Architecture

### 4.1 Three services, each doing one job, all free to start

- **Frontend — Vercel.** React (Vite) single-page app. Free Hobby tier, global CDN, no spin-down. (Note: Vercel's Hobby tier is scoped to personal/non-commercial use, which this project fits.)
- **Backend — Render Web Service.** A persistent Node.js (Fastify) process exposing the chat and feedback endpoints. Free tier, single instance, spins down after 15 minutes idle, ~1 minute cold start on wake.
- **Database — Neon.** Postgres, free forever, scale-to-zero after 5 minutes idle with a sub-second wake. Holds exactly one table: anonymous event counters. No message content ever reaches it.

None of the three know or care that the others exist on a different platform — they're connected only by plain HTTPS calls (frontend → backend) and a connection string (backend → database).

### 4.2 Stack

| Layer | Choice | Why |
|---|---|---|
| Backend framework | **Fastify** | Matches your existing toolset; plugin architecture maps cleanly onto the modular-domain folders below |
| Frontend | **React + Vite** | Minimal build tooling, deploys to Vercel with zero configuration |
| LLM | **Gemini 2.5 Flash-Lite** (or your OpenAI equivalent) | Cheapest standard-tier model — see cost math §4.7 |
| Database | **Neon Postgres** | Free forever, not a 30-day trial; scale-to-zero instead of hard deletion |
| Rate limiting | **In-memory, via `@fastify/rate-limit`** | Legitimate because Render's process persists between requests |
| Budget cap | **Hard cap in the LLM provider console** | The real backstop |
| Hosting | **Render (backend) + Vercel (frontend)** | Each platform doing what it's strongest at — Vercel for static/edge frontend delivery, Render for a persistent Node process |

### 4.3 Folder Structure

```
pinfohealth-ai/
├── backend/                           # deploys to Render
│   ├── src/
│   │   ├── server.js                  # Fastify bootstrap, CORS, /health
│   │   ├── config.js                  # ALL env var access — nowhere else
│   │   ├── db.js                      # Neon connection pool (SSL required)
│   │   ├── modules/
│   │   │   ├── chat/
│   │   │   │   ├── chat.routes.js
│   │   │   │   ├── chat.service.js    # sliding window + LLM call + streaming
│   │   │   │   └── prompts.js         # persona + guardrails + Socratic rules
│   │   │   ├── safety/
│   │   │   │   └── crisis-check.js
│   │   │   └── impact/
│   │   │       ├── impact.routes.js
│   │   │       └── impact.repository.js
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
│   │   └── lib/api.js
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── .env.example
├── docs/
│   └── MASTER_PLAN.md
└── AGENTS.md
```

### 4.4 Deployment — three independent pieces, three independent setups

**Neon (do this first — the backend needs the connection string before it can start):**
1. Create a free project at neon.tech. Copy the pooled connection string.
2. Run the migration in `backend/db/migrations/001_create_impact_events.sql` against it (via the Neon SQL editor, or `psql`).
3. Keep the connection string handy for the Render env var below.

**Render (`backend/render.yaml`):**
```yaml
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
        sync: false          # set manually in the Render dashboard
      - key: DATABASE_URL
        sync: false          # the Neon connection string, set manually
      - key: ALLOWED_ORIGIN
        value: https://pinfohealth-app.vercel.app   # update once the Vercel URL is known
```
`DATABASE_URL` and `GEMINI_API_KEY` are marked `sync: false` deliberately — they're secrets, not committed to git, and Render prompts you for them the first time you deploy the Blueprint.

**Vercel (`frontend/vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```
Set `VITE_API_URL` (the Render backend's URL) in the Vercel project's Environment Variables — Vite env vars are baked in at build time, so this must be set before the first deploy, not after.

**Deployment order matters:** Neon → Render (needs the Neon URL) → Vercel (needs the Render URL, and Render's `ALLOWED_ORIGIN` needs updating once the Vercel URL exists — expect one round-trip edit on Day 4).

### 4.5 Safety & Budget — four pillars

1. **Sliding-window context** — never more than the last 6 messages to the LLM.
2. **In-memory per-IP rate limiting** — `@fastify/rate-limit`, legitimate on Render's persistent single instance.
3. **Hard budget cap at the provider** — the real backstop.
4. **Hardcoded crisis bypass** — see §3.3.

**New in this revision:** CORS is no longer a nice-to-have. Frontend and backend now live on genuinely different domains (a `.vercel.app` and a `.onrender.com` URL), so every request is cross-origin by definition. `ALLOWED_ORIGIN` must be set correctly and narrowly (never `*`) or the frontend simply won't be able to talk to the backend at all — this will surface immediately in testing, not silently later, which is the right failure mode to have.

### 4.6 Impact Measurement

One table, insert-only, on Neon:

```sql
CREATE TABLE IF NOT EXISTS impact_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('session_started','message_sent','feedback_yes','feedback_no')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Neon connections require SSL — the pool config in `backend/src/db.js` needs `ssl: { rejectUnauthorized: false }` (or Neon's recommended pooled-connection settings) or every query will fail outright, immediately and obviously, on first run.

For your submission numbers:
```sql
SELECT event_type, COUNT(*) FROM impact_events GROUP BY event_type;
```

This survives Render's backend sleeping and Neon's compute scaling to zero — both wake automatically on the next request, and the data underneath was never in-memory to begin with.

**Optional bonus layer:** since the frontend is now on Vercel, you get Vercel Web Analytics for free on page views/visits — a second, independent traffic signal you can screenshot alongside the Postgres counts. Not required, but it's sitting there unused if you want it.

### 4.7 Cost Math

A single turn: roughly ~500 tokens of system prompt + sliding-window history in, ~250 tokens of reply out. At Gemini 2.5 Flash-Lite's published rate (~$0.10/M input, ~$0.40/M output), that's well under $0.0005 per exchange — $5 funds **several thousand** turns, not "hundreds." Compute your real number once the prompt is locked, and make sure genuine paid spend shows on the billing dashboard before you screenshot it.

### 4.8 The $0 → Scale Path

Three independent levers now, one per service:

| If this happens | Do this | Code changes needed |
|---|---|---|
| Backend spin-down annoys judges/users | Upgrade Render backend to Starter ($7/mo) | None — plan change only |
| Neon free limits hit (0.5 GB storage or 100 compute-hours/month) | Move to Neon's Launch plan, usage-based, no minimum | None |
| Project needs to look commercial / needs team seats | Upgrade Vercel to Pro | None |
| Judging window is coming, want to kill the Render cold start for that window only | Ping `/health` every ~10 minutes via a free scheduler during the demo period | None |
| Want accounts or persistent chat history later | Add tables to the Neon database already provisioned | No new infra, just migrations |

---

## 5. Organizing / Distribution Plan

Run this deliberately on Days 5–6:

1. **Personal seed asks.** Message ~10–15 specific classmates or org-mates directly, not a cold group post, asking for one honest reaction.
2. **One or two targeted group-chat shares.** A direct call to action ("2 minutes, tap Yes/No at the end"), with a trackable link if you can manage one.
3. **Testimonial capture.** Ask 3–5 testers if you can quote their reaction — this doubles as Organizing and Documentation evidence.

---

## 6. Day-by-Day Plan (risk-ordered)

| Day | Focus |
|---|---|
| 1 | Create Neon project + run the migration. Create Render account, backend Fastify skeleton, streamed Gemini call working locally. Set the hard budget cap in the provider console immediately. |
| 2 | Build the crisis pre-filter + finalize the system prompt. Deliberately try to break it. |
| 3 | Frontend chat UI (Vite/React): landing, disclaimer, streaming render, typing indicator, client-side sliding-window state. |
| 4 | Deploy all three pieces: Neon (already live), Render backend via `render.yaml`, Vercel frontend via `vercel.json`. Update `ALLOWED_ORIGIN` on Render once the Vercel URL is known. Confirm the four impact events land in Neon across a manual Render sleep/wake cycle. |
| 5 | Round 1 real-user testing: 5–10 close testers. Watch for the Render cold-start delay specifically; add a "waking up, first message may take a bit" loading state if it's jarring. |
| 6 | Distribution push (§5) + monitor the Neon event counts + collect testimonials. |
| 7 | Buffer. Set up a keep-alive ping for your judging window if needed. Finalize documentation, screenshots, repo cleanup, write the reflection, submit. |

---

## 7. Evidence & Submission Checklist

- [ ] Live Vercel URL (frontend)
- [ ] Public (or judge-shared) repo link
- [ ] Screenshot of the `impact_events` count query, run against Neon
- [ ] LLM provider billing dashboard screenshot showing real dollars spent
- [ ] Render dashboard screenshot showing the backend service deployed and live
- [ ] (Optional) Vercel Analytics screenshot as a second traffic signal
- [ ] 2–3 anonymized tester reactions
- [ ] Short screen recording or GIF of the app in use
- [ ] README section explicitly naming the safety design (crisis redirect, guardrails)

---

## 8. Reflection Scaffold

Answer honestly once you have real data:

- What actually broke or surprised you technically? (A CORS misconfiguration on first cross-origin deploy is a genuinely common, genuinely honest answer here if it happened.)
- What was your real measured cost-per-session vs. §4.7's prediction?
- What's the one drop-off point your `impact_events` numbers showed?
- What would you build with $50 instead of $5? Use the §4.8 scaling path you already designed for.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM cost overrun | Hard cap at provider (primary) + rate limiter (secondary) |
| Crisis message mishandled | Hardcoded pre-filter bypass — never solely LLM judgment |
| CORS misconfigured between Vercel and Render | Set `ALLOWED_ORIGIN` explicitly on Day 4, test cross-origin immediately after both are deployed, not later |
| Render cold-start delay during live judging | Keep-alive ping during the demo window only (§4.8) |
| Neon connection fails silently | It won't fail silently — missing SSL config fails loudly and immediately on first query, which is the safer failure mode; just don't skip `ssl: { rejectUnauthorized: false }` in `db.js` |
| Low real-user turnout | Personal outreach over cold broadcast (§5) |
| Late-breaking deploy issues | All three services deployed and cross-tested by Day 4, not Day 7 |

---

## 10. Suggested Tightening of Your Application Answers

- **Q3 ($5 spend):** swap "hundreds" for the computed figure from §4.7 once you have it.
- **Q4 (tech stack):** replace "high-concurrency Node.js backend" with: "a Node.js (Fastify) API on Render, a React frontend on Vercel, and a Neon Postgres instance for anonymous impact metrics — three free-tier services, each independently deployed."
- **Q8 (what could go wrong):** add the crisis-disclosure case, the cold-start UX risk, and (new) the cross-origin CORS risk — naming all three shows you designed around real failure modes, not hypothetical ones.

---

**Next step:** confirm this architecture, and we start Day 1 — Neon project first, since the backend needs that connection string before anything else can run.