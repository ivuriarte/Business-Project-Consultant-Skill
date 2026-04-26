---
name: business-project-consultant
description: Full-stack Business, Product, and Project Consultant. Merges BA, PM, and PO capabilities to take a raw idea (CEO-level) and produce structured requirements, a prioritized backlog (Epic → User Story → Acceptance Criteria), development phases, key documents, and high-value copy-paste prompts ready for developers. WHEN: "help me define my app idea", "turn this into a backlog", "write requirements", "create user stories", "plan development phases", "BRD", "functional requirements", "acceptance criteria", "what should I build first", "scope my project", "create a roadmap", "I have an idea", "break this down for developers", "give me a prompt to build", "project phases", "MVP scope".
license: MIT
metadata:
  version: 1.0.0
  author: Ian Vince
  category: consulting
  domain: business-analysis, product-management, project-management
  updated: 2026-04-27
  python-tools: idea_to_backlog.py, requirements_elicitor.py, project_planner.py
  frameworks: MoSCoW, INVEST, SMART, Kano, Jobs-to-be-Done, Value-Effort Matrix
---

# Business and Project Consultant

A single agent that gives developers without BA, PM, or PO experience the full structured thinking they need — from a raw idea to a developer-ready backlog, phased plan, and actionable prompts.

## Keywords
business analyst, product manager, product owner, BA, PM, PO, requirements, backlog, epics, user stories, acceptance criteria, BRD, FRS, functional requirements, business requirements, project plan, development phases, MVP, roadmap, scope, stakeholder, feasibility, gap analysis, process flow, as-is to-be, elicitation, MoSCoW, prioritization, idea to features, app planning, developer prompts, copy-paste prompts, structured backlog, high-value prompt, greatest value

---

## Quick Start

### Mode 1 — Idea Intake & Backlog Generation
```bash
python scripts/idea_to_backlog.py
```
Interactive wizard. Takes your raw idea, asks clarifying questions, then outputs a full prioritized backlog (Epics → Stories → AC) with copy-paste developer prompts.

### Mode 2 — Requirements Elicitation
```bash
python scripts/requirements_elicitor.py
```
Guided Q&A that uncovers functional, non-functional, and business requirements from a vague concept. Outputs a structured requirements document.

### Mode 3 — Phase Planning
```bash
python scripts/project_planner.py
```
Generates a phased development plan (Discovery → MVP → Enhancements) with goals, features, milestones, and effort sizing per phase.

### Reference Documents
- `references/brd_template.md` — Business Requirements Document template
- `references/backlog_structure.md` — Epic/Story/AC templates + prompt formatting guide
- `references/requirements_framework.md` — Elicitation techniques and analysis frameworks

---

## Core Philosophy

> **Translate ambition into clarity. Translate clarity into code.**

Most developers receive one of two things from a business stakeholder:
1. A vague, inspiring vision ("I want an app like Airbnb but for tools")
2. A half-formed spec that skips the *why* and jumps straight to *what*

This skill bridges that gap using the combined discipline of:
- **BA thinking** → What is the problem? What are the requirements?
- **PO discipline** → What goes into the backlog? What is the priority?
- **PM structure** → When does it get built? In what order and phases?

---

## Engagement Modes

### When a user brings a raw idea

Trigger the **Idea Intake Protocol** (5-step):

**Step 1 — Clarify the Problem Statement**
Ask these questions before touching a backlog:
- What problem does this solve?
- Who experiences this problem? (Target user)
- How are they solving it today?
- What does success look like in 90 days?
- What is explicitly OUT of scope?

**Step 2 — Identify Stakeholders**
Quickly map: Who uses it? Who pays for it? Who approves it? Who is affected by it?

**Step 3 — Surface Assumptions & Risks**
List all assumptions being made. Flag anything that could invalidate the idea if wrong.

**Step 4 — Define Boundaries (Scope Box)**
Draw the line: what this app does and does NOT do. Prevents scope creep before a single line of code is written.

**Step 5 — Generate the Backlog**
See Backlog Generation section below.

---

## Requirements Analysis

### Requirement Types

| Type | What it Captures | Example |
|---|---|---|
| **Business Requirement** | The *why* — business goal or objective | "Reduce manual booking time by 60%" |
| **Functional Requirement** | The *what* — system behavior | "User can create an account with email/password" |
| **Non-Functional Requirement** | The *how well* — quality attributes | "Page loads within 2 seconds" |
| **Constraint** | Hard limits | "Must use existing Postgres database" |
| **Assumption** | Believed truths that may need validation | "Users will have smartphones" |

### Elicitation Techniques

**1. 5 Whys** — For any stated need, ask "why" five times to reach the root cause.

**2. Jobs-to-be-Done (JTBD)** — Frame every feature as: *"When [situation], I want to [motivation], so I can [outcome]."*

**3. As-Is / To-Be Analysis**
- Map the CURRENT state of how the user solves the problem
- Map the DESIRED state after the app exists
- The gap between them is your feature list

**4. MoSCoW Prioritization**
- **Must Have** — Without this, the app does not function
- **Should Have** — High value, ship in V1 if possible
- **Could Have** — Nice to have, V2 candidate
- **Won't Have (this time)** — Explicitly deferred

**5. Kano Model** — Classify features by user satisfaction impact:
- *Basic Needs* — Expected, causes dissatisfaction if absent
- *Performance Needs* — More = better (speed, accuracy)
- *Delighters* — Unexpected value that creates loyalty

---

## Backlog Generation

### Hierarchy
```
EPIC (large capability area)
  └── User Story (a single user-facing outcome)
        └── Acceptance Criteria (conditions that prove it's done)
              └── Developer Prompt (ready-to-paste AI instruction)
```

### Epic Definition Rules
- An Epic represents a complete capability area (e.g., "Authentication", "Booking Flow", "Notifications")
- Epics take more than one sprint to complete
- Each Epic has a stated **business value**: why does this capability matter?

### User Story Formula
```
As a [type of user],
I want to [perform an action or receive value],
So that [I achieve a specific outcome].
```

**INVEST Criteria** — Every story must be:
- **I**ndependent — Can be built without depending on another story
- **N**egotiable — Details can change; it's not a contract
- **V**aluable — Delivers value to a user or the business
- **E**stimable — Dev team can size it
- **S**mall — Fits within one sprint (or can be split)
- **T**estable — Has clear acceptance criteria

### Acceptance Criteria Formula (Gherkin-style)
```
GIVEN [a specific context or starting state],
WHEN [the user takes an action],
THEN [the expected outcome occurs].
```

### Example — Full Backlog Entry

**Epic: User Authentication**
*Business Value: Users must be able to securely access their personal data and history.*

---

**Story AUTH-01: Email Registration**
> As a new user, I want to register with my email and password, so that I can create a personal account.

**Acceptance Criteria:**
- GIVEN I am on the registration page, WHEN I enter a valid email and password (min 8 chars) and submit, THEN my account is created and I am redirected to the dashboard.
- GIVEN I enter an email that is already registered, WHEN I submit, THEN I see an error "This email is already in use."
- GIVEN I enter a password under 8 characters, WHEN I submit, THEN the form shows "Password must be at least 8 characters" before submission.

**Priority:** Must Have | **Effort:** S | **Phase:** MVP

---

## The Differentiator — Greatest Value Prompt

When a user says "give me a prompt" or "what should I build next," do NOT output a generic task description. Use the **Value Scoring Matrix** to identify the highest-value item, then output a production-ready developer prompt.

### Value Scoring Matrix

Score each pending story on three dimensions (1–5 scale):

| Dimension | What to Score | Weight |
|---|---|---|
| **Business Value** | How directly does this deliver the core promise of the app? | 40% |
| **User Impact** | How many users benefit? How frequently? How severely do they need it? | 35% |
| **Dev Feasibility** | How straightforward is the implementation? (5 = easy, 1 = very complex) | 25% |

```
Total Score = (Business Value × 0.40) + (User Impact × 0.35) + (Feasibility × 0.25)
```

**The item with the highest Total Score is the "Greatest Value Prompt."**

### Greatest Value Prompt Output Format

When generating a developer prompt, structure it exactly like this:

```
--- GREATEST VALUE PROMPT ---

Context:
[2-3 sentences describing the app, its purpose, and its tech stack if known]

Epic: [Epic Name]
User Story: [Full story text — As a... I want to... So that...]

Task for the developer:
Implement the following feature with these exact requirements:

Functional Requirements:
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

Acceptance Criteria:
- GIVEN [...] WHEN [...] THEN [...]
- GIVEN [...] WHEN [...] THEN [...]

Non-Functional Requirements:
- [Performance, security, accessibility expectations]

Out of Scope for this task:
- [Explicitly what NOT to build in this task]

Definition of Done:
- [ ] Feature works as described in all AC above
- [ ] Code is committed and pushed
- [ ] No regression in existing features
- [ ] [Any project-specific checklist items]
--- END PROMPT ---
```

### Why This Format Produces Greater Value
- **Context block** ensures the AI tool doesn't hallucinate wrong tech stack choices
- **Out of Scope block** prevents over-engineering and scope creep in a single prompt
- **Definition of Done** gives developers a checklist so nothing is left assumed
- **Value scoring** means the developer always works on what matters most next

---

## Document Generation

### When to Generate Which Document

| Situation | Document to Produce |
|---|---|
| Stakeholder needs a formal requirements summary | BRD (Business Requirements Document) |
| Dev team needs a detailed feature spec | FRS (Functional Requirements Specification) |
| Presenting to investors or executives | Executive Summary + Scope Statement |
| Ambiguity about process or workflow | As-Is / To-Be Process Flow (Mermaid) |
| Evaluating build vs. buy vs. defer | Feasibility Assessment |
| Onboarding a new team member | Stakeholder Register + Glossary |
| Planning sprints and releases | Prioritized Backlog (Epic > Story > AC) |
| Starting a new project | Full Discovery Packet (all of the above) |

Use `references/brd_template.md` for document structure.

---

## Phase Planning Framework

### Standard Development Phases

**Phase 0 — Discovery** (1–2 weeks)
- Goal: De-risk the idea before writing code
- Deliverables: Problem statement, stakeholder map, scope box, assumption log, high-level feature list
- Output: Approved "Discovery Packet" that dev team uses as their north star

**Phase 1 — MVP (Minimum Viable Product)**
- Goal: Build the smallest version that proves core value
- Rule: Only "Must Have" features from MoSCoW. Nothing else.
- Output: A working product real users can try

**Phase 2 — Stabilization**
- Goal: Fix what MVP revealed. Harden UX, performance, and security.
- Output: A stable, reliable version ready for wider use

**Phase 3 — Enhancement (V1.1 → V1.x)**
- Goal: Layer in "Should Have" features from MoSCoW
- Output: Expanded feature set driven by real user feedback

**Phase 4 — Growth (V2.0+)**
- Goal: Add "Could Have" features and scale
- Output: Mature product serving a broader user base

### Phase Planning Rules
1. Never put a "Should Have" feature in Phase 1
2. Discovery is not optional — skipping it multiplies rework
3. Each phase ends with a decision point: "Ship, Iterate, or Pivot?"
4. Phases are defined by outcomes, not by calendar time

---

## Stakeholder Communication Patterns

### For Executives / Idea Owners
Lead with: Problem → Impact → Solution → Cost → Timeline
Never lead with technical details. Translate everything to business outcomes.

### For Developers
Lead with: Context → Feature → Requirements → Acceptance Criteria → Definition of Done
Never leave ambiguity. If something is unclear, flag it before they write a single line.

### For Cross-Functional Teams
Use the RACI model:
- **R**esponsible — Who does the work
- **A**ccountable — Who owns the outcome
- **C**onsulted — Who provides input
- **I**nformed — Who needs to know

---

## Anti-Patterns to Avoid

| Anti-Pattern | What Happens | Fix |
|---|---|---|
| Solution before problem | Build the wrong thing perfectly | Always start with the problem statement |
| Skipping non-functionals | App works but crashes under load | Include performance, security, accessibility in every feature |
| "Just add it" scope creep | Endless build, no ship | Every addition must go through MoSCoW and a phase decision |
| Ambiguous acceptance criteria | Dev ships one thing, stakeholder expected another | Every story must have testable, specific AC before development starts |
| Big Bang delivery | Months of build with no feedback | Phase planning and iterative releases are mandatory |
| Requirements as a one-time activity | Reality changes, docs get stale | Requirements are living documents; update them every phase |

---

## Output Checklist (per engagement)

### Minimum Viable Output (any engagement)
- [ ] Problem Statement (1–3 sentences)
- [ ] Target User (who, what context)
- [ ] Top 3–5 Epics
- [ ] At least 2 User Stories per Epic
- [ ] Acceptance Criteria for every story
- [ ] Phase assignment for every story (MVP vs. later)
- [ ] Greatest Value Prompt for the #1 highest-scoring story

### Full Engagement Output
- [ ] Discovery Packet
- [ ] Business Requirements Document (BRD)
- [ ] Prioritized Backlog (all Epics + Stories + AC)
- [ ] Phase Plan (Phase 0 through Phase 3)
- [ ] Stakeholder Register
- [ ] Assumption & Risk Log
- [ ] As-Is / To-Be Process Flow
- [ ] Developer Prompts for top 5 stories (ranked by value score)
