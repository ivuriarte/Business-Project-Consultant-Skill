.DEFAULT_GOAL := help

# ─── Help ──────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  Business and Project Consultant — Interactive Wizards"
	@echo ""
	@echo "  Usage: make <target>"
	@echo ""
	@echo "  Targets:"
	@echo "    make requirements   Run the Requirements Elicitation wizard"
	@echo "    make backlog        Run the Idea → Backlog wizard"
	@echo "    make plan           Run the Project Phase Planner wizard"
	@echo "    make check          Syntax-check all scripts (no wizard launched)"
	@echo "    make clean          Remove generated output files from current directory"
	@echo ""

# ─── Wizards ───────────────────────────────────────────────────────────────
.PHONY: requirements
requirements:
	python3 scripts/requirements_elicitor.py

.PHONY: backlog
backlog:
	python3 scripts/idea_to_backlog.py

.PHONY: plan
plan:
	python3 scripts/project_planner.py

# ─── Quality Checks ────────────────────────────────────────────────────────
.PHONY: check
check:
	@echo "Checking Python syntax..."
	python3 -m py_compile scripts/requirements_elicitor.py && echo "  ✓ requirements_elicitor.py"
	python3 -m py_compile scripts/idea_to_backlog.py       && echo "  ✓ idea_to_backlog.py"
	python3 -m py_compile scripts/project_planner.py       && echo "  ✓ project_planner.py"
	@echo "All scripts OK."

# ─── Clean ─────────────────────────────────────────────────────────────────
.PHONY: clean
clean:
	@echo "Removing generated output files..."
	@find . -maxdepth 1 \( \
		-name "*-backlog-*.md" \
		-o -name "*-backlog-*.json" \
		-o -name "*-greatest-value-prompt-*.md" \
		-o -name "*-requirements-*.md" \
		-o -name "*-requirements-*.json" \
		-o -name "*-project-plan-*.md" \
		-o -name "*-project-plan-*.json" \
	\) -delete -print | sed 's|^./|  Removed: |'
	@echo "Done."
