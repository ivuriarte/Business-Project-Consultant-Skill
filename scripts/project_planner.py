#!/usr/bin/env python3
"""
Project Planner
Business and Project Consultant — Generates a phased development plan
(Discovery → MVP → Enhancements) with goals, feature lists, milestones,
effort sizing, and a printable phase summary.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional

SKILL_VERSION = "1.2.0"


# ─── ANSI Colors ────────────────────────────────────────────────────────────
class C:
    BOLD   = "\033[1m"
    CYAN   = "\033[96m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    RED    = "\033[91m"
    DIM    = "\033[2m"
    MAGENTA = "\033[95m"
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


# ─── Phase Model ─────────────────────────────────────────────────────────────
PHASE_RULES = {
    "Discovery": {
        "purpose":    "De-risk the idea before writing code.",
        "must_have":  ["Problem statement", "Target user definition", "Scope box (in/out)", "Assumption log", "Stakeholder map"],
        "typical_duration": "1–2 weeks",
        "exit_criteria": "Stakeholders have approved the Discovery Packet and dev team understands scope.",
        "priority_rule":  "No code is written. Documentation and validation only.",
    },
    "MVP": {
        "purpose":    "Build the smallest version that proves core value to real users.",
        "must_have":  ["Must Have features only", "Core happy path works end-to-end", "Basic error handling", "Authentication (if user data involved)"],
        "typical_duration": "4–8 weeks",
        "exit_criteria": "A real user can complete the core workflow without help from the dev team.",
        "priority_rule":  "Only Must Have features. Every Should Have or Could Have is deferred.",
    },
    "Stabilization": {
        "purpose":    "Harden what MVP revealed. Fix bugs, improve performance, tighten UX.",
        "must_have":  ["Bug fixes from MVP", "Performance baseline met", "Security hardening", "Monitoring and alerting in place"],
        "typical_duration": "2–3 weeks",
        "exit_criteria": "App passes load test, no P1/P2 bugs, monitoring is live.",
        "priority_rule":  "No new features. Reliability and security only.",
    },
    "Enhancement": {
        "purpose":    "Layer in Should Have features based on real user feedback from MVP.",
        "must_have":  ["Should Have features from MoSCoW", "User feedback loop in place", "Analytics / usage tracking"],
        "typical_duration": "4–6 weeks per cycle",
        "exit_criteria": "User satisfaction score improved. Key Should Have features shipped.",
        "priority_rule":  "Feature additions driven by user feedback data, not assumptions.",
    },
    "Growth": {
        "purpose":    "Scale the product: add Could Have features, expand user base, optimize performance.",
        "must_have":  ["Could Have features (selected)", "Scalability improvements", "Onboarding / acquisition flows"],
        "typical_duration": "Ongoing cycles",
        "exit_criteria": "Product is self-sustaining with measurable growth metrics.",
        "priority_rule":  "Growth features only if core product metrics are green.",
    },
}


class Feature:
    def __init__(self, name: str, priority: str, effort: str, rationale: str):
        self.name      = name
        self.priority  = priority
        self.effort    = effort
        self.rationale = rationale

    def to_dict(self) -> dict:
        return {
            "name":      self.name,
            "priority":  self.priority,
            "effort":    self.effort,
            "rationale": self.rationale,
        }


class Milestone:
    def __init__(self, name: str, description: str, target_week: int):
        self.name        = name
        self.description = description
        self.target_week = target_week

    def to_dict(self) -> dict:
        return {
            "name":        self.name,
            "description": self.description,
            "target_week": self.target_week,
        }


class Phase:
    def __init__(self, phase_name: str, custom_name: str, duration_weeks: int, start_offset_weeks: int):
        self.phase_name          = phase_name
        self.custom_name         = custom_name
        self.duration_weeks      = duration_weeks
        self.start_offset_weeks  = start_offset_weeks
        self.features:    List[Feature]   = []
        self.milestones:  List[Milestone] = []
        self.team_size:   str             = ""
        self.goal:        str             = ""
        self.risks:       List[str]       = []
        self.decision_point: str         = ""

    @property
    def display_name(self) -> str:
        return self.custom_name or self.phase_name

    def to_dict(self) -> dict:
        return {
            "phase":             self.phase_name,
            "name":              self.display_name,
            "goal":              self.goal,
            "duration_weeks":    self.duration_weeks,
            "start_week":        self.start_offset_weeks + 1,
            "end_week":          self.start_offset_weeks + self.duration_weeks,
            "team_size":         self.team_size,
            "features":          [f.to_dict() for f in self.features],
            "milestones":        [m.to_dict() for m in self.milestones],
            "risks":             self.risks,
            "decision_point":    self.decision_point,
        }


class ProjectPlan:
    def __init__(self, project_name: str, start_date: str, team_size: str, tech_stack: str):
        self.project_name = project_name
        self.start_date   = start_date
        self.team_size    = team_size
        self.tech_stack   = tech_stack
        self.phases:      List[Phase] = []
        self.created_at   = datetime.now().strftime("%Y-%m-%d %H:%M")

    def total_weeks(self) -> int:
        return sum(p.duration_weeks for p in self.phases)

    def to_dict(self) -> dict:
        return {
            "project":      self.project_name,
            "created_at":   self.created_at,
            "start_date":   self.start_date,
            "team_size":    self.team_size,
            "tech_stack":   self.tech_stack,
            "total_weeks":  self.total_weeks(),
            "phases":       [p.to_dict() for p in self.phases],
        }


# ─── Effort Parsing ───────────────────────────────────────────────────────────
EFFORT_MAP = {
    "xs": 1, "s": 2, "m": 4, "l": 7, "xl": 14,
    "1": 1, "2": 2, "3": 3, "5": 5, "8": 8, "13": 13,
}


def effort_days(effort: str) -> float:
    return EFFORT_MAP.get(effort.lower().strip(), 3)


# ─── Pipeline Context Loader ──────────────────────────────────────────────────
def load_backlog_prefill(path: str) -> dict:
    """Load project context from a backlog JSON for pre-filling intake and phase building."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"\n{C.RED}⚠ Backlog file not found: {path}{C.RESET}")
        return {}
    except json.JSONDecodeError as e:
        print(f"\n{C.RED}⚠ Could not parse backlog file: {e}{C.RESET}")
        return {}

    stories_by_phase: Dict[str, list] = {}
    for epic in data.get("epics", []):
        for story in epic.get("stories", []):
            phase = story.get("phase", "Unknown")
            stories_by_phase.setdefault(phase, []).append(story)

    raw_stack = data.get("tech_stack", "")
    return {
        "name":             data.get("project", ""),
        "tech_stack":       raw_stack if raw_stack not in ("", "Not specified") else "",
        "stories_by_phase": stories_by_phase,
    }


# ─── Intake ────────────────────────────────────────────────────────────────
def intake_plan(plan: ProjectPlan, prefill: Optional[dict] = None) -> None:
    header("PROJECT PLAN — INTAKE")

    def _ask(text: str, key: str) -> str:
        """Show a pre-filled default from idea_to_backlog.py output if available."""
        default = (prefill or {}).get(key, "")
        if default:
            print(f"\n{C.YELLOW}▶ {text}{C.RESET}")
            print(f"  {C.DIM}Loaded from backlog: \"{default}\"{C.RESET}")
            override = input("  Press Enter to use this, or type to override: ").strip()
            return override if override else default
        return ask(text)

    plan.project_name = _ask("What is the name of this project?", "name")
    start             = ask("What is the planned start date? (YYYY-MM-DD or press Enter for today)")
    if not start:
        start = datetime.now().strftime("%Y-%m-%d")
    plan.start_date   = start
    plan.team_size    = ask("How many developers will work on this?")
    plan.tech_stack   = _ask("Tech stack? (press Enter to skip)", "tech_stack")
    if not plan.tech_stack:
        plan.tech_stack = "Not specified"
    success("Intake complete.")


# ─── Phase Builder ────────────────────────────────────────────────────────────
def build_phase(phase_name: str, offset: int, stories_by_phase: Optional[dict] = None) -> Phase:
    rules = PHASE_RULES.get(phase_name, {})

    header(f"PHASE: {phase_name.upper()}")
    info(f"Purpose: {rules.get('purpose', '')}\n"
         f"Typical duration: {rules.get('typical_duration', '')}\n"
         f"Priority rule: {rules.get('priority_rule', '')}")

    custom_name = ask(
        f"Custom name for this phase? (e.g. 'Phase 1 — Core') or press Enter to use '{phase_name}'"
    )
    duration = ask(f"How many weeks? (typical: {rules.get('typical_duration', '?')})")
    while not duration.isdigit() or int(duration) < 1:
        print(f"{C.RED}  Enter a positive integer.{C.RESET}")
        duration = ask("Weeks?")

    phase = Phase(phase_name, custom_name, int(duration), offset)

    phase.goal = ask(f"What is the primary goal of this phase in one sentence?")
    phase.team_size = ask("How many people are working in this phase?")

    # Features
    header(f"FEATURES — {phase.display_name}")
    phase_stories = (stories_by_phase or {}).get(phase_name, [])
    if phase_stories:
        print(f"\n  {C.DIM}Stories from your backlog assigned to {phase_name}:{C.RESET}")
        for s in phase_stories:
            short_text = s.get("text", "")[:75] + ("..." if len(s.get("text", "")) > 75 else "")
            print(f"  {C.DIM}  [{s.get('id','')}] {short_text}{C.RESET}")
        print(f"\n  {C.DIM}Use these to name the features below.{C.RESET}")
    info(
        f"List the features planned for this phase.\n"
        f"Mandatory items for {phase_name}:\n"
        + "\n".join(f"  • {m}" for m in rules.get("must_have", []))
        + "\n\nType 'done' when finished."
    )

    feat_idx = 1
    while True:
        name = ask(f"Feature #{feat_idx} name (or 'done')")
        if name.lower() == "done":
            break
        priority  = ask("Priority? (Must Have / Should Have / Could Have)")
        effort    = ask("Effort? (XS / S / M / L / XL or story points)")
        rationale = ask("Why is this in this phase?")
        phase.features.append(Feature(name, priority, effort, rationale))
        success(f"Feature '{name}' added.")
        feat_idx += 1

    # Milestones
    header(f"MILESTONES — {phase.display_name}")
    info("Add key checkpoints within this phase. These become your sprint anchors.\nType 'done' when finished.")

    ms_idx = 1
    while True:
        ms_name = ask(f"Milestone #{ms_idx} (or 'done')")
        if ms_name.lower() == "done":
            break
        ms_desc  = ask("What does hitting this milestone mean? (definition)")
        ms_week  = ask("Which week of the project does this target? (week number)")
        while not ms_week.isdigit():
            ms_week = ask("Enter a valid week number:")
        phase.milestones.append(Milestone(ms_name, ms_desc, int(ms_week)))
        success(f"Milestone '{ms_name}' added.")
        ms_idx += 1

    # Risks
    header(f"RISKS — {phase.display_name}")
    info("What could go wrong in this phase? Naming risks now prevents surprises later.\nType 'done' when finished.")

    while True:
        risk = ask("Risk (or 'done')")
        if risk.lower() == "done":
            break
        phase.risks.append(risk)
        success("Risk logged.")

    # Decision Point
    phase.decision_point = ask(
        "Decision point at end of phase:\n"
        "  What question must be answered before moving to the next phase?\n"
        "  (e.g. 'Is the core workflow working for at least 10 test users?')"
    )

    success(f"Phase '{phase.display_name}' built: {len(phase.features)} features, {len(phase.milestones)} milestones.")
    return phase


# ─── Phase Selection ──────────────────────────────────────────────────────────
AVAILABLE_PHASES = ["Discovery", "MVP", "Stabilization", "Enhancement", "Growth"]


def select_phases() -> List[str]:
    header("PHASE SELECTION")
    info(
        "Select which phases to plan for this project.\n"
        "Discovery and MVP are strongly recommended for any new project.\n"
    )

    for i, p in enumerate(AVAILABLE_PHASES, 1):
        purpose = PHASE_RULES[p]["purpose"]
        print(f"  [{i}] {p:20s} — {purpose}")

    print(f"\n{C.YELLOW}▶ Enter phase numbers separated by commas (e.g. 1,2,3){C.RESET}")
    print("  → ", end="")
    raw = input().strip()

    selected = []
    for part in raw.split(","):
        part = part.strip()
        if part.isdigit() and 1 <= int(part) <= len(AVAILABLE_PHASES):
            phase = AVAILABLE_PHASES[int(part) - 1]
            if phase not in selected:
                selected.append(phase)

    if not selected:
        print(f"{C.RED}No phases selected. Defaulting to Discovery + MVP.{C.RESET}")
        selected = ["Discovery", "MVP"]

    success(f"Phases selected: {', '.join(selected)}")
    return selected


# ─── Output Rendering ─────────────────────────────────────────────────────────
def render_plan(plan: ProjectPlan) -> str:
    lines = []
    lines.append(f"# Project Plan — {plan.project_name}")
    lines.append(f"_Generated: {plan.created_at}_\n")

    lines.append("## Overview")
    lines.append(f"- **Start Date:** {plan.start_date}")
    lines.append(f"- **Team Size:** {plan.team_size}")
    lines.append(f"- **Tech Stack:** {plan.tech_stack}")
    lines.append(f"- **Total Duration:** {plan.total_weeks()} weeks\n")

    # Timeline table
    lines.append("## Phase Timeline\n")
    lines.append("| Phase | Start Week | End Week | Duration | Goal |")
    lines.append("|---|---|---|---|---|")
    for p in plan.phases:
        start = p.start_offset_weeks + 1
        end   = p.start_offset_weeks + p.duration_weeks
        lines.append(f"| {p.display_name} | Week {start} | Week {end} | {p.duration_weeks}w | {p.goal} |")
    lines.append("")

    for p in plan.phases:
        rules = PHASE_RULES.get(p.phase_name, {})
        start = p.start_offset_weeks + 1
        end   = p.start_offset_weeks + p.duration_weeks

        lines.append(f"---\n\n## {p.display_name} (Week {start}–{end})")
        lines.append(f"**Goal:** {p.goal}")
        lines.append(f"**Team:** {p.team_size} people")
        lines.append(f"**Purpose:** {rules.get('purpose', '')}")
        lines.append(f"**Priority Rule:** {rules.get('priority_rule', '')}\n")

        if p.features:
            lines.append("### Features\n")
            lines.append("| Feature | Priority | Effort | Rationale |")
            lines.append("|---|---|---|---|")
            for f in p.features:
                lines.append(f"| {f.name} | {f.priority} | {f.effort} | {f.rationale} |")
            lines.append("")

        if p.milestones:
            lines.append("### Milestones\n")
            for m in p.milestones:
                lines.append(f"- **Week {m.target_week} — {m.name}:** {m.description}")
            lines.append("")

        if p.risks:
            lines.append("### Risks\n")
            for r in p.risks:
                lines.append(f"- ⚠ {r}")
            lines.append("")

        lines.append(f"### Exit Decision Point")
        lines.append(f"> {p.decision_point}\n")
        lines.append(f"**Standard exit criteria:** {rules.get('exit_criteria', 'To be defined.')}\n")

    lines.append("---")
    lines.append(f"\n_Plan generated by Business and Project Consultant skill._")
    lines.append("_Review this plan with the full team before sprint planning begins._")

    return "\n".join(lines)


def render_gantt(plan: ProjectPlan) -> str:
    """Renders a Mermaid Gantt chart for the phase plan."""
    lines = []
    lines.append("## Gantt Chart (Mermaid)\n")
    lines.append("```mermaid")
    lines.append("gantt")
    lines.append(f"    title {plan.project_name} — Development Plan")
    lines.append("    dateFormat  YYYY-MM-DD")

    try:
        start_dt = datetime.strptime(plan.start_date, "%Y-%m-%d")
    except ValueError:
        start_dt = datetime.now()

    for phase in plan.phases:
        lines.append(f"    section {phase.display_name}")
        phase_start = start_dt + timedelta(weeks=phase.start_offset_weeks)
        running_date = phase_start
        for feat in phase.features:
            days   = max(1, int(effort_days(feat.effort)))
            f_name = feat.name.replace(",", " -")
            lines.append(
                f"    {f_name} : {running_date.strftime('%Y-%m-%d')}, {days}d"
            )
            running_date += timedelta(days=days)
        for ms in phase.milestones:
            ms_date = start_dt + timedelta(weeks=ms.target_week - 1)
            lines.append(f"    {ms.name} : milestone, {ms_date.strftime('%Y-%m-%d')}, 0d")

    lines.append("```")
    return "\n".join(lines)


def print_summary(plan: ProjectPlan) -> None:
    header("PLAN SUMMARY")

    total_features = sum(len(p.features) for p in plan.phases)
    total_ms       = sum(len(p.milestones) for p in plan.phases)

    print(f"\n  Project        : {C.BOLD}{plan.project_name}{C.RESET}")
    print(f"  Start Date     : {plan.start_date}")
    print(f"  Team Size      : {plan.team_size}")
    print(f"  Total Weeks    : {plan.total_weeks()}")
    print(f"  Phases         : {len(plan.phases)}")
    print(f"  Total Features : {total_features}")
    print(f"  Total Milestones: {total_ms}")

    print(f"\n  {C.BOLD}Phase Breakdown:{C.RESET}")
    for p in plan.phases:
        bar = "█" * p.duration_weeks
        print(f"  {p.display_name:25s} {bar} ({p.duration_weeks}w, {len(p.features)} features)")


def save_outputs(plan: ProjectPlan) -> None:
    header("SAVING PLAN")

    slug    = re.sub(r"[^a-z0-9]+", "-", plan.project_name.lower()).strip("-")
    ts      = datetime.now().strftime("%Y%m%d-%H%M")
    md_file = f"{slug}-project-plan-{ts}.md"
    js_file = f"{slug}-project-plan-{ts}.json"

    plan_md = render_plan(plan)
    gantt   = render_gantt(plan)
    plan_dict = plan.to_dict()
    plan_dict["skill_version"] = SKILL_VERSION

    cwd = os.getcwd()
    with open(md_file, "w", encoding="utf-8") as f:
        f.write(plan_md)
        f.write("\n\n")
        f.write(gantt)
        f.write(f"\n\n---\n_Generated by Business and Project Consultant v{SKILL_VERSION}_\n")

    with open(js_file, "w", encoding="utf-8") as f:
        f.write(json.dumps(plan_dict, indent=2))

    success(f"Project plan → {os.path.join(cwd, md_file)}")
    success(f"JSON export  → {os.path.join(cwd, js_file)}")
    print(f"\n  {C.DIM}To render the Gantt chart: paste the mermaid block into")
    print(f"  mermaid.live, any GitHub .md file, Notion, or GitLab.{C.RESET}")


# ─── Main ────────────────────────────────────────────────────────────────────
def main(prefill: Optional[dict] = None):
    print(f"\n{C.BOLD}{C.CYAN}{'═' * 60}")
    print("  BUSINESS AND PROJECT CONSULTANT")
    print("  Project Phase Planner")
    print(f"{'═' * 60}{C.RESET}")
    info(
        "This wizard builds a phased development plan for your project.\n"
        "Output: A Markdown plan with phase goals, features, milestones,\n"
        "risks, decision points, and a Mermaid Gantt chart.\n\n"
        "Tip: Run requirements_elicitor.py first to capture requirements,\n"
        "then idea_to_backlog.py to build your backlog, then this tool\n"
        "to plan the sequence of delivery.\n\n"
        "Estimated time: 15–25 minutes."
    )

    plan = ProjectPlan("", "", "", "")
    intake_plan(plan, prefill=prefill)

    selected_phases = select_phases()
    stories_by_phase = (prefill or {}).get("stories_by_phase")
    offset = 0
    for phase_name in selected_phases:
        phase = build_phase(phase_name, offset, stories_by_phase=stories_by_phase)
        plan.phases.append(phase)
        offset += phase.duration_weeks

    print_summary(plan)
    answer = ask("\nReady to save your project plan? (yes to save / no to exit without saving)")
    if answer.lower() not in ("yes", "y"):
        print(f"\n{C.YELLOW}⚠ Save cancelled. Run the script again to start over.{C.RESET}\n")
        sys.exit(0)

    save_outputs(plan)

    header("DONE")
    print(f"\n  Your project plan is ready.")
    print(f"  Share it with your team and use the Gantt chart in planning sessions.\n")
    print(f"  Recommended next step: import the backlog into your issue tracker")
    print(f"  and assign Phase labels to each story.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description=(
            "Business and Project Consultant v" + SKILL_VERSION + "\n"
            "Interactive project phase planner.\n"
            "Builds a phased development plan (Discovery → MVP → Enhancement)\n"
            "with goals, features, milestones, risks, and a Mermaid Gantt chart.\n\n"
            "Run from your project root directory. Output files are saved there."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {SKILL_VERSION}")
    parser.add_argument(
        "--from-backlog",
        metavar="FILE",
        help=(
            "Path to a backlog JSON file (from idea_to_backlog.py). "
            "Pre-fills project name and tech stack, and shows backlog stories per phase as a guide."
        ),
    )
    args = parser.parse_args()
    prefill: Optional[dict] = None
    if args.from_backlog:
        prefill = load_backlog_prefill(args.from_backlog)
        if prefill:
            print(f"\n{C.GREEN}✓ Loaded context from: {args.from_backlog}{C.RESET}")
    try:
        main(prefill=prefill)
    except KeyboardInterrupt:
        print(f"\n\n{C.YELLOW}⚠ Wizard cancelled. No files were saved.{C.RESET}\n")
        sys.exit(0)
