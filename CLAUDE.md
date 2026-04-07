# LucidForge

Cross-platform tool that orchestrates Claude-powered code generation through step-based workflows and provides structured review of AI-generated changes. A Claude Code skill handles orchestration (discovery, planning, execution, code review) and writes structured artifact files. The desktop app and IDE extensions consume those artifacts to present diffs, change maps, insights, and approval workflows — while also managing the agents that do the work.

## Architecture

Producer-consumer model with the artifact schema at the center:

- **Agent Skill** (`app/skills/lucidforge-agents/SKILL.md`) — Claude Code skill that scans the project and generates LucidForge agent files
- **Feature Skill** (`app/skills/lucidforge/SKILL.md`) — Claude Code skill that orchestrates multi-step feature development, writes artifact files to `.lucidforge/features/`
- **Change Skill** (`app/skills/lucidforge-change/SKILL.md`) — Claude Code skill for making targeted changes to a feature's code and updating the step artifact
- **Wails App** (`app/`) — Go + React desktop app, the reference implementation
- **VS Code Extension** — separate repo, TypeScript
- **JetBrains Plugin** — separate repo, Kotlin

The app has zero AI dependencies. It reads files, computes diffs, manages agents, and presents UI.

## Build & Run

```bash
cd app
wails dev      # development with hot reload
wails build    # production build
```

## Project Structure

```
app/                           # Wails desktop app (Go + React)
    skills/                    # Claude Code skill files (embedded in app binary for install)
        lucidforge/SKILL.md
        lucidforge-agents/SKILL.md
        lucidforge-cancel/SKILL.md
        lucidforge-change/SKILL.md
        lucidforge-commit/SKILL.md
    main.go                    # entry point
    app.go                     # Go backend: artifact reading, git, approval
    internal/
        agents/                # LucidForge agent file reading and writing
        artifacts/             # artifact file reading and schema types
        git/                   # diff computation, commit on approval
        features/              # feature listing and state
    frontend/src/
        components/            # DiffViewer, ChangeMap, StepList, AgentEditor, etc.
        hooks/                 # Wails binding hooks
        pages/                 # FeatureList, FeatureReview, AgentManagement
        types/                 # TypeScript types matching artifact schema
docs/                          # design documentation
```

## Design Docs

- `docs/requirements.md` — what we're building and why
- `docs/concepts.md` — key concepts and architecture
- `docs/tech.md` — technical decisions and open questions
- `docs/artifact-schema.md` — the artifact contract (the most important doc)
- `docs/ui-guide.md` — screens, navigation, layout, and data mapping
- `docs/code-style.md` — coding conventions for Go, React/TypeScript, and testing
- `docs/style.md` — visual design: colors, typography, spacing, component styling

## Key Principles

- **The artifact schema is the product** — everything else is a producer or consumer
- **Zero AI dependencies in the app** — it reads files, presents UI, and edits agent files, nothing more
- **`lucidforge: true` marks LucidForge agents** — the app and skills filter `.claude/agents/` by this frontmatter flag
- **Go + React** — matches the team's stack for easy adoption and contribution
- **Web tech for code review UI** — Monaco for diffs, D3/React Flow for change maps, CSS for polish
- **Separate repos for each reader** — no shared code between Wails app, VS Code extension, and JetBrains plugin; they share only the schema
