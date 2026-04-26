# Contributing to Business and Project Consultant

Thank you for using this skill and for considering an improvement. Contributions are welcome — whether it's fixing a bug in a script, adding a new analysis framework, improving documentation, or suggesting a new wizard.

---

## Ways to Contribute

| Type | Examples |
|---|---|
| **Bug fix** | A script crashes on certain input, output formatting is broken |
| **Improvement** | Better prompts in a wizard, clearer AC examples, smarter value scoring |
| **New framework** | Adding a new requirements or prioritization framework to `references/` |
| **New script** | A new interactive wizard (e.g. stakeholder mapper, risk register builder) |
| **Documentation** | Clearer README, better examples, translation |

---

## How to Submit a Change

1. **Fork or copy** this skill folder to your own machine
2. **Make your change** in the relevant file
3. **Test it** — if you changed a script, run it end-to-end and verify the output
4. **Update `CHANGELOG.md`** — add a new entry under the correct version bump
5. **Share it back** — send the updated folder (or a diff) to the skill author

---

## Script Contribution Guidelines

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
