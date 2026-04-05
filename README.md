# LucidForge

Structured AI code generation with step-by-step review. LucidForge breaks feature development into phases — discovery, planning, execution, and code review — then gives you a rich review experience with diffs, change maps, per-file reasoning, and design pattern identification.

Two components work together:

1. **Claude Code skills** orchestrate the development workflow and write structured artifact files
2. **Review apps** (desktop, VS Code, JetBrains) read those artifacts and present them for human review

## How It Works

```
You ──► /lucidforge "add user auth" ──► Claude Code executes steps ──► .lucidforge/ artifacts
                                                                              │
                                                                              ▼
                                                                    Open LucidForge app
                                                                    Review diffs & maps
                                                                    Approve → commit
```

1. **Set up agents** — Run `/lucidforge-agents` in Claude Code to generate specialized agents for your project
2. **Run a feature** — Run `/lucidforge "feature name" -p "description"` to start the workflow
3. **Review** — Open the LucidForge app to review discovery docs, UX designs, plans, step-by-step diffs, change maps, and code review issues
4. **Approve** — Approve the feature in the app to create a single commit on your source branch

## Install

### Skills (required)

The skills need to be in your Claude Code skills directory. Install globally (all projects) or per-project:

**Option A: Run the install script**

```bash
# Global install (recommended)
./install.sh

# Per-project install
./install.sh --project /path/to/your/project
```

**Option B: Copy manually**

```bash
# Global
cp -r skill/lucidforge ~/.claude/skills/
cp -r skill/lucidforge-agents ~/.claude/skills/

# Per-project
cp -r skill/lucidforge /path/to/project/.claude/skills/
cp -r skill/lucidforge-agents /path/to/project/.claude/skills/
```

### Desktop App

```bash
cd app
wails build
```

The built binary is in `app/build/bin/`. Run it from your project directory or pass the project path as an argument.

## Usage

### 1. Generate Agents

Open Claude Code in your project and run:

```
/lucidforge-agents
```

This scans your project structure and creates specialized agent files in `.claude/agents/` with `lucidforge: true` in their frontmatter. You'll get agents like "Backend API", "Frontend", "Data Layer" mapped to your project's architecture.

To refresh agents after restructuring your project:

```
/lucidforge-agents --refresh
```

You can also manage agents through the LucidForge desktop app — add, edit, delete, and merge agents with a visual UI.

### 2. Run a Feature

```
/lucidforge "add-user-auth" -p "Add JWT-based authentication with login and register endpoints"
```

The skill walks through:

- **Discovery** — explores your codebase, asks clarifying questions, writes a feature description
- **UX Design** (optional) — designs user flows and creates HTML mockups for UI features
- **Planning** — breaks the feature into steps, assigns each to an agent, predicts file changes
- **Execution** — spawns agents step by step, validates (build + test) after each
- **Code Review** — reviews all generated code, auto-fixes issues

Each phase writes artifact files to `.lucidforge/features/{feature-id}/`.

**Flags:**
- `-p "..."` — feature description (skips the initial "what do you want to build?" question)
- `--auto-approve` — skip interactive approval gates (useful for CI)
- `--skip-ux` — skip UX design phase

### 3. Review

Open the LucidForge desktop app. It reads the artifact files and shows:

- **Discovery doc** — what was asked for, requirements, constraints
- **UX design** — user flows, component specs, HTML mockups
- **Plan** — step-by-step breakdown with agent assignments
- **Step review** — per-step diffs, change maps, per-file reasoning, design patterns
- **Code review issues** — what was found and what was auto-fixed

Mark files as reviewed, inspect the change map to understand how files connect, and read the per-file reasoning to understand *why* each file was changed.

### 4. Approve

Click "Approve Feature" in the app. This creates a single commit on your source branch with all the feature's changes.

## Artifact Files

LucidForge stores everything in `.lucidforge/` at your project root:

```
.lucidforge/
└── features/
    └── add-user-auth/
        ├── feature.json       # metadata, status, token usage
        ├── discovery.md       # feature description
        ├── plan.md            # step plan with task lists
        ├── ux.md              # UX design (optional)
        ├── mockups/           # HTML mockups (optional)
        ├── review.json        # code review issues (optional)
        └── steps/
            ├── 00-backend-api.json
            ├── 01-frontend.json
            └── ...
```

These files are human-readable JSON and markdown. You can inspect them directly, commit them to version control, or build your own tools that read them.

## Agents

LucidForge agents are standard Claude Code agent files (`.claude/agents/*.md`) marked with `lucidforge: true` in their frontmatter:

```markdown
---
name: Backend API
description: Handles API layer and business logic
model: claude-sonnet-4-6
lucidforge: true
---

You are a senior backend engineer. You own the API layer.

## Directories
- src/api/
- src/services/

## Instructions
- Use dependency injection for all service dependencies

## Learnings
- The PaymentsService uses gRPC, not REST
```

Agents accumulate learnings over time as you approve features. The `## Instructions` section is yours to edit — add project-specific guidelines and conventions.

Non-LucidForge agent files (without `lucidforge: true`) are left untouched.

## Project Structure

```
skill/                              # Claude Code skills
    lucidforge/SKILL.md             # feature orchestration
    lucidforge-agents/SKILL.md      # agent generation
app/                                # Wails desktop app (Go + React)
docs/                               # design documentation
install.sh                          # skill installer
```

## Documentation

- [Requirements](docs/requirements.md) — what we're building and why
- [Concepts](docs/concepts.md) — architecture, agents, features, steps, artifacts
- [Technical Decisions](docs/tech.md) — stack, project structure, open questions
- [Artifact Schema](docs/artifact-schema.md) — the contract between skills and readers
- [UI Guide](docs/ui-guide.md) — screens, navigation, layouts
- [Code Style](docs/code-style.md) — Go and React/TypeScript conventions
- [Visual Style](docs/style.md) — colors, typography, spacing, components

## License

MIT
