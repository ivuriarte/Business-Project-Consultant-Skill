# Backlog Structure & Developer Prompt Guide

> **Purpose:** Reference templates for writing high-quality Epics, User Stories, Acceptance Criteria, and the Greatest Value Prompt format. Use this alongside `idea_to_backlog.py` or when crafting the backlog manually.

---

## The Backlog Hierarchy

```
EPIC
  └── User Story
        └── Acceptance Criteria (GIVEN / WHEN / THEN)
              └── Developer Prompt (Greatest Value format)
```

Every item flows downward. An Epic without stories is aspirational, not actionable. A story without AC is ambiguous. AC without a developer prompt delays execution.

---

## Part 1 — Epics

### What is an Epic?
An Epic is a **large, named capability area** that takes more than one sprint to deliver. It groups related stories that together create a complete user-facing feature set.

### Epic Template

```markdown
## EPIC [ID]: [Name]

**Summary:** [One sentence — what capability does this Epic deliver?]

**Business Value:**
[Why does this capability matter? What happens to the product if this Epic is never built?]

**Target Users:**
[Who directly benefits from this Epic?]

**MoSCoW Priority:** Must Have / Should Have / Could Have

**Phase:** Discovery / MVP / Stabilization / Enhancement / Growth

**Stories:**
- [STORY-01] [Story title]
- [STORY-02] [Story title]
- [STORY-03] [Story title]
```

### Epic Examples

| Epic Name | Business Value |
|---|---|
| User Authentication | Without this, users cannot have personal data — the app has no identity layer |
| Onboarding Flow | First-time users who don't understand the app churn within 60 seconds |
| Billing & Payments | No billing = no revenue = the business model doesn't work |
| Dashboard & Analytics | Users need to see outcomes to understand the app's value |
| Notifications & Alerts | Without timely nudges, users forget to return and retention drops |
| Admin Panel | Without an admin view, the team cannot manage users, data, or issues in production |

---

## Part 2 — User Stories

### User Story Formula

```
As a [specific type of user],
I want to [perform a specific action or receive specific value],
So that [I achieve a named, concrete outcome].
```

### INVEST Checklist

Before writing AC, verify the story passes INVEST:

| Letter | Criterion | Test |
|---|---|---|
| I | **Independent** | Can this be built without waiting for another story? |
| N | **Negotiable** | Are the details flexible — not a hard contract? |
| V | **Valuable** | Does a real user or the business gain something from this? |
| E | **Estimable** | Can a developer give it a size (XS/S/M/L/XL)? |
| S | **Small** | Does it fit in one sprint (or can be split)? |
| T | **Testable** | Do we have clear AC that can pass or fail? |

If any answer is "no," rewrite the story before adding it to the sprint.

### Story Size Guide

| Size | Days | Typical Scope |
|---|---|---|
| XS | < 1 day | A button, a label change, a one-field form |
| S | 1–2 days | A form with validation, a simple API endpoint |
| M | 3–5 days | A feature with multiple states, a screen with business logic |
| L | 1–2 weeks | A complex feature: multi-step flow, third-party integration |
| XL | 2+ weeks | Should be split into smaller stories |

---

## Part 3 — Acceptance Criteria

### Gherkin Format (Recommended)

```
GIVEN [a specific context or starting state],
WHEN [the user performs a specific action],
THEN [a specific, observable outcome occurs].
```

### Rules for Writing Good AC

1. **Be specific, not general.** "It works" is not AC. "The user sees a green confirmation banner within 1 second" is AC.
2. **Cover the happy path first.** Then add edge cases and error states.
3. **One behaviour per criterion.** Do not combine two outcomes in one AC.
4. **Use measurable language.** "Fast" = not AC. "Loads in < 2 seconds" = AC.
5. **Write from the user's perspective.** Not "the system stores data" — "the user can see their saved information on the next visit."

### AC Example Set — User Registration

**Story:** As a new user, I want to register with my email and password, so that I can create a personal account.

**AC:**
1. GIVEN I am on the registration page, WHEN I fill in a valid email and a password of 8+ characters and click "Create Account", THEN my account is created, I am logged in, and I am redirected to the dashboard.
2. GIVEN I enter an email that is already registered, WHEN I click "Create Account", THEN I see the error message "This email is already in use. Try logging in." and the form is not submitted.
3. GIVEN I enter a password fewer than 8 characters, WHEN I click "Create Account", THEN I see the inline error "Password must be at least 8 characters" and the form is not submitted.
4. GIVEN I leave the email field empty, WHEN I click "Create Account", THEN I see the inline error "Email is required."
5. GIVEN my account is created, WHEN I check my email inbox, THEN I receive a verification email within 2 minutes with a working verification link.

### AC Coverage Matrix

For every story, ensure you have AC for:
- ✅ Happy path (everything works as expected)
- ✅ Validation errors (wrong/missing input)
- ✅ Edge cases (empty state, maximum input, special characters)
- ✅ Permissions (what happens if unauthorized user tries)
- ✅ Error state (network failure, server error)

---

## Part 4 — The Greatest Value Prompt

### What is a Greatest Value Prompt?
A structured, ready-to-paste developer prompt that includes everything a developer (or AI coding assistant) needs to implement a feature correctly without needing to ask follow-up questions.

### When to Generate One
Generate a Greatest Value Prompt when:
- A developer is starting work on a story and needs a clear starting point
- You want to use an AI coding assistant (Copilot, Cursor, etc.) to implement a feature
- A story has been approved and is moving to the active sprint
- You want the AI assistant to generate code with the exact right requirements

### How to Identify the Greatest Value Story

Use the Value Scoring Matrix to rank stories:

```
Value Score = (Business Value × 0.40) + (User Impact × 0.35) + (Dev Feasibility × 0.25)
```

| Dimension | Scale | What to Consider |
|---|---|---|
| Business Value | 1–5 | How directly does this deliver the app's core promise? |
| User Impact | 1–5 | How many users are affected? How frequently? How severely? |
| Dev Feasibility | 1–5 | How straightforward is implementation? (5 = low complexity) |

The highest-scoring story is the Greatest Value Story. Build that first.

---

### Greatest Value Prompt Template

Copy this template and fill it in for any story you want to implement:

```
--- GREATEST VALUE PROMPT ---

Context:
[2–3 sentences describing the app, its purpose, and the problem it solves.
Include the tech stack if known.]

Epic: [Epic Name and ID]
Story [STORY-ID]: As a [actor], I want to [action], so that [outcome].

Task for the developer:
Implement the feature described in this story with the following requirements.

Functional Requirements:
1. [Specific requirement 1]
2. [Specific requirement 2]
3. [Specific requirement 3]

Acceptance Criteria:
- GIVEN [context], WHEN [action], THEN [outcome].
- GIVEN [context], WHEN [action], THEN [outcome].
- GIVEN [context], WHEN [action], THEN [outcome].

Non-Functional Requirements:
- [Performance expectation]
- [Security expectation]
- [Accessibility or compatibility expectation]

Out of Scope for this task:
- [Explicitly what NOT to build as part of this implementation]
- [Related features that belong to a different story]

Definition of Done:
- [ ] All acceptance criteria above pass
- [ ] No regression in existing features
- [ ] Input is validated and errors are handled gracefully
- [ ] Code is committed and pushed to the feature branch
- [ ] [Story ID] is marked complete in the backlog

Value Score: [X.X / 5.0]
--- END PROMPT ---
```

---

### Greatest Value Prompt — Filled Example

```
--- GREATEST VALUE PROMPT ---

Context:
InvoiceFlow is a web application for freelance designers to create, send,
and track client invoices. It is built with Next.js, Supabase, and Tailwind CSS.
The core problem it solves is: freelancers lose track of unpaid invoices
because they manage them in spreadsheets or paper.

Epic: EP01 — Invoice Management
Story [INV-S01]: As a freelance designer, I want to create a new invoice
with a client name, line items, and due date, so that I can send it to
my client and track what I'm owed.

Task for the developer:
Implement the invoice creation form and save functionality.

Functional Requirements:
1. The form must accept: Client Name (text), Invoice Number (auto-generated),
   Invoice Date (date picker, defaults to today), Due Date (date picker),
   and at least one line item (Description + Quantity + Unit Price).
2. Line items must be addable and removable dynamically.
3. The total must calculate automatically (sum of Quantity × Unit Price for all rows).
4. On save, the invoice must be stored in the database linked to the logged-in user.
5. After saving, the user is redirected to the invoice detail page.

Acceptance Criteria:
- GIVEN I am logged in and on the Create Invoice page, WHEN I fill in all required
  fields and click "Save Invoice", THEN the invoice is saved and I am redirected
  to the invoice detail page showing the new invoice.
- GIVEN I have not entered a Client Name, WHEN I click "Save Invoice", THEN I see
  the error "Client name is required" and the form is not submitted.
- GIVEN I add a line item with Quantity = 2 and Unit Price = 150, THEN the row
  total shows "300.00" and the invoice total updates immediately.
- GIVEN I remove a line item, THEN the invoice total recalculates without the
  removed row.

Non-Functional Requirements:
- The form must be responsive and usable on mobile (min 320px width).
- All monetary values must be stored and displayed with 2 decimal places.
- Invoice Number must be unique per user (e.g. INV-001, INV-002).

Out of Scope for this task:
- Sending the invoice to the client (that is a separate story: INV-S03)
- PDF generation (separate story: INV-S04)
- Payment tracking (separate story: INV-S05)

Definition of Done:
- [ ] All acceptance criteria above pass
- [ ] Invoice is saved correctly in Supabase with correct user association
- [ ] No regression in existing invoice list page
- [ ] Form input is validated client-side and server-side
- [ ] Code is committed and pushed
- [ ] INV-S01 is marked complete in the backlog

Value Score: 4.85 / 5.0
--- END PROMPT ---
```

---

## Part 5 — Backlog Management Rules

### Priority Review Cadence

| When | What to do |
|---|---|
| Every sprint start | Re-score top 10 stories. Priorities shift with new information. |
| After user feedback | Add new stories. Promote anything that addresses a real user pain. |
| After each phase | Retire stories that are no longer relevant. Cut anything that doesn't serve the current goal. |

### Backlog Health Indicators

| ✅ Healthy | ⚠ Warning |
|---|---|
| Every story in the current sprint has AC | Stories in sprint with no AC |
| Top of backlog is always prioritized | Backlog not reviewed in 2+ sprints |
| All Must Have stories are in MVP or earlier | Must Have stories sitting in Enhancement |
| Stories are S or M sized | Multiple XL stories in upcoming sprint |
| No story is older than 90 days without being built or retired | Stories from 6+ months ago never touched |

---

## Quick Reference — Backlog Vocabulary

| Term | Definition |
|---|---|
| **Epic** | A large capability area grouping related stories |
| **User Story** | A single user-facing need described from the user's perspective |
| **Acceptance Criteria** | Testable conditions that prove a story is done |
| **Definition of Done** | Team-wide checklist that applies to every story |
| **Sprint** | A fixed time period (usually 1–2 weeks) in which stories are built |
| **Backlog Grooming** | Regular session to review, re-prioritize, and refine stories |
| **Velocity** | How many story points (or effort units) a team completes per sprint |
| **MoSCoW** | Must Have / Should Have / Could Have / Won't Have — prioritization framework |
| **Value Score** | Weighted score (Business Value × User Impact × Feasibility) used to rank stories |
