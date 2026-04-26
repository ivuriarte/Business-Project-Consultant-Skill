# Business Requirements Document (BRD) Template

> **When to use:** Generate a BRD when a stakeholder needs a formal, signed-off summary of what the project is, why it exists, and what it must achieve — before development begins. This is the anchor document every other artifact references.

---

# Business Requirements Document
## [Project Name]

**Version:** 1.0  
**Status:** Draft | Under Review | Approved  
**Prepared by:** [Name / Role]  
**Date:** YYYY-MM-DD  
**Approved by:** [Stakeholder Name / Role]  
**Approval Date:** YYYY-MM-DD  

---

## Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | YYYY-MM-DD | [Name] | Initial draft |
| 1.0 | YYYY-MM-DD | [Name] | Approved version |

---

## Table of Contents

1. Executive Summary
2. Business Context and Problem Statement
3. Project Objectives
4. Scope
5. Stakeholders
6. Business Requirements
7. Functional Requirements Summary
8. Non-Functional Requirements Summary
9. Constraints and Dependencies
10. Assumptions
11. Risks and Mitigations
12. Success Metrics
13. Glossary
14. Appendix

---

## 1. Executive Summary

> *1–3 paragraphs. Write this for an executive who has 60 seconds. Answer: What is the project? Why does it matter? What does it cost and when will it be done?*

**What:** [One sentence describing the solution]

**Why:** [One sentence describing the business problem being solved]

**How:** [One sentence on the approach]

**When:** [Target completion / key milestone dates]

---

## 2. Business Context and Problem Statement

### 2.1 Current State (As-Is)

Describe how the problem is currently being handled:
- Who is doing it
- What tools or processes are used
- What the pain points are
- What it costs (time, money, errors)

### 2.2 Desired Future State (To-Be)

Describe the world after this project is complete:
- What changes
- Who benefits and how
- What is measurably better

### 2.3 Problem Statement

> *One clear, specific sentence that defines the problem.*

**Template:** [Target user] cannot [achieve goal] because [root cause], which results in [business impact].

**Example:** "Freelance designers cannot track outstanding invoices efficiently because they have no centralized tool, resulting in an average of 3 hours/week lost to manual follow-up and late payments."

### 2.4 Opportunity

Describe the business opportunity this project captures if the problem is solved.

---

## 3. Project Objectives

*Objectives must be SMART: Specific, Measurable, Achievable, Relevant, Time-bound.*

| # | Objective | Measure of Success | Target Date |
|---|---|---|---|
| 1 | [Objective 1] | [How we'll measure it] | [Date] |
| 2 | [Objective 2] | [How we'll measure it] | [Date] |
| 3 | [Objective 3] | [How we'll measure it] | [Date] |

---

## 4. Scope

### 4.1 In Scope

List everything this project WILL deliver:
- [Feature / capability / process 1]
- [Feature / capability / process 2]
- [Feature / capability / process 3]

### 4.2 Out of Scope

List everything this project explicitly WILL NOT deliver:
- [Out of scope item 1] — *Rationale: [why deferred]*
- [Out of scope item 2] — *Rationale: [why deferred]*

> **Rule:** If something is not listed in 4.1, it is out of scope by default. Both lists must be explicitly signed off.

### 4.3 Boundaries

Describe where this system starts and ends:
- **Starts when:** [Triggering event, e.g., "user visits the app URL"]
- **Ends when:** [Terminal event, e.g., "invoice is paid and recorded"]
- **External systems touched:** [List any APIs, databases, or services this project integrates with]

---

## 5. Stakeholders

### 5.1 Stakeholder Register

| Name | Role | Organization | Interest | Influence | Communication Frequency |
|---|---|---|---|---|---|
| [Name] | [Role] | [Org] | [What they care about] | High/Med/Low | Weekly/Monthly |

### 5.2 RACI Matrix (Key Decisions)

| Decision / Activity | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Requirements approval | BA | Business Owner | Dev Lead | Dev Team |
| Architecture decisions | Dev Lead | CTO | BA | All |
| Go/No-Go to production | Dev Lead | Business Owner | QA | Stakeholders |

---

## 6. Business Requirements

*Business requirements capture the WHY. They are goals, not features.*

| ID | Requirement | Priority | Rationale | Source |
|---|---|---|---|---|
| BR-001 | [The business must be able to...] | Must Have | [Why this matters] | [Stakeholder/Workshop] |
| BR-002 | [The system must support...] | Should Have | [Why this matters] | [Stakeholder/Workshop] |
| BR-003 | [The organisation needs...] | Could Have | [Why this matters] | [Stakeholder/Workshop] |

---

## 7. Functional Requirements Summary

*Full functional requirements live in the FRS (Functional Requirements Specification). Summarize the key capabilities here.*

| ID | Capability Area | Description | Priority |
|---|---|---|---|
| FR-001 | [Area, e.g. Authentication] | [Brief description] | Must Have |
| FR-002 | [Area, e.g. Dashboard] | [Brief description] | Must Have |
| FR-003 | [Area, e.g. Reporting] | [Brief description] | Should Have |

> **Reference:** See FRS document for full functional requirements detail.

---

## 8. Non-Functional Requirements Summary

| ID | Category | Requirement | Target |
|---|---|---|---|
| NFR-001 | Performance | Page load time | < 2 seconds (p95) |
| NFR-002 | Scalability | Concurrent users | Supports 1,000 simultaneous |
| NFR-003 | Availability | Uptime | 99.9% (< 9h downtime/year) |
| NFR-004 | Security | Authentication | MFA required for admin accounts |
| NFR-005 | Accessibility | Standard | WCAG 2.1 Level AA |
| NFR-006 | Compatibility | Browsers | Chrome, Safari, Firefox (last 2 versions) |

---

## 9. Constraints and Dependencies

### 9.1 Constraints

*Hard limits that cannot be changed.*

| # | Constraint | Type | Impact |
|---|---|---|---|
| 1 | [e.g. Must use existing PostgreSQL DB] | Technical | Architecture must work with existing schema |
| 2 | [e.g. Budget cap of $X] | Financial | Feature set must fit within budget |
| 3 | [e.g. Must launch by Q3] | Time | Scope must be reduced to hit deadline |

### 9.2 Dependencies

*Things this project depends on that are controlled by others.*

| # | Dependency | Owner | Risk if Delayed |
|---|---|---|---|
| 1 | [e.g. API from third-party payment provider] | [Vendor name] | Payment flow cannot be built |
| 2 | [e.g. Design mockups from design team] | [Designer] | Dev cannot start UI work |

---

## 10. Assumptions

*Things believed to be true that have NOT been formally verified. Each assumption is a risk.*

| ID | Assumption | Owner | Validation Method | Target Date |
|---|---|---|---|---|
| ASS-001 | [e.g. Users will have internet access] | BA | User research | [Date] |
| ASS-002 | [e.g. Existing DB can handle new queries] | Dev Lead | Load test | [Date] |

---

## 11. Risks and Mitigations

| ID | Risk | Likelihood | Impact | Severity | Mitigation |
|---|---|---|---|---|---|
| R-001 | [Risk description] | High/Med/Low | High/Med/Low | H/M/L | [Action to reduce or accept] |
| R-002 | [Risk description] | High/Med/Low | High/Med/Low | H/M/L | [Action to reduce or accept] |

**Severity = Likelihood × Impact** (High×High = Critical, etc.)

---

## 12. Success Metrics

*How will we know the project succeeded? Define these before development starts.*

| Metric | Baseline (Now) | Target | Measurement Method | Timeframe |
|---|---|---|---|---|
| [e.g. Time to complete invoice] | [e.g. 45 min/week] | [e.g. < 10 min/week] | [In-app time tracking] | [60 days post-launch] |
| [e.g. User adoption] | [e.g. 0] | [e.g. 100 active users] | [Analytics dashboard] | [90 days post-launch] |

---

## 13. Glossary

| Term | Definition |
|---|---|
| [Term] | [Clear, jargon-free definition] |
| MVP | Minimum Viable Product — the smallest version of the product that delivers core value |
| BRD | Business Requirements Document — this document |
| FRS | Functional Requirements Specification — detailed feature-level requirements |
| AC | Acceptance Criteria — conditions that prove a feature is complete |
| MoSCoW | Prioritization framework: Must Have, Should Have, Could Have, Won't Have |

---

## 14. Appendix

### A. Referenced Documents

| Document | Version | Location |
|---|---|---|
| Functional Requirements Specification (FRS) | 1.0 | [Link] |
| Project Backlog | 1.0 | [Link] |
| Project Plan / Phase Map | 1.0 | [Link] |
| Wireframes / Designs | [Version] | [Link] |

### B. Revision Notes

[Notes from review sessions, key decisions made, rationale for changes]

---

*This document is considered the source of truth for what this project is, why it exists, and what it must achieve. Any change to scope, objectives, or requirements requires a version increment and re-approval.*
