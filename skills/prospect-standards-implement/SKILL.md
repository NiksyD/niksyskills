---
name: prospect-standards-implement
description: Implement a requested feature, fix, or code change in Prospect Analyzer while applying its current coding standards to every new or modified file. Use when the user names this skill and describes the implementation; use prospect-standards-migrate for a full existing-file standards migration.
---

# Implement to Prospect Analyzer standards

Treat the user's remaining request as the implementation specification. They do not need to repeat the standards, list affected files, or prescribe checks. Deliver the requested behavior completely and keep existing functionality, public contracts, business rules, SSR behavior, accessibility, and visual behavior intact unless the request explicitly changes them. Apply **every applicable current project standard** to each new or modified file. This skill governs an implementation, not a whole-file migration of unrelated pre-existing code; if the user also requests full migration, use `prospect-standards-migrate` for that scope.

## Definition of done

An implementation is complete only when all of the following are true:

- The exact changed-file set was identified before editing and reviewed independently afterward.
- Existing Git changes were inspected and preserved; unrelated cleanup was not included.
- Every changed file was classified and checked against all applicable current standards.
- Behavior changes have focused tests added or updated where the application supports them.
- Focused formatting, lint, type/template, and test checks were run before broader checks.
- UI checker invocations confirmed that the intended file paths were actually accepted; an empty filtered file set is not a passing result.
- The final diff, imports/exports, callers, public contracts, and test names were reviewed.
- New failures are separated from pre-existing repository failures in the completion report.

## Establish the rules and change set

Find the repository root containing `AGENTS.md`, `CODE-STANDARD/`, `prospect-analyzer-ui/`, and `prospect-analyzer-core/`. Read `AGENTS.md` and `CODE-STANDARD/INDEX.md`, then read the **complete current text of every `CODE-STANDARD/` document applicable to the anticipated files** before editing. Use `../prospect-standards-migrate/references/coverage.md` as an audit aid, but treat the current original standards documents as authoritative. Revisit the documents when the change set expands. The local documents are authoritative for UI work; do not use stale external links or substitute remembered summaries. Honor user instructions where they override a skill guideline. Where examples, checker behavior, and normative prose differ, follow `AGENTS.md` and the normative prose, resolving ambiguity from context.

Inspect the relevant application's Git status, target files, companion templates/styles/tests, callers, contracts, and available barrels. Classify the exact proposed changed-file set by owner and type before editing: Angular feature/core/shared/server, FastAPI API/core/models/services/tests, asset, or configuration. Preserve unrelated user edits. Choose the narrowest correct location for each addition: feature/page component, shared utility, model/interface, service, or owning `constants/<name>.constant.ts` with barrel. Check whether pure parsing, formatting, validation, or normalization belongs in `src/app/shared/utils/` and whether stable UI copy belongs in an owning feature constants barrel. Do not alter vendor/generated files or protected standards/config/allowlists to bypass a rule.

## Implement

Make the smallest coherent set of changes that fulfills the behavior, including necessary API, UI, types, callers, constants, barrels, tests, and configuration. For each file, read its applicable standards before editing and independently review the resulting file. Apply the standards to all new code and to existing code substantially refactored by the request. Do not leave newly introduced violations or a partially converted component. Avoid unrelated cleanup solely to make an old file globally pristine; report pre-existing violations separately. If the request explicitly asks for a full file migration, invoke the migration skill and bring that whole file into compliance.

In Angular work, pay particular attention to standalone `OnPush` components, `inject()`, signals, signal inputs/outputs, native control flow and tracked loops, Signal Forms for new or substantially refactored forms, the application `SignalFormControl` boundary for third-party CVAs, explicit access/returns and meaningful JSDoc, async request counters, `withLoading`, owner constants and nearest barrels, accessible action controls, `<app-svg-icon>`, BEM templates/SCSS, first-rule `:host { @apply block; }`, theme colors, and the documented bans. Check the original documents for exact conditions and exceptions.

In FastAPI work:

- Keep routers in `src/api/`, infrastructure in `src/core/`, schemas in `src/models/`, and business logic in `src/services/`.
- Preserve request/response schemas, status codes, error shapes, authentication behavior, and external API contracts unless the request explicitly changes them.
- Keep validation and serialization in typed Pydantic models; keep business rules out of routers when they belong in services.
- Place unit tests in `tests/` and integration tests in `tests/integration/`, using `test_*.py` names.
- Run focused pytest tests first, then the configured Black/isort/type checks and broader tests when useful.
- Do not weaken security, logging, configuration, or error handling to make tests pass.

Preserve SSR and external API contracts where relevant.

## Verify and report

Run focused checks first: changed-file lint and formatting, type/template compilation, meaningful focused tests, and then a build or broader tests when needed to establish the behavior. For UI changes, visually inspect affected states and responsive behavior when feasible. From `prospect-analyzer-ui/`, run `node scripts/check-angular22-standards.mjs` with the **exact changed `src/...` `.ts`, `.html`, and `.svg` paths**; confirm the command received and accepted those intended paths. If there are no checker-supported files, record the checker as N/A rather than treating an empty filtered invocation as a pass. The checker does not cover SCSS or all semantic requirements, so manually review those. For backend changes, use focused pytest and configured Black/isort/type checks as applicable. Do not treat a passing aggregate scan as per-file proof. Inspect the final diff and changed-file set, fix current-change failures, and distinguish unrelated pre-existing repository failures.

In the final response, state what was implemented, how existing behavior was preserved, and a per-file pass/fail matrix with applicable standards, manual review, checker or N/A, and focused lint/format/type/test results. State any validation or visual-access limitation accurately. Do not stage, commit, or push automatically; do not expose or commit credentials, `.env` files, or Terraform secrets/state.
