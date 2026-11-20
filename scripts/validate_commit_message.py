#!/usr/bin/env python3
"""Validate a commit message against the team's Git convention.

Required format (the first three non-blank lines of the message):

    <type>: <short summary>
    issue: <Jira issue key>
    description: <brief explanation of the change>

Anything after the description line (wrapped text, a body, trailers such as
Co-authored-by) is allowed and ignored.

Usage:
    python3 scripts/validate_commit_message.py --message "<full message>"
    python3 scripts/validate_commit_message.py --file .git/COMMIT_EDITMSG
    git log -1 --format=%B | python3 scripts/validate_commit_message.py
"""

import argparse
import re
import sys
from pathlib import Path

VALID_TYPES = ("feat", "fix", "docs", "style", "refactor", "test", "ci", "build")
JIRA_RE = re.compile(r"[A-Z][A-Z0-9]+-[0-9]+")
SUBJECT_RE = re.compile(
    r"(?P<type>[^\s:(!]+)(?P<scope>\([^)]*\))?(?P<bang>!)?:(?P<sep>\s*)(?P<summary>.*)"
)
SCISSORS = "# ------------------------ >8 ------------------------"

FORMAT = (
    "<type>: <short summary>\n"
    "issue: <Jira issue key>\n"
    "description: <brief explanation of the change>"
)
EXAMPLE = (
    "feat: add OTP request endpoint\n"
    "issue: TGTG-24\n"
    "description: Add phone validation and create an OTP through the configured SMS provider."
)


def meaningful_lines(message, strip_comments=False):
    """Return the non-blank lines of a message, stripped of surrounding spaces.

    strip_comments drops '#' lines and everything below the scissors line, which
    is what Git itself does before saving a message written in the editor.
    """
    lines = []
    for raw in (message or "").splitlines():
        if strip_comments:
            if raw.rstrip() == SCISSORS:
                break
            if raw.startswith("#"):
                continue
        line = raw.strip()
        if line:
            lines.append(line)
    return lines


def _check_field(line, label, position, errors):
    """Validate a '<label>: <value>' line and return its value (or None)."""
    match = re.fullmatch(rf"(?P<label>{label}):(?P<sep>\s*)(?P<value>.*)", line, re.IGNORECASE)
    if not match:
        errors.append(f"Line {position} must start with '{label}:'. Found: '{line}'.")
        return None
    if match.group("label") != label:
        errors.append(f"The '{label}:' label must be lowercase. Found: '{match.group('label')}:'.")
    value = match.group("value").strip()
    if not value:
        errors.append(f"The '{label}:' field is empty.")
        return None
    if not match.group("sep"):
        errors.append(f"Add a space after '{label}:'.")
    return value


def validate_commit_message(message, strip_comments=False):
    """Raise ValueError listing every problem found; return True when valid."""
    lines = meaningful_lines(message, strip_comments)
    if not lines:
        raise ValueError("Commit message is empty.")

    errors = []

    # Line 1: <type>: <short summary>
    subject = lines[0]
    match = SUBJECT_RE.fullmatch(subject)
    if not match:
        errors.append(f"Line 1 must be '<type>: <short summary>'. Found: '{subject}'.")
    else:
        commit_type = match.group("type")
        summary = match.group("summary").strip()
        if commit_type not in VALID_TYPES:
            hint = " Types are lowercase." if commit_type.lower() in VALID_TYPES else ""
            errors.append(
                f"Unsupported type '{commit_type}'. Allowed types: {', '.join(VALID_TYPES)}.{hint}"
            )
        if match.group("scope") or match.group("bang"):
            errors.append(
                f"Scopes and '!' are not part of the convention. "
                f"Write '{commit_type}: ...' instead of '{subject.split(':', 1)[0]}: ...'."
            )
        if not summary:
            errors.append("The short summary after '<type>:' is empty.")
        elif not match.group("sep"):
            errors.append(f"Add a space after '{commit_type}:'.")
        if re.search(r"\sissue:\s", f" {summary} ", re.IGNORECASE):
            errors.append(
                "'issue:' and 'description:' must each be on their own line, "
                "not on the summary line."
            )

    # Line 2: issue: <Jira issue key>
    if len(lines) < 2:
        errors.append("Missing line 2: 'issue: <Jira issue key>'.")
    else:
        jira = _check_field(lines[1], "issue", 2, errors)
        if jira is not None and not JIRA_RE.fullmatch(jira):
            errors.append(
                f"Invalid Jira key '{jira}'. Expected pattern [A-Z][A-Z0-9]+-[0-9]+, "
                "for example TGTG-24."
            )

    # Line 3: description: <brief explanation of the change>
    if len(lines) < 3:
        errors.append("Missing line 3: 'description: <brief explanation of the change>'.")
    else:
        _check_field(lines[2], "description", 3, errors)

    if errors:
        raise ValueError("\n".join(f"- {error}" for error in errors))
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Validate a commit message against the team's Git convention."
    )
    parser.add_argument("message", nargs="?", help="Full commit message to validate")
    parser.add_argument("--message", dest="message_flag", help="Full commit message to validate")
    parser.add_argument(
        "--file",
        help="Read the message from a file (e.g. .git/COMMIT_EDITMSG); '#' comment lines are ignored",
    )
    args = parser.parse_args()

    message = args.message_flag if args.message_flag is not None else args.message
    strip_comments = False
    if args.file:
        message = Path(args.file).read_text(encoding="utf-8")
        strip_comments = True
    elif message is None:
        message = sys.stdin.read()

    try:
        validate_commit_message(message, strip_comments=strip_comments)
    except ValueError as exc:
        print("Commit validation failed:", file=sys.stderr)
        print(exc, file=sys.stderr)
        print(f"\nRequired format:\n{FORMAT}", file=sys.stderr)
        print(f"\nExample:\n{EXAMPLE}", file=sys.stderr)
        return 1

    print(f"Commit message is valid: {meaningful_lines(message, strip_comments)[0]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())