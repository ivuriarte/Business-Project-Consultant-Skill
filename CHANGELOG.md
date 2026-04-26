# Changelog

All notable changes to the Business and Project Consultant skill are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

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
