# UI Guide

Screen layout, navigation flow, and data mapping for the LucidForge Wails app (Go + React).

## Navigation

The app has a flat navigation model — a top-level route determines which page is shown. No nested routers.

```
App Launch
  └─ Feature List (home)
       ├─ Feature Review (per-feature)
       │    ├─ Discovery tab
       │    ├─ UX Design tab (if present)
       │    ├─ Plan tab
       │    ├─ Steps tab (with sub-navigation per step)
       │    └─ Review Issues tab (if present)
       └─ Agent Management
```

Three pages total. The feature review page has internal tab navigation but is a single route.

## Pages

### 1. Feature List (Home)

The landing page. Lists all features from `.lucidforge/features/`.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  LucidForge                              [Agents]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Add User Authentication                         │    │
│  │ user-review · 5 steps · $0.45 · Apr 4, 2026    │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Refactor Billing Module                         │    │
│  │ approved · 3 steps · $0.28 · Apr 2, 2026       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  No in-progress features. Run the lucidforge skill      │
│  to start a new feature.                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Data:**
- `GetFeatures()` → list of features with status, cost, step count, date
- Only shows features with status `user-review`, `approved`, or `cancelled`
- Click a feature → navigate to Feature Review
- [Agents] button → navigate to Agent Management

**Feature card contents:**
- Feature name (bold)
- Status badge (colored: gold for user-review, green for approved, dim for cancelled)
- Step count
- Total cost
- Creation date

### 2. Feature Review

The core experience. One page with tabs for the full review flow.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Features    Add User Authentication         $0.45   │
├─────────────────────────────────────────────────────────┤
│  [Discovery] [UX Design] [Plan] [Steps] [Issues]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   (tab content)                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Cancel Feature]                    [Approve Feature]  │
└─────────────────────────────────────────────────────────┘
```

**Header:** Back button, feature name, total cost
**Footer:** Cancel and Approve actions (approve creates single commit on source branch)
**Tabs:** Discovery, UX Design (conditional on `hasUxDesign`), Plan, Steps, Issues (conditional on `review.json` existing)

#### Discovery Tab

Renders `discovery.md` as formatted markdown.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ## Overview                                            │
│  JWT-based authentication with login and register       │
│  endpoints for the REST API...                          │
│                                                         │
│  ## Requirements                                        │
│  - Bcrypt password hashing                              │
│  - JWT tokens with configurable expiry                  │
│  - Token revocation support                             │
│  ...                                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Data:** `GetFeature(id)` → read `discovery.md` content, render with react-markdown

#### UX Design Tab

Renders `ux.md` as formatted markdown. Shows "Open Mockup" buttons for any referenced HTML files.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ## User Flows                                          │
│  1. User visits /login...                               │
│                                                         │
│  ## Mockups                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │ login-page.html      │  │ dashboard.html       │    │
│  │ [Open in Browser]    │  │ [Open in Browser]    │    │
│  └──────────────────────┘  └──────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Data:** Read `ux.md` content + list `mockups/*.html` files. "Open in Browser" opens the file via system default browser.

#### Plan Tab

Renders `plan.md` as formatted markdown with task checkboxes visible.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ## Step 1: Backend API — Auth Models and Database      │
│  Agent: backend-api                                     │
│  Files: src/models/User.cs, src/models/AuthToken.cs,   │
│         src/data/DbContext.cs                           │
│                                                         │
│  Tasks:                                                 │
│  ☑ Create User entity with email, password hash...     │
│  ☑ Create AuthToken entity with token value...         │
│  ☑ Register entities in DbContext and add migration    │
│                                                         │
│  ## Step 2: Backend API — Auth Service                  │
│  ...                                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Data:** Read `plan.md` content, render with react-markdown (checkboxes are standard GFM)

#### Steps Tab

The most complex tab. Two-panel layout: step list sidebar + step detail area.

```
┌──────────────────┬──────────────────────────────────────┐
│ Steps            │  Step 1: Auth Models     backend-api │
│                  │                                      │
│ ● Step 1    3/3 │  [Insights] [Diff] [Map]             │
│ ○ Step 2    0/4 │ ─────────────────────────────────────│
│ ○ Step 3    0/2 │                                      │
│ ○ Step 4    0/5 │         (sub-tab content)            │
│ ○ Step 5    0/3 │                                      │
│                  │                                      │
│                  │                                      │
│                  │                                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

**Step sidebar:**
- List of steps with order, agent name, and viewed file count ("3/3")
- Filled circle (●) for steps with all files viewed, empty (○) otherwise
- Click to select step
- Sidebar is resizable (180px default, 120–300px range)

**Step detail header:** Step title, agent name badge

**Step sub-tabs:**

**Insights sub-tab:**
```
┌──────────────────────────────────────────────────────────┐
│  Change Summary                                          │
│  Added User and AuthToken entities with EF Core          │
│  registration. User stores email and bcrypt password     │
│  hash with audit timestamps...                           │
│                                                          │
│  Patterns                                                │
│  ┌────────────────────────────────────────────────┐      │
│  │ Entity Framework Code First                    │      │
│  │ New entities registered via DbSet properties   │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  Tasks                                                   │
│  ☑ Create User entity with email, password hash...      │
│  ☑ Create AuthToken entity with token value...          │
│  ☑ Register entities in DbContext and add migration     │
│                                                          │
│  Validation: ✓ Passed                                    │
│  Tokens: 17K (12K in · 5K out) · $0.08                  │
└──────────────────────────────────────────────────────────┘
```

**Diff sub-tab:**
```
┌────────────────────┬─────────────────────────────────────┐
│ Files         3/3  │  src/models/User.cs          [✓]   │
│                    │ ────────────────────────────────────│
│ ✓ User.cs         │  ▼ Why this file changed            │
│ ✓ AuthToken.cs    │  New entity needed for user          │
│ ✓ DbContext.cs    │  identity. Stores email and...       │
│                    │ ────────────────────────────────────│
│                    │   1  + using System;                │
│                    │   2  +                              │
│                    │   3  + public class User {          │
│                    │   4  +     public string Email...   │
│                    │   5  +     public string Password.. │
│                    │   ...                               │
│                    │                                     │
│                    │   [Unified ▾]  [Hide Whitespace]    │
└────────────────────┴─────────────────────────────────────┘
```

- **File list panel** (resizable, 220px default): file names with viewed checkmarks, header shows "Files 2/3"
- **Diff panel**: file header with name and viewed checkbox, collapsible "Why this file changed" reasoning panel, diff content (Monaco Editor or diff2html), unified/side-by-side toggle, hide whitespace toggle
- Clicking a file in the list loads its diff
- Viewed checkbox toggles persist to step artifact file (`viewedFiles`)
- New files show syntax-highlighted content without diff markers
- Deleted files show with "(deleted)" header

**Map sub-tab:**
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   ┌───────────────┐         ┌───────────────┐           │
│   │ User.cs       │         │ AuthToken.cs  │           │
│   │ ─────────     │ foreign │ ─────────     │           │
│   │ C User        │◄── key ─│ C AuthToken   │           │
│   │ P Email       │         │ P Token       │           │
│   │ P PasswordHash│         │ P ExpiresAt   │           │
│   │ P CreatedAt   │         │ P UserId      │           │
│   └───────────────┘         └───────────────┘           │
│           ▲                         ▲                    │
│           │ entity reg.             │ entity reg.        │
│   ┌───────────────┐                                     │
│   │ DbContext.cs  │                                     │
│   │ ─────────     │                                     │
│   │ P Users       │                                     │
│   │ P AuthTokens  │                                     │
│   └───────────────┘                                     │
│                                                          │
│  Interactive: drag, zoom, hover to highlight connections │
└──────────────────────────────────────────────────────────┘
```

- File boxes with header (file name, change category color) and member list
- Member badges: type initial (C=class, P=property, M=method, etc.)
- Connection lines between related files/members with relationship labels
- Hover a file box → highlight its connections
- Click a file box → navigate to that file's diff
- Pan and zoom support (D3 or React Flow)

#### Issues Tab

Shows code review issues from `review.json`. Only present if review.json exists.

```
┌──────────────────────────────────────────────────────────┐
│  2 issues (1 fixed, 1 unfixed)                           │
│                                                          │
│  ┌────────────────────────────────────────────────┐      │
│  │ ⚠ WARNING · Step 1 · backend-api          ✓   │      │
│  │ src/services/AuthService.cs                    │      │
│  │ JWT secret is hardcoded. Should be loaded      │      │
│  │ from configuration.                            │      │
│  └────────────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────────────┐      │
│  │ ℹ INFO · Step 3 · frontend                     │      │
│  │ src/components/LoginForm.tsx                    │      │
│  │ Consider adding aria-label to the submit       │      │
│  │ button for screen reader accessibility.        │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Issue cards with severity badge (colored), step/agent reference, file path, description
- Fixed indicator (✓ green checkmark) for auto-fixed issues
- Click file path → navigate to that file's diff in the Steps tab

### 3. Agent Management

Full management UI for LucidForge agents.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Features    Agents                      [+ New]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Backend API                    claude-sonnet-4-6│    │
│  │ Senior backend engineer                         │    │
│  │ src/api/ · src/services/                        │    │
│  │                              [Merge] [Delete]   │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Frontend                      claude-sonnet-4-6 │    │
│  │ Frontend developer                              │    │
│  │ src/components/ · src/pages/                     │    │
│  │                              [Merge] [Delete]   │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ General                       claude-sonnet-4-6 │    │
│  │ Cross-cutting code                              │    │
│  │ (catch-all)                                     │    │
│  │                              [Merge]            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Agent list:** cards showing name, model, identity, directories. General agent cannot be deleted.

**Click an agent card → expand to editor:**
```
┌─────────────────────────────────────────────────────────┐
│  Backend API                                            │
│                                                         │
│  Name:        [Backend API                         ]    │
│  Description: [Handles API layer and services      ]    │
│  Model:       [claude-sonnet-4-6              ▾]        │
│  Identity:    [Senior backend engineer             ]    │
│  Directories: [src/api/] [src/services/] [+ Add]        │
│                                                         │
│  Instructions                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ - Use dependency injection for all service      │    │
│  │   dependencies                                  │    │
│  │ - All endpoints return standard API response    │    │
│  │   wrappers                                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Learnings (read-only)                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ - The PaymentsService uses gRPC, not REST       │    │
│  │ - Rate limiting is handled at the gateway       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Save]                            [Cancel]             │
└─────────────────────────────────────────────────────────┘
```

**Agent editor fields:**
- Name (text input)
- Description (text input)
- Model (dropdown: available Claude models)
- Identity (text input — the persona string)
- Directories (tag list with add/remove)
- Instructions (textarea — editable markdown)
- Learnings (read-only display — accumulated by post-approval hook)
- Save writes changes back to the `.md` file
- Cancel discards edits

**Merge flow:**
1. Click [Merge] on source agent
2. Modal: "Merge into which agent?" — dropdown of other agents
3. Preview: shows what will be combined (directories, instructions, learnings)
4. Confirm → source deleted, target updated

**Delete flow:**
1. Click [Delete] on agent
2. Confirmation dialog: "Delete Backend API? This cannot be undone."
3. Confirm → `.md` file removed

**New agent flow:**
1. Click [+ New] in header
2. Empty editor form appears (same as edit, but all fields blank)
3. Name and at least one directory required
4. Save creates new `.md` file with `lucidforge: true` frontmatter

## Wails Bindings ↔ UI Mapping

| Page / Action | Go Backend Method | Data |
|---|---|---|
| Feature list | `GetFeatures()` | `[]Feature` |
| Feature review | `GetFeature(id)` | `*Feature` + markdown file contents |
| Step list | `GetSteps(featureId)` | `[]Step` |
| File diff | `GetDiff(featureId, stepOrder, filePath)` | `*FileDiff` |
| Mark file viewed | `MarkFileViewed(featureId, stepOrder, filePath)` | writes to step JSON |
| Approve feature | `ApproveFeature(featureId, commitMessage)` | git commit |
| Agent list | `GetAgents()` | `[]Agent` |
| Agent detail | `GetAgent(name)` | `*Agent` |
| Save agent | `SaveAgent(agent)` | writes to `.md` file |
| Create agent | `CreateAgent(agent)` | creates `.md` file |
| Delete agent | `DeleteAgent(name)` | removes `.md` file |
| Merge agents | `MergeAgents(source, target)` | merges + removes source |

## View State

**Persisted to artifact files (survives app restarts):**
- `viewedFiles` in step JSON — which files the user has marked as reviewed

**Persisted to local app storage (user preferences):**
- Diff mode: unified vs side-by-side
- Hide whitespace toggle
- Reasoning panel expanded/collapsed

**In-memory only (resets on page change):**
- Selected step
- Selected file within a step
- Selected sub-tab (Insights/Diff/Map)
- Scroll positions

## Responsive Behavior

The app targets a minimum window size of 1024x768. The two resizable panels in the Steps tab (step sidebar, file list) use drag handles. All other layout is flexbox-based and fills available space.

No mobile support — this is a desktop app via Wails.
