#!/usr/bin/env python3
"""
Idea to Backlog Generator
Business and Project Consultant — Interactive wizard that converts a raw idea
into a prioritized backlog with Epics, User Stories, Acceptance Criteria,
and greatest-value developer prompts.
"""

import argparse
import json
import os
import sys
import re
from typing import Dict, List, Optional
from datetime import datetime

SKILL_VERSION = "1.3.0"


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


def prompt(text: str) -> str:
    return input(f"\n{C.YELLOW}▶ {text}{C.RESET}\n  → ").strip()


def info(text: str):
    print(f"\n{C.DIM}{text}{C.RESET}")


def success(text: str):
    print(f"\n{C.GREEN}✓ {text}{C.RESET}")


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


# ─── Pipeline Context Loader ─────────────────────────────────────────────────
def load_requirements_prefill(path: str) -> dict:
    """Load project context from a requirements JSON for pre-filling intake prompts."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"\n{C.RED}⚠ Requirements file not found: {path}{C.RESET}")
        return {}
    except json.JSONDecodeError as e:
        print(f"\n{C.RED}⚠ Could not parse requirements file: {e}{C.RESET}")
        return {}

    # Use the first Business requirement as the problem statement
    brs = [r for r in data.get("requirements", []) if r.get("type") == "Business"]
    problem = brs[0].get("description", "") if brs else data.get("context", "")

    # Map business intent fields from requirement sources
    cost_of_inaction  = next(
        (r.get("description", "") for r in brs if r.get("source") == "Business Risk"), ""
    )
    stakeholder_value = next(
        (r.get("description", "") for r in brs if r.get("source") == "Stakeholder Need"), ""
    )
    # Key assumption: first item in the assumptions list from the requirements session
    assumptions_list = data.get("assumptions", [])
    key_assumption   = assumptions_list[0] if assumptions_list else ""

    return {
        "name":             data.get("project", ""),
        "problem":          problem,
        "target_user":      data.get("target_users", ""),
        "cost_of_inaction":  cost_of_inaction,
        "stakeholder_value": stakeholder_value,
        "key_assumption":    key_assumption,
    }


# ─── Data Models ────────────────────────────────────────────────────────────
class AcceptanceCriteria:
    def __init__(self, given: str, when: str, then: str):
        self.given = given
        self.when = when
        self.then = then

    def to_text(self) -> str:
        return f"GIVEN {self.given}, WHEN {self.when}, THEN {self.then}."

    def to_dict(self) -> dict:
        return {"given": self.given, "when": self.when, "then": self.then}


class UserStory:
    def __init__(
        self,
        story_id: str,
        actor: str,
        action: str,
        outcome: str,
        priority: str,
        effort: str,
        phase: str,
        business_value: int,
        user_impact: int,
        feasibility: int,
    ):
        self.story_id = story_id
        self.actor = actor
        self.action = action
        self.outcome = outcome
        self.priority = priority
        self.effort = effort
        self.phase = phase
        self.business_value = business_value
        self.user_impact = user_impact
        self.feasibility = feasibility
        self.ac: List[AcceptanceCriteria] = []

    @property
    def full_text(self) -> str:
        return f"As a {self.actor}, I want to {self.action}, so that {self.outcome}."

    @property
    def value_score(self) -> float:
        return round(
            (self.business_value * 0.40)
            + (self.user_impact * 0.35)
            + (self.feasibility * 0.25),
            2,
        )

    def to_dict(self) -> dict:
        return {
            "id": self.story_id,
            "text": self.full_text,
            "priority": self.priority,
            "effort": self.effort,
            "phase": self.phase,
            "value_score": self.value_score,
            "scores": {
                "business_value": self.business_value,
                "user_impact": self.user_impact,
                "feasibility": self.feasibility,
            },
            "acceptance_criteria": [ac.to_dict() for ac in self.ac],
        }


class Epic:
    def __init__(self, epic_id: str, name: str, business_value: str):
        self.epic_id = epic_id
        self.name = name
        self.business_value = business_value
        self.stories: List[UserStory] = []

    def to_dict(self) -> dict:
        return {
            "id": self.epic_id,
            "name": self.name,
            "business_value": self.business_value,
            "stories": [s.to_dict() for s in self.stories],
        }


class Project:
    def __init__(
        self,
        name: str,
        problem_statement: str,
        target_user: str,
        success_definition: str,
        tech_stack: str,
    ):
        self.name = name
        self.problem_statement = problem_statement
        self.target_user = target_user
        self.success_definition = success_definition
        self.tech_stack = tech_stack
        self.epics: List[Epic] = []
        self.created_at = datetime.now().strftime("%Y-%m-%d %H:%M")
        # Business intent coaching fields (set by intake_project)
        self.cost_of_inaction:  str = ""
        self.stakeholder_value: str = ""
        self.key_assumption:    str = ""


# ─── Intake Wizard ──────────────────────────────────────────────────────────
def intake_project(prefill: Optional[dict] = None) -> Project:
    header("STEP 1 OF 5 — IDEA INTAKE")
    info(
        "Before we build a backlog, we need to understand the idea.\n"
        "Answer each question honestly. Vague answers = vague backlog."
    )

    def _ask(text: str, key: str) -> str:
        """Show a pre-filled default from requirements_elicitor.py output if available."""
        default = (prefill or {}).get(key, "")
        if default:
            print(f"\n{C.YELLOW}▶ {text}{C.RESET}")
            print(f"  {C.DIM}Loaded from requirements: \"{default}\"{C.RESET}")
            override = input("  Press Enter to use this, or type to override: ").strip()
            return override if override else default
        return prompt(text)

    name = _ask("What is the name of this app or project?", "name")
    problem = nudge_if_vague(_ask(
        "What problem does this solve?\n  (e.g. 'Freelancers lose track of client invoices')",
        "problem"
    ))
    target_user = _ask(
        "Who is the primary user?\n  (e.g. 'Freelance designers aged 25-40 who work remotely')",
        "target_user"
    )
    success_definition = prompt(
        "What does success look like in 90 days?\n  (e.g. '100 active users, avg 3 invoices/week sent')"
    )
    tech_stack = prompt(
        "What is the tech stack? (Press Enter to skip)\n  (e.g. 'Next.js, Supabase, Tailwind')"
    )

    # ── Business Intent Coaching ─────────────────────────────────────────────
    # These 3 questions are non-skippable. They force the developer to think
    # like a product owner BEFORE touching a single Epic. This is the most
    # common gap for developers with no BA or business background.
    header("STEP 1b OF 5 — BUSINESS INTENT")
    info(
        "These three questions are the most important ones in this wizard.\n"
        "Developers often skip straight to features — these questions stop that.\n\n"
        "  There are no wrong answers. Short, honest answers are best.\n"
        "  The more clearly you answer these, the more valuable your backlog will be."
    )

    cost_of_inaction = nudge_if_vague(_ask(
        "If you never build this — what pain stays unsolved?\n"
        "  What keeps happening to your users that this app would stop?\n"
        "  (e.g. 'Freelancers keep forgetting to invoice clients and lose money')",
        "cost_of_inaction",
    ))

    stakeholder_value = nudge_if_vague(_ask(
        "Who else benefits if this succeeds — besides the end user?\n"
        "  Think: your employer, a client, investors, a community, yourself financially.\n"
        "  (e.g. 'My agency client needs this to reduce support ticket volume by 40%')",
        "stakeholder_value",
    ))

    key_assumption = nudge_if_vague(_ask(
        "What is your single most important assumption about this idea?\n"
        "  What do you believe is true — but haven't fully confirmed yet?\n"
        "  (e.g. 'I assume freelancers are willing to pay $10/month to avoid this problem')",
        "key_assumption",
    ))
    # ── End Business Intent Coaching ─────────────────────────────────────────

    project = Project(
        name=name,
        problem_statement=problem,
        target_user=target_user,
        success_definition=success_definition,
        tech_stack=tech_stack if tech_stack else "Not specified",
    )
    project.cost_of_inaction  = cost_of_inaction
    project.stakeholder_value = stakeholder_value
    project.key_assumption    = key_assumption

    success(f'Project "{name}" created.')
    return project


# ─── Epic Builder ───────────────────────────────────────────────────────────
PRIORITY_OPTIONS = {"1": "Must Have", "2": "Should Have", "3": "Could Have", "4": "Won't Have"}
EFFORT_OPTIONS   = {"1": "XS (< 1 day)", "2": "S (1–2 days)", "3": "M (3–5 days)", "4": "L (1–2 weeks)", "5": "XL (2+ weeks)"}
PHASE_OPTIONS    = {"0": "Discovery", "1": "MVP", "2": "Stabilization", "3": "Enhancement", "4": "Growth"}


def select_option(label: str, options: Dict[str, str]) -> str:
    print(f"\n{C.YELLOW}▶ {label}{C.RESET}")
    for key, val in options.items():
        print(f"  [{key}] {val}")
    while True:
        choice = input("  → ").strip()
        if choice in options:
            return options[choice]
        print(f"{C.RED}  Invalid choice. Try again.{C.RESET}")


def score_prompt(label: str) -> int:
    print(f"\n{C.YELLOW}▶ {label} (1=low, 5=high){C.RESET}")
    while True:
        val = input("  → ").strip()
        if val.isdigit() and 1 <= int(val) <= 5:
            return int(val)
        print(f"{C.RED}  Enter a number from 1 to 5.{C.RESET}")


def collect_ac(story: UserStory) -> None:
    header(f"ACCEPTANCE CRITERIA for {story.story_id}")
    _action_hint  = story.action[:45] + ("..." if len(story.action) > 45 else "")
    _outcome_hint = story.outcome[:55] + ("..." if len(story.outcome) > 55 else "")
    info(
        "Acceptance criteria define exactly when a feature is 'done'.\n"
        "Write one test scenario per criterion using GIVEN / WHEN / THEN.\n\n"
        "  GIVEN = the starting condition    e.g. 'I am on the login page'\n"
        "  WHEN  = the action taken          e.g. 'I click the Submit button'\n"
        "  THEN  = the expected result       e.g. 'I see a success confirmation'\n\n"
        f"Suggested first criterion for '{_action_hint}':\n"
        f"  GIVEN → the {story.actor} is ready\n"
        f"  WHEN  → they {_action_hint}\n"
        f"  THEN  → {_outcome_hint}"
    )
    idx = 1
    while True:
        given = prompt(f"AC #{idx} — GIVEN  (e.g. 'I am on the login page') — type 'done' to finish")
        if given.lower() == "done":
            if not story.ac:
                print(f"{C.RED}  At least one AC is required.{C.RESET}")
                continue
            break
        when = prompt(f"AC #{idx} — WHEN   (e.g. 'I click the Submit button')")
        then = prompt(f"AC #{idx} — THEN   (e.g. 'I see the expected result')")
        story.ac.append(AcceptanceCriteria(given, when, then))
        success(f"AC #{idx} added.")
        idx += 1


def collect_stories(epic: Epic, story_counter: List[int]) -> None:
    header(f"STORIES for Epic: {epic.name}")
    info("Type 'done' at the actor prompt to finish adding stories to this epic.")

    while True:
        actor = prompt("Story — Who is the actor? (or type 'done' to finish this epic)")
        if actor.lower() == "done":
            if not epic.stories:
                print(f"{C.RED}  At least one story is required per epic.{C.RESET}")
                continue
            break

        action  = prompt("Story — What do they want to DO?")
        _raw_outcome = prompt("Story — Why? What OUTCOME do they get?\n  (e.g. 'they can track their spending without using a spreadsheet')")
        # Strip leading 'so that' / 'so' — the full_text template adds it
        _raw_outcome = re.sub(r'^so\s+that\s+', '', _raw_outcome.strip(), flags=re.IGNORECASE).strip()
        _raw_outcome = re.sub(r'^so\s+', '', _raw_outcome.strip(), flags=re.IGNORECASE).strip()
        outcome = nudge_if_vague(_raw_outcome)

        priority    = select_option("Priority (MoSCoW)", PRIORITY_OPTIONS)
        effort      = select_option("Effort Estimate", EFFORT_OPTIONS)
        phase       = select_option("Development Phase", PHASE_OPTIONS)

        print(f"\n{C.BOLD}Value Scoring{C.RESET} — Be honest. These scores determine which story becomes the Greatest Value Prompt.")
        bv = score_prompt("Business Value — How critical is this to the app's core promise?")
        ui = score_prompt("User Impact — How many users need this, how often, how badly?")
        fe = score_prompt("Dev Feasibility — How straightforward is implementation? (5 = easy)")

        story_counter[0] += 1
        story_id = f"{epic.epic_id}-S{story_counter[0]:02d}"

        story = UserStory(
            story_id=story_id,
            actor=actor,
            action=action,
            outcome=outcome,
            priority=priority,
            effort=effort,
            phase=phase,
            business_value=bv,
            user_impact=ui,
            feasibility=fe,
        )

        collect_ac(story)
        epic.stories.append(story)
        success(f"Story {story_id} added (Value Score: {story.value_score}/5.0)")


def collect_epics(project: Project) -> None:
    header("STEP 2 OF 5 — EPICS")
    info(
        "An Epic is a large capability area (e.g. 'Authentication', 'Payments', 'Dashboard').\n"
        "Type 'done' at the epic name prompt when you've added all epics."
    )

    story_counter = [0]
    idx = 1

    while True:
        epic_name = prompt(f"Epic #{idx} — Name (or type 'done' to finish)")
        if epic_name.lower() == "done":
            if not project.epics:
                print(f"{C.RED}  At least one Epic is required.{C.RESET}")
                continue
            break

        bv = nudge_if_vague(prompt(
            f"Epic #{idx} — Business Value statement\n  (Why does this capability matter?)"
        ))
        epic_id = f"EP{idx:02d}"
        epic = Epic(epic_id=epic_id, name=epic_name, business_value=bv)

        collect_stories(epic, story_counter)
        project.epics.append(epic)
        success(f"Epic {epic_id} — '{epic_name}' added with {len(epic.stories)} story/stories.")
        idx += 1


# ─── Output Generation ──────────────────────────────────────────────────────
def all_stories(project: Project) -> List[UserStory]:
    stories = []
    for epic in project.epics:
        stories.extend(epic.stories)
    return stories


def find_greatest_value_story(project: Project) -> Optional[tuple]:
    """Returns (story, epic) with the highest value score."""
    best_story = None
    best_epic  = None
    best_score = -1.0
    for epic in project.epics:
        for story in epic.stories:
            if story.value_score > best_score:
                best_score  = story.value_score
                best_story  = story
                best_epic   = epic
    return (best_story, best_epic)


def render_backlog(project: Project) -> str:
    lines = []
    lines.append(f"# Backlog — {project.name}")
    lines.append(f"_Generated: {project.created_at}_\n")
    lines.append("## Project Overview")
    lines.append(f"- **Problem:** {project.problem_statement}")
    lines.append(f"- **Target User:** {project.target_user}")
    lines.append(f"- **Success in 90 days:** {project.success_definition}")
    lines.append(f"- **Tech Stack:** {project.tech_stack}\n")
    lines.append("## Business Intent")
    lines.append(f"- **Cost of Inaction:** {project.cost_of_inaction}")
    lines.append(f"- **Stakeholder Value:** {project.stakeholder_value}")
    lines.append(f"- **Key Assumption to Validate:** {project.key_assumption}\n")
    lines.append("---\n")

    for epic in project.epics:
        lines.append(f"## {epic.epic_id} — {epic.name}")
        lines.append(f"> **Business Value:** {epic.business_value}\n")
        for story in epic.stories:
            lines.append(f"### {story.story_id} | {story.priority} | {story.effort} | {story.phase}")
            lines.append(f"> {story.full_text}\n")
            lines.append(f"**Value Score:** {story.value_score}/5.0")
            lines.append(f"_(Business Value: {story.business_value} | User Impact: {story.user_impact} | Feasibility: {story.feasibility})_\n")
            lines.append("**Acceptance Criteria:**")
            for i, ac in enumerate(story.ac, 1):
                lines.append(f"{i}. {ac.to_text()}")
            lines.append("")

    return "\n".join(lines)


def render_greatest_value_prompt(project: Project) -> str:
    story, epic = find_greatest_value_story(project)
    if not story:
        return "No stories found."

    lines = []
    lines.append("```")
    lines.append("--- GREATEST VALUE PROMPT ---")
    lines.append("")
    lines.append("Context:")
    lines.append(
        f"{project.name} is an application designed to solve the following problem: "
        f"{project.problem_statement} "
        f"The primary user is: {project.target_user}."
    )
    if project.tech_stack != "Not specified":
        lines.append(f"Tech stack: {project.tech_stack}.")
    lines.append("")
    lines.append(f"Epic: {epic.name}")
    lines.append(f"Story [{story.story_id}]: {story.full_text}")
    lines.append("")
    lines.append("Task for the developer:")
    lines.append("Implement the following feature with these exact requirements.")
    lines.append("")
    lines.append("Acceptance Criteria (all must pass before marking done):")
    for i, ac in enumerate(story.ac, 1):
        lines.append(f"{i}. {ac.to_text()}")
    lines.append("")
    lines.append("Non-Functional Requirements:")
    lines.append("- The implementation must not break existing functionality.")
    lines.append("- Follow the existing code style and conventions.")
    lines.append("- Include appropriate input validation and error handling.")
    lines.append("")
    lines.append("Out of Scope for this task:")
    lines.append("- Any feature outside the acceptance criteria above.")
    lines.append("- UI/UX changes unrelated to this story.")
    lines.append("- Refactoring of unrelated code.")
    lines.append("")
    lines.append("Definition of Done:")
    lines.append("- [ ] All acceptance criteria pass.")
    lines.append("- [ ] No regressions in existing features.")
    lines.append("- [ ] Code is reviewed and committed.")
    lines.append(f"- [ ] Story {story.story_id} is marked complete in the backlog.")
    lines.append("")
    lines.append(f"Value Score: {story.value_score}/5.0 (Business Value: {story.business_value} | User Impact: {story.user_impact} | Feasibility: {story.feasibility})")
    lines.append("")
    if project.cost_of_inaction:
        lines.append("Business Context (why this matters):")
        lines.append(f"- Cost of not building: {project.cost_of_inaction}")
    if project.key_assumption:
        lines.append(f"- Key assumption to validate: {project.key_assumption}")
    lines.append("--- END PROMPT ---")
    lines.append("```")

    return "\n".join(lines)


def render_top_5_prompts(project: Project) -> str:
    stories_with_epics = []
    for epic in project.epics:
        for story in epic.stories:
            stories_with_epics.append((story, epic))

    ranked = sorted(stories_with_epics, key=lambda x: x[0].value_score, reverse=True)[:5]

    lines = ["# Top 5 Ranked Developer Prompts\n"]
    lines.append("_Ranked by Value Score = (Business Value × 0.40) + (User Impact × 0.35) + (Feasibility × 0.25)_\n")

    for rank, (story, epic) in enumerate(ranked, 1):
        lines.append(f"---\n\n## Rank #{rank} — Score: {story.value_score}/5.0")
        lines.append(f"**{story.story_id}** | Epic: {epic.name} | {story.priority} | {story.phase}\n")
        lines.append(f"> {story.full_text}\n")
        lines.append("**Acceptance Criteria:**")
        for ac in story.ac:
            lines.append(f"- {ac.to_text()}")
        lines.append("")

    return "\n".join(lines)


def render_github_issues_md(project: Project) -> str:
    """Renders each User Story as a copy-paste GitHub Issue block."""
    lines = []
    lines.append(f"# GitHub Issues — {project.name}")
    lines.append(f"_Generated: {project.created_at}_\n")
    lines.append(
        "Each block is a ready-to-use GitHub Issue.\n"
        "Paste the Title and Body into GitHub Issues, or use the GitHub CLI:\n"
        "```\ngh issue create --title \"<title>\" --body \"<body>\" --label \"<labels>\"\n```\n"
    )
    lines.append("---\n")

    for epic in project.epics:
        lines.append(f"## Epic: {epic.name}\n")
        for story in epic.stories:
            priority_label = story.priority.lower().replace(" ", "-").replace("'", "")
            phase_label    = story.phase.lower()
            effort_raw     = story.effort.split("(")[0].strip()  # e.g. "M" or "XS"
            effort_label   = f"effort:{effort_raw.lower()}"
            title = f"[{story.story_id}] {story.actor.capitalize()} — {story.action}"
            if len(title) > 100:
                title = title[:97] + "..."

            lines.append(f"### {story.story_id}")
            lines.append(f"**Title:** `{title}`")
            lines.append(f"**Labels:** `{priority_label}`, `{phase_label}`, `{effort_label}`\n")
            lines.append("**Body:**\n")
            lines.append("```")
            lines.append("## User Story")
            lines.append(f"{story.full_text}\n")
            lines.append(f"**Epic:** {epic.name}")
            lines.append(f"**Phase:** {story.phase} | **Priority:** {story.priority} | **Effort:** {story.effort}")
            lines.append(f"**Value Score:** {story.value_score}/5.0\n")
            if story.ac:
                lines.append("## Acceptance Criteria")
                for i, ac in enumerate(story.ac, 1):
                    lines.append(f"{i}. {ac.to_text()}")
            lines.append("```")
            lines.append("")

    return "\n".join(lines)


# ─── Save & Summary ─────────────────────────────────────────────────────────
def save_outputs(project: Project) -> None:
    header("STEP 5 OF 5 — SAVING OUTPUTS")

    slug = re.sub(r"[^a-z0-9]+", "-", project.name.lower()).strip("-")
    ts   = datetime.now().strftime("%Y%m%d-%H%M")

    backlog_file = f"{slug}-backlog-{ts}.md"
    prompt_file  = f"{slug}-greatest-value-prompt-{ts}.md"
    json_file    = f"{slug}-backlog-{ts}.json"
    issues_file  = f"{slug}-github-issues-{ts}.md"

    backlog_md  = render_backlog(project)
    prompt_md   = render_greatest_value_prompt(project)
    top5_md     = render_top_5_prompts(project)
    issues_md   = render_github_issues_md(project)
    json_output = json.dumps(
        {
            "skill_version": SKILL_VERSION,
            "project": project.name,
            "created_at": project.created_at,
            "problem_statement": project.problem_statement,
            "target_user": project.target_user,
            "success_definition": project.success_definition,
            "tech_stack": project.tech_stack,
            "business_intent": {
                "cost_of_inaction":  project.cost_of_inaction,
                "stakeholder_value": project.stakeholder_value,
                "key_assumption":    project.key_assumption,
            },
            "epics": [e.to_dict() for e in project.epics],
        },
        indent=2,
    )

    cwd = os.getcwd()
    with open(backlog_file, "w", encoding="utf-8") as f:
        f.write(backlog_md)
        f.write(f"\n\n---\n_Generated by Business and Project Consultant v{SKILL_VERSION}_\n")
    with open(prompt_file, "w", encoding="utf-8") as f:
        f.write("# Greatest Value Prompt\n\n")
        f.write(prompt_md)
        f.write("\n\n---\n\n")
        f.write(top5_md)
        f.write(f"\n\n---\n_Generated by Business and Project Consultant v{SKILL_VERSION}_\n")
    with open(json_file, "w", encoding="utf-8") as f:
        f.write(json_output)
    with open(issues_file, "w", encoding="utf-8") as f:
        f.write(issues_md)
        f.write(f"\n\n---\n_Generated by Business and Project Consultant v{SKILL_VERSION}_\n")

    success(f"Backlog saved      → {os.path.join(cwd, backlog_file)}")
    success(f"Prompts saved      → {os.path.join(cwd, prompt_file)}")
    success(f"JSON export saved  → {os.path.join(cwd, json_file)}")
    success(f"GitHub Issues      → {os.path.join(cwd, issues_file)}")
    info("Tip: paste any issue block into GitHub, or use: gh issue create --title \"...\" --body \"...\"")


# ─── Summary Printout ───────────────────────────────────────────────────────
def print_summary(project: Project) -> None:
    header("STEP 4 OF 5 — BACKLOG SUMMARY")

    stories = all_stories(project)
    must_have    = [s for s in stories if s.priority == "Must Have"]
    should_have  = [s for s in stories if s.priority == "Should Have"]
    mvp_stories  = [s for s in stories if s.phase == "MVP"]

    print(f"\n  Project      : {C.BOLD}{project.name}{C.RESET}")
    print(f"  Epics        : {len(project.epics)}")
    print(f"  Total Stories: {len(stories)}")
    print(f"  Must Have    : {len(must_have)}")
    print(f"  Should Have  : {len(should_have)}")
    print(f"  MVP Stories  : {len(mvp_stories)}")

    best_story, best_epic = find_greatest_value_story(project)
    if best_story:
        print(f"\n  {C.BOLD}{C.GREEN}⭐ GREATEST VALUE STORY{C.RESET}")
        print(f"  ID     : {best_story.story_id}")
        print(f"  Epic   : {best_epic.name}")
        print(f"  Story  : {best_story.full_text}")
        print(f"  Score  : {best_story.value_score}/5.0")

    print(f"\n{C.DIM}Full backlog and developer prompts will be saved in the next step.{C.RESET}")


# ─── Phase Confirmation ─────────────────────────────────────────────────────
def confirm_phases(project: Project) -> None:
    header("STEP 3 OF 5 — PHASE REVIEW")
    info("Review the distribution of your stories across phases. Adjust if needed.")

    phases: Dict[str, List[str]] = {}
    for epic in project.epics:
        for story in epic.stories:
            _text  = story.full_text
            _short = _text[:60] + ("..." if len(_text) > 60 else "")
            phases.setdefault(story.phase, []).append(f"{story.story_id} [{story.priority}] — {_short}")

    for phase, items in sorted(phases.items()):
        print(f"\n  {C.BOLD}Phase: {phase}{C.RESET} ({len(items)} stories)")
        for item in items:
            print(f"    • {item}")

    answer = prompt(
        "\nDoes this phase distribution look correct? (yes / no)\n"
        "  (If no, re-run the script and adjust phase assignments)"
    )
    if answer.lower() not in ("yes", "y"):
        print(f"\n{C.YELLOW}⚠ Re-run the script and adjust phase assignments when adding stories.{C.RESET}")
        sys.exit(0)


# ─── Main ────────────────────────────────────────────────────────────────────
def main(prefill: Optional[dict] = None):
    print(f"\n{C.BOLD}{C.CYAN}{'═' * 60}")
    print("  BUSINESS AND PROJECT CONSULTANT")
    print("  Idea → Backlog → Developer Prompts")
    print(f"{'═' * 60}{C.RESET}")
    info(
        "This wizard will walk you through converting your raw idea\n"
        "into a structured backlog with prioritized, ready-to-use\n"
        "developer prompts.\n\n"
        "Estimated time: 10–20 minutes depending on scope."
    )

    project = intake_project(prefill)
    collect_epics(project)
    confirm_phases(project)
    print_summary(project)

    answer = prompt("\nReady to save your backlog? (yes to save / no to exit without saving)")
    if answer.lower() not in ("yes", "y"):
        print(f"\n{C.YELLOW}⚠ Save cancelled. Run the script again to start over.{C.RESET}\n")
        sys.exit(0)

    save_outputs(project)

    header("DONE")
    print(f"\n  Your backlog and developer prompts have been saved.")
    print(f"  Start with the Greatest Value Prompt — it's your highest ROI task.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=(
            "Business and Project Consultant v" + SKILL_VERSION + "\n"
            "Interactive wizard: converts a raw idea into a prioritized backlog\n"
            "with Epics, User Stories, Acceptance Criteria, and Greatest Value Prompts.\n\n"
            "Run from your project root directory. Output files are saved there."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {SKILL_VERSION}")
    parser.add_argument(
        "--from-requirements",
        metavar="FILE",
        help=(
            "Path to a requirements JSON file (from requirements_elicitor.py). "
            "Pre-fills project name, problem statement, and target user so you don't re-type them."
        ),
    )
    args = parser.parse_args()
    prefill: Optional[dict] = None
    if args.from_requirements:
        prefill = load_requirements_prefill(args.from_requirements)
        if prefill:
            print(f"\n{C.GREEN}✓ Loaded context from: {args.from_requirements}{C.RESET}")
    try:
        main(prefill=prefill)
    except KeyboardInterrupt:
        print(f"\n\n{C.YELLOW}⚠ Wizard cancelled. No files were saved.{C.RESET}\n")
        sys.exit(0)
