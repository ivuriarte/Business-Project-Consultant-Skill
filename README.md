# Frank — From Idea to Backlog in Minutes

> **The AI that structures your thinking before you build.**  
> Structured epics. Prioritized stories. Developer-ready output. GitHub export included.

**Author:** Ian Vince  
**Version:** 3.0.0  
**License:** MIT

---

## What Frank Does

Most founders and developers jump straight to wireframes or code before they've answered the three questions that actually determine whether a product succeeds:

- *Why does this need to exist?* (Cost of inaction)
- *Who specifically benefits?* (User + stakeholder value)
- *What assumption would invalidate all of this?* (Key risk)

Frank refuses to skip these. It gates backlog generation behind a structured Quick Brief, then produces a complete, auto-scored backlog (Epics → User Stories → Acceptance Criteria) ready for your dev team — or for GitHub Issues export.

**What you get from a single session:**
- Prioritized backlog (Epics → Stories → AC) with MoSCoW and value scores
- Greatest Value Prompt — a production-ready copy-paste developer prompt for your highest-impact story
- GitHub Issues export — one issue per User Story, labeled and structured
- Shareable session URL — share your backlog with any teammate

---

## Three Ways to Use Frank

### Option A — AI Agent (recommended, `agent/`)

A full web application anyone can use — no Copilot, no Python, no terminal required.

```bash
cd agent
cp .env.local.example .env.local   # fill in OpenAI + Upstash keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll get a unique session URL to share with your team.

**What the agent does that the other options don't:**
- Enforces the Quick Brief gate — refuses to generate epics until your intent is clear
- Auto-scores every story using the Value Scoring Matrix (Business Value × User Impact × Feasibility)
- Persists sessions in Upstash Redis — shareable URL, resumable after closing the browser
- Exports directly to GitHub Issues — labeled, one per story, with AC and metadata
- Progressive backlog saving — every epic is checkpointed as it's generated; a dropped stream never loses work

See [`agent/README.md`](agent/README.md) for full setup instructions.

### Option B — Copilot Chat (no terminal needed)

If you have this installed as a Copilot skill, open GitHub Copilot Chat and describe your idea:

- *"Help me define my app idea"*
- *"Turn this into a backlog"*
- *"Create user stories for my project"*
- *"Plan the development phases"*

Frank guides you through the same structured thinking — entirely in conversation. No files to manage.

### Option C — Interactive Scripts (permanent output files)

Run the three Python wizards directly. Each produces `.md` and `.json` output files you can share, import into GitHub Issues, paste into Jira, or hand to a developer.

```bash
python3 scripts/requirements_elicitor.py    # Understand the problem
python3 scripts/idea_to_backlog.py          # Build the backlog
python3 scripts/project_planner.py          # Plan the phases
```

> **Not sure which to use?** Use Option A (agent) if you want a complete guided experience with team sharing and GitHub export. Use Option B (Copilot) for quick in-editor sessions. Use Option C when you need permanent deliverable files.

---

## Requirements

### For the AI Agent (Option A)
- **Node.js 18+**
- **OpenAI API key** (GPT-4o access)
- **Upstash Redis** account (free tier works)
- **GitHub Personal Access Token** (for export, `repo` scope)
- **`ADMIN_SECRET`** — a random 64-char hex string for session recovery (generate with `openssl rand -hex 32`)

### For the Copilot Skill (Option B)
- **GitHub Copilot** with agent/skill support enabled

### For the CLI Scripts (Option C)
- **Python 3.8+**
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

> First, open PowerShell and navigate (`cd`) into the folder where you cloned or extracted this repository, so that `business-project-consultant\` is a visible subdirectory. Then run:

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
├── SKILL.md                          ← Copilot skill definition
├── README.md                         ← This file
├── CHANGELOG.md                      ← Version history
├── CONTRIBUTING.md                   ← How to contribute improvements
├── LICENSE                           ← MIT License
├── agent/                            ← Standalone AI web agent (v2.0)
│   ├── app/                          ← Next.js App Router
│   │   ├── api/chat/                 ← Streaming chat endpoint (GPT-4o)
│   │   ├── api/session/[id]/         ← Session data endpoint
│   │   ├── api/export/github/        ← GitHub Issues export endpoint
│   │   ├── page.tsx                  ← Main page (session routing)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ChatInterface.tsx         ← Main chat UI
│   │   ├── BacklogPanel.tsx          ← Live backlog sidebar
│   │   ├── MessageBubble.tsx         ← Markdown message renderer
│   │   └── ExportButton.tsx          ← GitHub export modal
│   ├── lib/
│   │   ├── types.ts                  ← Shared TypeScript types
│   │   ├── instructions.ts           ← System prompt + stage definitions
│   │   ├── redis.ts                  ← Upstash session layer
│   │   └── github.ts                 ← GitHub API client
│   ├── .env.local.example            ← Environment variable template
│   └── README.md                     ← Agent setup guide
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

Run these from your terminal in any project directory. Each script saves its output as `.md` and `.json` files in the directory where you run the command — so run from your project root, not from inside `scripts/`.

### Recommended Order — Full Connected Pipeline

The scripts are designed to feed each other. Run them in order from your **project folder** to eliminate re-typing:

```bash
# Step 1 — Capture requirements
cd /path/to/my-project
python3 /path/to/scripts/requirements_elicitor.py
# → saves my-project-requirements-<timestamp>.json

# Step 2 — Build backlog (reads Step 1 output, pre-fills project context)
python3 /path/to/scripts/idea_to_backlog.py --from-requirements my-project-requirements-<timestamp>.json
# → saves my-project-backlog-<timestamp>.json

# Step 3 — Plan phases (reads Step 2 output, pre-fills name/stack, shows stories per phase)
python3 /path/to/scripts/project_planner.py --from-backlog my-project-backlog-<timestamp>.json
```

The `--from-requirements` and `--from-backlog` flags pre-fill project name, problem statement, target user, and tech stack from the previous step's JSON output. Backlog stories also appear as a reference guide during phase planning.

> Each script can also be run standalone without any flags.

---

### Script 1 — Requirements Elicitor

```bash
python3 scripts/requirements_elicitor.py
```

A guided Q&A that uncovers Business, Functional, Non-Functional, Constraint, and Assumption requirements from any idea. Prevents the most common mistake in software projects: building the wrong thing.

**Output files:**
- `<project-name>-requirements-<timestamp>.md`
- `<project-name>-requirements-<timestamp>.json`

**Time:** 15–30 minutes

---

### Script 2 — Idea to Backlog

```bash
python3 scripts/idea_to_backlog.py
```

An interactive wizard that takes your raw idea and produces a full prioritized backlog: Epics → User Stories → Acceptance Criteria. Automatically scores every story using the Value Scoring Matrix and outputs a **Greatest Value Prompt** — the single highest-ROI developer task, ready to paste into Copilot.

**Output files:**
- `<project-name>-backlog-<timestamp>.md`
- `<project-name>-greatest-value-prompt-<timestamp>.md`
- `<project-name>-backlog-<timestamp>.json`
- `<project-name>-github-issues-<timestamp>.md` ← copy-paste GitHub Issue blocks + `gh issue create` CLI tip

**Time:** 10–20 minutes

---

### Script 3 — Project Planner

```bash
python3 scripts/project_planner.py
```

Builds a phased development plan (Discovery → MVP → Stabilization → Enhancement → Growth) with goals, feature lists, milestones, risks, decision points, and a Mermaid Gantt chart.

> **Rendering the Gantt chart:** The output `.md` file contains a `mermaid` code block. Paste it into [mermaid.live](https://mermaid.live), any GitHub `.md` file, Notion, or GitLab to render the visual timeline.

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

---

## Roadmap

| Phase | Status | Highlights |
|---|---|---|
| **Alpha** | ✅ Live | Rebrand, stream resilience, route tests, cybersecurity audit |
| **Beta** | 🔜 Next | Auth (Clerk), billing (Stripe), validation stage, PRD export, Azure DevOps + Jira export |
| **Production** | 🗓 Planned | Team workspaces, cross-session memory, read-only share links, Linear + GitHub Projects export |

Track individual tasks in [TODO.md](TODO.md).
