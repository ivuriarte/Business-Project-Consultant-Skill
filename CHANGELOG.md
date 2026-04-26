# Changelog

All notable changes to the Business and Project Consultant skill are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

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
