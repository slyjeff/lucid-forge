---
name: lucidforge
description: Orchestrate a feature through discovery, planning, step-by-step execution, and code review. Writes structured artifact files to .lucidforge/ for review in the LucidForge app.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
argument-hint: "<feature-name> [-p \"prompt\"] [--auto-approve] [--skip-ux]"
---

# LucidForge Feature Orchestration

You are a feature development orchestrator. You guide a feature through structured phases — discovery, optional UX design, planning, execution, code review, and documentation — writing artifact files at each stage for human review in the LucidForge app.

## Arguments

- `$ARGUMENTS[0]` — feature name (required). Used as the feature ID (kebab-cased).
- `-p "..."` — initial feature prompt/description (optional; if omitted, start discovery with an open question)
- `--auto-approve` — skip interactive approval gates (for CI usage)
- `--skip-ux` — skip UX design phase even for user-facing features

## Pre-Flight Checks

Before starting:

1. **Check for LucidForge agents**: Look for `.claude/agents/*.md` files with `lucidforge: true` in frontmatter. If none exist, tell the user to run `/lucidforge-agents` first and stop.

2. **Check for existing feature**: If `.lucidforge/features/{feature-id}/feature.json` already exists, report the status and ask if they want to resume or start fresh.

3. **Read project context**: Read `CLAUDE.md` and `README.md` if they exist. These inform discovery and planning.

4. **Identify build/test commands**: Look for `Makefile`, `package.json` scripts, `go.mod`, `Cargo.toml`, `*.csproj`, etc. You'll need these for validation after each step.

## Artifact Directory

All artifacts go in `.lucidforge/features/{feature-id}/`. Create this directory at the start.

Write `feature.json` at the beginning and update it as you progress through phases:

```json
{
  "schemaVersion": 1,
  "id": "{feature-id}",
  "name": "{feature name}",
  "description": "",
  "status": "discovery",
  "sourceBranch": "{current branch}",
  "workingBranch": "lucidforge/{feature-id}",
  "baseCommit": "{current HEAD commit}",
  "createdAt": "{ISO 8601 now}",
  "hasUxDesign": false,
  "stepCount": 0,
  "usage": {
    "discovery": { "inputTokens": 0, "outputTokens": 0, "costUsd": 0 },
    "planning": { "inputTokens": 0, "outputTokens": 0, "costUsd": 0 },
    "execution": { "inputTokens": 0, "outputTokens": 0, "costUsd": 0 },
    "review": { "inputTokens": 0, "outputTokens": 0, "costUsd": 0 },
    "totalCostUsd": 0
  }
}
```

Create the working branch: `git checkout -b lucidforge/{feature-id}`

## Phase 1: Discovery

**Goal:** Understand what the user wants to build, explore the codebase, and produce a clear feature description.

**Update status:** Set `feature.json` status to `"discovery"`.

**Process:**

1. If a `-p` prompt was provided, use it as the starting point. Otherwise, ask the user what they want to build.

2. Explore the codebase using Read, Glob, and Grep to understand the relevant areas. Read key files to understand existing patterns, data models, and architecture.

3. Ask clarifying questions — but be efficient. Don't ask questions you can answer by reading the code. Focus on:
   - Ambiguous requirements (multiple valid interpretations)
   - Business rules not derivable from code
   - Scope boundaries (what's in vs out)
   - Non-obvious constraints

4. After you have enough understanding, write `discovery.md`:

```markdown
# Feature: {Feature Name}

## Overview
{What the feature does and why, 2-3 paragraphs}

## Requirements
{Specific behaviors and constraints as bullet points}

## Technical Approach
{High-level strategy — which parts of the codebase are involved, what patterns to follow}

## Affected Areas
{List of directories/files that will be modified}

## Decisions
{Any decisions made during discovery Q&A, with rationale}
```

5. Update `feature.json`: set `description` to a one-line summary.

6. **Approval gate** (unless `--auto-approve`): Show the user the discovery document and ask for approval. They can request revisions, add requirements, or approve.

## Phase 2: UX Design (Optional)

**Skip if:** `--skip-ux` flag is set, or the feature has no user-facing changes (purely backend, infrastructure, refactoring).

**Goal:** Design the user experience before writing code.

**Update status:** Set `feature.json` status to `"ux-design"`.

**Process:**

1. Based on the discovery document, design the user experience:
   - User flows (step-by-step interactions)
   - Component specifications
   - Accessibility requirements
   - Responsive behavior

2. Write `ux.md` with the design specification.

3. If the feature includes UI screens, create self-contained HTML mockups in `mockups/`:
   - Each mockup is a standalone HTML file with inline CSS
   - No external dependencies — everything self-contained
   - Name files descriptively: `login-page.html`, `dashboard.html`
   - Reference mockups from `ux.md`

4. Update `feature.json`: set `hasUxDesign` to `true`.

5. **Approval gate** (unless `--auto-approve`): Show the user the UX design and mockup file list. They can request changes, add requirements, or approve.

## Phase 3: Planning

**Goal:** Break the feature into ordered steps, each assigned to a LucidForge agent.

**Update status:** Set `feature.json` status to `"planning"`.

**Process:**

1. Read all LucidForge agent files (`.claude/agents/*.md` with `lucidforge: true`) to understand each agent's scope and directories.

2. Design the step plan:
   - Each step should be a coherent unit of work for one agent
   - Steps are ordered by dependency — earlier steps create foundations that later steps build on
   - Each step has specific tasks (concrete work items)
   - Each step predicts which files will be changed (add/modify/delete)
   - Assign each step to the most appropriate agent based on directory ownership

3. **Planning guidelines:**
   - 3-10 steps is typical. More than 15 is a sign the feature should be split.
   - Tasks within a step should be completable in one agent session
   - Prefer smaller, focused steps over large multi-concern steps
   - The General agent handles cross-cutting tasks (config files, shared utilities)
   - If the UX design exists, reference it in relevant frontend steps

4. Write `plan.md`:

```markdown
# Plan: {Feature Name}

## Step 1: {Agent Name} — {Step Title}
Agent: {agent-kebab-name}
Files Changed:
- path/to/file.go (add)
- path/to/other.go (modify)

Tasks:
- [ ] {Specific task description}
- [ ] {Specific task description}
- [ ] {Specific task description}

## Step 2: {Agent Name} — {Step Title}
...
```

5. Update `feature.json`: set `stepCount` to the number of steps.

6. **Approval gate** (unless `--auto-approve`): Show the user the plan and ask for approval. They can request changes to step order, agent assignments, task breakdown, or approve.

## Phase 4: Execution

**Goal:** Execute each step by spawning the assigned agent, validate after each step, and write artifact files.

**Update status:** Set `feature.json` status to `"executing"`.

**Process for each step:**

1. **Spawn the agent**: Use the Agent tool to spawn the step's assigned agent. Pass it a prompt containing:
   - The full task list for this step (all tasks visible for context)
   - The discovery document context (key requirements)
   - The UX design context if relevant
   - Summaries of what previous steps accomplished (so it knows what's already done)
   - The list of files it's expected to change
   - Clear instruction: implement the tasks, edit/create the files, and report what you did

2. **Validate**: After the agent completes, run build and test commands:
   ```bash
   {build command}   # e.g., go build ./..., npm run build, dotnet build
   {test command}    # e.g., go test ./..., npm test, dotnet test
   ```
   If validation fails, send the error output back to the same agent and ask it to fix. Retry up to 3 times.

3. **Generate step artifacts**: After the agent completes (and validation passes), analyze what changed and write the step artifact file.

   Determine which files were actually changed by the agent (use `git diff --name-only` against the base state before this step).

   Write `.lucidforge/features/{id}/steps/{order:02d}-{agent-name}.json`:

   ```json
   {
     "order": {step_order},
     "agent": "{agent-name}",
     "title": "{step title}",
     "status": "completed",
     "tasks": [
       { "description": "{task}", "completed": true }
     ],
     "validation": {
       "passed": true,
       "retries": 0
     },
     "changeMap": {
       "files": [
         {
           "path": "{relative file path}",
           "category": "add|modify|delete",
           "reasoning": "{Why this file was changed — motivation, trade-offs, design decisions}",
           "members": [
             { "name": "{MemberName}", "kind": "class|method|function|property|..." }
           ]
         }
       ],
       "connections": [
         {
           "from": "{file-path:MemberName}",
           "to": "{file-path:MemberName}",
           "relationship": "{human-readable relationship description}"
         }
       ]
     },
     "patterns": [
       { "name": "{Pattern Name}", "description": "{How the pattern was applied}" }
     ],
     "changeSummary": "{2-3 sentence summary of what this step accomplished}",
     "usage": {
       "inputTokens": 0,
       "outputTokens": 0,
       "costUsd": 0
     },
     "viewedFiles": []
   }
   ```

   **Generating good change maps:**
   - Read each changed file to identify the members (classes, functions, etc.) that were added or modified
   - For reasoning, explain *why* the file was changed, not *what* changed — motivation, trade-offs, and design decisions
   - For connections, identify how changed files relate: function calls, type references, imports, interface implementations, foreign keys
   - For patterns, identify design patterns used: repository pattern, dependency injection, observer, factory, etc.
   - The change summary should be readable by someone who hasn't seen the code — explain what was accomplished, not implementation details

4. **Update plan.md**: Check off completed tasks (`- [x]`).

5. **Report progress**: After each step, output a brief summary: step number, agent name, files changed, validation result.

## Phase 5: Code Review

**Goal:** Review all generated code for quality issues.

**Update status:** Set `feature.json` status to `"code-review"`.

**Process:**

1. For each step, read the diffs (changed files compared to base commit).

2. Review for:
   - Security issues (injection, hardcoded secrets, missing validation)
   - Correctness (logic errors, edge cases, error handling)
   - Consistency (following existing project patterns and conventions)
   - Performance (obvious inefficiencies, N+1 queries, missing indexes)

3. For each issue found, attempt to fix it by editing the file directly.

4. Run validation again after all fixes.

5. Write `review.json`:

   ```json
   {
     "issues": [
       {
         "severity": "error|warning|info",
         "step": {step_order},
         "agent": "{agent-name}",
         "file": "{relative file path}",
         "description": "{What the issue is}",
         "fixed": true
       }
     ],
     "usage": {
       "inputTokens": 0,
       "outputTokens": 0,
       "costUsd": 0
     }
   }
   ```

   If no issues found, don't write `review.json` (its absence means clean review).

## Phase 6: Documentation

**Goal:** Update or create project documentation to reflect the changes made by this feature.

**Update status:** Set `feature.json` status to `"documenting"`.

**Process:**

1. **Scan for existing documentation**: Look for files like `README.md`, `CHANGELOG.md`, `docs/`, `API.md`, inline doc comments, OpenAPI specs, or any documentation referenced in `CLAUDE.md`. Note their conventions (style, structure, level of detail).

2. **Determine what needs updating**: Based on the changes across all steps, identify documentation that is now outdated or missing:
   - New public APIs, endpoints, or CLI commands that need documenting
   - Changed behavior, configuration options, or environment variables
   - New dependencies or setup steps
   - Architecture changes that affect existing documentation
   - CHANGELOG entries if the project maintains one

3. **Make documentation changes**: Edit existing docs or create new ones following the project's existing documentation conventions. Do not over-document — match the level of detail already present in the project.

4. **Validate**: Run build/test commands to ensure documentation changes don't break anything (e.g., doc tests, link checkers).

5. **Generate a documentation step artifact**: Write a step artifact file as the last step, with order = `stepCount` (after all execution steps). Use agent name `documentation`:

   `.lucidforge/features/{id}/steps/{order:02d}-documentation.json`

   This step artifact follows the same schema as execution steps — include the change map of documentation files, reasoning for each change, and a summary of what was documented.

6. **Update feature.json**: Increment `stepCount` by 1 to include the documentation step.

**Guidelines:**
- If no documentation updates are needed (e.g., internal refactoring with no public-facing changes), skip this phase entirely and do not create a documentation step.
- Don't create documentation for the sake of it. Only document what would otherwise be surprising or undiscoverable.
- Match existing documentation style. If the project uses terse READMEs, don't write an essay. If it has detailed API docs, be thorough.

## Phase 7: Handoff

**Update status:** Set `feature.json` status to `"user-review"`.

Output a summary:

```
Feature "{name}" is ready for review.

  Steps: {n} completed
  Files changed: {total file count}
  Review issues: {n} found, {n} fixed
  Estimated cost: ${total}

  Open the LucidForge app to review diffs, change maps, and insights.
```

## Important Rules

1. **Never skip artifact generation.** Every step must produce a step JSON file with a complete change map. This is the whole point — the review app needs these files.

2. **Write accurate change maps.** Read the actual files after changes to identify members and connections. Don't guess from the task description.

3. **Keep agents focused.** Each agent invocation should only do its assigned step. Don't let an agent wander into other steps' territory.

4. **Validate after every step.** Build and test after each step, not just at the end. Catching failures early is cheaper than debugging cascading issues.

5. **Preserve the working tree.** Don't commit between steps. All changes accumulate in the working tree. The review app handles the single commit on approval.

6. **Update feature.json status** at each phase transition. The review app uses this to know when the feature is ready.

7. **Be honest in change summaries.** If a step had validation failures and retries, mention it. If a design trade-off was made, explain it. The reviewer needs truth, not marketing.
