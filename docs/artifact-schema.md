# Artifact Schema

This is the contract that connects producers (the skill) and consumers (readers). It is the center of the LucidForge ecosystem. Any tool that writes this format is a valid producer. Any tool that reads this format is a valid reader.

## Storage Layout

```
.lucidforge/
└── features/
    └── {feature-id}/
        ├── feature.json          # feature metadata (status, branch, usage)
        ├── discovery.md          # feature description, requirements, constraints
        ├── plan.md               # step plan with task lists and file predictions
        ├── ux.md                 # UX design spec (optional)
        ├── mockups/              # self-contained HTML mockups (optional, referenced by ux.md)
        │   ├── login-page.html
        │   └── dashboard.html
        ├── review.json           # code review issues (optional)
        └── steps/
            ├── 00-backend-api.json
            ├── 01-frontend.json
            └── ...
```

All paths are relative to the project root. The `.lucidforge/` directory lives at the project root alongside `.git/`.

## Feature File

`feature.json` — top-level metadata for a feature.

```json
{
  "schemaVersion": 1,
  "id": "add-user-auth",
  "name": "Add User Authentication",
  "description": "JWT-based authentication with login/register endpoints",
  "status": "user-review",
  "sourceBranch": "main",
  "workingBranch": "lucidforge/add-user-auth",
  "baseCommit": "abc123def456",
  "createdAt": "2026-04-04T10:00:00Z",
  "hasUxDesign": true,
  "stepCount": 5,
  "usage": {
    "discovery": { "inputTokens": 5000, "outputTokens": 2000, "costUsd": 0.03 },
    "planning": { "inputTokens": 8000, "outputTokens": 4000, "costUsd": 0.05 },
    "execution": { "inputTokens": 50000, "outputTokens": 20000, "costUsd": 0.30 },
    "review": { "inputTokens": 15000, "outputTokens": 3000, "costUsd": 0.07 },
    "totalCostUsd": 0.45
  }
}
```

### Feature fields

| Field | Type | Required | Description |
|---|---|---|---|
| `schemaVersion` | int | yes | Schema version (currently `1`) |
| `id` | string | yes | URL-safe feature identifier |
| `name` | string | yes | Human-readable feature name |
| `description` | string | yes | One-line feature description |
| `status` | string | yes | Current lifecycle status (see below) |
| `sourceBranch` | string | yes | Branch to commit to on approval |
| `workingBranch` | string | yes | Branch where changes live |
| `baseCommit` | string | yes | Commit SHA before any changes (for diff computation) |
| `createdAt` | string | yes | ISO 8601 timestamp |
| `hasUxDesign` | bool | yes | Whether `ux.md` and `mockups/` are present |
| `stepCount` | int | yes | Total number of steps |
| `usage` | object | yes | Token usage and cost per phase |
| `usage.totalCostUsd` | float | yes | Sum of all phase costs |

### Status values

| Status | Meaning | Who sets it |
|---|---|---|
| `discovery` | Skill is running discovery | Skill |
| `planning` | Skill is generating the plan | Skill |
| `executing` | Skill is executing steps | Skill |
| `code-review` | Skill is reviewing generated code | Skill |
| `documenting` | Skill is updating documentation | Skill |
| `user-review` | Ready for human review | Skill |
| `approved` | User approved; changes committed | Reader |
| `cancelled` | User cancelled the feature | Reader |

Readers should only display features with status `user-review`, `approved`, or `cancelled`. Other statuses indicate the skill is still working.

## Discovery Document

`discovery.md` — markdown document produced during discovery. Written once by the skill, static after. Readers render this as formatted markdown.

Typical sections (produced by the skill, not enforced by schema):

- **Overview** — what the feature does and why
- **Requirements** — specific behaviors and constraints
- **Technical Approach** — high-level strategy, key decisions
- **Affected Areas** — which parts of the codebase are involved
- **Open Questions** — anything resolved during discovery Q&A

The discovery document gives reviewers the *intent* behind the feature — what was asked for and what constraints were identified — so they can evaluate whether the implementation matches.

## UX Design Document

`ux.md` — optional UX design specification. Present when the feature includes user-facing changes and UX design was not skipped. Readers render this as formatted markdown.

Typical sections:

- **User Flows** — step-by-step interaction descriptions
- **Component Specs** — UI components with behavior details
- **Accessibility** — keyboard navigation, screen reader, contrast requirements
- **Responsive Behavior** — how the UI adapts to different screen sizes
- **Mockups** — references to self-contained HTML files in `mockups/`

The `mockups/` directory contains standalone HTML files (inline CSS, no external dependencies) that can be opened in a browser. Readers should provide a way to open these — either inline preview or a "View in browser" action.

The UX document gives reviewers the *design intent* — what the UI should look and behave like — so they can evaluate whether the implementation matches the design.

## Plan Document

`plan.md` — the step-by-step execution plan.

```markdown
# Plan: Add User Authentication

## Step 1: Backend API — Auth Models and Database
Agent: backend-api
Files Changed:
- src/models/User.cs (add)
- src/models/AuthToken.cs (add)
- src/data/DbContext.cs (modify)

Tasks:
- [x] Create User entity with email, password hash, and timestamps
- [x] Create AuthToken entity with token value, expiry, and user reference
- [x] Register entities in DbContext and add migration

## Step 2: Backend API — Auth Service
Agent: backend-api
Files Changed:
- src/services/AuthService.cs (add)
- src/services/IAuthService.cs (add)
- src/config/ServiceRegistration.cs (modify)

Tasks:
- [x] Define IAuthService interface with Login, Register, ValidateToken
- [x] Implement AuthService with bcrypt hashing and JWT generation
- [x] Register in DI container
```

Task checkboxes are updated to `[x]` as tasks complete during execution. Readers can display the plan as a high-level overview but should use step artifact files for detailed review data.

## Step Artifact Files

`steps/{order:D2}-{agent-name}.json` — the core artifact. One per step.

```json
{
  "order": 0,
  "agent": "backend-api",
  "title": "Auth Models and Database",
  "status": "completed",
  "tasks": [
    { "description": "Create User entity with email, password hash, and timestamps", "completed": true },
    { "description": "Create AuthToken entity with token value, expiry, and user reference", "completed": true },
    { "description": "Register entities in DbContext and add migration", "completed": true }
  ],
  "validation": {
    "passed": true,
    "retries": 0
  },
  "changeMap": {
    "files": [
      {
        "path": "src/models/User.cs",
        "category": "add",
        "reasoning": "New entity needed for user identity. Stores email and bcrypt hash — no plain-text passwords. Timestamps support audit trail requirements from discovery.",
        "members": [
          { "name": "User", "kind": "class" },
          { "name": "User.Email", "kind": "property" },
          { "name": "User.PasswordHash", "kind": "property" },
          { "name": "User.CreatedAt", "kind": "property" }
        ]
      },
      {
        "path": "src/models/AuthToken.cs",
        "category": "add",
        "reasoning": "Separate token entity allows token revocation without changing user records. Expiry field enables automatic cleanup.",
        "members": [
          { "name": "AuthToken", "kind": "class" },
          { "name": "AuthToken.Token", "kind": "property" },
          { "name": "AuthToken.ExpiresAt", "kind": "property" },
          { "name": "AuthToken.UserId", "kind": "property" }
        ]
      },
      {
        "path": "src/data/DbContext.cs",
        "category": "modify",
        "reasoning": "Register new entities so EF Core can generate migrations. Added DbSet properties follow existing pattern in the file.",
        "members": [
          { "name": "AppDbContext.Users", "kind": "property" },
          { "name": "AppDbContext.AuthTokens", "kind": "property" }
        ]
      }
    ],
    "connections": [
      {
        "from": "src/models/AuthToken.cs:AuthToken.UserId",
        "to": "src/models/User.cs:User",
        "relationship": "foreign key reference"
      },
      {
        "from": "src/data/DbContext.cs:AppDbContext.Users",
        "to": "src/models/User.cs:User",
        "relationship": "entity registration"
      },
      {
        "from": "src/data/DbContext.cs:AppDbContext.AuthTokens",
        "to": "src/models/AuthToken.cs:AuthToken",
        "relationship": "entity registration"
      }
    ]
  },
  "patterns": [
    {
      "name": "Entity Framework Code First",
      "description": "New entities registered via DbSet properties, migrations generated from code"
    }
  ],
  "changeSummary": "Added User and AuthToken entities with EF Core registration. User stores email and bcrypt password hash with audit timestamps. AuthToken is a separate entity to support token revocation. Both registered in DbContext following existing patterns.",
  "usage": {
    "inputTokens": 12000,
    "outputTokens": 5000,
    "costUsd": 0.08
  },
  "viewedFiles": []
}
```

### Step fields

| Field | Type | Required | Description |
|---|---|---|---|
| `order` | int | yes | Execution order (0-based) |
| `agent` | string | yes | Name of the agent that executed this step |
| `title` | string | yes | Short description of the step |
| `status` | string | yes | `pending`, `executing`, `completed`, `failed` |
| `tasks` | array | yes | Task list with completion state |
| `tasks[].description` | string | yes | What the task does |
| `tasks[].completed` | bool | yes | Whether the task finished |
| `validation` | object | yes | Build/test result |
| `validation.passed` | bool | yes | Whether build/test passed |
| `validation.retries` | int | yes | Number of retry attempts |
| `changeMap` | object | yes | What changed and why |
| `changeMap.files` | array | yes | Changed files with detail |
| `changeMap.connections` | array | yes | Relationships between files/members |
| `patterns` | array | yes | Design patterns identified (can be empty) |
| `changeSummary` | string | yes | Natural-language summary |
| `usage` | object | yes | Token counts and cost |
| `viewedFiles` | array | no | File paths marked as reviewed (written by readers) |

### changeMap.files fields

| Field | Type | Required | Description |
|---|---|---|---|
| `path` | string | yes | File path relative to project root |
| `category` | string | yes | `add`, `modify`, or `delete` |
| `reasoning` | string | yes | Why this file was changed — motivation, trade-offs, design decisions |
| `members` | array | yes | Functions/classes/properties added or modified (can be empty) |

### changeMap.connections fields

| Field | Type | Required | Description |
|---|---|---|---|
| `from` | string | yes | Source: `file-path` or `file-path:MemberName` |
| `to` | string | yes | Target: `file-path` or `file-path:MemberName` |
| `relationship` | string | yes | Human-readable description of the relationship |

### Member kinds

- `class`, `interface`, `record`, `struct`, `enum`
- `method`, `function`, `property`, `field`, `constructor`
- `component` (React/Vue/Svelte components)
- `route`, `endpoint`, `middleware`
- `test`, `fixture`

## Code Review File

`review.json` — produced after the code review phase. Optional (absent if no issues found).

```json
{
  "issues": [
    {
      "severity": "warning",
      "step": 1,
      "agent": "backend-api",
      "file": "src/services/AuthService.cs",
      "description": "JWT secret is hardcoded. Should be loaded from configuration.",
      "fixed": true
    }
  ],
  "usage": {
    "inputTokens": 15000,
    "outputTokens": 3000,
    "costUsd": 0.07
  }
}
```

### Issue severity values

- `error` — must be fixed before approval
- `warning` — should be fixed, but not blocking
- `info` — suggestion for improvement

### Issue fields

| Field | Type | Required | Description |
|---|---|---|---|
| `severity` | string | yes | `error`, `warning`, or `info` |
| `step` | int | yes | Which step (order) this issue belongs to |
| `agent` | string | yes | Which agent's code has the issue |
| `file` | string | yes | File path relative to project root |
| `description` | string | yes | What the issue is |
| `fixed` | bool | yes | Whether the auto-fix resolved it |

## Schema Versioning

The `schemaVersion` field in `feature.json` tracks the schema version. Rules:

1. New optional fields can be added without a version bump
2. Removing fields, changing types, or changing semantics requires a version bump
3. Readers should handle missing optional fields gracefully
4. Readers should warn on unrecognized `schemaVersion` values

Current version: **1**
