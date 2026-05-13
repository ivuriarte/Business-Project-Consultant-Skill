# Contributing to Frank — AI Product Strategist

Thank you for using Frank and for considering an improvement. Contributions are welcome across all three layers: the AI agent, the Copilot skill, and the CLI scripts.

---

## Ways to Contribute

| Type | Examples |
|---|---|
| **Agent bug fix** | Route error, UI regression, Redis edge case, tool calling failure |
| **Agent feature** | New export destination, new stage, new AI capability |
| **Prompt improvement** | Better Business Intent questions, clearer backlog instructions, tighter value scoring |
| **Script bug fix** | A CLI script crashes on certain input, output formatting is broken |
| **New framework** | Adding a new analysis framework to `references/` |
| **Documentation** | Clearer README, better examples, updated setup guide |

---

## How to Submit a Change

1. **Fork or copy** this repository to your own machine
2. **Make your change** in the relevant file
3. **Test it** — if you changed an agent route, run `npm test`; if you changed a script, run it end-to-end
4. **Update `CHANGELOG.md`** — add a new entry under the correct version bump
5. **Open a PR** or send a diff to the skill author

---

## Agent Contribution Guidelines (`agent/`)

When modifying the Next.js agent:

- **TypeScript strict mode.** No `any` types unless unavoidable. Run `npx tsc --noEmit` before submitting.
- **Tests are required.** If you add a route or modify a route's behavior, add or update the corresponding test in `__tests__/routes/`. Run `npm test` and confirm all 45 tests pass.
- **Edge runtime only.** All API routes must include `export const runtime = 'edge'`. Do not use Node.js-only APIs.
- **Zod validation at every boundary.** All inputs to route handlers must be validated with Zod before any processing.
- **No PII in logs.** Do not log IP addresses, GitHub tokens, user content, or session data. Use structured JSON log format: `{ event, sessionId, ... }`.
- **Rate limiting is fail-open.** Do not change `chatRatelimit`/`exportRatelimit` to fail-closed — availability takes priority.
- **Session key format is `session:<id>`.** Do not change the key format without a migration plan.

---

## Script Contribution Guidelines (`scripts/`)

When adding or modifying a Python script:

- **Python 3.8+ only.** No external libraries — standard library only.
- **Follow the existing style:** ANSI color helpers (`C.BOLD`, `C.CYAN`, etc.), `header()`, `ask()`, `info()`, `success()` functions.
- **Interactive flow:** Every script must be fully terminal-driven with clear prompts. No silent failures.
- **Output both `.md` and `.json`:** Every script saves a human-readable Markdown file and a machine-readable JSON file.
- **Include a `main()` function** with a `if __name__ == "__main__": main()` guard.
- **Test with edge cases:** Empty input, single-item backlog, very long text strings.

---

## Reference Document Guidelines

When adding or modifying a file in `references/`:

- Use Markdown tables for structured content
- Every framework must include: When to use, How it works, and at least one concrete example
- Keep language practitioner-friendly — avoid academic jargon
- If adding a new framework to `requirements_framework.md`, add it as a new numbered section

---

## SKILL.md Guidelines

The `SKILL.md` file is what GitHub Copilot reads to understand when and how to invoke this skill. When modifying it:

- Do not remove existing keyword triggers without a strong reason — colleagues may rely on them
- If adding new engagement modes, document them in the **Engagement Modes** section
- Update the `metadata.updated` date in the frontmatter
- Bump the `metadata.version` number according to the versioning guide in `CHANGELOG.md`

---

## Questions?

Reach out to the skill author directly with any questions before making large changes.
