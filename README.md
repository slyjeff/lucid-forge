# LucidForge

Structured AI code generation with step-by-step review. LucidForge breaks feature development into phases — discovery, planning, execution, code review, and documentation — then gives you a rich review experience with diffs, change maps, per-file reasoning, and design pattern identification.

Two components work together:

1. **Claude Code skills** orchestrate the development workflow and write structured artifact files
2. **Desktop app** reads those artifacts and presents diffs, change maps, and insights for human review

## Quick Start

### 1. Install the skills

```bash
./install.sh
```

This copies the LucidForge skills to `~/.claude/skills/` so they're available in all projects.

### 2. Generate agents for your project

Open Claude Code in your project directory and run:

```
/lucidforge-agents
```

This scans your project and creates specialized agents (e.g., "Backend API", "Frontend", "Data Layer") in `.claude/agents/`. Each agent owns specific directories and accumulates learnings over time.

### 3. Run a feature

```
/lucidforge "add-user-auth" -p "Add JWT-based authentication with login and register endpoints"
```

LucidForge walks through six phases:

| Phase | What happens |
|---|---|
| **Discovery** | Explores codebase, asks clarifying questions, writes feature spec |
| **UX Design** | Designs user flows and creates HTML mockups (optional, UI features only) |
| **Planning** | Breaks feature into steps, assigns agents, predicts file changes |
| **Execution** | Spawns agents step by step, validates (build + test) after each |
| **Code Review** | Reviews generated code, auto-fixes issues |
| **Documentation** | Updates project docs to reflect changes (if applicable) |

Each phase writes artifact files to `.lucidforge/features/{feature-id}/`.

**Flags:**
- `-p "..."` — feature description (skips the "what do you want to build?" question)
- `--auto-approve` — skip interactive approval gates
- `--skip-ux` — skip UX design phase

### 4. Review changes

**Option A: Desktop app**

```bash
cd app
wails build
./build/bin/lucidforge.exe
```

The app shows:
- **Discovery** — what was asked for, requirements, technical approach
- **Plan** — step-by-step breakdown with agent assignments and file predictions
- **UX Design** — user flows, component specs, HTML mockups you can open in a browser
- **AI Review Notes** — issues found during code review and what was auto-fixed
- **Review** — per-step diffs with syntax highlighting, change navigation, per-file reasoning, and an interactive change map showing how files connect

You can edit files directly in the diff viewer — changes auto-save to disk. Mark files as reviewed to track your progress. Use side-by-side or unified diff mode, toggle whitespace visibility, and search within files.

The app auto-refreshes when artifact files change, so you can have it open while a feature is still executing.

**Option B: Read the files directly**

Everything is in `.lucidforge/features/{feature-id}/` as human-readable JSON and markdown. You can inspect them with any text editor.

### 5. Commit the feature

In Claude Code, run:

```
/lucidforge-commit
```

This:
1. Finds features ready for review (or takes a feature ID)
2. Extracts learnings from the feature's execution and appends them to the relevant agent files
3. Shows a proposed commit message for your approval
4. Stages all changed files plus updated agent files
5. Creates a single commit (does not push)

Agents accumulate project-specific knowledge through learnings — patterns, gotchas, conventions, and relationships discovered during each feature. These learnings make future features more accurate.

You can also cancel a feature from the app (✖ button on the feature card), with the option to revert changes or keep them.

## Install

### Skills

```bash
# Global install (all projects)
./install.sh

# Per-project install
./install.sh --project /path/to/your/project
```

Or copy manually:

```bash
cp -r skill/lucidforge ~/.claude/skills/
cp -r skill/lucidforge-agents ~/.claude/skills/
cp -r skill/lucidforge-commit ~/.claude/skills/
```

### Desktop App

Requires [Go](https://go.dev/dl/) and [Wails v2](https://wails.io/):

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
cd app
wails build
```

The built binary is in `app/build/bin/`.

## Skills Reference

| Skill | Command | Purpose |
|---|---|---|
| `lucidforge` | `/lucidforge "name" -p "description"` | Orchestrate a full feature |
| `lucidforge-agents` | `/lucidforge-agents` | Generate or refresh project agents |
| `lucidforge-commit` | `/lucidforge-commit [feature-id]` | Commit a completed feature |

## Managing Agents

Agents are standard Claude Code agent files in `.claude/agents/` with `lucidforge: true` in their frontmatter. You can manage them:

- **From Claude Code:** Run `/lucidforge-agents --refresh` to update after restructuring
- **From the app:** Click "Agents" to add, edit, delete, or merge agents with a visual editor
- **Manually:** Edit the `.md` files directly

Each agent has:
- **Identity** — who the agent is and what it owns
- **Directories** — which parts of the codebase it's responsible for
- **Instructions** — your project-specific guidelines (you write these)
- **Learnings** — patterns discovered during feature execution (accumulated automatically)

## Artifact Files

```
.lucidforge/
└── features/
    └── add-user-auth/
        ├── feature.json       # metadata, status
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

The artifact schema is documented in [docs/artifact-schema.md](docs/artifact-schema.md). Any tool that reads this format can be a LucidForge viewer.

## Project Structure

```
skill/
    lucidforge/SKILL.md             # feature orchestration
    lucidforge-agents/SKILL.md      # agent generation
    lucidforge-commit/SKILL.md      # feature commit
app/                                # Wails desktop app (Go + React)
docs/                               # design documentation
install.sh                          # skill installer
```

## License

MIT
