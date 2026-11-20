#!/usr/bin/env python3
"""Validate the message of every commit in the current pull request.

Meant to run inside GitHub Actions on a pull_request event. It reads the PR
number from GITHUB_EVENT_PATH, lists the PR's commits through the REST API
(all pages, so long PRs are fully checked) and validates each non-merge commit
with validate_commit_message.py. Merge commits (more than one parent), such as
"Merge branch 'main' into ...", are skipped because Git writes their message.

Required environment: GITHUB_EVENT_PATH, GITHUB_REPOSITORY, GITHUB_TOKEN.
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from validate_commit_message import EXAMPLE, FORMAT, validate_commit_message  # noqa: E402

API_URL = os.environ.get("GITHUB_API_URL", "https://api.github.com")
PER_PAGE = 100


def fetch_pr_commits(repo, pr_number, token):
    commits = []
    page = 1
    while True:
        request = urllib.request.Request(
            f"{API_URL}/repos/{repo}/pulls/{pr_number}/commits?per_page={PER_PAGE}&page={page}",
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "User-Agent": "pr-commit-validation",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            batch = json.load(response)
        commits.extend(batch)
        if len(batch) < PER_PAGE:
            return commits
        page += 1


def check_commits(commits):
    """Return (checked, skipped_merges, failures) for a list of API commit objects."""
    checked = 0
    skipped = 0
    failures = []
    for item in commits:
        if len(item.get("parents") or []) > 1:
            skipped += 1
            continue
        checked += 1
        message = (item.get("commit") or {}).get("message") or ""
        try:
            validate_commit_message(message)
        except ValueError as exc:
            first_line = message.strip().splitlines()[0] if message.strip() else "(empty message)"
            failures.append(
                {"sha": item.get("sha", "unknown")[:10], "subject": first_line, "error": str(exc)}
            )
    return checked, skipped, failures


def write_step_summary(lines):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as handle:
            handle.write("\n".join(lines) + "\n")


def main():
    with open(os.environ["GITHUB_EVENT_PATH"], encoding="utf-8") as handle:
        event = json.load(handle)
    pull_request = event.get("pull_request")
    if not pull_request:
        print("Not a pull_request event; nothing to validate.")
        return 0

    commits = fetch_pr_commits(
        os.environ["GITHUB_REPOSITORY"], pull_request["number"], os.environ["GITHUB_TOKEN"]
    )
    checked, skipped, failures = check_commits(commits)

    if not failures:
        message = f"Validated {checked} commit(s); skipped {skipped} merge commit(s)."
        print(message)
        write_step_summary(["### Commit messages", "", f"All good. {message}"])
        return 0

    print(f"{len(failures)} of {checked} commit(s) do not follow the convention:\n", file=sys.stderr)
    summary = [
        "### Commit messages",
        "",
        f"{len(failures)} of {checked} commit(s) do not follow the convention.",
        "",
    ]
    for failure in failures:
        print(f"{failure['sha']}  {failure['subject']}", file=sys.stderr)
        print(failure["error"] + "\n", file=sys.stderr)
        # Annotation shown on the PR's Checks tab; %0A is a newline in annotations.
        annotation = failure["error"].replace("%", "%25").replace("\n", "%0A")
        print(f"::error title=Invalid commit {failure['sha']}::{annotation}")
        summary.append(f"- `{failure['sha']}` {failure['subject']}")
        summary.extend(f"  {line}" for line in failure["error"].splitlines())

    print(f"Required format:\n{FORMAT}\n\nExample:\n{EXAMPLE}", file=sys.stderr)
    print("\nSee CONTRIBUTING.md > 'Correcting a commit message'.", file=sys.stderr)
    summary += ["", "Required format:", "```text", FORMAT, "```"]
    summary += ["See CONTRIBUTING.md, section 'Correcting a commit message'."]
    write_step_summary(summary)
    return 1


if __name__ == "__main__":
    sys.exit(main())