---
name: lucidforge-commit
description: Commit a LucidForge feature — stages changed files, extracts learnings to agents, creates a commit, and marks the feature as approved.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
argument-hint: "[feature-id]"
---

# LucidForge Commit

Commit a completed LucidForge feature. Extracts learnings from the feature's execution and appends them to the relevant agent files, then creates a single commit with all changes.

## Process

1. **Find the feature to commit:**
   - If `$ARGUMENTS[0]` is provided, use it as the feature ID.
   - Otherwise, scan `.lucidforge/features/` for features with `"status": "user-review"`.
   - If multiple features are in `user-review`, list them and ask the user which one to commit.
   - If no features are in `user-review`, report that and stop.

2. **Read the feature data:**
   - Read `.lucidforge/features/{feature-id}/feature.json` to get the feature metadata.
   - Read all step files in `.lucidforge/features/{feature-id}/steps/*.json`.

3. **Extract learnings:**
   - Read all LucidForge agent files (`.claude/agents/*.md` with `lucidforge: true`).
   - For each step, determine which agent executed it (from the step's `agent` field).
   - For each agent that participated in this feature, extract learnings from their steps:
     - **Patterns discovered** — design patterns used that are specific to this project (not generic CS patterns)
     - **Retry insights** — if validation failed and was retried, what went wrong and how it was fixed
     - **File relationships** — non-obvious connections between files/modules that future work should know about
     - **Project conventions** — coding patterns, naming conventions, or architectural decisions discovered during execution
   - Write each learning as a concise, actionable bullet point.
   - **Filter for value:** Skip learnings that are:
     - Generic programming knowledge (e.g., "use dependency injection")
     - Already documented in the project's README or CLAUDE.md
     - Already present in the agent's existing Learnings section
     - Too specific to this one feature to be useful in future work
   - **Keep learnings that are:**
     - Project-specific knowledge that would surprise a new developer
     - Gotchas or edge cases unique to this codebase
     - Relationships between modules that aren't obvious from the code structure
     - Conventions that aren't documented elsewhere

4. **Append learnings to agent files:**
   - For each agent with new learnings, read their `.claude/agents/{name}.md` file.
   - Append the new learnings as bullet points to the `## Learnings` section.
   - Prefix each new learning with `- ` (markdown bullet).
   - If the Learnings section is empty, add the bullets after the `## Learnings` heading.
   - If the Learnings section already has content, append after the existing bullets with a blank line separator.

5. **Collect changed files:**
   - From each step's `changeMap.files`, collect all file paths.
   - Deduplicate — each file path should appear only once.

6. **Generate the commit message:**
   - Default format: `feat: {feature name}`
   - Include a body with a brief summary of what was done (from the feature description and step summaries).
   - Show the proposed commit message to the user and ask for confirmation. They can edit it or approve.

7. **Stage and commit:**
   - Run `git add` for each changed file.
   - Also `git add` any agent files that were updated with learnings.
   - Run `git commit` with the approved message.
   - Do NOT push. The commit stays local.

8. **Update feature status:**
   - Edit `.lucidforge/features/{feature-id}/feature.json` to set `"status": "approved"`.

9. **Report:**
   - Show the commit SHA, branch, number of files committed, and a summary of learnings extracted per agent.

## Rules

- Only commit features in `user-review` status. Refuse to commit features in any other status.
- Do NOT push to remote. Only create a local commit.
- Stage only the files listed in the change maps plus updated agent files, not everything in the working tree.
- If `git add` or `git commit` fails, report the error and do not update the feature status.
- Do not duplicate existing learnings. Read the agent's current Learnings section before appending.
- Keep learnings concise — one line per learning, actionable and specific.
