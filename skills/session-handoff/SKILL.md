---
name: session-handoff
description: Manage session continuity across chats. Generates a clean HANDOFF.md before starting a new chat or resumes work from an existing HANDOFF.md without context rot.
---

# Session Handoff & Continuity

Use this skill when preparing to switch to a fresh chat session or when resuming a project from a previous session's handoff file. This avoids context rot, token exhaustion, and lost instructions.

## Modes of Operation

### 1. Export Mode (Ending a session)
Triggered when the user asks to save state, prepare a handoff, switch to a new session, or says `@session-handoff export`.

**Workflow:**
1. Inspect Git status, recent diffs, and the current conversation progress.
2. Create or overwrite `HANDOFF.md` at the root of the active workspace.
3. Use the exact template structure below. Keep it concise, high-signal, and factual:
   - **Do not** write speculative next steps; only document real pending work.
   - **Do not** preserve dead ends or abandoned debugging attempts—only record what works and what to avoid.
4. Output a brief confirmation showing where `HANDOFF.md` was saved and what prompt to paste in the fresh chat.

### 2. Resume Mode (Starting a new session)
Triggered when the user starts a fresh chat and mentions `@session-handoff`, `resume`, or asks to continue from the handoff file.

**Workflow:**
1. Read `HANDOFF.md` from the project root.
2. Confirm the current workspace matches the documented branch, changed files, and environment.
3. Report the goal, the current status, and propose executing **Step 1** of the immediate next steps.
4. Wait for user confirmation or proceed directly if explicitly instructed.

---

## Required `HANDOFF.md` Structure

```markdown
# Session Handoff: [Feature / Task Name]

**Date:** [ISO Date or YYYY-MM-DD]  
**Branch:** [Active Git branch]  
**Primary Goal:** [One clear sentence describing the ultimate objective]

---

## 1. Current State & Deliverables
- [x] [Completed item with relative file paths]
- [ ] [In-progress item with current status]
- [ ] [Pending deliverable]

## 2. Key Architecture & Design Decisions
- **Decision:** [e.g. Using Signal Forms instead of ReactiveForms]
  - *Rationale:* [Brief technical reason or standard reference]
- **Decision:** [e.g. Preserved BFF contract in src/server/]
  - *Rationale:* [Why this approach was chosen over alternatives]

## 3. Discarded Approaches (What NOT to do)
- [Briefly state failed or rejected approaches so the next session does not re-attempt them]

## 4. Immediate Next Steps (Prioritized)
1. **[Next Action 1]**: [Specific file and implementation detail]
2. **[Next Action 2]**: [Verification check or follow-up task]

## 5. Verification Commands
```bash
# Focused check commands relevant to this task
[e.g. npm test / npm run validate / poetry run test]
```
```
