---
name: lucidforge-change
description: Make a change to a LucidForge feature — edits code, runs validation, and updates the relevant step artifact.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
argument-hint: "<description of the change>"
---

# LucidForge Change

Make a targeted change to an in-progress LucidForge feature. Edits code, validates, and updates the relevant step artifact with new files, members, connections, patterns, and summary.

This skill can be called multiple times on the same feature.

## Arguments

- `$ARGUMENTS` — a natural-language description of the change to make (required).

## Process

### 1. Find the active feature

- Check the current git branch. If it matches `lucidforge/*`, extract the feature ID.
- Otherwise, scan `.lucidforge/features/` for features with `"status": "user-review"`.
- If multiple features match, list them and ask the user which one.
- If no features match, report that and stop.
- Read `feature.json` and all step files in `.lucidforge/features/{feature-id}/steps/*.json`.

### 2. Determine the target step

- Read the change description and assess which files will likely be touched.
- Match against existing steps by comparing:
  - File overlap: which step's `changeMap.files` already covers the relevant files?
  - Agent territory: which step's agent owns the directories involved? (Read the agent files if needed.)
- If the change clearly maps to one step, use it.
- If ambiguous, show the user the step list and ask which step this change belongs to.
- If the change doesn't fit any existing step, ask whether to add it to the closest step or skip (do not create new steps — that changes the feature structure).

### 3. Read context

- Read the target step's artifact file for its current state (tasks, changeMap, changeSummary, patterns).
- Read the step's agent file (`.claude/agents/{agent-name}.md`) for the agent's instructions and identity.
- Read the feature's `discovery.md` for requirements context.

### 4. Make the change

- Spawn the step's assigned agent using the Agent tool. The step's `agent` field names the agent — use `.claude/agents/{agent-name}.md` as the agent (e.g., `Agent("@backend-api", ...)`). This ensures the change is made with the same identity, instructions, and directory scope as the original step. Pass it a prompt containing:
  - The user's change description
  - The step's current changeSummary (so it knows what's already been done)
  - The list of files already in the step's changeMap (so it knows what exists)
  - Relevant requirements from discovery
  - Clear instruction: implement the requested change, edit/create the necessary files, and report what you did and which files you touched

### 5. Validate

- Look for build/test commands (Makefile, package.json scripts, go.mod, Cargo.toml, etc.).
- Spawn `@lf-verification` with the commands found:

  ```
  Run validation after a LucidForge change.

  Build command: {build command}
  Test command: {test command}
  ```

- If verification reports failures, send the error output back to the same execution agent and ask it to fix. Retry up to 3 times.
- If validation still fails after retries, report the failure and stop without updating the step artifact.

### 6. Update the step artifact

Read the existing step JSON, then update it:

**Tasks:**
- Append a new task entry describing the change, marked as `completed: true`.

**changeMap.files:**
- For files already in the changeMap that were modified again: update their `reasoning` to note the additional change, refresh `members` by reading the file to identify current members.
- For new files not already in the changeMap: add a new entry with `path`, `category` (add/modify/delete), `reasoning`, and `members`.
- For each file entry being added or updated, read the actual file to accurately populate `members`.

**changeMap.connections:**
- Identify any new connections introduced by the change (imports, function calls, type references between changed files).
- Append new connections. Do not remove existing connections.

**patterns:**
- If the change introduces a design pattern not already listed, add it.
- Do not remove existing patterns.

**changeSummary:**
- Rewrite the summary to incorporate the new change. It should read as a coherent description of everything the step accomplished, not a changelog.

**viewedFiles:**
- For any file that was actually modified or created by this change: remove it from `viewedFiles` if present. The reviewer needs to re-check these files.
- Leave all other viewedFiles entries untouched.

**validation:**
- Update `validation.passed` and `validation.retries` to reflect this run.

Write the updated step JSON back to the same file path.

### 7. Update plan.md

- Find the relevant step section in `plan.md`.
- Append the new task as a checked-off item (`- [x] {description}`) under the step's Tasks list.

### 8. Report

Output a brief summary:
- Feature name and step updated
- What was changed
- Files added or modified
- Validation result

## Rules

1. **Only modify features in `user-review` status.** Refuse to change features in any other status.
2. **Do not create new steps.** This skill updates existing steps only.
3. **Do not modify files outside the target step's scope** without asking the user. If the change requires touching files owned by a different step/agent, flag it and ask.
4. **Preserve existing step data.** Append to tasks, files, connections, and patterns — do not remove or replace existing entries (except changeSummary which is rewritten, and viewedFiles which are cleared for touched files).
5. **Validate before updating artifacts.** Never update the step JSON if the build/tests fail.
6. **Be accurate in changeMap updates.** Read the actual files after changes to identify members and connections. Do not guess.
