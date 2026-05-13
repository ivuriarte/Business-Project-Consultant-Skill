# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.0.x   | ✅ Yes    |
| 2.0.x   | ✅ Yes    |
| 1.3.x   | ⚠️ Best-effort |
| < 1.3   | ❌ No     |

---

## Security Model

Frank is a **production AI agent** deployed on Vercel Edge Runtime. It makes outbound network calls to OpenAI and Upstash Redis, and optionally to the GitHub API. The "no network calls" statement in versions ≤ 1.3 applied only to the CLI scripts (`scripts/`) — it does not apply to the `agent/` web application.

---

## Agent Security Architecture

### API Security
- All API routes (`/api/chat`, `/api/export/github`, `/api/session/[id]`) run on Vercel Edge Runtime
- Input is validated with **Zod** at every endpoint boundary before any processing occurs
- Session IDs are validated against `/^[A-Za-z0-9_-]{8,32}$/` before any Redis lookup
- The `value_score` field is enforced via `.transform()` — the model cannot hallucinate scores outside the valid range

### Security Headers
Seven security headers are enforced on all responses via `next.config.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy`: default-src, script-src, style-src (with self + inline for Tailwind), connect-src (self + Vercel Analytics only — OpenAI is called server-side)

### Session Security
- Sessions are stored in Upstash Redis with a 30-day TTL
- Session keys are namespaced: `session:<id>` — no user data is indexed by user identity (pre-auth)
- Sessions are not auth-gated in Alpha. Any person with a session ID can read that session. **Do not put sensitive business data in a shared session link until auth is shipped (Beta).**
- The PATCH `/api/session/[id]` recovery endpoint requires `X-Admin-Secret` header matching the `ADMIN_SECRET` environment variable. This env var must be a high-entropy secret (≥ 64 hex characters).

### Rate Limiting
- Chat endpoint: **20 requests/minute** per IP (Upstash Redis sliding window)
- Export endpoint: **5 requests/hour** per IP
- Rate limiting **fails open** — if Redis is unavailable, requests are allowed through. This is intentional (availability over rate limit enforcement in degraded state).
- The IP address used for rate limiting is extracted from `x-forwarded-for`. It is **never logged** to avoid PII exposure.

### GitHub Token Handling
- GitHub Personal Access Tokens entered in the Export modal are **never stored server-side**. They are passed directly to the GitHub API in a single request and discarded.
- The server does not log, persist, or echo back any GitHub token value.
- A `GITHUB_TOKEN` environment variable can be set as a server-side fallback for export. If set, users do not need to enter a token. This variable must have `repo` scope only — do not use a token with org-level admin permissions.

### OpenAI Usage
- User messages are sent to the OpenAI API (GPT-4o) as part of the streaming chat flow. By using this application, users understand that message content is transmitted to OpenAI's API.
- No PII is explicitly requested or collected. System prompts do not instruct the model to request personal information.
- Prompt version is recorded on each session for forensic/audit purposes (`prompt_version` field in Redis). The model does not branch on this value.

### Prompt Injection Awareness
- Frank's system prompt instructs the model to maintain its role as a business consultant regardless of user instruction. However, no LLM-based system is immune to prompt injection.
- User input is not sanitized before being sent to the model (this is standard for chat applications). The attack surface is real.
- Planned: explicit injection-resistance hardening in Production Release phase.

### CI/CD Security
- The `ci.yml` workflow enforces linting (`--max-warnings 0`), type checking, tests, and build before any merge to `main`.
- GitHub Actions uses `VERCEL_OIDC_TOKEN` for deployment — no long-lived Vercel API keys are stored as secrets.
- The `smoke-test.yml` workflow runs on every production deployment and alerts via Slack webhook if the `/api/health` endpoint returns non-200.

### Python CLI Scripts (`scripts/`)
The three Python scripts (`requirements_elicitor.py`, `idea_to_backlog.py`, `project_planner.py`) use the Python standard library only. They make **no network calls**, require no API keys, and write output only to the local directory. The original security model applies to these scripts.

---

## Reporting a Vulnerability

Please report vulnerabilities **privately** rather than opening a public issue.

**Contact:** Open a [GitHub Security Advisory](https://github.com/ivuriarte/Business-Project-Consultant-Skill/security/advisories/new) on this repository.

We aim to respond to security reports within **72 hours** and ship a fix within **7 days** for any confirmed vulnerability.

## Out of Scope

- Vulnerabilities in OpenAI's API or model behavior (report to [openai.com/security](https://openai.com/security))
- Vulnerabilities in Upstash Redis infrastructure (report to [upstash.com](https://upstash.com))
- Vulnerabilities in Python itself (report to [python.org](https://www.python.org/news/security/))
- Vulnerabilities in GitHub Copilot or VS Code (report to [github.com/security](https://github.com/security))
