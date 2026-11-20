# Contributing

This repository uses a strict Git workflow so that pull requests stay reviewable and every change is traceable to a Jira issue. Branch names, commit messages and pull requests must follow the conventions below. GitHub Actions checks them automatically on every pull request, together with formatting, linting, type checking and the production build.

## Branch naming convention

All development branches must follow the format:

```text
<type>/<jira-key>/<short-name>
```

Allowed branch types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `ci`, `build`.

| Part | Meaning | Rule |
|---|---|---|
| `type` | Category of change | One of the allowed types, lowercase |
| `jira-key` | The Jira issue | Pattern `[A-Z][A-Z0-9]+-[0-9]+`, uppercase (e.g. `TGTG-24`, `TEAM-16`) |
| `short-name` | What the branch is about | Lowercase letters, digits and single hyphens |

Valid:

```text
feat/TGTG-24/otp-request
fix/TGTG-35/login-validation
style/TGTG-70/format-pages
ci/TEAM-16/quality-checks
```

Invalid:

```text
feature/otp-request          # "feature" is not an allowed type, and the Jira key is missing
Feat/TGTG-24/otp-request     # type must be lowercase
feat/tgtg-24/otp-request     # Jira key must be uppercase
feat/TGTG-24                 # short-name segment is missing
feat/TGTG-24/OTP_Request     # uppercase letters and underscores in the short name
revert-7-feature/store-page  # GitHub's default "Revert" branch name; rename it before opening the PR
```

### Fixing a branch name

Rename the branch locally before opening a pull request:

```bash
git branch -m feat/TGTG-24/otp-request
```

If the badly named branch is already pushed, push the new name, delete the old one, and open the pull request from the new branch (close the old pull request if there was one):

```bash
git push -u origin feat/TGTG-24/otp-request
git push origin --delete feature/otp-request
```

## Commit message convention

Every commit message must start with these three lines, in this order:

```text
<type>: <short summary>
issue: <Jira issue key>
description: <brief explanation of the change>
```

Example:

```text
feat: add OTP request endpoint
issue: TGTG-24
description: Add phone validation and create an OTP through the configured SMS provider.
```

### Allowed types

| Type | Purpose |
|---|---|
| `feat` | Introduces a new feature |
| `fix` | Fixes a bug |
| `docs` | Changes documentation |
| `style` | Changes formatting or code style without changing behavior |
| `refactor` | Restructures code without changing behavior |
| `test` | Adds or updates tests |
| `ci` | Changes CI/CD configuration |
| `build` | Changes build configuration or dependencies |

### Required fields

1. `<type>: <short summary>`: an allowed type, lowercase, without a scope (`feat:` not `feat(vendor):`), followed by a non-empty summary.
2. `issue: <Jira issue key>`: an uppercase Jira key matching `[A-Z][A-Z0-9]+-[0-9]+`.
3. `description: <brief explanation>`: a non-empty explanation of what changed and why.

Rules the validator applies:

- The three fields are the first three non-blank lines. Blank lines between them are allowed, so `git commit -m ... -m ... -m ...` works.
- Labels (`issue:`, `description:`) are lowercase and followed by a space.
- Anything after the `description:` line is allowed and ignored, for example a longer body or `Co-authored-by:` trailers.
- Merge commits created by Git (`Merge branch 'main' into ...`) are skipped.

More valid examples:

```text
fix: correct login validation
issue: TGTG-35
description: Reject empty or malformed phone values before sending the OTP request.
```

```text
style: format pages with Prettier
issue: TEAM-16
description: Run Prettier on src so the new formatting check passes; no behavior change.
```

```text
ci: add PR validation workflow
issue: TEAM-16
description: Enforce branch naming, commit conventions, formatting, linting, type checking and the build on every pull request.
```

### Invalid commit examples

In this table, ` / ` separates the lines of a message.

| Message | Why it fails |
|---|---|
| `added OTP page` | No `<type>:` prefix, no `issue:` or `description:` lines |
| `feature: add OTP page` + valid issue/description lines | `feature` is not an allowed type |
| `feat(vendor): add orders page` + valid issue/description lines | Scopes are not part of the convention |
| `feat: add OTP page issue: TGTG-24 description: Add the page.` | Everything on one line; `issue:` and `description:` need their own lines |
| `feat: add OTP page` / `description: Add the page.` | The `issue:` line is missing |
| `feat: add OTP page` / `issue:` / `description: Add the page.` | The `issue:` field is empty |
| `feat: add OTP page` / `issue: tgtg-24` / `description: Add the page.` | The Jira key must be uppercase |
| `feat:` / `issue: TGTG-24` / `description: Add the page.` | The summary is empty |
| `feat: add OTP page` / `issue: TGTG-24` / `description:` | The description is empty |
| `feat: add OTP page` / `Issue: TGTG-24` / `description: Add the page.` | Labels must be lowercase |

### Writing a multi-line commit message

**In your editor (recommended).** Run `git commit` without `-m`. Git opens your editor; write the three lines, save and close.

**With three `-m` flags** (works in Bash, PowerShell and cmd):

```bash
git commit -m "feat: add OTP request endpoint" -m "issue: TGTG-24" -m "description: Add phone validation and create an OTP through the configured SMS provider."
```

**With one quoted multi-line string** (Bash, zsh, Git Bash, PowerShell):

```bash
git commit -m "feat: add OTP request endpoint
issue: TGTG-24
description: Add phone validation and create an OTP through the configured SMS provider."
```

### Checking a message locally

Enable the commit-msg hook once per clone. It rejects a bad message before the commit is created (needs Python 3):

```bash
git config core.hooksPath .githooks
```

You can also check a message by hand:

```bash
python3 scripts/validate_commit_message.py --message "$(git log -1 --format=%B)"
```

### Correcting a commit message

If the last commit is wrong, amend it (Git opens your editor; or pass the three `-m` flags shown above):

```bash
git commit --amend
```

If several commits need rewriting, use an interactive rebase, where `N` is the number of commits to go back:

```bash
git rebase -i HEAD~N
```

Change `pick` to `reword` for each commit that needs a new message, save, and write the corrected message when Git asks. After rewriting commits that are already pushed, force-push with lease:

```bash
git push --force-with-lease
```

The pull request updates and CI runs again on the rewritten commits.

## Pull request convention

- One Jira issue per pull request; the branch name and every commit carry the same Jira key where possible.
- Use the pull request template. Give the PR a title in the same `<type>: <short summary>` form as the commit subject.
- Keep the pull request focused. Formatting-only changes go in their own `style:` commit so reviewers can skip them.
- All CI checks must be green, and the GitHub ruleset approval is still required. CI complements the review; it does not replace it.
- If the PR is merged with **Squash and merge**, edit the squash commit message on GitHub so it follows the three-line format, because that message is what lands on the target branch.
- To bring your branch up to date, merging the target branch in (`git merge origin/main`) is fine; CI skips the merge commit.

## Quality checks

Every pull request runs these jobs on GitHub-hosted `ubuntu-latest` runners. Each one is a separate check on the pull request, so you can see which one failed and open its log from the **Checks** tab. A new push cancels the previous run of the same PR.

| CI check | What it runs | Run it locally |
|---|---|---|
| Branch name | `scripts/validate_branch_name.py` | `python3 scripts/validate_branch_name.py "$(git branch --show-current)"` |
| Commit messages | `scripts/validate_pr_commits.py` (every commit in the PR) | see "Checking a message locally" |
| Formatting (Prettier) | `npm run format:check` | `npm run format` fixes it |
| Lint (ESLint) | `npm run lint` | `npm run lint` |
| Type check (TypeScript) | `npm run typecheck` | `npm run typecheck` |
| Build (Vite) | `npm run build` | `npm run build` |

Node.js version: the version in `.nvmrc` (22, the same as the Dockerfile).

### Line endings on Windows

`.gitattributes` keeps every file at LF line endings, which is what Prettier expects. If you cloned before `.gitattributes` existed, refresh your working copy once so Prettier does not report every file. Commit or stash your work first, because this resets the working tree:

```bash
git rm -r --cached -q .
git reset --hard
```

## Development workflow

1. Create a branch: `git switch -c feat/TGTG-24/otp-request`
2. Make your changes and run `npm run format`, `npm run lint`, `npm run typecheck` and `npm run build`.
3. Stage and commit with a compliant message (see above).
4. Push: `git push -u origin feat/TGTG-24/otp-request`
5. Open a pull request on GitHub and fill in the template.
6. Watch the checks on the pull request. If one fails, open its log, fix the problem in a new compliant commit (or reword the commit), and push again. The pull request refreshes automatically with the new results.
7. Request review once everything is green.