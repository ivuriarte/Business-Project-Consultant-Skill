# Security Audit Report — Frank AI Agent
**Audit type:** OWASP Top 10 + STRIDE threat model + dependency scan  
**Auditor:** cybersecurity-analyst skill (Skills.sh)  
**Date:** 2026-05-13  
**Scope:** `agent/` — all API routes, middleware, Redis layer, GitHub export, CSP/headers  
**Commit baseline:** post A-C7 (48 tests)  
**Outcome:** 3 findings fixed in this audit; 0 Critical, 0 High remain open

---

## CIA Triad Summary

| Property | Assessment | Notes |
|---|---|---|
| **Confidentiality** | ✅ Good | No PII in logs; tokens never persisted; sessions isolated by ID |
| **Integrity** | ✅ Good | Zod validates all tool parameters; value_score recomputed server-side; stage enum enforced |
| **Availability** | ✅ Good | Fail-open rate limits; health probe exposes Redis status; 30-day session TTL |

---

## OWASP Top 10 Assessment

### A01 — Broken Access Control
**Status: ⚠ Medium (accepted)**  
Sessions are isolated by `sessionId` only (no auth). Any client that knows a session ID can read or replay it. This is an accepted risk for the Alpha phase — no PII is stored in sessions, only structured backlog data. Mitigation path: user auth (Beta blocker).

`/api/session/[id]` `PATCH` (admin) requires `X-Admin-Secret` header.  
**Fix applied (SEC-02):** Secret comparison upgraded from `===` to constant-time (`constantTimeEqual`) to prevent timing-oracle attacks.

### A02 — Cryptographic Failures
**Status: ✅ Pass**  
HSTS with `max-age=63072000; includeSubDomains; preload` enforced. All data in transit over TLS via Vercel. No plaintext secrets in code. Redis credentials from environment only. GitHub PAT transmitted in POST body over TLS; never logged or stored.

### A03 — Injection (Prompt Injection + XSS)
**Status: ✅ Pass**  
**Prompt injection surface:** User messages are forwarded to GPT-4o as `CoreMessage[]` from the Vercel AI SDK — they never concatenate into the system prompt string. The system prompt is built from `session.stage` (server-controlled enum) only. Model tool call parameters are fully validated by Zod before being saved to Redis, so a model hallucinating malformed data is rejected at the schema boundary.  
**XSS:** `frame-ancestors 'none'` + `X-Frame-Options: DENY` block clickjacking. CSP `script-src 'self'` blocks inline script injection. `react-markdown` renders user-originated content but is sandboxed by the CSP.  
**Dependency note:** `jsondiffpatch` (transitive via `ai@4.x`) has a moderate XSS CVE in its HTML formatter — Frank never uses `HtmlFormatter`, so this is unexploitable in the current codebase. Tracked for upgrade.

### A04 — Insecure Design
**Status: ✅ Pass**  
Rate limits on chat (20 req/min) and export (5 req/hr) per IP.  
**Fix applied (SEC-06):** New rate limit added — session creation capped at 5 new sessions/hour/IP, preventing session explosion and GPT-4o cost abuse. Existing sessions bypass this check (only fires on `getSession() === null`).

### A05 — Security Misconfiguration
**Status: ✅ Pass (1 fix applied)**  
7 security headers set globally via `next.config.ts`.  
**Fix applied (SEC-05):** `X-DNS-Prefetch-Control` changed from `on` to `off`. DNS prefetching can leak URLs from private/internal pages to external DNS resolvers — disabling it is the secure default for web apps.  
Full header inventory post-fix:

| Header | Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Clickjacking prevention |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing prevention |
| `X-DNS-Prefetch-Control` | `off` | DNS leak prevention ✅ fixed |
| `Referrer-Policy` | `strict-origin-when-cross-cross-origin` | Referrer leakage control |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Permission denial |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |
| `Content-Security-Policy` | see below | XSS/injection defence |

CSP:
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: https:; font-src 'self';
connect-src 'self' https://va.vercel-insights.com; frame-ancestors 'none'
```
`style-src 'unsafe-inline'` is required by Tailwind CSS at runtime. Acceptable risk.

### A06 — Vulnerable and Outdated Components
**Status: ⚠ Moderate (tracked, not blocking)**  
`npm audit` results:

| Package | Severity | CVE | Exploitable in Frank? |
|---|---|---|---|
| `jsondiffpatch` (via `ai@4.x`) | Moderate | XSS in HtmlFormatter | **No** — Frank never uses HtmlFormatter |
| `ai@4.x` | Low | File type whitelist bypass | **No** — Frank has no file upload feature |
| `postcss` (via `next@16.x`) | Moderate | XSS via unescaped `</style>` | **No** — PostCSS runs at build time only, not runtime |

All 3 CVEs are **unexploitable** in Frank's current feature set. Upgrading `ai` to v6 (the fix) is a semver-major breaking change and is tracked as a Beta task. No action required for Alpha.

### A07 — Identification and Authentication Failures
**Status: ⚠ Medium (accepted, Alpha)**  
No user authentication. Sessions are anonymous, identified only by nanoid(10) session ID. Acceptable for Alpha; a Beta blocker.

### A08 — Software and Data Integrity Failures
**Status: ✅ Pass**  
All model tool call parameters validated by Zod schemas before Redis write. `value_score` is recomputed server-side from source fields — the model cannot inject a fabricated score. No `eval`, `Function()`, or `dangerouslySetInnerHTML` in codebase.

### A09 — Security Logging and Monitoring Failures
**Status: ✅ Pass (with known gap)**  
Structured JSON logs on all routes: `chat_request`, `export_request`, `export_start`, `export_complete`, `export_partial_failure`, `ratelimit_unavailable`. No PII (IP removed from warn logs). Known gap: no log drain/alerting configured (tracked in tech debt register as operational readiness item).

### A10 — Server-Side Request Forgery (SSRF)
**Status: ✅ Pass**  
The only external HTTP call from server code is to `https://api.github.com` with a path constructed from validated `owner`/`repo` inputs. Both fields are validated against `/^[a-zA-Z0-9_.-]+$/` before use — path traversal and URL injection are blocked at input validation.

---

## STRIDE Threat Model Summary

| Threat | Surface | Mitigation |
|---|---|---|
| **Spoofing** | Admin PATCH endpoint | Constant-time secret comparison (SEC-02) |
| **Tampering** | Model tool call params | Zod schema validation + value_score recompute |
| **Repudiation** | All routes | Structured JSON audit logs |
| **Info Disclosure** | Session data | Session ID required; no auth = any ID is readable (accepted Alpha risk) |
| **Denial of Service** | Chat, export, session creation | Rate limits: 20 req/min chat, 5 req/hr export, 5 new sessions/hr (SEC-06) |
| **Elevation of Privilege** | Admin PATCH | Secret header + constant-time compare; no privilege beyond session update |

---

## Findings Summary

| ID | Severity | Title | Status |
|---|---|---|---|
| SEC-01 | Medium (accepted) | No user auth — sessions readable by session ID | Open — Alpha accepted risk |
| SEC-02 | Low → Fixed | ADMIN_SECRET compared with `===` (timing oracle) | **Fixed** — constant-time compare |
| SEC-03 | Moderate (unexploitable) | jsondiffpatch XSS CVE (HtmlFormatter) | Tracked — not exploitable |
| SEC-04 | Moderate (unexploitable) | postcss XSS CVE (build-time only) | Tracked — not exploitable |
| SEC-05 | Low → Fixed | `X-DNS-Prefetch-Control: on` (DNS leak risk) | **Fixed** — set to `off` |
| SEC-06 | Medium → Fixed | No rate limit on session creation (cost abuse / session explosion) | **Fixed** — 5 new sessions/hr/IP |
| SEC-07 | Low (accepted) | No log drain / alerting | Open — operational readiness |
| SEC-08 | Low (accepted) | `style-src 'unsafe-inline'` in CSP (Tailwind requirement) | Accepted — Tailwind dependency |

**Critical:** 0 | **High:** 0 | **Medium:** 1 fixed, 1 accepted | **Low:** 2 fixed, 2 accepted

---

## Next Security Review Triggers
- When user auth is added (A07 re-evaluate)
- When file upload is added (A06 `ai@4.x` file-type CVE becomes exploitable)
- When `ai` major version upgrade is available and tested
