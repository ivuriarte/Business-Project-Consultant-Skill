#!/usr/bin/env python3
"""
Requirements Elicitor
Business and Project Consultant — Guided Q&A that uncovers functional,
non-functional, and business requirements from a vague idea.
Outputs a structured requirements document ready for developer handoff.
"""

import json
import re
import sys
from datetime import datetime
from typing import Dict, List, Optional


# ─── ANSI Colors ────────────────────────────────────────────────────────────
class C:
    BOLD   = "\033[1m"
    CYAN   = "\033[96m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    RED    = "\033[91m"
    DIM    = "\033[2m"
    RESET  = "\033[0m"
    LINE   = "─" * 60


def header(text: str):
    print(f"\n{C.BOLD}{C.CYAN}{C.LINE}")
    print(f"  {text}")
    print(f"{C.LINE}{C.RESET}")


def ask(text: str) -> str:
    return input(f"\n{C.YELLOW}▶ {text}{C.RESET}\n  → ").strip()


def info(text: str):
    print(f"\n{C.DIM}{text}{C.RESET}")


def success(text: str):
    print(f"\n{C.GREEN}✓ {text}{C.RESET}")


def warn(text: str):
    print(f"\n{C.RED}⚠ {text}{C.RESET}")


# ─── Requirement Model ───────────────────────────────────────────────────────
class Requirement:
    TYPES = ["Functional", "Non-Functional", "Business", "Constraint", "Assumption"]

    def __init__(
        self,
        req_id: str,
        req_type: str,
        description: str,
        priority: str,
        rationale: str,
        source: str,
    ):
        self.req_id      = req_id
        self.req_type    = req_type
        self.description = description
        self.priority    = priority
        self.rationale   = rationale
        self.source      = source
        self.status      = "Pending"

    def to_dict(self) -> dict:
        return {
            "id":          self.req_id,
            "type":        self.req_type,
            "description": self.description,
            "priority":    self.priority,
            "rationale":   self.rationale,
            "source":      self.source,
            "status":      self.status,
        }


# ─── Counter helper ──────────────────────────────────────────────────────────
class IDCounter:
    def __init__(self):
        self.counts: Dict[str, int] = {}

    def next(self, prefix: str) -> str:
        self.counts[prefix] = self.counts.get(prefix, 0) + 1
        return f"{prefix}-{self.counts[prefix]:03d}"


# ─── Session ─────────────────────────────────────────────────────────────────
class ElicitationSession:
    def __init__(self):
        self.project_name:       str = ""
        self.project_context:    str = ""
        self.target_users:       str = ""
        self.primary_goal:       str = ""
        self.constraints:        List[str] = []
        self.assumptions:        List[str] = []
        self.requirements:       List[Requirement] = []
        self.out_of_scope:       List[str] = []
        self.stakeholders:       List[Dict] = []
        self.created_at:         str = datetime.now().strftime("%Y-%m-%d %H:%M")
        self._id_counter         = IDCounter()

    def add_requirement(
        self, req_type: str, description: str, priority: str, rationale: str, source: str
    ) -> Requirement:
        prefix_map = {
            "Functional":     "FR",
            "Non-Functional": "NFR",
            "Business":       "BR",
            "Constraint":     "CON",
            "Assumption":     "ASS",
        }
        prefix = prefix_map.get(req_type, "REQ")
        req_id = self._id_counter.next(prefix)
        req    = Requirement(req_id, req_type, description, priority, rationale, source)
        self.requirements.append(req)
        return req


# ─── Elicitation Sections ────────────────────────────────────────────────────
def elicit_context(session: ElicitationSession) -> None:
    header("SECTION 1 — PROJECT CONTEXT")
    info("Set the foundation. Everything else flows from this.")

    session.project_name    = ask("What is the name of this project or app?")
    session.project_context = ask(
        "Describe the project in 2–3 sentences.\n  What is it? What does it do?"
    )
    session.target_users    = ask(
        "Who are the primary users?\n  (Be specific: role, context, pain point)"
    )
    session.primary_goal    = ask(
        "What is the single most important thing this app must accomplish?\n"
        "  (If it only did one thing, what would it be?)"
    )
    success("Context captured.")


def elicit_business_requirements(session: ElicitationSession) -> None:
    header("SECTION 2 — BUSINESS REQUIREMENTS")
    info(
        "Business requirements answer the WHY.\n"
        "They describe goals, outcomes, and strategic objectives.\n"
        "Type 'done' when finished."
    )

    questions = [
        ("What business outcome must this app deliver?",          "Business Outcome"),
        ("What metrics will measure success?",                     "Success Metric"),
        ("What happens if this app is NOT built?",                 "Business Risk"),
        ("Who are the key stakeholders and what do they need?",    "Stakeholder Need"),
        ("Are there regulatory, legal, or compliance requirements?","Compliance"),
    ]

    for q, source in questions:
        ans = ask(q)
        if ans.lower() == "done" or not ans:
            continue
        priority = ask(f'Priority for this requirement? (Must Have / Should Have / Could Have)')
        rationale = ask(f"Why is this requirement important?")
        session.add_requirement("Business", ans, priority, rationale, source)
        success(f"Business requirement added.")

    print(f"\n{C.DIM}Add any additional business requirements. Type 'done' to continue.{C.RESET}")
    while True:
        ans = ask("Additional business requirement (or 'done')")
        if ans.lower() == "done":
            break
        priority  = ask("Priority? (Must Have / Should Have / Could Have)")
        rationale = ask("Why is this important?")
        session.add_requirement("Business", ans, priority, rationale, "Stakeholder")
        success("Added.")


def elicit_functional_requirements(session: ElicitationSession) -> None:
    header("SECTION 3 — FUNCTIONAL REQUIREMENTS")
    info(
        "Functional requirements answer the WHAT.\n"
        "They describe what the system must DO — specific behaviours and capabilities.\n\n"
        "Use the JTBD format: 'The system must allow [actor] to [action] so that [outcome].'\n"
        "Type 'done' when finished."
    )

    prompts = [
        ("What must a user be able to create, add, or submit?",       "Create Operations"),
        ("What must a user be able to read, view, or search?",        "Read Operations"),
        ("What must a user be able to edit or update?",               "Update Operations"),
        ("What must a user be able to delete or remove?",             "Delete Operations"),
        ("Are there any notifications or alerts the system must send?","Notifications"),
        ("What authentication or access control is needed?",          "Auth & Access"),
        ("Are there any integrations with third-party systems?",      "Integrations"),
        ("Are there any reporting or dashboard features needed?",     "Reporting"),
        ("What happens on errors or edge cases?",                     "Error Handling"),
    ]

    for q, source in prompts:
        ans = ask(q)
        if ans.lower() == "done" or not ans:
            continue
        priority  = ask("Priority? (Must Have / Should Have / Could Have)")
        rationale = ask("Why is this required?")
        session.add_requirement("Functional", ans, priority, rationale, source)
        success("Functional requirement added.")

    print(f"\n{C.DIM}Add any remaining functional requirements. Type 'done' to continue.{C.RESET}")
    while True:
        ans = ask("Additional functional requirement (or 'done')")
        if ans.lower() == "done":
            break
        priority  = ask("Priority? (Must Have / Should Have / Could Have)")
        rationale = ask("Why is this required?")
        session.add_requirement("Functional", ans, priority, rationale, "Custom")
        success("Added.")


def elicit_non_functional_requirements(session: ElicitationSession) -> None:
    header("SECTION 4 — NON-FUNCTIONAL REQUIREMENTS")
    info(
        "Non-functional requirements answer HOW WELL.\n"
        "They define quality attributes: performance, security, scalability, usability.\n"
        "Skipping these is the #1 cause of 'works on my machine' failures in production.\n"
        "Type 'skip' to skip a question."
    )

    nfr_prompts = [
        ("How fast must the app respond? (e.g. pages load in < 2s)",              "Performance",   "Should Have"),
        ("How many concurrent users must it handle? (e.g. 1,000 simultaneous)",  "Scalability",   "Should Have"),
        ("What are the uptime / availability requirements? (e.g. 99.9%)",         "Availability",  "Should Have"),
        ("What security requirements exist? (e.g. data encryption, OWASP Top 10)","Security",      "Must Have"),
        ("What accessibility standards apply? (e.g. WCAG 2.1 AA)",               "Accessibility", "Should Have"),
        ("What browsers or devices must be supported?",                           "Compatibility", "Must Have"),
        ("Are there data retention or backup requirements?",                      "Data",          "Should Have"),
        ("Are there audit logging or monitoring requirements?",                   "Observability", "Should Have"),
    ]

    for q, source, default_priority in nfr_prompts:
        ans = ask(q)
        if ans.lower() in ("skip", "done", ""):
            continue
        priority  = ask(f"Priority? (default: {default_priority}) — press Enter to accept")
        if not priority:
            priority = default_priority
        session.add_requirement("Non-Functional", ans, priority, source, source)
        success(f"NFR ({source}) added.")


def elicit_constraints(session: ElicitationSession) -> None:
    header("SECTION 5 — CONSTRAINTS & ASSUMPTIONS")
    info(
        "Constraints are hard limits that cannot be changed (budget, tech, deadlines).\n"
        "Assumptions are things you believe to be true but haven't verified.\n"
        "Both must be documented — they govern every decision you make."
    )

    print(f"\n{C.BOLD}Constraints:{C.RESET} Type 'done' when finished.")
    constraint_prompts = [
        "What technology stack MUST be used?",
        "What is the budget or resource limit?",
        "Are there any hard deadlines?",
        "What existing systems must be integrated with?",
    ]
    for q in constraint_prompts:
        ans = ask(q)
        if ans.lower() in ("done", "skip", ""):
            continue
        session.constraints.append(ans)
        req = session.add_requirement("Constraint", ans, "Must Have", "Hard limit on design/build", "Constraints Workshop")
        success("Constraint added.")

    while True:
        ans = ask("Additional constraint (or 'done')")
        if ans.lower() == "done":
            break
        session.constraints.append(ans)
        session.add_requirement("Constraint", ans, "Must Have", "Hard limit", "Custom")
        success("Added.")

    print(f"\n{C.BOLD}Assumptions:{C.RESET} Type 'done' when finished.")
    assumption_prompts = [
        "What do you assume about the users' technical ability?",
        "What infrastructure or services do you assume are available?",
        "What do you assume about the market or user demand?",
    ]
    for q in assumption_prompts:
        ans = ask(q)
        if ans.lower() in ("done", "skip", ""):
            continue
        session.assumptions.append(ans)
        session.add_requirement("Assumption", ans, "Could Have", "Needs validation before shipping", "Assumption Log")
        success("Assumption logged.")

    while True:
        ans = ask("Additional assumption (or 'done')")
        if ans.lower() == "done":
            break
        session.assumptions.append(ans)
        session.add_requirement("Assumption", ans, "Could Have", "Needs validation", "Custom")
        success("Added.")


def elicit_out_of_scope(session: ElicitationSession) -> None:
    header("SECTION 6 — OUT OF SCOPE")
    info(
        "Explicitly defining what is OUT of scope is just as important as defining\n"
        "what IS in scope. It prevents scope creep and sets developer expectations.\n"
        "Type 'done' when finished."
    )

    while True:
        ans = ask("What is explicitly NOT included in this project? (or 'done')")
        if ans.lower() == "done":
            if not session.out_of_scope:
                warn("At least one out-of-scope item is strongly recommended. Add one or type 'done'.")
                continue_anyway = ask("Continue anyway? (yes/no)")
                if continue_anyway.lower() in ("yes", "y"):
                    break
            else:
                break
        elif ans:
            session.out_of_scope.append(ans)
            success("Out of scope item logged.")


def elicit_stakeholders(session: ElicitationSession) -> None:
    header("SECTION 7 — STAKEHOLDER REGISTER")
    info(
        "List the key people involved: who uses it, who approves it, who is affected.\n"
        "Type 'done' when finished."
    )

    roles = ["End User", "Business Owner", "Developer", "QA", "Marketing", "Finance", "Legal"]

    while True:
        name = ask("Stakeholder name (or 'done')")
        if name.lower() == "done":
            break
        role = ask(f"Role? (e.g. {', '.join(roles)})")
        interest = ask("What is their interest in this project?")
        influence = ask("Influence level? (High / Medium / Low)")
        session.stakeholders.append({
            "name": name,
            "role": role,
            "interest": interest,
            "influence": influence,
        })
        success(f"Stakeholder '{name}' added.")


# ─── Output Rendering ────────────────────────────────────────────────────────
def render_requirements_doc(session: ElicitationSession) -> str:
    lines = []
    lines.append(f"# Requirements Document — {session.project_name}")
    lines.append(f"_Elicited: {session.created_at}_\n")

    lines.append("## 1. Project Overview")
    lines.append(f"**Name:** {session.project_name}")
    lines.append(f"**Context:** {session.project_context}")
    lines.append(f"**Target Users:** {session.target_users}")
    lines.append(f"**Primary Goal:** {session.primary_goal}\n")

    # Group by type
    type_order = ["Business", "Functional", "Non-Functional", "Constraint", "Assumption"]
    section_names = {
        "Business":       "2. Business Requirements",
        "Functional":     "3. Functional Requirements",
        "Non-Functional": "4. Non-Functional Requirements",
        "Constraint":     "5. Constraints",
        "Assumption":     "6. Assumptions",
    }

    for req_type in type_order:
        group = [r for r in session.requirements if r.req_type == req_type]
        if not group:
            continue
        lines.append(f"## {section_names[req_type]}\n")
        lines.append(f"| ID | Description | Priority | Source |")
        lines.append(f"|---|---|---|---|")
        for r in group:
            desc = r.description.replace("|", "/")
            lines.append(f"| {r.req_id} | {desc} | {r.priority} | {r.source} |")
        lines.append("")

    lines.append("## 7. Out of Scope")
    if session.out_of_scope:
        for item in session.out_of_scope:
            lines.append(f"- {item}")
    else:
        lines.append("_None explicitly defined — revisit before development starts._")
    lines.append("")

    lines.append("## 8. Stakeholder Register\n")
    if session.stakeholders:
        lines.append("| Name | Role | Interest | Influence |")
        lines.append("|---|---|---|---|")
        for s in session.stakeholders:
            lines.append(f"| {s['name']} | {s['role']} | {s['interest']} | {s['influence']} |")
    else:
        lines.append("_No stakeholders defined._")
    lines.append("")

    lines.append("## 9. Requirements Summary")
    type_counts = {}
    for r in session.requirements:
        type_counts[r.req_type] = type_counts.get(r.req_type, 0) + 1
    for t, count in type_counts.items():
        lines.append(f"- {t}: {count}")
    lines.append(f"- **Total: {len(session.requirements)}**")

    lines.append("\n---\n")
    lines.append("_This document was generated by the Business and Project Consultant skill._")
    lines.append("_Review with all stakeholders before starting development._")

    return "\n".join(lines)


def render_json(session: ElicitationSession) -> str:
    return json.dumps(
        {
            "project":           session.project_name,
            "created_at":        session.created_at,
            "context":           session.project_context,
            "target_users":      session.target_users,
            "primary_goal":      session.primary_goal,
            "out_of_scope":      session.out_of_scope,
            "stakeholders":      session.stakeholders,
            "requirements":      [r.to_dict() for r in session.requirements],
            "constraints":       session.constraints,
            "assumptions":       session.assumptions,
        },
        indent=2,
    )


def save_outputs(session: ElicitationSession) -> None:
    header("SAVING REQUIREMENTS DOCUMENT")

    slug    = re.sub(r"[^a-z0-9]+", "-", session.project_name.lower()).strip("-")
    ts      = datetime.now().strftime("%Y%m%d-%H%M")
    md_file = f"{slug}-requirements-{ts}.md"
    js_file = f"{slug}-requirements-{ts}.json"

    with open(md_file, "w") as f:
        f.write(render_requirements_doc(session))
    with open(js_file, "w") as f:
        f.write(render_json(session))

    success(f"Requirements doc → {md_file}")
    success(f"JSON export      → {js_file}")


def print_summary(session: ElicitationSession) -> None:
    header("ELICITATION SUMMARY")

    counts: Dict[str, int] = {}
    for r in session.requirements:
        counts[r.req_type] = counts.get(r.req_type, 0) + 1

    print(f"\n  Project   : {C.BOLD}{session.project_name}{C.RESET}")
    print(f"  Goal      : {session.primary_goal}")
    print(f"\n  Requirements captured:")
    for t, n in counts.items():
        print(f"    {t:20s}: {n}")
    print(f"\n  Out of Scope items : {len(session.out_of_scope)}")
    print(f"  Stakeholders       : {len(session.stakeholders)}")

    must_have = [r for r in session.requirements if r.priority == "Must Have"]
    print(f"\n  {C.BOLD}Must Have requirements: {len(must_have)}{C.RESET}")
    for r in must_have:
        short = r.description[:70] + ("..." if len(r.description) > 70 else "")
        print(f"    [{r.req_id}] {short}")


# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    print(f"\n{C.BOLD}{C.CYAN}{'═' * 60}")
    print("  BUSINESS AND PROJECT CONSULTANT")
    print("  Requirements Elicitation Wizard")
    print(f"{'═' * 60}{C.RESET}")
    info(
        "This wizard guides you through a structured requirements elicitation.\n"
        "Output: A formal requirements document ready for developer handoff.\n\n"
        "Tip: Answer every question thoughtfully.\n"
        "Vague requirements = vague implementations = expensive rework.\n\n"
        "Estimated time: 15–30 minutes."
    )

    session = ElicitationSession()
    elicit_context(session)
    elicit_business_requirements(session)
    elicit_functional_requirements(session)
    elicit_non_functional_requirements(session)
    elicit_constraints(session)
    elicit_out_of_scope(session)
    elicit_stakeholders(session)
    print_summary(session)
    save_outputs(session)

    header("DONE")
    print(f"\n  Your requirements document is ready for stakeholder review.")
    print(f"  Next step: Run idea_to_backlog.py to convert these requirements into a backlog.\n")


if __name__ == "__main__":
    main()
