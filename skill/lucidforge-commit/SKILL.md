---
name: lucidforge-commit
description: Commit a LucidForge feature — stages all changed files, creates a single commit, and marks the feature as approved.
user-invocable: true
allowed-tools:
  - Read
  - Bash
  - Glob
  - Edit
argument-hint: "[feature-id]"
---

# LucidForge Commit

Commit a completed LucidForge feature. This does the same thing as clicking the commit button in the LucidForge app.

## Process

1. **Find the feature to commit:**
   - If `$ARGUMENTS[0]` is provided, use it as the feature ID.
   - Otherwise, scan `.lucidforge/features/` for features with `"status": "user-review"`.
   - If multiple features are in `user-review`, list them and ask the user which one to commit.
   - If no features are in `user-review`, report that and stop.

2. **Read the feature data:**
   - Read `.lucidforge/features/{feature-id}/feature.json` to get the feature metadata.
   - Read all step files in `.lucidforge/features/{feature-id}/steps/*.json`.

3. **Collect changed files:**
   - From each step's `changeMap.files`, collect all file paths.
   - Deduplicate — each file path should appear only once.

4. **Generate the commit message:**
   - Default format: `feat: {feature name}`
   - Include a body with a brief summary of what was done (from the feature description and step summaries).
   - Show the proposed commit message to the user and ask for confirmation. They can edit it or approve.

5. **Stage and commit:**
   - Run `git add` for each changed file.
   - Run `git commit` with the approved message.
   - Do NOT push. The commit stays local.

6. **Update feature status:**
   - Edit `.lucidforge/features/{feature-id}/feature.json` to set `"status": "approved"`.

7. **Report:**
   - Show the commit SHA, branch, and number of files committed.

## Rules

- Only commit features in `user-review` status. Refuse to commit features in any other status.
- Do NOT push to remote. Only create a local commit.
- Stage only the files listed in the change maps, not everything in the working tree.
- If `git add` or `git commit` fails, report the error and do not update the feature status.
