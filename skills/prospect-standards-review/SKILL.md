---
name: prospect-standards-review
description: Review a Prospect Analyzer implementation against the user request, repository standards, tests, contracts, security, and final validation without changing files unless explicitly requested.
---

# Review Prospect Analyzer changes

Perform a review, not an implementation. Do not edit files, stage changes, or
commit unless the user explicitly asks for fixes. If a fix is requested, use
`prospect-standards-implement` for the implementation after documenting the
finding.

## Review workflow

1. Find the workspace root containing `AGENTS.md`, `CODE-STANDARD/`,
   `prospect-analyzer-ui/`, and `prospect-analyzer-core/`.
2. Inspect Git status and the exact diff or user-specified change set. Preserve
   unrelated user work and do not review generated output as source.
3. Read `AGENTS.md`, `CODE-STANDARD/INDEX.md`, and the complete applicable
   standards documents before judging a file.
4. Compare the implementation against both the user's requested behavior and
   the standards. Check callers, contracts, companion templates/styles/tests,
   barrels, constants, accessibility, SSR, security, and async race safety.
5. Run focused validation when it is safe and relevant. For Angular, pass the
   exact changed `.ts`, `.html`, and `.svg` paths to the standards checker and
   confirm those paths were accepted. Treat empty filtered input as `N/A`, not
   as a pass.

## Report

Report findings first, ordered by severity:

- **Blocker:** security issue, broken public contract, data loss, or failure of
  the requested behavior.
- **Major:** standards violation, race condition, accessibility regression, or
  missing behavior test on a critical path.
- **Minor:** maintainability, documentation, or non-critical validation gap.

Each finding must include the file and line, evidence, impact, and a concrete
recommendation. End with a per-file pass/fail matrix covering standards,
manual review, checker status, focused validation, and limitations. Separate
pre-existing failures from current-change findings.
