---
name: git-commit-message
description: Generate one clear Conventional Commit message and non-technical bullet summary from the current changes without staging, committing, or pushing.
---

# Generate a Git Commit Message

Review the current change set and produce one recommended Conventional Commit
message. This skill is advisory only: never run `git add`, `git commit`, or
`git push`.

## Workflow

1. Inspect `git status` and the relevant diff in the application repository.
2. Identify the primary user-visible purpose of the change.
3. Choose the most accurate commit type (optionally include scope if the project uses scopes).
4. Write a concise subject in imperative mood, capitalize the first word after
   the colon, and omit a trailing period.
5. Summarize the meaningful outcome in short, non-technical bullet points.
6. Do not invent behavior, issue numbers, test results, or files that are not
   supported by the change.

## Commit Types

- `feat`: adds a user-facing capability.
- `fix`: corrects broken or incorrect behavior.
- `chore`: maintenance, configuration, dependencies, or tooling.
- `refactor`: changes internal structure without changing behavior.
- `docs`: documentation-only changes.
- `test`: test-only changes.
- `style`: formatting or presentation-only changes.
- `perf`: improves performance without changing the intended behavior.
- `build`: build-system or packaging changes.
- `ci`: continuous-integration changes.

Format: `<type>: <subject>` or `<type>(<scope>): <subject>`

## Required Output

Return exactly this structure:

```text
<type>: <short imperative subject>

- <plain-language outcome or user benefit>
- <plain-language secondary outcome>
```

Use two to four bullets when useful. Describe what changed for users or the
project, not implementation details. Avoid source-file names, function names,
class names, framework jargon, command output, and phrases such as "updated
the component" when a clearer user-facing description is available.

If the change set contains unrelated work, identify the primary change and
warn that the changes should be separated before committing.
