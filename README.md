# Business and Project Consultant — Copilot Skill

A GitHub Copilot skill that gives developers the full structured thinking of a Business Analyst, Product Owner, and Project Manager — from a raw idea to a developer-ready backlog, phased plan, and actionable prompts.

**Author:** Ian Vince  
**Version:** 1.0.0  
**License:** MIT

---

## What It Does

Most developers receive either a vague vision ("I want an app like Airbnb but for tools") or a half-formed spec that skips the *why* and jumps to *what*. This skill bridges that gap by combining:

- **BA thinking** → What is the problem? What are the requirements?
- **PO discipline** → What goes in the backlog? What is the priority?
- **PM structure** → When does it get built? In what phases?

**Output:** A prioritized backlog (Epic → User Story → Acceptance Criteria), a requirements document, a phased project plan, and ready-to-paste developer prompts — all generated through guided interactive wizards.

---

## Requirements

- **GitHub Copilot** with agent/skill support enabled
- **Python 3.8+** (for the interactive scripts)
- No external Python libraries required — standard library only

---

## Installation

### Step 1 — Locate your skills folder

| OS | Path |
|---|---|
| macOS / Linux | `~/.agents/skills/` |
| Windows | `C:\Users\<YourName>\.agents\skills\` |

> If the `skills/` folder doesn't exist, create it.

### Step 2 — Copy this folder

Copy the entire `business-project-consultant/` folder into your skills directory:

**macOS / Linux:**
```bash
cp -r business-project-consultant/ ~/.agents/skills/
```

**Windows (PowerShell):**
```powershell
Copy-Item -Recurse business-project-consultant\ $env:USERPROFILE\.agents\skills\
```

### Step 3 — Verify in Copilot

Open VS Code with GitHub Copilot. In the Copilot chat panel, the skill will be available automatically. You can trigger it by describing your idea or asking things like:

- *"Help me define my app idea"*
- *"Turn this into a backlog"*
- *"Create user stories for my project"*
- *"Plan the development phases"*
- *"Give me a prompt to build this feature"*

---

## Folder Structure

```
business-project-consultant/
├── SKILL.md                          ← Skill definition (Copilot reads this)
├── README.md                         ← This file
├── CHANGELOG.md                      ← Version history
├── CONTRIBUTING.md                   ← How to contribute improvements
├── LICENSE                           ← MIT License
├── scripts/
│   ├── idea_to_backlog.py            ← Wizard: idea → backlog + developer prompts
│   ├── requirements_elicitor.py      ← Wizard: captures all requirement types
│   └── project_planner.py            ← Wizard: builds phased development plan
├── references/
│   ├── brd_template.md               ← Business Requirements Document template
│   ├── backlog_structure.md          ← Epic/Story/AC + prompt writing guide
│   └── requirements_framework.md    ← 9 analysis frameworks reference
└── examples/
    ├── sample-backlog.md             ← Sample output from idea_to_backlog.py
    ├── sample-requirements.md        ← Sample output from requirements_elicitor.py
    └── sample-project-plan.md        ← Sample output from project_planner.py
```

---

## The 3 Interactive Scripts

Run these from your terminal in any project directory. Each script saves its output as `.md` and `.json` files in the current directory.

### Recommended Order

```
1. requirements_elicitor.py   →   Understand the problem
2. idea_to_backlog.py         →   Build the backlog
3. project_planner.py         →   Plan the phases
```

---

### Script 1 — Requirements Elicitor

```bash
python scripts/requirements_elicitor.py
```

A guided Q&A that uncovers Business, Functional, Non-Functional, Constraint, and Assumption requirements from any idea. Prevents the most common mistake in software projects: building the wrong thing.

**Output files:**
- `<project-name>-requirements-<timestamp>.md`
- `<project-name>-requirements-<timestamp>.json`

**Time:** 15–30 minutes

---

### Script 2 — Idea to Backlog

```bash
python scripts/idea_to_backlog.py
```

An interactive wizard that takes your raw idea and produces a full prioritized backlog: Epics → User Stories → Acceptance Criteria. Automatically scores every story using the Value Scoring Matrix and outputs a **Greatest Value Prompt** — the single highest-ROI developer task, ready to paste into Copilot.

**Output files:**
- `<project-name>-backlog-<timestamp>.md`
- `<project-name>-greatest-value-prompt-<timestamp>.md`
- `<project-name>-backlog-<timestamp>.json`

**Time:** 10–20 minutes

---

### Script 3 — Project Planner

```bash
python scripts/project_planner.py
```

Builds a phased development plan (Discovery → MVP → Stabilization → Enhancement → Growth) with goals, feature lists, milestones, risks, decision points, and a Mermaid Gantt chart.

**Output files:**
- `<project-name>-project-plan-<timestamp>.md`
- `<project-name>-project-plan-<timestamp>.json`

**Time:** 15–25 minutes

---

## Key Concepts

### Greatest Value Prompt
Every story is scored on three dimensions to identify the highest-ROI task to build next:

```
Value Score = (Business Value × 0.40) + (User Impact × 0.35) + (Dev Feasibility × 0.25)
```

The top-scoring story is output as a structured, ready-to-paste developer prompt with full context, requirements, acceptance criteria, and a definition of done.

### MoSCoW Prioritization
Every story is labeled:
- **Must Have** — Without this, the app doesn't work
- **Should Have** — High value, ship in V1 if possible
- **Could Have** — Nice to have, V2 candidate
- **Won't Have (this time)** — Explicitly deferred

### GIVEN / WHEN / THEN
Every Acceptance Criterion uses the Gherkin format:
```
GIVEN [context], WHEN [action], THEN [outcome].
```

### 5 Development Phases
| Phase | Purpose |
|---|---|
| Discovery | De-risk the idea before writing code |
| MVP | Smallest version that proves core value |
| Stabilization | Harden what MVP revealed |
| Enhancement | Layer in Should Have features |
| Growth | Scale with Could Have features |

---

## References

The `references/` folder contains three standalone documents you can use without running any scripts:

| File | Use For |
|---|---|
| `brd_template.md` | Writing a formal Business Requirements Document |
| `backlog_structure.md` | Manual backlog writing with Epic/Story/AC templates |
| `requirements_framework.md` | 9 frameworks: 5 Whys, JTBD, MoSCoW, Kano, Value Scoring, and more |

---

## Examples

See the `examples/` folder for complete sample outputs from each script using a fictional invoice management app. Read these before running the scripts to understand what you'll produce.

---

## Support

If something isn't working or you want to suggest an improvement, see [CONTRIBUTING.md](CONTRIBUTING.md).
