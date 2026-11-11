---
name: prospect-standards-migrate
description: Fully migrate a specified Prospect Analyzer file to current project coding standards, preserving behavior and verifying all affected files. Use for standards migrations, not ordinary narrow edits.
---

# Prospect standards migration

Migrate the user's specified file to complete compliance with all applicable current repository standards, including necessary companion files and callers. A formatter or checker pass alone is never a complete migration. Preserve functionality, business rules, public contracts, accessibility, SSR behavior, and visual behavior; if a standard requires a behavior change, make the smallest compatible change and verify it.

## Definition of done

A migration is complete only when the specified file and every necessary companion file have been reviewed independently, existing behavior and contracts have been verified, focused validation has passed, and the final report separates current-change failures from pre-existing repository failures. An empty filtered standards-check invocation is not a pass.

## Authority and scope

Locate the root containing `AGENTS.md`, `CODE-STANDARD/`, `prospect-analyzer-ui/`, and `prospect-analyzer-core/`. Before editing, read `AGENTS.md`, `CODE-STANDARD/INDEX.md`, and the **complete current text of every applicable document** in `CODE-STANDARD/`. Read relevant configurations and nearby patterns too. Do not rely on this skill's summary in place of the originals. Use local `CODE-STANDARD/` documents as the source of truth. Use [references/coverage.md](references/coverage.md) as the audit map and include any newly added standards documents. Where prose, examples, the checker, or existing code disagree, follow `AGENTS.md` and the normative standards prose, resolving ambiguity from context. Never relax protected standards scripts, config, or allowlists to make a migration pass.

## Workflow

1. Resolve the exact path and owner: Angular feature/core/shared/server, FastAPI API/core/models/services/tests, asset, or configuration. Inspect Git status in the relevant independently versioned application and preserve unrelated user changes. Read the entire target, direct companions (component template, SCSS, test, constants, interfaces, barrels), relevant callers, and focused tests. Record observable behavior and contracts before edits. For generated/vendor/third-party files, identify and migrate the owning source instead of patching dependency code.
2. Build a requirement inventory for the target and anticipated affected files from the current originals and coverage map. Include banned-pattern absence checks. Fix applicable existing violations throughout the **whole specified file**, not only touched lines. Distinguish unrelated repository violations. Check existing barrels before imports and choose the narrowest owner for logic, contracts, constants, and copy.
3. Make the smallest coherent change set that achieves full compliance. Update companion templates/styles, callers, types, barrels, selectors, and tests when necessary. Preserve stable legacy forms unless substantially refactoring the form; then use Signal Forms and the application-owned third-party CVA compatibility boundary. Avoid unrelated cosmetic rewrites.
4. Before editing **each** file, classify it and read every applicable standards document. Revisit the exact changed-file set as it grows. Review every changed file independently; for a component, review template and SCSS even if unchanged. Avoid mechanical changes to lifecycle, reactive state, request races, query serialization, icon sizing, accessibility, or layout.
5. Validate in layers: focused lint, formatting checks, types, and meaningful tests where supported, then build and broader tests when needed to establish preserved behavior. For UI changes, visually inspect relevant states and responsive layouts. From `prospect-analyzer-ui/`, run `node scripts/check-angular22-standards.mjs` with the **exact changed `src/...` `.ts`, `.html`, and `.svg` paths**; it ignores other extensions, so manually audit SCSS. Confirm the CLI actually accepted the intended files. Use a separate no-argument scan when useful to identify pre-existing repository-wide failures. Review warnings manually. For backend files use focused pytest, Black/isort checks, configured typing checks, and relevant integration tests.
6. Inspect final diff, imports/exports, affected callers, test names, and exact changed-file list. Rerun failed gates after fixes. Confirm checker-supported paths were accepted by the command; if no supported paths exist, record the checker as N/A. Do not claim complete compliance while an applicable rule or behavior check remains unverified. If a gate cannot run, explain why and what evidence substitutes. If a real violation remains, keep working or report the migration as incomplete.

## Completion report

Report the specified file, all related changed files, preserved behavior, and a **per-file pass/fail matrix** naming applicable standards documents, manual review, checker result or N/A, focused lint/format/type/test results, and limitations. Separate current-change failures from pre-existing repository-wide failures. Include visual verification for UI work. Do not stage, commit, or push; Git is inspection-only. Do not change protected standards files, credentials, `.env` files, or Terraform secrets/state.
