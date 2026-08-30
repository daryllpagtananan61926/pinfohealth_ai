# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅        |

## Reporting a Vulnerability

**Do not open public issues for security vulnerabilities.**

Instead, report them privately via one of these channels:

1. **GitHub Private Vulnerability Reporting** (preferred)
   - Go to the **Security** tab → **Report a vulnerability**
   - Only maintainers can see the report

2. **Email**
   - Send details to: **security@pinfohealth.example** (replace with your actual contact)

We will:
- Acknowledge within **72 hours**
- Provide a preliminary assessment within **7 days**
- Coordinate a fix and disclosure timeline with you

## Public Disclosure Timeline

| Step | Target |
|------|--------|
| Acknowledgment | ≤ 72 hours |
| Initial assessment | ≤ 7 days |
| Fix development | ≤ 30 days (varies by severity) |
| Coordinated disclosure | After fix released |

## Security Features in This Project

- **Server-side input validation** on all API endpoints
- **Model output filtering** with JSON Schema validation (AJV)
- **Security headers** via `@fastify/helmet` (CSP, HSTS, frame options, etc.)
- **Structured logging** with PII redaction (session IDs, messages, credentials)
- **Crisis interception** before LLM call (keyword-based, failsafe)
- **Rate limiting** (20 req/hr/IP on chat endpoint)
- **Strict CORS** (single explicit origin, no wildcards)
- **System prompt secrecy** (loaded from Render Secret File, never in git)
- **Privacy-safe analytics** (no session IDs, 90-day retention, hour-bucket aggregation)
- **Tests** covering validation, crisis detection, UI parsing, and API contracts

## Out of Scope

- Client-side security (browser CSP, XSS) — defense-in-depth only
- Infrastructure security (Render, Vercel, Neon platform configs)
- Social engineering / phishing targeting users