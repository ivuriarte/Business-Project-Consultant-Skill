# Changelog

All notable changes to the Business and Project Consultant skill are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

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
