# Contributing to PinfoHealth AI

Thank you for your interest in contributing! This project is built for positive impact — we welcome thoughtful improvements.

## Quick Start

```bash
# Backend
cd backend
npm ci
cp .env.example .env   # fill in GEMINI_API_KEY, DATABASE_URL
npm run dev

# Frontend
cd frontend
npm ci
cp .env.example .env   # set VITE_API_URL
npm run dev
```

## Pull Request Process

1. **Fork** the repo and create a feature branch
2. **Write tests** for new logic (unit + integration where applicable)
3. **Run the full test suite**: `cd backend && npm test`
4. **Ensure CI passes**: `npm audit --audit-level=high` (no high/critical findings)
5. **Open a PR** with a clear description of the change and why

### PR Requirements
- All tests pass (95+ backend tests)
- No new high/critical npm audit findings
- Lint passes (if configured)
- Commit messages follow conventional format: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`

## Code Style

- **ES Modules** (`type: "module"` in package.json)
- **ESLint** (if configured) + Prettier
- **No secrets** in code — use `.env` (gitignored) or Render Secret Files
- **Defensive coding**: validate inputs, redact logs, fail fast

## Security

- Never commit `.env`, `system-prompt.txt`, or any secrets
- Report vulnerabilities privately: see [SECURITY.md](SECURITY.md)
- All model output is validated via AJV schemas before sending to client

## Testing

```bash
cd backend
npm test           # runs vitest (unit + integration)
```

Add tests in `backend/test/`:
- `unit/` — pure functions (validation, parsing, schemas)
- `integration/` — API endpoints via `app.inject()`

## Branching

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready, protected |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation only |

## License

By contributing, you agree your contributions will be licensed under the [MIT License](LICENSE).