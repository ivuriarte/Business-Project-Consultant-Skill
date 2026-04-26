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

SKILL_VERSION = "1.0.0"


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


# ─── Intake Wizard ──────────────────────────────────────────────────────────
def intake_project() -> Project:
    header("STEP 1 OF 5 — IDEA INTAKE")
    info(
        "Before we build a backlog, we need to understand the idea.\n"
        "Answer each question honestly. Vague answers = vague backlog."
    )

    name = prompt("What is the name of this app or project?")
    problem = prompt(
        "What problem does this solve?\n  (e.g. 'Freelancers lose track of client invoices')"
    )
    target_user = prompt(
        "Who is the primary user?\n  (e.g. 'Freelance designers aged 25-40 who work remotely')"
    )
    success_definition = prompt(
        "What does success look like in 90 days?\n  (e.g. '100 active users, avg 3 invoices/week sent')"
    )
    tech_stack = prompt(
        "What is the tech stack? (Press Enter to skip)\n  (e.g. 'Next.js, Supabase, Tailwind')"
    )

    project = Project(
        name=name,
        problem_statement=problem,
        target_user=target_user,
        success_definition=success_definition,
        tech_stack=tech_stack if tech_stack else "Not specified",
    )

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
    info(
        "Write at least 1 acceptance criterion using GIVEN / WHEN / THEN.\n"
        "Type 'done' at the GIVEN prompt to finish this story."
    )
    idx = 1
    while True:
        given = prompt(f"AC #{idx} — GIVEN (or type 'done' to finish)")
        if given.lower() == "done":
            if not story.ac:
                print(f"{C.RED}  At least one AC is required.{C.RESET}")
                continue
            break
        when = prompt(f"AC #{idx} — WHEN")
        then = prompt(f"AC #{idx} — THEN")
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
        outcome = prompt("Story — Why? What OUTCOME do they get?")

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

        bv = prompt(
            f"Epic #{idx} — Business Value statement\n  (Why does this capability matter?)"
        )
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
    lines.append("Functional Requirements:")
    for i, ac in enumerate(story.ac, 1):
        lines.append(f"{i}. {ac.to_text()}")
    lines.append("")
    lines.append("Acceptance Criteria (verify all before marking done):")
    for ac in story.ac:
        lines.append(f"- GIVEN {ac.given}, WHEN {ac.when}, THEN {ac.then}.")
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


# ─── Save & Summary ─────────────────────────────────────────────────────────
def save_outputs(project: Project) -> None:
    header("STEP 5 OF 5 — SAVING OUTPUTS")

    slug = re.sub(r"[^a-z0-9]+", "-", project.name.lower()).strip("-")
    ts   = datetime.now().strftime("%Y%m%d-%H%M")

    backlog_file = f"{slug}-backlog-{ts}.md"
    prompt_file  = f"{slug}-greatest-value-prompt-{ts}.md"
    json_file    = f"{slug}-backlog-{ts}.json"

    backlog_md  = render_backlog(project)
    prompt_md   = render_greatest_value_prompt(project)
    top5_md     = render_top_5_prompts(project)
    json_output = json.dumps(
        {
            "skill_version": SKILL_VERSION,
            "project": project.name,
            "created_at": project.created_at,
            "problem_statement": project.problem_statement,
            "target_user": project.target_user,
            "success_definition": project.success_definition,
            "tech_stack": project.tech_stack,
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

    success(f"Backlog saved      → {os.path.join(cwd, backlog_file)}")
    success(f"Prompts saved      → {os.path.join(cwd, prompt_file)}")
    success(f"JSON export saved  → {os.path.join(cwd, json_file)}")


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
            phases.setdefault(story.phase, []).append(f"{story.story_id} [{story.priority}] — {story.full_text[:60]}...")

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
def main():
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

    project = intake_project()
    collect_epics(project)
    confirm_phases(project)
    print_summary(project)
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
    parser.parse_args()
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{C.YELLOW}⚠ Wizard cancelled. No files were saved.{C.RESET}\n")
        sys.exit(0)
