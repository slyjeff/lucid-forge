# Style Guide

Coding conventions for the LucidForge project (Go + React + TypeScript stack).

## General Principles

- **No comments** — extract well-named functions instead. Code should be self-documenting.
- **No dead code** — delete unused functions, variables, and imports. Don't comment them out.
- **No premature abstraction** — three similar lines are better than a premature helper. Extract when there's a third use, not a second.
- **No speculative features** — build what's needed now, not what might be needed later.

## Go

### Naming

- `PascalCase` for exported types, functions, methods, fields
- `camelCase` for unexported types, functions, local variables
- `ALL_CAPS` only for constants that are truly universal (not config values)
- Receivers: short, one or two letters derived from the type name (`a` for `App`, `s` for `Store`, `r` for `Reader`)
- Interfaces: use the `-er` suffix when it fits (`Reader`, `Writer`, `Parser`); don't force it (`AgentStore` not `AgentStorer`)

### Structs and types

Use struct literals with named fields:

```go
agent := Agent{
    Name:        "Backend API",
    Description: "Handles API layer",
    Model:       "claude-sonnet-4-6",
    LucidForge:  true,
    Directories: []string{"src/api/", "src/services/"},
}
```

Exported fields for data types (no getters/setters for plain data). Methods for behavior:

```go
type Feature struct {
    ID            string    `json:"id"`
    Name          string    `json:"name"`
    Status        string    `json:"status"`
    SourceBranch  string    `json:"sourceBranch"`
    WorkingBranch string    `json:"workingBranch"`
    BaseCommit    string    `json:"baseCommit"`
    CreatedAt     time.Time `json:"createdAt"`
    StepCount     int       `json:"stepCount"`
}

func (f *Feature) IsReviewable() bool {
    return f.Status == "user-review"
}
```

### Error handling

Return errors, don't panic. Wrap with context using `fmt.Errorf`:

```go
func (s *Store) LoadFeature(id string) (*Feature, error) {
    data, err := os.ReadFile(s.featurePath(id))
    if err != nil {
        return nil, fmt.Errorf("load feature %s: %w", id, err)
    }

    var feature Feature
    if err := json.Unmarshal(data, &feature); err != nil {
        return nil, fmt.Errorf("parse feature %s: %w", id, err)
    }

    return &feature, nil
}
```

Don't over-wrap — if the context is already clear from the caller, return the error directly.

### File organization

One primary type per file, named after the type:

```
internal/
    agents/
        agent.go          # Agent type and methods
        store.go          # AgentStore — reads/writes agent .md files
        merge.go          # MergeAgents logic
    artifacts/
        feature.go        # Feature type
        step.go           # Step type and ChangeMap
        store.go          # ArtifactStore — reads .lucidforge/ files
    git/
        diff.go           # Diff computation
        commit.go         # Commit on approval
```

### Testing

Table-driven tests with descriptive names:

```go
func TestFeature_IsReviewable(t *testing.T) {
    tests := []struct {
        name   string
        status string
        want   bool
    }{
        {"user-review is reviewable", "user-review", true},
        {"executing is not reviewable", "executing", false},
        {"approved is not reviewable", "approved", false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            f := Feature{Status: tt.status}
            if got := f.IsReviewable(); got != tt.want {
                t.Errorf("IsReviewable() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

For tests that don't fit the table pattern, use `// Arrange` / `// Act` / `// Assert`:

```go
func TestAgentStore_MergeAgents(t *testing.T) {
    // Arrange
    store := newTestStore(t)
    source := Agent{Name: "Workers", Directories: []string{"src/workers/"}}
    target := Agent{Name: "Backend", Directories: []string{"src/api/"}}
    store.Save(source)
    store.Save(target)

    // Act
    err := store.MergeAgents("Workers", "Backend")

    // Assert
    if err != nil {
        t.Fatalf("MergeAgents: %v", err)
    }
    merged, _ := store.Load("Backend")
    if len(merged.Directories) != 2 {
        t.Errorf("expected 2 directories, got %d", len(merged.Directories))
    }
}
```

Use `t.TempDir()` for tests that need filesystem access. No global test state.

## React / TypeScript

### Naming

- `PascalCase` for components, types, interfaces
- `camelCase` for functions, variables, hooks, props
- `UPPER_SNAKE_CASE` for true constants (not config)
- File names match the primary export: `DiffViewer.tsx`, `useFeature.ts`, `types.ts`

### Components

Functional components with props interfaces. Destructure props in the signature:

```tsx
interface StepListProps {
  steps: Step[];
  selectedStep: number;
  onSelectStep: (order: number) => void;
}

function StepList({ steps, selectedStep, onSelectStep }: StepListProps) {
  return (
    <div className="step-list">
      {steps.map((step) => (
        <StepListItem
          key={step.order}
          step={step}
          isSelected={step.order === selectedStep}
          onClick={() => onSelectStep(step.order)}
        />
      ))}
    </div>
  );
}
```

- Named exports, not default exports
- One component per file (small helper components in the same file are fine)
- Keep components focused — if it's doing too much, split it

### Hooks

Custom hooks for Wails bindings and shared state:

```tsx
function useFeature(id: string) {
  const [feature, setFeature] = useState<Feature | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    GetFeature(id)
      .then(setFeature)
      .catch((err) => setError(err.message));
  }, [id]);

  return { feature, error };
}
```

Prefix with `use`. Return an object, not a tuple, when there are more than two return values.

### Types

Types match the artifact schema exactly. Define them in a central `types/` directory:

```tsx
interface Step {
  order: number;
  agent: string;
  title: string;
  status: "pending" | "executing" | "completed" | "failed";
  tasks: Task[];
  validation: Validation;
  changeMap: ChangeMap;
  patterns: Pattern[];
  changeSummary: string;
  usage: Usage;
  viewedFiles: string[];
}

interface ChangeMapFile {
  path: string;
  category: "add" | "modify" | "delete";
  reasoning: string;
  members: Member[];
}
```

Use union types for enums (`"add" | "modify" | "delete"`, not `enum Category`). This matches the JSON values directly.

### Styling

CSS Modules or Tailwind — to be decided during implementation. Either way:

- No inline styles except for truly dynamic values (e.g., `style={{ width: `${percent}%` }}`)
- Consistent class naming: `kebab-case` for CSS classes
- Component-scoped styles — no global style leakage

### State management

Start with React state and props. Introduce Zustand or similar only if prop drilling becomes painful across more than three levels. Don't preemptively add a state library.

### Testing

React Testing Library with Vitest:

```tsx
describe("StepList", () => {
  it("renders all steps", () => {
    // Arrange
    const steps = [makeStep(0, "backend"), makeStep(1, "frontend")];

    // Act
    render(<StepList steps={steps} selectedStep={0} onSelectStep={() => {}} />);

    // Assert
    expect(screen.getByText("backend")).toBeInTheDocument();
    expect(screen.getByText("frontend")).toBeInTheDocument();
  });

  it("highlights the selected step", () => {
    // Arrange
    const steps = [makeStep(0, "backend"), makeStep(1, "frontend")];

    // Act
    render(<StepList steps={steps} selectedStep={1} onSelectStep={() => {}} />);

    // Assert
    expect(screen.getByText("frontend").closest("div")).toHaveClass("selected");
  });
});
```

Use factory functions (`makeStep`, `makeFeature`) for test data. Keep them in a shared `testutils/` file.

## Shared Conventions

### Git

- Branch per feature: `lucidforge/{feature-id}`
- Single commit per feature on approval
- Commit messages: imperative mood, concise ("add user authentication", not "added user authentication feature")

### File formats

- JSON for structured data (artifact files, feature metadata)
- Markdown for human-readable documents (discovery, plan, UX design, agent files)
- YAML frontmatter in agent `.md` files (parsed by both Go backend and skill)

### Artifact schema types are canonical

The TypeScript types in `frontend/src/types/` and the Go structs in `internal/artifacts/` must both match `docs/artifact-schema.md`. If they diverge, the doc wins. When adding a new field, update all three: schema doc, Go struct, TypeScript type.
