# Technical Decisions

## The Reader Ecosystem

Each reader is a separate project, separate repo, separate language. They share only the artifact schema.

| Reader | Stack | Primary Use Case |
|---|---|---|
| Wails desktop app | Go + React | Standalone experience, reference implementation |
| VS Code extension | TypeScript | Review in-editor, native diff integration |
| JetBrains plugin | Kotlin | Review in IntelliJ/GoLand/WebStorm |

This repo contains the Wails desktop app (reference implementation) and the skills.

## Wails App Stack

| Component | Technology | Rationale |
|---|---|---|
| Backend | Go | Company standard, fast, good file I/O and process execution |
| Frontend | React + TypeScript | Company standard, massive ecosystem for code review UI |
| Framework | Wails v2 | Go + web frontend in a native window, cross-platform |
| Diff rendering | Monaco Editor | VS Code's editor — syntax highlighting, unified/side-by-side diffs, future editing support |
| Change map viz | D3.js or React Flow | Interactive graph visualization |
| Markdown | react-markdown | Mature, extensible |
| Syntax highlighting | Prism.js or Shiki | Web-native, supports 100+ languages |
| Git | Shell out to git | Diff computation, commit on approval — simpler and more reliable than go-git |
| File watching | fsnotify | Auto-refresh when `.lucidforge/` changes during skill execution |

## Project Structure

```
lucidforge/
├── skill/
│   ├── lucidforge/
│   │   └── SKILL.md               # feature orchestration skill
│   ├── lucidforge-agents/
│   │   └── SKILL.md               # agent generation skill (orchestration + execution agents)
│   ├── lucidforge-change/
│   │   └── SKILL.md               # targeted change + step artifact update skill
│   ├── lucidforge-commit/
│   │   └── SKILL.md               # approval, commit, and learnings extraction skill
│   └── lucidforge-cancel/
│       └── SKILL.md               # cancel and optional revert skill
├── app/                            # Wails desktop app
│   ├── main.go                     # Wails entry point
│   ├── app.go                      # Go backend: artifact reading, git, approval
│   ├── internal/
│   │   ├── agents/                 # LucidForge agent file reading and writing
│   │   ├── artifacts/              # artifact file reading and schema types
│   │   ├── git/                    # diff computation, commit on approval
│   │   └── features/               # feature listing and state
│   ├── frontend/                   # React app
│   │   ├── src/
│   │   │   ├── components/         # UI components (DiffViewer, ChangeMap, StepList, AgentEditor, etc.)
│   │   │   ├── hooks/              # React hooks for Wails bindings
│   │   │   ├── pages/              # FeatureList, FeatureReview, AgentManagement
│   │   │   └── types/              # TypeScript types matching artifact schema
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── wails.json
│   └── go.mod
├── docs/
│   ├── requirements.md
│   ├── concepts.md
│   ├── tech.md
│   ├── artifact-schema.md
│   ├── ui-guide.md
│   ├── code-style.md
│   └── style.md
└── CLAUDE.md
```

## Key Design Decisions

### Zero AI dependencies in the app

The app never calls any AI API. It never spawns Claude Code. It reads artifact files from disk and presents them. This means:

- No API keys to manage
- No network calls (except git if remote operations are needed)
- No prompt engineering
- No token estimation or conversation management
- Instant startup — just read JSON files

### Go backend, React frontend

The Go backend handles:
- Reading artifact files from `.lucidforge/features/`
- Reading and writing LucidForge agent files from `.claude/agents/` (filtered by `lucidforge: true`)
- Computing git diffs (base commit vs working tree, filtered by step's changed files)
- Creating commits on approval
- Exposing data to the frontend via Wails bindings

The React frontend handles:
- All rendering: diffs, change maps, step navigation, file trees, markdown documents
- Agent management UI: list, edit, add, delete, merge
- View state: which files are reviewed, which step is selected, diff mode preference
- Persisting view state to the step artifact files (writing `viewedFiles`)

### Web tech advantages for code review UI

The app is fundamentally a code viewer. Web tech excels here:

- **Monaco Editor**: VS Code's diff viewer, inline in the app — syntax highlighting for every language, unified and side-by-side modes, minimap, word wrap. No need to build a custom diff control.
- **D3 / React Flow**: interactive force-directed graphs for change maps — drag, zoom, hover to highlight connections. Far more capable than what XAML or Swing can offer.
- **CSS**: precise control over diff coloring, code styling, layout. A polished review UI is easier to build with CSS than with native toolkit styling.

### Wails binding model

Wails exposes Go functions to the JavaScript frontend via auto-generated TypeScript bindings. The Go backend exposes methods like:

```go
// Features
func (a *App) GetFeatures() ([]Feature, error)
func (a *App) GetFeature(id string) (*Feature, error)
func (a *App) GetSteps(featureId string) ([]Step, error)
func (a *App) GetDiff(featureId string, stepOrder int, filePath string) (*FileDiff, error)
func (a *App) MarkFileViewed(featureId string, stepOrder int, filePath string) error
func (a *App) ApproveFeature(featureId string, commitMessage string) error

// Agents (only returns/modifies files with lucidforge: true)
func (a *App) GetAgents() ([]Agent, error)
func (a *App) GetAgent(name string) (*Agent, error)
func (a *App) SaveAgent(agent Agent) error
func (a *App) CreateAgent(agent Agent) error
func (a *App) DeleteAgent(name string) error
func (a *App) MergeAgents(sourceName string, targetName string) error
```

React calls these directly — no REST API, no WebSocket, no HTTP server.

### What to borrow conceptually from the original LucidForge

The design patterns, not the code:

- **Change map visualization**: file boxes with member lists, connection lines between related files, hover to highlight relationships
- **Per-file reasoning**: collapsible panel above the diff explaining *why* this file changed
- **Step navigation**: step selector with agent name, summary, and status indicators
- **Viewed file tracking**: checkbox per file, count in header ("3/7 viewed")
- **Diff context expansion**: click to reveal more lines around changes
- **Agent management**: add/edit/delete/merge agents with directory scoping and learnings

These will be reimplemented in React/TypeScript, not ported from C#/XAML.

### Git operations

Minimal git interaction:

- **Read diffs**: compare working tree to base commit, filtered by step's changed files. Use `go-git` or shell out to `git diff`.
- **Commit on approval**: stage changed files, create a single commit on the source branch with a descriptive message.
- **Read branch info**: current branch, base commit from `feature.json`.

No push, no merge, no conflict resolution. The skill handles branch creation; the reader just reads the current state and commits on approval.

## Schema as Spec

The artifact schema should be documented well enough that someone could build a new reader from the spec alone, without looking at any existing reader's code. This means:

- Every field documented with type, optionality, and semantics
- Example files for common scenarios
- Version numbering with backward-compatibility rules
- The schema doc is the source of truth — if a reader's TypeScript types disagree with the spec, the spec wins

## Resolved Questions

### Wails v2

v3 is still alpha as of April 2026 (v3.0.0-alpha.68). v2 is stable, well-documented, and sufficient for a single-window artifact viewer. The complexity lives in the React frontend, not the Wails integration layer, so migration to v3 later would be straightforward.

### Monaco Editor for diffs

Monaco (~2-3MB) is heavier than diff2html, but we expect to need editing capabilities soon — not just read-only diff viewing. Monaco provides syntax highlighting for every language, unified and side-by-side diff modes, minimap, and inline widgets. Starting with Monaco avoids a future migration.

### Shell out to git

The git needs are minimal: `git diff`, `git add`, `git commit`, `git branch`. The user definitely has git installed (this is a code review tool). Shelling out is simpler and more reliable than go-git's API. Wrap a few `exec.Command` calls in `internal/git/`.

### Plugin distribution

Skills are packaged as a Claude Code plugin with a `.claude-plugin/plugin.json` manifest. Distributed via GitHub repo; users install with `/plugin install <url>`. The `install.sh` script remains as a fallback for manual installation.

### Multi-feature support

Supported from day one. Each feature gets its own branch and its own `.lucidforge/features/{id}/` directory. Multiple features coexist on disk. The feature list page shows all of them. Branch switching is the user's responsibility; the app reads whatever's on disk.

### File watching with fsnotify

The app watches `.lucidforge/features/` for changes using `fsnotify` and emits Wails events to trigger React re-fetches. This supports the primary workflow: skill running in one terminal while the app is open. Without file watching, users would need to manually refresh after every step completes.
