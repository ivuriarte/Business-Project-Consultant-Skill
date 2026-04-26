# Requirements Analysis Framework

> **Purpose:** A practical reference covering the core frameworks and techniques used in professional requirements elicitation, analysis, and documentation. Use this to guide conversations with stakeholders and ensure nothing is missed before development starts.

---

## Framework 1 — The 5 Whys (Root Cause Analysis)

**When to use:** A stakeholder presents a feature request but you're not sure they're solving the right problem.

**How it works:** Ask "why" five times to move from a surface symptom to the root cause.

**Example:**

| # | Question | Answer |
|---|---|---|
| 1 | Why do we need a notification system? | Because users forget to log back in |
| 2 | Why do they forget to log back in? | Because there's no trigger to remind them |
| 3 | Why is that a problem? | Because they don't see new activity relevant to them |
| 4 | Why don't they see it? | Because they have to manually check the app |
| 5 | Why does this matter to the business? | Because low re-engagement = high churn = lost revenue |

**Root cause revealed:** The real problem is not "we need notifications" — it's "users don't return because there's no value pull mechanism." This may be solved by notifications OR by improving the in-app value of returning.

**Rule:** Never build a feature based on the first "why." Always reach the root cause.

---

## Framework 2 — Jobs to Be Done (JTBD)

**When to use:** When defining what a user actually needs from a feature (not just what they say they want).

**Formula:**
```
When [situation],
I want to [motivation / action],
So I can [expected outcome].
```

**Example:**

| JTBD Component | Example |
|---|---|
| When | When I finish a project with a client |
| I want to | Send a professional invoice immediately |
| So I can | Get paid without awkward follow-up conversations |

**Why this matters for developers:**
A JTBD reveals the *outcome the user is hiring the feature for* — not just the interaction. It shapes what the feature must feel like, not just what it must do. A developer who knows the JTBD writes better edge case handling.

---

## Framework 3 — As-Is / To-Be Analysis

**When to use:** When the app is replacing an existing manual or digital process.

**How it works:**
1. Map the CURRENT state (As-Is) — how the user does this today
2. Map the DESIRED state (To-Be) — how the user will do this with the app
3. The gap between them = your feature list

**Template:**

### As-Is State

| Step | Actor | Action | Tool / Method | Pain Point |
|---|---|---|---|---|
| 1 | Freelancer | Creates invoice | Excel template | Takes 30 min, looks unprofessional |
| 2 | Freelancer | Sends invoice | Email attachment | No tracking, often lost |
| 3 | Freelancer | Follows up on payment | Phone call / email | Awkward, time-consuming |
| 4 | Freelancer | Records payment | Spreadsheet | Manual, error-prone |

### To-Be State

| Step | Actor | Action | System Response | Improvement |
|---|---|---|---|---|
| 1 | Freelancer | Fills in invoice form | Auto-calculates totals, assigns number | 5 min, professional template |
| 2 | Freelancer | Clicks "Send Invoice" | Email sent, PDF attached, tracking starts | Instant, tracked |
| 3 | System | Payment overdue | Sends reminder to client automatically | No awkward follow-up needed |
| 4 | Client | Pays invoice | System marks as paid, freelancer notified | Real-time, zero manual entry |

**The gap:** Steps 1–4 in As-Is vs. To-Be reveals 4 Epics: Invoice Creation, Invoice Delivery, Payment Reminders, Payment Recording.

---

## Framework 4 — MoSCoW Prioritization

**When to use:** Every time you have a list of features or requirements that need to be prioritized.

**Rules:**

| Priority | Label | Rule | % of Scope (typical) |
|---|---|---|---|
| Must Have | 🔴 | Without this, the app doesn't work or the MVP is invalid | 40–60% |
| Should Have | 🟡 | High value, should be in V1 if capacity allows | 20–30% |
| Could Have | 🟢 | Nice to have, schedule in V2 | 10–20% |
| Won't Have (this time) | ⚪ | Explicitly deferred — not "no forever", but "no now" | Remainder |

**Anti-pattern to avoid:** "Everything is Must Have." If everything is critical, nothing is. Force trade-offs by asking: *"If we had to remove one Must Have, which one breaks the product least?"*

**MoSCoW Review Questions:**

- "If this feature wasn't in the launch version, would users be unable to do the core job?" → Must Have
- "Would this feature drive significant value but users can work around its absence temporarily?" → Should Have
- "Would this be a nice addition but users won't churn without it?" → Could Have
- "Is this aspirational, unclear, or dependent on future capabilities?" → Won't Have (this time)

---

## Framework 5 — Value Scoring Matrix

**When to use:** To identify which story to build next (Greatest Value Prompt selection).

**Formula:**
```
Value Score = (Business Value × 0.40) + (User Impact × 0.35) + (Dev Feasibility × 0.25)
```

**Scoring Guide:**

| Score | Business Value | User Impact | Dev Feasibility |
|---|---|---|---|
| 5 | Core to the app's value proposition | Every user, every session, can't use app without it | Straightforward — clear path, known tools |
| 4 | Directly drives retention or revenue | Most users, frequently | Well-understood, some unknowns |
| 3 | Improves experience, moderate business value | Some users, some sessions | Moderate complexity |
| 2 | Nice to have, indirect value | Few users, rarely | Complex, needs research |
| 1 | Future vision, unclear ROI | Edge case users | Very complex or high-risk |

**Interpretation:**

| Score Range | Recommendation |
|---|---|
| 4.0 – 5.0 | Build this sprint. Maximum ROI. |
| 3.0 – 3.9 | Build next sprint. High value. |
| 2.0 – 2.9 | Backlog. Build after core is stable. |
| < 2.0 | Defer or cut. Low ROI relative to effort. |

---

## Framework 6 — Kano Model (User Satisfaction Mapping)

**When to use:** When deciding which features to invest in based on their effect on user satisfaction.

**Three Categories:**

| Category | Description | Effect if Absent | Effect if Present | Example |
|---|---|---|---|---|
| **Basic Needs** | Features users assume exist — they won't mention them until they're missing | Deep dissatisfaction | Neutral (expected) | Login system, data saves correctly |
| **Performance Needs** | The more, the better — directly proportional to satisfaction | Dissatisfied | Proportionally satisfied | Search result speed, invoice accuracy |
| **Delighters** | Unexpected value — users didn't ask for it but love it when they find it | Neutral (unaware) | Strong satisfaction and loyalty | Smart invoice numbering, one-click reminders |

**How to apply:**
- Basic Needs must be in every sprint — skipping them kills trust
- Performance Needs justify investment in optimization sprints
- Delighters are your V2 differentiation strategy — don't build them in MVP, save them for when the core is solid

---

## Framework 7 — Stakeholder Analysis (Power/Interest Grid)

**When to use:** At the start of every project to understand who matters, how much, and how to engage them.

**The Grid:**

```
                 HIGH INTEREST
                      │
         KEEP         │      MANAGE
       INFORMED       │      CLOSELY
  LOW  ──────────────┼────────────── HIGH
  POWER               │              POWER
         MONITOR      │      KEEP
                      │    SATISFIED
                 LOW INTEREST
```

| Quadrant | Strategy |
|---|---|
| High Power + High Interest | Engage constantly. These are your approvers and champions. |
| High Power + Low Interest | Keep satisfied. They can block you. Don't overwhelm them with detail. |
| Low Power + High Interest | Keep informed. They are often your most enthusiastic users or advocates. |
| Low Power + Low Interest | Monitor. Check in occasionally. Don't invest heavy communication. |

---

## Framework 8 — Scope Box (In-Scope / Out-of-Scope Boundary Definition)

**When to use:** At the very start of a project, before any requirements are written.

**Why it matters:** Undefined scope = infinite scope. "We'll add that later" is how projects die.

**Template:**

```
SCOPE BOX — [Project Name]

The system WILL:
├── [Capability 1]
├── [Capability 2]
└── [Capability 3]

The system will NOT:
├── [Explicitly excluded 1] (Rationale: [why deferred])
├── [Explicitly excluded 2] (Rationale: [why deferred])
└── [Explicitly excluded 3] (Rationale: [why deferred])

The system starts when:
└── [Trigger event]

The system ends when:
└── [Terminal event]

External systems involved:
└── [System 1], [System 2]
```

**Rule:** Anything not listed in "The system WILL" is out of scope by default. Both lists must be signed off before development starts.

---

## Framework 9 — Feasibility Assessment

**When to use:** Before committing to build a feature — especially novel, complex, or expensive ones.

**Four dimensions to assess:**

| Dimension | Questions to Answer | Red Flags |
|---|---|---|
| **Technical Feasibility** | Can we build this with our current stack? Are there known unknowns? | "We've never done this before" with no research, or unknown third-party dependencies |
| **Operational Feasibility** | Does the team have the skills to build and maintain this? | Requires expertise no one on the team has, with no training plan |
| **Financial Feasibility** | Does the cost (build + operate) justify the business value? | Cost of running the feature exceeds the revenue it generates |
| **Time Feasibility** | Can this be built within the project timeline? | No time buffer for unknowns, unrealistic estimates |

**Scoring:** Rate each dimension 1–5 (5 = fully feasible). Average < 3 = reassess before committing.

---

## Common Requirements Elicitation Mistakes

| Mistake | What Happens | Fix |
|---|---|---|
| Accepting the first answer | You build a solution to a symptom, not the root problem | Use 5 Whys |
| Writing requirements as solutions | "The system shall have a button" instead of "the user must be able to trigger X" | Keep requirements technology-agnostic |
| No non-functional requirements | App works but fails under real conditions | Mandate NFRs for every feature |
| Skipping out-of-scope definition | Scope creep consumes the budget | Document out-of-scope explicitly, with rationale |
| No assumption log | An invalidated assumption breaks the architecture | Log every assumption with an owner and validation date |
| Requirements written only by one person | Missing stakeholder needs | Validate requirements with at least 3 different stakeholder types |
| No traceability | Can't trace a bug back to a requirement, or know which requirement is untested | Every requirement has an ID; every story references a requirement ID |

---

## Requirement Quality Checklist

Before handing any requirement to a developer, verify it is:

- [ ] **Complete** — it stands alone without needing context from another document
- [ ] **Unambiguous** — only one interpretation is possible
- [ ] **Testable** — a QA engineer can write a test that passes or fails on this requirement
- [ ] **Feasible** — the team can build it within known constraints
- [ ] **Traceable** — it references the business or user need that created it
- [ ] **Prioritized** — it has a MoSCoW priority label
- [ ] **Sized** — it has an effort estimate (XS/S/M/L/XL or story points)
- [ ] **Assigned to a phase** — the dev team knows when this is expected

---

## Requirements → Backlog Traceability Map

Show how requirements flow through the system to ensure nothing is missed:

```
Business Requirement (BR-001)
  └── Functional Requirement (FR-004, FR-005)
        └── Epic (EP02 — Invoice Management)
              └── User Story (INV-S01)
                    └── Acceptance Criteria (AC-1, AC-2, AC-3)
                          └── Developer Prompt (Greatest Value Prompt)
                                └── Sprint Task
                                      └── Test Case
                                            └── Deployed Feature
```

Every deployed feature should be traceable back to a business requirement. If it isn't, question why it was built.
