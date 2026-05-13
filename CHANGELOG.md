# Changelog

All notable changes to Frank — AI Product Strategist are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

---

## [3.0.0] — 2026-05-14

### Changed — Rebrand: "Business & Project Consultant" → Frank

- **Product identity**: Renamed from "Business and Project Consultant" to **Frank — AI Product Strategist**. New tagline: *"From idea to backlog in minutes."* All UI surfaces, documentation, and repository metadata updated.
- **layout.tsx**: Title and `<meta description>` updated to new brand and tagline.
- **SKILL.md**: Description, keywords, category, and version updated to reflect Frank's identity and drop the BA/PM/PO framing.
- **README.md**: Full rewrite — new positioning, updated requirements (added `ADMIN_SECRET`), roadmap section added.
- **SECURITY.md**: Rewritten to cover the live AI agent's security model. The old "no network calls" statement is retired.
- **CONTRIBUTING.md**: Updated for agent-first development; TypeScript/Next.js contribution guidelines added alongside the original Python script guidelines.

### Added — Stream Resilience + Session Recovery (Technical, part of v4 internal release)
- **`save_checkpoint` tool** (`app/api/chat/route.ts`): Progressive epic checkpointing. The agent calls `save_checkpoint` after completing each Epic during backlog generation — a mid-stream disconnect no longer loses completed work. Calls `appendEpics` in the Redis layer.
- **`appendEpics` function** (`lib/redis.ts`): New Redis function for incremental epic persistence without a full session overwrite.
- **PATCH `/api/session/[id]`** (`app/api/session/[id]/route.ts`): Admin recovery endpoint. Accepts `X-Admin-Secret` header + `{ stage, clearEpics }` body. Allows manually unsticking a session locked in the wrong stage. Validates against `ADMIN_SECRET` env var.
- **`maxSteps` raised to 10** (`app/api/chat/route.ts`): Allows the agent to call `save_checkpoint` multiple times (one per Epic) before calling `persist_backlog`.

### Added — Route Integration Tests
- **`__tests__/routes/chat.test.ts`**: 8 tests — session validation, rate limiting, token cap, valid stream, fail-open.
- **`__tests__/routes/export.test.ts`**: 10 tests — field validation, session lookup, rate limiting, GitHub API failure, success.
- **`__tests__/routes/session.test.ts`**: 15 tests — GET, DELETE, PATCH (admin auth, stage validation, clearEpics). Total: **45 tests across 4 files**.

### Added — Monitoring + Reliability
- **Smoke test Slack alert** (`.github/workflows/smoke-test.yml`): If `SLACK_WEBHOOK_URL` is set as a GitHub secret, a POST is sent to the webhook on any production smoke test failure. Skips gracefully if the secret is absent.
- **Structured `warn` on `onFinish` token failure** (`app/api/chat/route.ts`): Token tracking failures now emit `{ event: 'token_tracking_failed', error }` rather than failing silently.

### Fixed
- **`appendMessages` Redis round-trips** (`lib/redis.ts`): Reduced from 3 to 2 round-trips. Direct `SET` replaces the old `getSession + updateSession` pattern.
- **`prompt_version` documented as forensic-only** (`lib/types.ts`): Comment updated — `buildSystemPrompt` does not branch on this value. It is recorded for audit trail purposes only.
- **CSP `connect-src` comment** (`next.config.ts`): Explains why `self` + `va.vercel-insights.com` is correct — OpenAI calls are Edge server-side and do not appear in browser CSP.
- **CI lint gate enforced** (`.github/workflows/ci.yml`): `--max-warnings 0` flag added; `npm test` step added. Failing tests now block the build.

---

## [2.0.0] — 2026-05-10

### Added — Idea → Agent (full AI agent, `agent/`)
- **Next.js 16 AI agent** (`agent/`): A fully deployable web application that transforms the Copilot skill into a production-grade AI agent usable by anyone — no Copilot, no terminal, no Python required.
- **Hard-gated Business Intent stage**: The agent enforces all three Business Intent Questions (Cost of Inaction, Stakeholder Value, Key Assumption) at the system-prompt level. It refuses to generate any Epic until all three are answered with substantive responses.
- **OpenAI GPT-4o with Vercel AI SDK v4**: Streaming multi-turn conversation via the Assistants-compatible `useChat` hook. Tool calling (`persist_backlog`) integrates directly with the session layer.
- **Upstash Redis session persistence** (`lib/redis.ts`): Every session has a unique shareable URL (`/?s=<id>`). Sessions persist for 30 days. Conversation history is stored and restored on reload, making sessions fully resumable and shareable with teammates.
- **Auto-scoring value matrix** (`lib/instructions.ts`): The agent automatically computes Business Value × User Impact × Feasibility scores from gathered context — users are never asked to score manually.
- **GitHub Issues export** (`app/api/export/github/route.ts`, `lib/github.ts`): One-click export creates a labeled GitHub Issue per User Story with full Acceptance Criteria, value score metadata, and phase/priority labels. Labels are created automatically in the target repo.
- **Backlog sidebar** (`components/BacklogPanel.tsx`): Live-updating panel shows stage progress, project name, all Epics with expandable story lists, and MVP story count. Updates automatically after each AI turn.
- **Export modal** (`components/ExportButton.tsx`): In-app GitHub export UI. Users enter owner, repo, and a Personal Access Token (never stored server-side). Displays created issue URLs on success.
- **Session share button**: Copies the session URL to clipboard so product managers or developers can open the same session in their own browser.
- **Greatest Value Prompt**: After full backlog generation, the agent outputs a production-ready, copy-paste developer prompt for the highest-scoring story in a structured format (Context, Story, Functional Requirements, AC, NFRs, Out of Scope, Definition of Done).

### Changed
- `SKILL.md` updated to reference the `agent/` web application as the primary interface. CLI scripts remain as Option B for permanent file outputs.
- `README.md` updated with agent setup instructions and revised folder structure.

---

## [1.3.0] — 2026-04-28

### Added
- **GitHub Issues export** (`idea_to_backlog.py`): `save_outputs()` now generates a `*-github-issues-{ts}.md` file alongside the backlog. Each User Story becomes a copy-paste GitHub Issue block with Title, Labels (`must-have`, `mvp`, `effort:m`, etc.), and a structured Body (User Story + AC in Markdown). Includes a `gh issue create` CLI hint.
- **Business intent pre-fill from `--from-requirements`** (`idea_to_backlog.py`): `load_requirements_prefill()` now extracts `cost_of_inaction` (from Business Risk requirement), `stakeholder_value` (from Stakeholder Need requirement), and `key_assumption` (from first assumption in the assumptions list). These pre-fill the three Business Intent coaching questions in STEP 1b, eliminating re-entry across the full pipeline.
- **Business Intent block uses `_ask()` for pre-fill**: The three coaching questions in `intake_project()` now support the same "Loaded from requirements / Press Enter to use this" pattern as the main intake questions.

### Fixed
- **`elicit_context()` Section 1 missing nudge**: `project_context`, `target_users`, and `primary_goal` now pass through `nudge_if_vague()`. Previously Section 1 free-text answers had no quality check — the nudge was only applied in Section 2 onwards.

---

## [1.2.0] — 2026-04-28

### Added
- **Business Intent Coaching block** in `idea_to_backlog.py` (`intake_project()`): Three non-skippable questions — Cost of Inaction, Stakeholder Value, Key Assumption — surface business thinking for developers with no BA background before a single Epic is created. These fields are written to the backlog Markdown ("Business Intent" section), the backlog JSON (`business_intent` object), and the Greatest Value Prompt ("Business Context" block).
- **SKILL.md chat mode rule**: Agent now requires answers to all three Business Intent questions before generating any features or epics. Includes a rebuttal script for users who push back ("just give me the backlog"). This enforces the "why before what" principle in Copilot chat mode.

---

## [1.1.0] — 2026-04-28

### Added
- **Pipeline connection** (`--from-requirements`, `--from-backlog` flags): `idea_to_backlog.py` and `project_planner.py` now accept upstream JSON output to pre-fill project context, eliminating re-entry across the three-script workflow
- **AC hints with examples**: `collect_ac()` now shows inline GIVEN/WHEN/THEN examples (`e.g. 'I am on the login page'`) and a personalized suggested first criterion built from the story's actor, action, and outcome
- **Save confirmation**: All three scripts prompt "Ready to save?" before writing any files — users can review the summary and cancel cleanly
- **Mermaid render instructions**: `project_planner.py` prints render guidance (mermaid.live, GitHub .md, Notion, GitLab) after saving the plan
- **"Two Ways to Use" README section**: Distinguishes Copilot chat usage (Option A) from CLI scripts (Option B) with guidance for new users
- **Backlog stories guide in phase planner**: `build_phase()` displays stories from the loaded backlog assigned to each phase as a reference before feature entry
- **Dynamic pipeline tip**: `requirements_elicitor.py` DONE block now prints the actual saved JSON filename in the `--from-requirements` command instead of a `<placeholder>`

### Fixed
- **NFR rationale missing**: `elicit_non_functional_requirements()` was passing the source category name as the rationale field instead of calling `resolve_rationale(source)`. All NFRs now have meaningful, context-appropriate rationale sentences in the output document
- **`confirm_phases()` ellipsis**: Always-appended `...` to story text in the phase review step regardless of text length — now conditional on `len(text) > 60`
- **Nudge threshold**: Reduced vague-answer threshold from 15 to 10 characters in all three scripts
- **`so that so they` double conjunction**: Stripped leading `so that` / `so` prefix from story outcomes via `re.sub` — the `full_text` template adds it back correctly
- **Gantt sequential features**: `running_date` now advances per feature within each phase instead of all features starting on the same day
- **Duplicate AC block in Greatest Value Prompt**: Collapsed two redundant acceptance criteria sections into one numbered list

---

## [1.0.1] — 2026-04-27

### Fixed
- `SKILL.md` and `README.md`: Changed all `python scripts/...` references to `python3 scripts/...` to ensure macOS/Linux compatibility
- `README.md`: Clarified Windows PowerShell install path to specify running from the cloned repository folder
- `README.md`: Clarified that script output files are saved to the current working directory (not inside `scripts/`)

### Added
- `scripts/idea_to_backlog.py`: `argparse` `--help` and `--version` flags; `SKILL_VERSION` constant stamped into all output files; absolute file paths printed on save; `KeyboardInterrupt` handling with clean exit message; UTF-8 encoding on all file writes
- `scripts/requirements_elicitor.py`: Same improvements as above
- `scripts/project_planner.py`: Same improvements as above
- `examples/sample-backlog.json`: JSON output sample for `idea_to_backlog.py`
- `examples/sample-requirements.json`: JSON output sample for `requirements_elicitor.py`
- `examples/sample-project-plan.json`: JSON output sample for `project_planner.py`
- `SECURITY.md`: Security policy documenting local-only execution model and vulnerability reporting process
- `.python-version`: Minimum supported Python version (`3.8`)
- `Makefile`: Convenience targets `make requirements`, `make backlog`, `make plan`, `make check`, `make clean`
- `.gitignore`: Prevent generated output files and OS/editor artifacts from being committed

---

## [1.0.0] — 2026-04-27

### Added
- `SKILL.md` — Full skill definition for GitHub Copilot with keyword triggers, engagement modes, and output checklist
- `scripts/idea_to_backlog.py` — Interactive wizard: converts raw idea into a prioritized backlog with Epics, User Stories, Acceptance Criteria, and Greatest Value Prompts
- `scripts/requirements_elicitor.py` — Guided Q&A wizard that captures Business, Functional, Non-Functional, Constraint, and Assumption requirements
- `scripts/project_planner.py` — Phased development plan builder with Mermaid Gantt chart output
- `references/brd_template.md` — Business Requirements Document template
- `references/backlog_structure.md` — Epic/Story/AC templates and Greatest Value Prompt formatting guide
- `references/requirements_framework.md` — 9 analysis frameworks: 5 Whys, JTBD, As-Is/To-Be, MoSCoW, Value Scoring Matrix, Kano Model, Stakeholder Grid, Scope Box, Feasibility Assessment
- `README.md` — Installation guide, script usage, key concepts
- `CHANGELOG.md` — This file
- `CONTRIBUTING.md` — Contribution guidelines
- `LICENSE` — MIT License
- `examples/` — Sample outputs from all three scripts using a fictional invoice management app

---

## Versioning Guide (for future updates)

| Change Type | Version Bump | Example |
|---|---|---|
| New script or major new feature | MAJOR or MINOR | Adding a new wizard script → `1.1.0` |
| New framework in references | MINOR | Adding a new analysis framework → `1.1.0` |
| Bug fix in a script | PATCH | Fixing a script crash → `1.0.1` |
| Documentation update only | PATCH | Improving README → `1.0.1` |
| Breaking change to skill triggers | MAJOR | Restructuring SKILL.md engagement modes → `2.0.0` |
