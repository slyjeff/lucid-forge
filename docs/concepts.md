# Concepts

## The Architecture: Schema at the Center

LucidForge's architecture is a producer-consumer model with the artifact schema as the contract:

```
                       ┌─────────────────┐
                       │  Claude Code    │
                       │  Skill          │
                       │  (producer)     │
                       └────────┬────────┘
                                │ writes
                                ▼
                       ┌──────────────────┐
                       │ .lucidforge/     │
                       │  files (artifact │
                       │  schema)         │
                       └──┬──────┬──────┬─┘
                   reads  │      │      │  reads
               ┌──────────┘      │      └──────────┐
               ▼                 ▼                  ▼
       ┌──────────────┐  ┌─────────────┐  ┌──────────────┐
       │  Wails App   │  │  VS Code    │  │  JetBrains   │
       │  (Go/React)  │  │  Extension  │  │  Plugin      │
       └──────────────┘  └─────────────┘  └──────────────┘
```

The skill and readers never talk to each other. They communicate through the filesystem. This means:

- Any reader can be built in any language
- New readers can be added without changing the skill
- The skill can be improved without changing any reader
- Artifact files are inspectable by humans directly

## Agents

In Claude Code, agents are defined as `.claude/agents/*.md` files — a system prompt with optional metadata. The LucidForge skill uses these as the specialized workers for each step.

LucidForge agents are marked with `lucidforge: true` in their frontmatter to distinguish them from other Claude Code agents in the project:

```markdown
---
name: Backend API
model: claude-sonnet-4-6
lucidforge: true
---

You are a senior backend engineer. You own the API layer.

## Directories
- src/api/
- src/services/

## Instructions
- Use dependency injection for all service dependencies
- All endpoints return standard API response wrappers

## Learnings
- The PaymentsService uses gRPC, not REST
- Rate limiting is handled at the gateway, not in service code
```

The `lucidforge: true` marker lets readers filter to only LucidForge agents and lets the skill know which agents are available for step assignment. A project can have other Claude Code agents for non-LucidForge purposes — they won't appear in the LucidForge UI.

### Agent generation

A separate `lucidforge-agents` skill scans the project structure and generates LucidForge agent files. It analyzes directory layout, language/framework usage, and code organization to recommend agents with appropriate names, descriptions, directory scopes, and identities. Users run this skill once to bootstrap, then edit agents through the reader's UI or directly in the markdown files.

The main `lucidforge` skill checks for LucidForge agents before starting and prompts the user to run `lucidforge-agents` if none exist.

### Agent management in readers

Readers provide a full management UI for LucidForge agents (files with `lucidforge: true`):

- **Add**: create a new agent with name, description, directories, identity, and model. The reader writes a new `.md` file to `.claude/agents/` with `lucidforge: true` frontmatter.
- **Edit**: modify any agent field — name, description, model, identity, directories, instructions. Changes are written back to the `.md` file.
- **Delete**: remove an agent file (with confirmation). The General agent cannot be deleted — it's the catch-all for cross-cutting code.
- **Merge**: combine two agents into one. Select a source and target — the target gets the source's directories (deduplicated), instructions (appended), and learnings (combined). The target keeps its own identity and model if set. The source agent file is deleted after merge.

Learnings are displayed read-only in the management UI. They accumulate over time through a post-approval hook that appends insights to the relevant agent files.

## Features

A feature is a unit of work — "add user authentication" or "refactor the billing module." Each feature goes through a lifecycle:

```
Discovery → (UX Design) → Planning → Execution → Code Review → User Review → Done
   │             │            │           │            │              │
   │             │            │           │            │              └── readers
   └─────────────┴────────────┴───────────┴────────────┘
                           skill
```

The skill drives everything up through code review. UX design is optional — skipped when the feature has no user-facing changes. Readers handle user review. The handoff point is when the skill writes the final artifact files and sets the feature status to `user-review`.

After handoff, the user can make targeted changes with `/lucidforge-change`. This skill takes a natural-language description, matches it to the right step and agent, makes the change, validates, and updates the step artifact (files, members, connections, patterns, summary). It clears `viewedFiles` for any file it touches so the reviewer knows to re-check. It can be called multiple times on the same feature.

Readers present the full picture: discovery (the intent), UX design (the design), plan (the approach), and then step-by-step code changes (the implementation). This lets reviewers evaluate not just "is the code correct?" but "does the code match what was asked for?"

Features are stored as a directory of artifact files under `.lucidforge/features/{feature-id}/`.

## Steps

A step is a single unit of execution within a feature — one agent doing one coherent piece of work. Steps are ordered and executed sequentially. Each step produces:

- **Agent assignment**: which `.claude/agents/` agent executed it
- **Tasks**: the specific work items within the step, with completion state
- **Change map**: which files changed, which members were added/modified, how files connect, and why each file changed
- **Design patterns**: patterns identified in the step's changes
- **Change summary**: natural-language description of what the step accomplished
- **Validation result**: whether build/test passed and how many retries were needed
- **Token usage**: input/output tokens and estimated cost

Step artifact files are written in two phases for real-time progress tracking. Before the agent starts, the skill writes the step file with `status: "executing"` and all tasks marked incomplete. After the agent finishes and validation passes, the skill overwrites the file with the full artifact (change map, patterns, summary, `status: "completed"`). This means readers can show which step is currently running and which tasks are pending — even while the skill is still executing.

Steps accumulate changes in the working tree without per-step commits. One commit per feature on approval.

## Change Maps

A change map captures *what* changed and *why* at a granular level:

- **Files**: each changed file with its category (added/modified/deleted), the members it contains, and per-file reasoning explaining the motivation and trade-offs
- **Connections**: relationships between files and members (e.g., "UserController.cs calls UserService.CreateUser")
- **Members**: functions, classes, interfaces, properties that were added or modified within each file

Change maps power the visual step map in readers — an interactive diagram showing how the step's changes connect across the codebase.

## Artifact Files

The structured output the skill writes and readers consume. See [artifact-schema.md](artifact-schema.md) for the full specification. Key files:

| File | Purpose | Written by | Read by |
|---|---|---|---|
| `feature.json` | Feature metadata, status, usage | Skill | Readers |
| `discovery.md` | Feature description, requirements, constraints | Skill | Readers |
| `ux.md` | UX design spec (optional) | Skill | Readers |
| `mockups/*.html` | Self-contained HTML mockups (optional) | Skill | Readers |
| `plan.md` | Step plan with task lists and file predictions | Skill | Readers |
| `steps/*.json` | Per-step artifacts (change map, patterns, summary) | Skill | Readers |
| `review.json` | Code review issues | Skill | Readers |

Readers render `discovery.md`, `ux.md`, and `plan.md` as formatted markdown — these documents give reviewers the *intent* (what was asked for, what the UX should look like, what was planned) so they can evaluate whether the code matches.

One exception: `viewedFiles` in step artifacts is written by readers (tracking which files the user has reviewed). This is the only field readers write.

The `viewedFiles` field also serves as a review gate: the CLI commit skill (`/lucidforge-commit`) checks whether all changed files have been marked as viewed before creating the commit. If files are unviewed, it warns the user and lists them — suggesting the LucidForge GUI if none have been reviewed at all. The user can override this soft block, but the intent is to encourage thorough review before approval.

## Validation

After each step, the skill runs the project's build and test commands. If validation fails, the agent gets the error output and retries. This happens inside the skill — readers only see the final result.

The artifact file records whether validation passed and how many retries were needed.

## Learnings

Agents accumulate project-specific knowledge over time. When a feature is approved, a post-approval hook or skill extracts insights from the work and appends them to the relevant agent files.

This is just appending text to a markdown file. The agents read their own file as their system prompt, so learnings are automatically included in future work.

## The Reader's Job

A reader is more than a viewer — it's the control surface for the entire LucidForge workflow. It:

1. Manages LucidForge agents (add, edit, delete, merge)
2. Finds `.lucidforge/features/` directories
3. Reads `feature.json` to get feature metadata and status
4. Presents discovery, UX design, and plan documents as formatted markdown
5. Reads step artifact files to get change maps, patterns, summaries
6. Computes diffs by comparing the working tree to the base commit
7. Presents all of this in a navigable UI
8. Tracks which files the user has reviewed
9. On approval, creates a single commit on the source branch

A reader has no AI logic, no prompt engineering, no API keys, no network calls (except git). It reads files and presents UI.
