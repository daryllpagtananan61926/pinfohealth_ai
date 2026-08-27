# DoGoodie $5 Impact Hack — Final Submission

> **Project:** PinfoHealth AI — *One calm question at a time.*
> **Live URL:** [FILL IN — deployed frontend URL]
> **Repo:** [FILL IN — GitHub URL]
>
> 📌 **Before submitting:** replace the two `[FILL IN]` spots (URL + impact numbers from the query below).

---

## Section 2: The Execution & Tech Layer

### What did you actually do with the $5?

Built a deployed, production-ready AI wellness companion on a $5 seed budget (free tiers did the heavy lifting):

- **Problem:** Students need a zero-stigma, no-signup, always-available mental-health first step.
- **Safety first:** Crisis pre-filter runs **before** the LLM → verified NCMH helpline numbers, no LLM call, no logging. Server-side sliding window (6 msgs), rate limiting, single-origin CORS, **zero message storage**.
- **Backend (Fastify):** `/api/chat` (SSE streaming), `/api/feedback`, `/api/ui-event`, `/api/impact-summary`, `/health`.
- **Frontend (React + Vite):** calm landing, streaming chat, dark mode, responsive.
- **Generative UI (differentiator):** AI renders interactive tools inline — box breathing, 5-4-3-2-1 grounding, micro-habit "Done" card, mood check-in, quick polls → "not just a chatbot."
- **Takeaway Card:** downloadable PNG of the one micro-step → tangible artifact, not a transcript.
- **Measured impact from day one:** anonymous event counters in Postgres.
- **Deployed 3 services**, MIT open-source.

**Tech keywords:** Node.js 20 · Fastify · React 18 · Vite · Neon (Postgres) · Google Gemini · SSE · html2canvas · React Router.

### Who benefited?

- ✅ A person/people — private, judgment-free ear
- ✅ A community — university students
- ✅ A cause — student mental health & de-stigmatizing help-seeking

---

## Section 3: The Results & Receipts

### Measurable impact (hard numbers)

All counters are anonymous, straight from the database:

| Metric | Meaning | Count |
|---|---|---|
| `session_started` | Sessions begun | [FILL IN] |
| `message_sent` | AI exchanges completed | [FILL IN] |
| `feedback_yes`/`feedback_no` | "Did this help you reset?" | [FILL IN] |
| `ui_breathing_complete` | Breathing **completed** | [FILL IN] |
| `ui_habit_done` | Micro-steps **marked done** | [FILL IN] |
| `ui_grounding_done` / `ui_mood_select` / `ui_poll_vote` | Other actions | [FILL IN] |

> ```sql
> SELECT event_type, COUNT(*) FROM impact_events GROUP BY event_type ORDER BY count DESC;
> ```

**Why it's evidence, not vanity:** completion counters (breathing *finished*, habit *done*) prove action, not clicks; Takeaway Card = visible concrete outcome; cost per session ≈ fractions of a cent.

### Proof to upload (no faces — none are captured by design)

1. `takeaway-card.png` — the strongest artifact (a real micro-step)
2. `impact-analytics.png` — Neon query results (the receipt)
3. `chat-with-ui.png` — generative UI rendered inline ("not just a chatbot")
4. `landing.png` — optional

### Proof links

- **Live URL:** [FILL IN]
- **Live impact dashboard:** [FILL IN] `/impact` — self-updating counters, no auth
- **Impact API (raw JSON):** [FILL IN] `/api/impact-summary`
- **GitHub repo:** [FILL IN] (public)

### What does the proof show?

Live dashboard = real numbers from the DB (no fakes possible) · repo = production code + safety layer + README · live URL = working deployment · takeaway card = real user output.

### Can this proof be shown publicly?

**Yes, share away!** Open source, zero personal data, crisis-safe. Only caveat: use a fresh demo session for chat screenshots.

---

## Section 4: Reflection & The Future

### What did you learn + what would you do with $500?

**Worked:** Socratic (question → one tiny action) feels safe & human · safety-first shaped architecture & trust · generative UI = biggest novelty win · measuring from day one = judge-ready evidence.

**Failed/learned:** LLM cold-start latency · resisting "advice mode" takes prompt discipline · honest impact is hard (completion > clicks) · $5 forces cheap-model trade-offs (paid reliability is first purchase).

**With $500, in order:**
1. **Pilot with real students** — measure pre/post stress via existing counters → stress-reduction story
2. **Partner with university guidance offices** — distribution = impact
3. **Localize crisis layer** — Taglish/Filipino (NCMH partner)
4. **Expand generative UI library** — evidence-based micro-interventions, each instrumented
5. **Buy reliability + ethical review** — paid LLM tier, mental-health professional sign-off

**$500 multiplier:** every feature is instrumented → iterate on *measured* impact, and MIT keeps it producing impact after the hack.

### Could the $5 have done more good another way?

Honest: direct donation = guaranteed immediate value (accepted opportunity cost). But the bet: **$5 → durable free tool** (near-zero marginal cost, ~1,000 sessions), **safety net built first** (never substitutes for care; routes vulnerable users to NCMH humans), and **evidence loop** (future dollars spent only on proven interventions). $5 as *seed*, not replacement giving — that's the defensible bet.

---

### Acknowledgments

Built for the **DoGoodie $5 Impact Hack** — impact over revenue.
Crisis resources: **NCMH Crisis Hotline — 1553 / 1800-1888-1553 / 0917-899-8727**, 24/7.