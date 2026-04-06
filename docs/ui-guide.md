# UI Guide

Screen layout, navigation flow, and data mapping for the LucidForge Wails app (Go + React).

## Navigation

The app has a flat navigation model — a top-level route determines which page is shown.

```
App Launch
  └─ Feature List (home)
       ├─ Feature Review (per-feature)
       │    ├─ Discovery tab
       │    ├─ UX Design tab (if present)
       │    ├─ Plan tab
       │    ├─ AI Review Notes tab (if review issues exist)
       │    └─ Review tab (if steps exist)
       └─ Agent Management
```

Three pages total. The feature review page has internal tab navigation but is a single route.

## Pages

### 1. Feature List (Home)

The landing page. Lists all reviewable features from `.lucidforge/features/`. Shows a subtle LucidForge logo watermark in the background.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [C:\path\to\project]                        [Agents]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Add User Authentication              ✔ ✖       │    │
│  │ user-review · 5 steps                           │    │
│  │ JWT-based authentication with login/register    │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Refactor Billing Module                         │    │
│  │ approved · 3 steps                              │    │
│  │ Restructure billing service for multi-tenant    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Data:**
- `GetFeatures()` → list of features with status and step count
- Only shows features with status `user-review`, `approved`, or `cancelled`
- Click a feature card → navigate to Feature Review
- [Agents] button → navigate to Agent Management
- Project path button → open directory picker to switch projects

**Feature card contents:**
- Feature name (bold)
- Status badge (colored: gold for user-review, green for approved, red for cancelled)
- Step count
- Description
- ✔ commit button and ✖ cancel button (only for `user-review` features, with hover effects)

**Actions:**
- ✔ Commit: opens a dialog to enter a commit message, then stages all changed files and creates a single commit
- ✖ Cancel: confirmation dialog, marks feature as cancelled

**Project persistence:** The app remembers the last opened project and reopens it on next launch.

**Auto-refresh:** The feature list auto-refreshes when `.lucidforge/features/` changes on disk (via fsnotify).

### 2. Feature Review

The core review experience. One page with tabs for the full review flow.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Features    Add User Authentication                  │
├─────────────────────────────────────────────────────────┤
│  [Discovery] [UX Design] [Plan] [AI Review Notes] [Review]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   (tab content)                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Header:** Back button and feature name
**Tabs:** Discovery, UX Design (conditional), Plan, AI Review Notes (conditional), Review (conditional)

When steps exist, the page opens directly to the Review tab. Otherwise it opens to Discovery.

#### Discovery Tab

Renders `discovery.md` as formatted markdown with styled headings, code blocks, tables, and blockquotes.

**Data:** `GetDiscovery(featureId)` → markdown string rendered with react-markdown + remark-gfm

#### UX Design Tab

Renders `ux.md` as formatted markdown. Shows clickable mockup cards that open HTML files in the system browser.

**Data:** `GetUxDesign(featureId)` + `GetMockups(featureId)` → markdown + list of HTML filenames

#### Plan Tab

Renders `plan.md` as formatted markdown with GFM task checkboxes.

**Data:** `GetPlan(featureId)` → markdown string

#### AI Review Notes Tab

Shows code review issues from `review.json`. Only present if review.json exists and has issues.

```
┌──────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────┐      │
│  │ ⚠ WARNING · Step 1 · backend-api      Fixed   │      │
│  │ JWT secret is hardcoded. Should be loaded      │      │
│  │ from configuration.                            │      │
│  │ src/services/AuthService.cs                    │      │
│  └────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

- Issue cards with severity badge (error/warning/info, colored), step/agent reference, description, file path
- Fixed indicator for auto-fixed issues

#### Review Tab

The most complex tab. Step selector dropdown + sub-tabs for Insights, Diff, and Map.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  [Auth Models and Database ▾]           backend-api      │
│  [Insights] [Diff] [Map]                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                   (sub-tab content)                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Step selector:** Dropdown showing step titles. Agent name badge next to it.

**Insights sub-tab:**
- Change summary (natural language)
- Design patterns identified (cards with name and description)

**Diff sub-tab:**
```
┌──────────────────────┬───────────────────────────────────────────────────┐
│ Files [📁]      2/5  │  src/models/User.cs                               │
│                      │  [▲] [▼] [□ Viewed] [Side-by-Side] [□ Hide ws]   │
│ ○ A User.cs         │  [Search]                                          │
│ ✓ A AuthToken.cs    │ ──────────────────────────────────────────────────│
│ ○ M DbContext.cs    │  ▼ Why this file was added                        │
│                      │  New entity needed for user                       │
│                      │  identity. Stores email and...                    │
│                      │ ──────────────────────────────────────────────────│
│                      │                                                   │
│                      │    (Monaco editor / diff viewer)                  │
│                      │                                                   │
└──────────────────────┴───────────────────────────────────────────────────┘
```

- **File list panel:** resizable (drag the divider); file names with viewed indicator (✓/○), category badge (A=add, M=modify, D=delete), header with viewed count and group-by-directory toggle (📁)
- **Toolbar:** file path, prev/next change buttons (▲/▼, always reserve space — hidden for non-modified files), viewed checkbox, side-by-side/unified toggle, hide whitespace checkbox, search button
- **Reasoning panel:** collapsible, shows context-aware label ("Why this file was added/deleted/changed")
- **Editor:** Monaco-based, always editable for new and modified files with debounced auto-save (500ms)

**Diff behavior:**
- New files: single Monaco editor (editable, no diff)
- Deleted files: single Monaco editor (read-only)
- Modified files: Monaco DiffEditor (side-by-side or unified, editable right side)
- On file select, scrolls to center the first change
- Next/prev buttons navigate between changes, centering the full change range

**Editing:** Files are always editable (new and modified, not deleted). Changes auto-save to disk after 500ms of no typing. No explicit save button needed.

**File list sorting:** Files are always sorted alphabetically by filename. In grouped mode, directories are sorted alphabetically, then files within each directory alphabetically.

**Group by directory:** Toggle the 📁 button in the file list header. Groups files under their immediate parent directory name; disambiguates same-named directories by showing the parent path. Files are indented under their directory label.

**Viewed tracking:**
- Click the ○/✓ indicator in the file list, or use the Viewed checkbox in the toolbar
- Marking as viewed auto-advances to the next unviewed file in display order (respects flat vs grouped sort)
- Unmarking as viewed stays on the current file
- Viewed state persists to the step artifact file (`viewedFiles` array)

**Settings persistence:** Side-by-side vs unified mode, hide whitespace, group-by-directory toggle, and sidebar width persist in localStorage across sessions.

**Map sub-tab:**

Files grouped by directory in bordered boxes. Hover to see connections.

```
┌──────────────────────────────────────────────────────────┐
│  ┌─ src/models/ ─────────────────────────────────┐       │
│  │  ┌───────────────┐  ┌───────────────┐         │       │
│  │  │ User.cs       │  │ AuthToken.cs  │         │       │
│  │  │ C User        │  │ C AuthToken   │         │       │
│  │  │ P Email       │  │ P Token       │         │       │
│  │  │ P PasswordHash│  │ P UserId      │         │       │
│  │  └───────────────┘  └───────────────┘         │       │
│  └───────────────────────────────────────────────┘       │
│  ┌─ src/data/ ───────────────────────────────────┐       │
│  │  ┌───────────────┐                            │       │
│  │  │ DbContext.cs  │                            │       │
│  │  │ P Users       │                            │       │
│  │  │ P AuthTokens  │                            │       │
│  │  └───────────────┘                            │       │
│  └───────────────────────────────────────────────┘       │
│                                                          │
│  Hover a file → dashed blue lines show connections       │
│  with relationship labels. Unconnected files dim.        │
└──────────────────────────────────────────────────────────┘
```

- Files grouped by directory
- File boxes with header (file name, category-colored border) and member list
- Member badges: type initial (C=class, P=property, M=method, etc.) with kind-colored background
- Hover a file → dashed blue connection lines appear to related files with relationship labels at midpoint
- Unconnected files dim to 35% opacity

### 3. Agent Management

Full management UI for LucidForge agents.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Features    Agents                      [+ New Agent]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Backend API                    claude-sonnet-4-6│    │
│  │ Senior backend engineer                         │    │
│  │ src/api/ · src/services/                        │    │
│  │ [Edit] [Merge] [Delete]                         │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ General                       claude-sonnet-4-6 │    │
│  │ Cross-cutting code                              │    │
│  │ [Edit] [Merge]                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Agent cards:** name, model badge, identity, directory tags, action buttons (Edit, Merge, Delete). General agent cannot be deleted.

**Agent editor:** Inline form with name (new only), description, model dropdown, identity textarea, directories (tag input with add/remove), instructions textarea, learnings (read-only display).

**Merge flow:** Modal with target agent dropdown, confirm merges directories (deduped), instructions, and learnings into target and deletes source.

**Delete flow:** Confirmation dialog, removes the `.md` file.

## Wails Bindings ↔ UI Mapping

| Page / Action | Go Backend Method | Data |
|---|---|---|
| Feature list | `GetFeatures()` | `[]Feature` |
| Feature review | `GetFeature(id)` | `*Feature` |
| Discovery content | `GetDiscovery(featureId)` | markdown string |
| UX design content | `GetUxDesign(featureId)` | markdown string |
| Plan content | `GetPlan(featureId)` | markdown string |
| Mockup list | `GetMockups(featureId)` | `[]string` |
| Open mockup | `OpenMockup(featureId, filename)` | opens in browser |
| Review issues | `GetReview(featureId)` | `*Review` |
| Step list | `GetSteps(featureId)` | `[]Step` |
| File diff | `GetDiff(featureId, stepOrder, filePath)` | `*FileDiff` |
| Mark file viewed | `MarkFileViewed(featureId, stepOrder, filePath)` | writes to step JSON |
| Unmark file viewed | `UnmarkFileViewed(featureId, stepOrder, filePath)` | writes to step JSON |
| Save file edit | `SaveFileContent(filePath, content)` | writes to working tree |
| Commit feature | `ApproveFeature(featureId, commitMessage)` | git add + commit |
| Cancel feature | `CancelFeature(featureId)` | updates status |
| Select project | `SelectProjectRoot()` | directory picker |
| Get project root | `GetProjectRoot()` | current path |
| Agent list | `GetAgents()` | `[]Agent` |
| Agent detail | `GetAgent(name)` | `*Agent` |
| Save agent | `SaveAgent(agent)` | writes to `.md` file |
| Create agent | `CreateAgent(agent)` | creates `.md` file |
| Delete agent | `DeleteAgent(name)` | removes `.md` file |
| Merge agents | `MergeAgents(source, target)` | merges + removes source |

## View State

**Persisted to artifact files (survives app restarts):**
- `viewedFiles` in step JSON — which files the user has marked as reviewed

**Persisted to localStorage (user preferences):**
- Diff mode: unified vs side-by-side
- Hide whitespace toggle

**Persisted to app preferences (across sessions):**
- Last opened project root

**In-memory only (resets on page change):**
- Selected step
- Selected file within a step
- Selected sub-tab (Insights/Diff/Map)
- Scroll positions

## Auto-Refresh

The app watches `.lucidforge/features/` for changes using fsnotify and emits Wails events to trigger React re-fetches. This supports the primary workflow: skill running in one terminal while the app is open. Only the initial page load shows a loading state — refetches update data silently without disrupting the UI.

## Responsive Behavior

The app targets a minimum window size of 1024x768. All layout is flexbox-based and fills available space.

No mobile support — this is a desktop app via Wails.
