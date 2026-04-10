# LucidForge — JetBrains Plugin

A JetBrains IDE plugin for reviewing AI-generated features produced by the LucidForge Claude Code skill. Adds a **LucidForge Review** tool window to the left sidebar that lists features, their steps, and changed files, and opens the IDE's native diff viewer when you click a file.

The plugin reads the same `.lucidforge/features/` artifact files that the desktop app reads — it's a thin consumer of the artifact schema with zero AI dependencies. See [../docs/artifact-schema.md](../docs/artifact-schema.md) for the schema.

Supports all JetBrains IDEs built on the IntelliJ Platform: IntelliJ IDEA, PyCharm, WebStorm, Rider, GoLand, CLion, PhpStorm, RubyMine, and Android Studio.

## Install

1. Download `lucidforge-jetbrains-<version>.zip` from the [Releases](../../../releases) page (tags starting with `jetbrains-v`).
2. In your IDE: **Settings → Plugins → ⚙ → Install Plugin from Disk…** and pick the zip.
3. Restart the IDE when prompted.

## Using the Tool Window

Open the project containing `.lucidforge/features/` and click the **LucidForge Review** icon on the left sidebar. The tool window has three regions:

### Selector Bar (top)

- **Feature** — dropdown of every feature in `.lucidforge/features/`, sorted with the most recent first.
- **Discovery / Plan / Issues** — buttons that open the corresponding artifact in the main editor area:
  - *Discovery* opens `discovery.md` (the feature spec) as a markdown preview.
  - *Plan* opens `plan.md` (the step breakdown with task lists) as a markdown preview.
  - *Issues* opens a generated view of `review.json` grouped by severity (errors, warnings, info). The view is virtual — it doesn't write anything to disk.
  - Each button is disabled if the corresponding artifact doesn't exist for the current feature. The button stays highlighted while its tab is the active editor.
- **Step** — dropdown of steps for the selected feature, in execution order. Each step has a title (e.g. `"0 • backend-api"`) and its own change set.

### File List (center)

Lists the files touched by the selected step, each with:

- A **checkbox** (leftmost) that marks the file as "viewed." The state is persisted to the step's JSON artifact so it survives IDE restarts.
- A **filetype icon** matching the IDE's Solution Explorer convention.
- The **filename** (last path segment only).

**Interactions:**

- **Click the checkbox** to toggle viewed. The click zone is just the icon area — clicking the filename does not toggle.
- **Single-click the filename or icon** to open the file's diff in the main editor area. LucidForge uses the IDE's built-in diff viewer, so all the usual diff features (navigation, fold unchanged, side-by-side, search) work.
- **Press Enter** with a file selected to open its diff.
- **Toggle "Group by folder"** (toolbar above the list) to cluster files under bold parent-folder headers. Headers are non-interactive; only file rows are clickable. Grouped items are indented under their header.
- **Insights** button (toolbar above the list) opens a generated markdown view of the current step's `changeSummary` and identified `patterns`.

### Diff Viewer (main editor area)

The IDE's native diff viewer, opened as a regular editor tab. It compares the file's state at the feature's base commit against its current working-tree state. Close the tab when you're done — nothing is persisted by opening a diff.

## How It Finds Features

The plugin expects `.lucidforge/features/` at the project root (the same directory the skill writes to). Each immediate subdirectory is treated as a feature; the plugin reads `feature.json`, `discovery.md`, `plan.md`, `review.json`, and `steps/*.json` on demand.

No explicit refresh is needed for most operations — dropdowns repopulate when you switch features or steps — but if you run a feature while the tool window is open, you may need to reopen the tool window or restart the IDE to see the new feature appear in the list.

## Build from Source

Requires JDK 17+ and the Gradle wrapper (included).

```bash
cd jetbrains
./gradlew clean buildPlugin
```

On Windows you can use the included batch wrapper, which always runs a clean build to avoid shipping stale classes from deleted source files:

```cmd
cd jetbrains
build.bat
```

The plugin zip is written to `jetbrains/build/distributions/lucidforge-jetbrains-<version>.zip`.

### Verify against the platform

```bash
./gradlew verifyPlugin
```

This runs the official IntelliJ Plugin Verifier against the target platform version declared in `build.gradle.kts` and reports any API compatibility problems.

## CI/CD

The monorepo has two JetBrains-specific workflows:

- **`.github/workflows/ci.yml`** — builds the plugin on every push and PR when `jetbrains/**` files change. Runs `check verifyPlugin buildPlugin` and uploads the zip as a GitHub Actions artifact (`lucidforge-jetbrains-plugin`).
- **`.github/workflows/release-jetbrains.yml`** — runs on tags matching `jetbrains-v*`. Builds the plugin, creates a GitHub Release with auto-generated notes, and attaches the zip. Tags containing `-rc`, `-beta`, or `-alpha` are marked as prereleases.

## Architecture Notes

The plugin is intentionally small. Key source files:

```
jetbrains/src/main/
├── java/dev/lucidforge/jetbrains/access/
│   └── TextEditorPreviewBridge.java   # Java shim to access the platform's
│                                      # DEFAULT_LAYOUT_FOR_FILE key (Kotlin
│                                      # can't reference it directly)
├── kotlin/dev/lucidforge/jetbrains/
│   ├── diff/DiffPresenter.kt          # Opens the IDE's diff viewer for a file
│   ├── git/                           # Reads file content at a given commit
│   ├── model/Artifacts.kt             # Kotlin types matching the artifact schema
│   ├── service/FeatureService.kt      # Project-level service that reads
│   │                                  # `.lucidforge/features/` and persists
│   │                                  # viewed-file state
│   └── toolwindow/
│       ├── LucidForgeToolWindowFactory.kt  # Registers the tool window
│       └── LucidForgeNavigationPanel.kt    # The panel described above
└── resources/
    ├── META-INF/plugin.xml            # Plugin descriptor
    └── icons/lucidforge.svg           # Tool window icon
```

### Why Kotlin instead of sharing Go code

The monorepo's design principle is "no shared code between consumers" — the JetBrains plugin lives as a sibling of the Wails app and shares only the artifact schema. Kotlin is the native language for IntelliJ Platform plugins, which avoids any JNI bridging or separate runtime.

### Custom `CheckBoxList` rendering

The file list is an IntelliJ `CheckBoxList<FileRow>` with `adjustRendering` overridden to render two row types:

- **Item** rows: checkbox + filetype icon + filename, with a left indent when "Group by folder" is on.
- **Header** rows: folder icon + bold folder name, non-interactive.

Click detection for the checkbox is non-trivial because `CheckBoxList` hardcodes its hit zone to cell-relative x ∈ `[0, iconWidth]`. When grouping shifts the checkbox visually to the right, the default hit zone stops matching the visual position. `findPointRelativeToCheckBox` is overridden to subtract the indent offset so the returned point lands inside the checkbox icon's coordinate space (see `LucidForgeNavigationPanel.kt` inline comments for the full explanation — it's a surprisingly deep rabbit hole).

## Releasing

1. Bump `version` in `jetbrains/build.gradle.kts` and update `jetbrains/src/main/resources/META-INF/plugin.xml` if needed.
2. Commit the version bump.
3. Tag and push:
   ```bash
   git tag jetbrains-v0.1.2
   git push origin jetbrains-v0.1.2
   ```
4. The `release-jetbrains.yml` workflow builds the plugin and publishes a GitHub Release with the zip attached.

## Known Limitations

- No automatic refresh when artifacts change on disk — reopen the tool window after running a feature.
- Feature cancellation and commit actions live in the Claude Code skills (`/lucidforge-cancel`, `/lucidforge-commit`), not in the plugin. The plugin is review-only.
- No change map visualization (the Wails app's "change map" is desktop-app-specific).
- No agent management UI.
