# LucidForge

Structured AI code generation with step-by-step review. LucidForge breaks feature development into phases — discovery, planning, execution, code review, and documentation — then gives you a rich review experience with diffs, change maps, per-file reasoning, and design pattern identification.

Two components work together:

1. **Claude Code skills** orchestrate the development workflow and write structured artifact files
2. **Desktop app** reads those artifacts and presents diffs, change maps, and insights for human review

## Quick Start

### 1. Install the desktop app

Download the latest release for your platform from the [Releases](../../releases) page:

- **Windows** — `lucidforge-windows-amd64.zip` → extract and run `lucidforge.exe`
- **macOS** — `lucidforge-macos-universal.zip` → extract and run `lucidforge.app`
- **Linux** — `lucidforge-linux-amd64.AppImage` → see [Linux install](#linux) below

The app will prompt you to install the Claude Code skills on first launch. Click **Install** to copy them to `~/.claude/commands/`.

### 1a. Install the skills manually (optional)

If you prefer to install from source or skip the app:

```bash
./install.sh          # global install → ~/.claude/commands/
```

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

### Windows & macOS

Download the latest release from the [Releases](../../releases) page, extract the archive, and run the app. On first launch, click **Install** when prompted to install the Claude Code skills.

### Linux

Download `lucidforge-linux-amd64.AppImage` from the [Releases](../../releases) page.

**Run directly (no install):**
```bash
chmod +x lucidforge-linux-amd64.AppImage
./lucidforge-linux-amd64.AppImage
```

**Integrate with your app launcher:**
```bash
./lucidforge-linux-amd64.AppImage --install
```

This copies the `.desktop` file and icon into `~/.local/share/` so LucidForge appears in GNOME, KDE, and other desktop launchers.

### Skills (manual install from source)

```bash
# Global install (all projects)
./install.sh

# Per-project install
./install.sh --project /path/to/your/project
```

### Build from Source

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
| `lucidforge-cancel` | `/lucidforge-cancel [feature-id]` | Cancel a feature, optionally revert changes |

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
app/                                # Wails desktop app (Go + React)
    skills/                         # Claude Code skill files (bundled in the app)
        lucidforge/SKILL.md
        lucidforge-agents/SKILL.md
        lucidforge-cancel/SKILL.md
        lucidforge-change/SKILL.md
        lucidforge-commit/SKILL.md
docs/                               # design documentation
install.sh                          # skill installer (for source installs)
```

## License

MIT
