# Contributing to LucidForge

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/lumen.git`
3. Create a feature branch: `git checkout -b my-feature`
4. Make your changes
5. Push and open a Pull Request against `main`

### Prerequisites

- [Go 1.23+](https://go.dev/dl/)
- [Node.js 20+](https://nodejs.org/)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation) (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)
- Linux only: `libgtk-3-dev` and `libwebkit2gtk-4.0-dev`

### Build and Test

```bash
cd app

# Run tests
go test ./...
cd frontend && npx vitest run && cd ..

# Development with hot reload
wails dev

# Production build
wails build
```

CI runs tests on Ubuntu, Windows, and macOS. Your PR must pass all three before review.

## Project Structure

```
skill/lucidforge/SKILL.md          Feature orchestration skill
skill/lucidforge-agents/SKILL.md   Agent generation skill
app/                               Wails desktop app (Go + React)
    main.go                        Entry point
    app.go                         Go backend: artifact reading, git, approval
    internal/
        agents/                    Agent file reading and writing
        artifacts/                 Artifact file reading and schema types
        git/                       Diff computation, commit on approval
        features/                  Feature listing and state
    frontend/src/
        components/                DiffViewer, ChangeMap, StepList, etc.
        hooks/                     Wails binding hooks
        pages/                     FeatureList, FeatureReview, AgentManagement
        types/                     TypeScript types matching artifact schema
```

## Coding Standards

- **Go**: standard `gofmt` formatting, no comments — extract well-named functions instead
- **TypeScript/React**: functional components, hooks for state
- **Tests**: Go `testing` package; Vitest + Testing Library for frontend
- Keep the app free of AI dependencies — it reads files and presents UI, nothing more

## Pull Request Guidelines

- Keep PRs focused — one logical change per PR
- All PRs require approval from [@slyjeff](https://github.com/slyjeff) before merging
- Ensure CI passes (tests on Ubuntu, Windows, and macOS)
- Add tests for new functionality
- Update documentation if your change affects user-facing behavior
- Write a clear PR description explaining what and why

## Reporting Issues

- Use the [Bug Report](../../issues/new?template=bug_report.md) template for bugs
- Use the [Feature Request](../../issues/new?template=feature_request.md) template for ideas
- Check existing issues before creating a new one

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
