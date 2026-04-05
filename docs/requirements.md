# Requirements

## Problem

AI code generation tools produce changes fast, but reviewing those changes is hard. When an AI modifies 15 files across 6 steps, developers face a wall of diffs with no structure, no explanation of *why* each file changed, and no way to understand the design decisions behind the code.

## Insight

The orchestration and review concerns should be fully separated. A Claude Code skill handles orchestration (discovery, planning, execution, validation) and writes structured artifact files. Any number of independent readers can present those artifacts for human review — a desktop app, a VS Code extension, a JetBrains plugin. The artifact schema is the only contract.

## What We're Building

LucidForge is an ecosystem with three layers:

### 1. The Artifact Schema

A well-defined file format (JSON + markdown) that captures everything a reviewer needs: what changed, why it changed, how files connect, what patterns were used, and what each step accomplished. This is the product — everything else is a producer or consumer.

### 2. Claude Code Skills (Producers)

Two skills that work together:

**`lucidforge-agents`** — scans the project structure and generates specialized agent files (`.claude/agents/*.md` with `lucidforge: true`). Run once to bootstrap a project, or re-run when the project structure changes. Preserves user-edited instructions and learnings.

**`lucidforge`** — orchestrates feature development through structured steps:

- **Discovery**: explores the codebase, asks clarifying questions, produces a feature description
- **Planning**: breaks the feature into ordered steps, each assigned to a LucidForge agent
- **Execution**: spawns the assigned agent for each step, runs build/test validation between steps, writes structured artifact files capturing what changed and why
- **Code review**: reviews the generated code and auto-fixes issues

### 3. Readers (Consumers)

Multiple independent readers of the same artifact files:

- **Wails desktop app** (Go + React) — the reference implementation, standalone experience
- **VS Code extension** (TypeScript) — review inside the editor, leveraging VS Code's native diff and webview APIs
- **JetBrains plugin** (Kotlin) — review inside IntelliJ/GoLand/WebStorm

Each reader is a separate project in a separate repo. They share no code. They share only the artifact schema.

## Functional Requirements

### Agent Skill (`lucidforge-agents`)

- FR-A1: Scan the project structure (directories, languages, frameworks, code organization)
- FR-A2: Recommend a set of LucidForge agents with names, descriptions, directory scopes, identities, and model preferences
- FR-A3: Write agent files to `.claude/agents/` with `lucidforge: true` frontmatter
- FR-A4: Preserve existing LucidForge agents — update descriptions and directories if the project structure has changed, but don't overwrite user-edited instructions or learnings
- FR-A5: Leave non-LucidForge agents (without `lucidforge: true`) untouched

### Feature Skill (`lucidforge`)

- FR-S1: Check for LucidForge agents before starting; prompt user to run `lucidforge-agents` if none exist
- FR-S2: Run interactive discovery conversation with the user
- FR-S3: Run optional UX design phase for features with user-facing changes (produces `ux.md` and `mockups/`)
- FR-S4: Generate a step-by-step plan with agent assignments (only assign LucidForge agents)
- FR-S5: Execute each step by spawning the assigned Claude Code agent
- FR-S6: Run build/test validation after each step
- FR-S7: Write a structured artifact file after each step (change map, patterns, reasoning, summary)
- FR-S8: Run a code review pass across all steps after execution
- FR-S9: Auto-fix review issues by dispatching to the responsible agent
- FR-S10: Track token usage and cost per step and per feature

### Readers (Consumers)

- FR-R1: Read artifact files from `.lucidforge/features/{id}/`
- FR-R2: List all features with status, cost, and creation date
- FR-R3: Render discovery document as formatted markdown (feature intent, requirements, constraints)
- FR-R4: Render UX design document as formatted markdown when present, with ability to open HTML mockups in browser
- FR-R5: Render plan document as formatted markdown (planned approach, step overview)
- FR-R6: Display step list with status, agent name, and summary
- FR-R7: Show per-step diffs filtered to that step's changed files
- FR-R8: Show per-file reasoning ("why this file changed")
- FR-R9: Show change map with file connections and member-level detail
- FR-R10: Show design patterns identified per step
- FR-R11: Support unified and side-by-side diff views
- FR-R12: Support syntax highlighting for common languages
- FR-R13: Track per-file viewed state (persisted across sessions)
- FR-R14: Support feature approval workflow (approve → single commit on source branch)
- FR-R15: Display token usage and cost per step and per feature
- FR-R16: List LucidForge agents (`.claude/agents/*.md` files with `lucidforge: true` in frontmatter)
- FR-R17: View agent details — name, description, model, identity, directories, instructions, learnings
- FR-R18: Edit agent fields — name, description, model, identity, directories, instructions (write changes back to the `.md` file)
- FR-R19: View agent learnings (read-only display; accumulated by post-approval hook, not by the reader)
- FR-R20: Add new LucidForge agent — user provides name, description, directories; reader creates the `.md` file with `lucidforge: true`
- FR-R21: Delete a LucidForge agent — removes the `.md` file (with confirmation). Cannot delete the General agent.
- FR-R22: Merge two LucidForge agents — select source and target; merges directories (deduplicated), instructions (appended), and learnings (combined). Source agent is deleted after merge. Target keeps its identity and model if set.

## Non-Functional Requirements

- NF-1: Readers have zero AI dependencies — they read files, compute diffs, and present UI
- NF-2: The artifact schema is the only contract — skill and readers are independently deployable
- NF-3: Readers start fast (< 2 seconds) and handle features with 20+ steps
- NF-4: Artifact files are human-readable JSON and git-friendly
- NF-5: The Wails app works cross-platform (Windows, macOS, Linux)
