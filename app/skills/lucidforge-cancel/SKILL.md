---
name: lucidforge-cancel
description: Cancel a LucidForge feature — marks it as cancelled and optionally reverts all file changes.
user-invocable: true
allowed-tools:
  - Read
  - Edit
  - Bash
  - Glob
argument-hint: "[feature-id]"
---

# LucidForge Cancel

Cancel a LucidForge feature. Marks the feature as cancelled and optionally reverts all file changes to their pre-feature state.

## Process

1. **Find the feature to cancel:**
   - If `$ARGUMENTS[0]` is provided, use it as the feature ID.
   - Otherwise, scan `.lucidforge/features/` for features with `"status": "user-review"`.
   - If multiple features are in `user-review`, list them and ask the user which one to cancel.
   - If no features are in `user-review`, report that and stop.

2. **Read the feature data:**
   - Read `.lucidforge/features/{feature-id}/feature.json` to get the feature metadata.
   - Read all step files in `.lucidforge/features/{feature-id}/steps/*.json`.
   - Collect all changed file paths from the step change maps.

3. **Confirm with the user:**
   - Show the feature name, description, number of steps, and number of files changed.
   - Ask: "Do you want to cancel this feature?"
   - If the user says no, stop.

4. **Ask about file changes:**
   - Ask: "Do you want to revert the file changes, or keep them in the working tree?"
   - **Keep changes:** Only update the feature status. Files remain as-is.
   - **Revert changes:** For each file in the change maps:
     - Files with category `add`: delete the file from the working tree.
     - Files with category `modify` or `delete`: restore to the base commit state using `git checkout {baseCommit} -- {filePath}`.

5. **Update feature status:**
   - Edit `.lucidforge/features/{feature-id}/feature.json` to set `"status": "cancelled"`.

6. **Report:**
   - Confirm the feature was cancelled.
   - If changes were reverted, list the files that were restored or removed.

## Rules

- Only cancel features in `user-review` status. Refuse to cancel features in any other status.
- Always confirm with the user before cancelling. Never cancel without explicit approval.
- If reverting, do NOT delete the `.lucidforge/features/{feature-id}/` directory — keep the artifacts for reference.
- If `git checkout` fails for a file during revert, report the error but continue with other files.
