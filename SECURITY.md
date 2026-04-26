# Security Policy

## Supported Versions

| Version | Supported |
|---------|---------- |
| 1.3.x   | ✅ Yes    |
| 1.2.x   | ✅ Yes    |
| < 1.2   | ❌ No     |

## Security Model

**This tool runs entirely on your local machine. It makes no network calls.**

- All three scripts (`requirements_elicitor.py`, `idea_to_backlog.py`, `project_planner.py`) use the Python standard library only — no external dependencies, no pip packages.
- No data is transmitted to any server, API, or third-party service.
- Output files (`.md`, `.json`) are written to the directory you run the script from. They are not uploaded anywhere.
- No credentials, API keys, or sensitive environment variables are read or required.

## Python Dependency Hygiene

Because this project has no `requirements.txt` or third-party dependencies, there is no supply-chain attack surface. All code is self-contained in the `scripts/` directory.

## Reporting a Vulnerability

If you discover a security issue in this project (e.g., a path traversal in file naming, unsafe input handling, etc.), please report it privately rather than opening a public issue.

**Contact:** Open a [GitHub Security Advisory](https://github.com/ivuriarte/Business-Project-Consultant-Skill/security/advisories/new) on this repository.

We aim to respond to security reports within **72 hours** and ship a fix within **7 days** for any confirmed vulnerability.

## Out of Scope

- Issues in Python itself (report to [python.org](https://www.python.org/news/security/))
- Issues in GitHub Copilot or VS Code (report to [github.com/security](https://github.com/security))
