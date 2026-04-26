#!/usr/bin/env python3
"""
Requirements Elicitor
Business and Project Consultant — Guided Q&A that uncovers functional,
non-functional, and business requirements from a vague idea.
Outputs a structured requirements document ready for developer handoff.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from typing import Dict, List, Optional

SKILL_VERSION = "1.1.0"


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


# ─── Vague Answer Nudge ──────────────────────────────────────────────────────
_VAGUE_PHRASES = ("i don't know", "i do not know", "not sure", "idk", "n/a", "na", "tbd", "dunno")


def nudge_if_vague(text: str) -> str:
    """Non-blocking nudge when an answer looks too short or vague."""
    is_short = len(text.strip()) < 10
    is_vague = any(phrase in text.lower() for phrase in _VAGUE_PHRASES)
    if is_short or is_vague:
        print(f"\n{C.YELLOW}  ⚠ That's a bit short — can you be more specific?{C.RESET}")
        print(f"{C.DIM}  Press Enter to keep it, or type a better answer:{C.RESET}")
        better = input("  → ").strip()
        if better:
            return better
    return text


# ─── Smart Priority & Rationale Resolution ───────────────────────────────────
_RECOMMEND_TRIGGERS = (
    "don't know", "do not know", "not sure", "unsure", "idk", "no idea",
    "recommend", "suggest", "your call", "you decide", "help me", "dunno",
    "not certain", "you choose", "auto", "default",
)

def _is_recommend(text: str) -> bool:
    t = text.lower()
    return not text or any(p in t for p in _RECOMMEND_TRIGGERS)

def _normalize_priority(raw: str, default: str) -> str:
    """Map loose input (e.g. 'must', 'critical') to canonical MoSCoW values."""
    t = raw.lower()
    if any(x in t for x in ("must", "critical", "required", "mandatory")):
        return "Must Have"
    if any(x in t for x in ("should", "important", "high")):
        return "Should Have"
    if any(x in t for x in ("could", "nice", "low", "optional")):
        return "Could Have"
    return default  # fall back to caller's default if unrecognised

_PRIORITY_GUIDE: Dict[str, tuple] = {
    # source → (recommended_priority, plain-English reason)
    "Business Outcome": ("Must Have",    "Business outcomes define why the app exists — no outcome, no product."),
    "Success Metric":   ("Should Have",  "Metrics let you know when you've achieved the goal."),
    "Business Risk":    ("Must Have",    "Understanding the cost of inaction clarifies the stakes."),
    "Stakeholder Need": ("Should Have",  "Stakeholder needs guide features but urgency varies."),
    "Compliance":       ("Must Have",    "Legal and regulatory requirements are non-negotiable."),
    "Create Operations":("Must Have",    "Core create functionality is foundational to most apps."),
    "Read Operations":  ("Must Have",    "Without read capability, created data has no value to the user."),
    "Update Operations":("Should Have",  "Edit functionality is important but secondary to create/read."),
    "Delete Operations":("Should Have",  "Users need control over their data, though this can sometimes be phased."),
    "Notifications":    ("Should Have",  "Notifications improve UX but are rarely blocking for MVP."),
    "Auth & Access":    ("Must Have",    "Authentication is required before any personal data can be stored."),
    "Integrations":     ("Could Have",   "Third-party integrations add value but are often phase-able."),
    "Reporting":        ("Could Have",   "Data visibility is valuable but rarely a hard MVP blocker."),
    "Error Handling":   ("Should Have",  "Clear errors reduce support burden and user frustration."),
    "Performance":      ("Should Have",  "Performance goals set the baseline for a usable experience."),
    "Scalability":      ("Should Have",  "Scalability matters once you have users — plan early but phase late."),
    "Availability":     ("Should Have",  "Uptime requirements affect infrastructure choices."),
    "Security":         ("Must Have",    "Security flaws can sink a product before it launches."),
    "Accessibility":    ("Should Have",  "Accessibility broadens your user base and may be legally required."),
    "Compatibility":    ("Must Have",    "Unsupported browsers/devices block users from using the app at all."),
    "Data":             ("Should Have",  "Data retention policies avoid legal risk and user data loss."),
    "Observability":    ("Should Have",  "Logging and monitoring are essential once you have real users."),
}
_PRIORITY_DEFAULT = ("Should Have", "This requirement supports the overall quality and value of the project.")

_RATIONALE_GUIDE: Dict[str, str] = {
    "Business Outcome": "This defines the core business value the app must deliver.",
    "Success Metric":   "Measurable outcomes allow stakeholders to evaluate ROI and make go/no-go decisions.",
    "Business Risk":    "Documenting business risk clarifies the cost of inaction.",
    "Stakeholder Need": "Capturing stakeholder needs ensures alignment before development begins.",
    "Compliance":       "Legal and regulatory compliance is a non-negotiable foundation.",
    "Create Operations":"Users must be able to create data — foundational to most apps.",
    "Read Operations":  "Without read functionality, created data has no value to the user.",
    "Update Operations":"Editable data keeps the app useful over time as situations change.",
    "Delete Operations":"Users need control over their data.",
    "Notifications":    "Timely alerts reduce the need for manual status checks.",
    "Auth & Access":    "Access control protects user data and determines what each role can do.",
    "Integrations":     "Integrations extend the app's value without rebuilding existing systems.",
    "Reporting":        "Data visibility helps users make decisions within the app.",
    "Error Handling":   "Clear error messages prevent user frustration and reduce support burden.",
    "Performance":      "Performance goals define the minimum acceptable user experience.",
    "Security":         "Security requirements protect users and the business from harm.",
}
_RATIONALE_DEFAULT = "This requirement supports the primary goal of the project."


def resolve_priority(source: str, suggested: str = None) -> str:
    rec_priority, rec_reason = _PRIORITY_GUIDE.get(source, _PRIORITY_DEFAULT)
    if suggested:
        rec_priority = suggested

    print(f"\n  {C.DIM}Suggested priority: {C.RESET}{C.BOLD}{C.CYAN}{rec_priority}{C.RESET}  "
          f"{C.DIM}({rec_reason}){C.RESET}")
    raw = input(f"  Priority [Enter = accept '{rec_priority}', or type Must Have / Should Have / Could Have]: ").strip()

    if not raw or _is_recommend(raw):
        return rec_priority
    return _normalize_priority(raw, rec_priority)


def resolve_rationale(source: str) -> str:
    suggestion = _RATIONALE_GUIDE.get(source, _RATIONALE_DEFAULT)
    print(f"\n  {C.DIM}Suggested rationale: \"{suggestion}\"{C.RESET}")
    raw = input(f"  Why is this required? [Enter = accept suggestion, or type your own]: ").strip()
    if not raw or _is_recommend(raw):
        return suggestion
    return raw


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
    header("SECTION 1 — YOUR PROJECT")
    info(
        "Let's start simple. Just tell me about your idea in plain words.\n"
        "There are no wrong answers — the more honest you are, the better the output."
    )

    session.project_name    = ask("What do you want to call this app or project?")
    session.project_context = ask(
        "Describe it like you're explaining it to a friend.\n"
        "  What is it, and what does it do?"
    )
    session.target_users    = ask(
        "Who is this for?\n"
        "  (e.g. 'freelance designers', 'small restaurant owners', 'students studying for exams')"
    )
    session.primary_goal    = ask(
        "If this app could only do one thing really well, what would that be?\n"
        "  (e.g. 'let users track their expenses', 'help people find a doctor nearby')"
    )
    success("Got it. Foundation set.")


def elicit_business_requirements(session: ElicitationSession) -> None:
    header("SECTION 2 — WHY ARE YOU BUILDING THIS?")
    info(
        "These questions are about the big picture — the reason this app needs to exist.\n"
        "Don't overthink it. Short, honest answers work best.\n"
        "Type 'skip' on any question you want to skip."
    )

    questions = [
        ("What should this app make better, easier, or faster for your users?",  "Business Outcome"),
        ("How will you know if the app is working? What would success look like?", "Success Metric"),
        ("What happens if you never build this — what pain stays unsolved?",       "Business Risk"),
        ("Besides end users, who else cares about this? (e.g. your boss, investors, a client)", "Stakeholder Need"),
        ("Are there any rules, laws, or policies this app needs to follow?\n  (e.g. data privacy, medical regulations, age restrictions — type 'skip' if unsure)", "Compliance"),
    ]

    total = len(questions)
    for i, (q, source) in enumerate(questions, 1):
        print(f"\n{C.DIM}  Question {i} of {total}{C.RESET}")
        ans = ask(q)
        if ans.lower() in ("done", "skip") or not ans:
            continue
        ans = nudge_if_vague(ans)
        priority  = resolve_priority(source)
        rationale = resolve_rationale(source)
        session.add_requirement("Business", ans, priority, rationale, source)
        success(f"Business requirement added.  [{priority}]")

    print(f"\n{C.DIM}Optional: anything else about WHY this app needs to exist? Press Enter to move on.{C.RESET}")
    while True:
        ans = ask("Anything to add? (or just press Enter to continue)")
        if ans.lower() == "done" or not ans:
            break
        priority  = resolve_priority("Business Outcome")
        rationale = resolve_rationale("Business Outcome")
        session.add_requirement("Business", ans, priority, rationale, "Stakeholder")
        success(f"Added.  [{priority}]")


def elicit_functional_requirements(session: ElicitationSession) -> None:
    header("SECTION 3 — WHAT SHOULD THE APP DO?")
    info(
        "Now let's talk about the actual features — what can users do inside the app?\n"
        "Answer in plain English. Example: 'Users can upload a photo of their receipt.'\n"
        "Type 'skip' on any question that doesn't apply to your app."
    )

    prompts = [
        ("What can users create, add, or submit in your app?\n"
         "  (e.g. 'create an invoice', 'post a message', 'submit an order')",     "Create Operations"),
        ("What can users see, search, or look up?\n"
         "  (e.g. 'view their transaction history', 'search for a product')",     "Read Operations"),
        ("What can users change or update after it's been created?\n"
         "  (e.g. 'edit their profile', 'update an order status')",               "Update Operations"),
        ("What can users remove or delete?\n"
         "  (e.g. 'delete an old invoice', 'remove a saved address')",            "Delete Operations"),
        ("Should the app send any messages or alerts to users?\n"
         "  (e.g. 'email when a payment is received', 'push notification for a reminder')", "Notifications"),
        ("Do users need to log in? Should different users see different things?\n"
         "  (e.g. 'admin vs regular user', 'login with Google')",                 "Auth & Access"),
        ("Does your app need to connect to any other tools or services?\n"
         "  (e.g. 'Stripe for payments', 'Google Maps', 'an existing database')", "Integrations"),
        ("Do you need any charts, reports, or a dashboard?\n"
         "  (e.g. 'monthly sales summary', 'user activity graph')",               "Reporting"),
        ("What should happen when something goes wrong?\n"
         "  (e.g. 'show a friendly error message', 'retry automatically')",       "Error Handling"),
    ]

    total = len(prompts)
    for i, (q, source) in enumerate(prompts, 1):
        print(f"\n{C.DIM}  Question {i} of {total}  (type 'skip' to skip this one){C.RESET}")
        ans = ask(q)
        if ans.lower() in ("done", "skip") or not ans:
            continue
        priority  = resolve_priority(source)
        rationale = resolve_rationale(source)
        session.add_requirement("Functional", ans, priority, rationale, source)
        success(f"Functional requirement added.  [{priority}]")

    print(f"\n{C.DIM}Optional: any other features the app needs? Press Enter to move on.{C.RESET}")
    while True:
        ans = ask("Any other feature to add? (or just press Enter to continue)")
        if ans.lower() == "done" or not ans:
            break
        priority  = resolve_priority("Create Operations")
        rationale = resolve_rationale("Create Operations")
        session.add_requirement("Functional", ans, priority, rationale, "Custom")
        success(f"Added.  [{priority}]")


def elicit_non_functional_requirements(session: ElicitationSession) -> None:
    header("SECTION 4 — HOW SHOULD THE APP PERFORM?")
    info(
        "These questions aren't about features — they're about quality and reliability.\n"
        "Think of it as: what would make users trust and keep using the app?\n"
        "Type 'skip' on anything you're not sure about — we'll use sensible defaults."
    )

    nfr_prompts = [
        ("How fast should the app feel?\n"
         "  (e.g. 'pages should load in under 2 seconds', or type 'skip' to use a standard default)", "Performance",   "Should Have"),
        ("How many people do you expect to use it at the same time?\n"
         "  (e.g. '10 users during beta', '1,000 at launch', or 'skip' if you don't know yet)",     "Scalability",   "Should Have"),
        ("Can the app have downtime, or does it need to always be available?\n"
         "  (e.g. 'it's fine if it's down for maintenance', '99.9% uptime required')",               "Availability",  "Should Have"),
        ("What personal or sensitive data will the app store?\n"
         "  (e.g. 'email addresses and passwords', 'payment info', 'health records')",               "Security",      "Must Have"),
        ("Do you need to support users with disabilities?\n"
         "  (e.g. 'yes, screen reader support', 'basic keyboard navigation', or 'skip')",           "Accessibility", "Should Have"),
        ("What devices and browsers should it work on?\n"
         "  (e.g. 'Chrome and Safari on desktop', 'mobile phones too')",                             "Compatibility", "Must Have"),
        ("How long should user data be kept, and does it need to be backed up?\n"
         "  (e.g. 'keep data for 1 year', 'daily backups', or 'skip')",                             "Data",          "Should Have"),
        ("Do you need to track errors or know when something breaks in production?\n"
         "  (e.g. 'yes, error alerts via email', 'basic logging is fine', or 'skip')",              "Observability", "Should Have"),
    ]

    total = len(nfr_prompts)
    for i, (q, source, default_priority) in enumerate(nfr_prompts, 1):
        print(f"\n{C.DIM}  Question {i} of {total}  (type 'skip' to skip){C.RESET}")
        ans = ask(q)
        if ans.lower() in ("skip", "done", "") or not ans:
            continue
        priority  = resolve_priority(source, suggested=default_priority)
        rationale = resolve_rationale(source)
        session.add_requirement("Non-Functional", ans, priority, rationale, source)
        success(f"NFR ({source}) added.  [{priority}]")


def elicit_constraints(session: ElicitationSession) -> None:
    header("SECTION 5 — LIMITS & BELIEFS")
    info(
        "Constraints are things that are fixed and can't be changed — like your tech choice,\n"
        "your deadline, or your budget. Assumptions are things you believe are true but\n"
        "haven't confirmed yet. Both are important to write down.\n"
        "Type 'skip' on any question that doesn't apply."
    )

    print(f"\n{C.BOLD}Fixed Limits (Constraints):{C.RESET}")
    constraint_prompts = [
        ("Is there a specific technology, framework, or platform you HAVE to use?\n"
         "  (e.g. 'must use React', 'has to run on AWS', or 'skip' if flexible)"),
        ("Do you have a budget or team size limit?\n"
         "  (e.g. 'solo developer', '$500/month max running cost', or 'skip')"),
        ("Is there a hard launch date or deadline?\n"
         "  (e.g. 'must be ready by June', 'need MVP in 4 weeks', or 'skip')"),
        ("Does this app need to connect to a system that already exists?\n"
         "  (e.g. 'must sync with our existing CRM', or 'skip')"),
    ]
    for q in constraint_prompts:
        ans = ask(q)
        if ans.lower() in ("done", "skip", "") or not ans:
            continue
        session.constraints.append(ans)
        session.add_requirement("Constraint", ans, "Must Have", "Hard limit on design/build", "Constraints Workshop")
        success("Constraint noted.")

    print(f"\n{C.DIM}Optional: any other fixed limits? Press Enter to move on.{C.RESET}")
    while True:
        ans = ask("Any other fixed limit? (or just press Enter to continue)")
        if ans.lower() == "done" or not ans:
            break
        session.constraints.append(ans)
        session.add_requirement("Constraint", ans, "Must Have", "Hard limit", "Custom")
        success("Noted.")

    print(f"\n{C.BOLD}Beliefs & Assumptions:{C.RESET}")
    assumption_prompts = [
        ("How tech-savvy are your users? Can they figure things out, or do they need hand-holding?\n"
         "  (e.g. 'they're comfortable with apps', 'very non-technical', or 'skip')"),
        ("What do you assume will already be in place when this launches?\n"
         "  (e.g. 'users have a smartphone', 'stable internet available', or 'skip')"),
        ("What are you assuming about whether people actually want this?\n"
         "  (e.g. 'freelancers hate invoicing', 'there's no good free alternative', or 'skip')"),
    ]
    for q in assumption_prompts:
        ans = ask(q)
        if ans.lower() in ("done", "skip", "") or not ans:
            continue
        session.assumptions.append(ans)
        session.add_requirement("Assumption", ans, "Could Have", "Needs validation before shipping", "Assumption Log")
        success("Assumption noted.")

    print(f"\n{C.DIM}Optional: any other assumptions? Press Enter to move on.{C.RESET}")
    while True:
        ans = ask("Any other assumption? (or just press Enter to continue)")
        if ans.lower() == "done" or not ans:
            break
        session.assumptions.append(ans)
        session.add_requirement("Assumption", ans, "Could Have", "Needs validation", "Custom")
        success("Noted.")


def elicit_out_of_scope(session: ElicitationSession) -> None:
    header("SECTION 6 — WHAT WON'T YOU BUILD?")
    info(
        "This is one of the most important sections — and most people skip it.\n"
        "Listing what you WON'T build prevents feature creep and\n"
        "stops developers from building things nobody asked for.\n\n"
        "Think: what would people expect this app to do, but you're not including yet?\n"
        "(e.g. 'no mobile app yet', 'no payment processing in V1', 'no admin panel')\n"
        "Type 'done' when finished."
    )

    while True:
        ans = ask("What's something this app will NOT do (at least not yet)? (or 'done')")
        if ans.lower() == "done":
            if not session.out_of_scope:
                warn("Tip: at least one out-of-scope item is strongly recommended — it protects you from scope creep.")
                continue_anyway = ask("Skip this section anyway? (yes / no)")
                if continue_anyway.lower() in ("yes", "y"):
                    break
            else:
                break
        elif ans:
            session.out_of_scope.append(ans)
            success("Noted as out of scope.")


def elicit_stakeholders(session: ElicitationSession) -> None:
    header("SECTION 7 — WHO'S INVOLVED?")
    info(
        "Who else has a stake in this project beyond the end users?\n"
        "This could be you, a client, a manager, investors, or a team member.\n"
        "Type 'done' when you've added everyone (or right away to skip this section)."
    )

    roles = ["End User", "Business Owner", "Developer", "QA", "Marketing", "Finance", "Legal"]

    while True:
        name = ask("Person's name (or 'done' to finish)")
        if name.lower() == "done" or not name:
            break
        role = ask(f"What's their role? (e.g. {', '.join(roles)})")
        interest = ask("What do they care about most in this project?\n  (e.g. 'wants it launched fast', 'needs to approve the budget')")
        influence = ask("How much say do they have? (High / Medium / Low)")
        session.stakeholders.append({
            "name": name,
            "role": role,
            "interest": interest,
            "influence": influence,
        })
        success(f"Added {name}.")


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

    cwd = os.getcwd()
    md_content = render_requirements_doc(session)
    md_content += f"\n\n---\n_Generated by Business and Project Consultant v{SKILL_VERSION}_\n"

    json_content = json.loads(render_json(session))
    json_content["skill_version"] = SKILL_VERSION

    with open(md_file, "w", encoding="utf-8") as f:
        f.write(md_content)
    with open(js_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(json_content, indent=2))

    success(f"Requirements doc → {os.path.join(cwd, md_file)}")
    success(f"JSON export      → {os.path.join(cwd, js_file)}")
    return js_file


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
    print("  Let's figure out what you're building")
    print(f"{'═' * 60}{C.RESET}")
    info(
        "This is a guided conversation \u2014 not a form, not a test.\n"
        "Answer in plain words. You can't get this wrong.\n\n"
        "By the end, you'll have a clear requirements document you can hand\n"
        "to a developer (or paste into Copilot) and get exactly what you want.\n\n"
        "  \u2022 Type 'skip' on any question to move on\n"
        "  \u2022 Press Enter on priority/rationale prompts to accept the suggestion\n"
        "  \u2022 Press Ctrl+C at any time to exit without saving\n\n"
        "Estimated time: 15\u201330 minutes."
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
    answer = ask(
        "\nReady to save your requirements document? (yes to save / no to exit without saving)"
    )
    if answer.lower() not in ("yes", "y"):
        print(f"\n{C.YELLOW}⚠ Save cancelled. Run the script again to start over.{C.RESET}\n")
        sys.exit(0)
    saved_json = save_outputs(session)

    header("DONE")
    print(f"\n  Your requirements document is ready for stakeholder review.")
    print(f"  Next step: run idea_to_backlog.py to convert these requirements into a backlog.\n")
    print(f"  Tip — pass your JSON output to skip re-entering project context:")
    print(f"  python3 scripts/idea_to_backlog.py --from-requirements {saved_json}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=(
            "Business and Project Consultant v" + SKILL_VERSION + "\n"
            "Interactive requirements elicitation wizard.\n"
            "Guides you through capturing Business, Functional, Non-Functional,\n"
            "Constraint, and Assumption requirements from any project idea.\n\n"
            "Run from your project root directory. Output files are saved there."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {SKILL_VERSION}")
    parser.parse_args()
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{C.YELLOW}⚠ Wizard cancelled. No files were saved.{C.RESET}\n")
        sys.exit(0)
