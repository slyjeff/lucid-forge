# Visual Style Guide

Dark-theme design system for the LucidForge app. All colors are designed for a dark background. Translate these to CSS custom properties or Tailwind config in the React frontend.

## Color Palette

### Brand Accent (Warm Gold)

| Token | Hex | Usage |
|---|---|---|
| `accent` | `#D4A843` | Primary brand color, active indicators, unviewed file markers |
| `accent-light` | `#E8C46B` | Hover states on accent elements |
| `accent-dark` | `#A88535` | Pressed states, darker accent contexts |
| `accent-subtle` | `#D4A843` at 10% | Accent-tinted backgrounds |

### Surfaces (Layered Depth)

Five levels of elevation, darkest to lightest:

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0F1117` | Page background |
| `surface` | `#171B24` | Mid-tier containers, sidebars |
| `card` | `#1C2029` | Cards, panels, file boxes in change map |
| `card-hover` | `#242935` | Interactive card hover state |
| `elevated` | `#272C38` | Highest elevation — dialogs, popovers, tooltips |

### Borders

| Token | Hex | Usage |
|---|---|---|
| `border` | `#2D3340` | Standard borders on cards, separators |
| `border-light` | `#3B4354` | Lighter borders on dialogs, emphasized dividers |

### Text

| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#E6EDF3` | Main readable text |
| `text-secondary` | `#8B949E` | Labels, supporting text, inactive tabs |
| `text-dim` | `#6E7681` | Least prominent — line numbers, placeholders |

### Status

| Token | Hex | Subtle (10% alpha) | Usage |
|---|---|---|---|
| `success` | `#3FB950` | `rgba(63,185,80,0.10)` | Passed validation, completed steps, viewed files |
| `error` | `#F85149` | `rgba(248,81,73,0.10)` | Failed validation, review issues, deleted files |
| `warning` | `#D29922` | `rgba(210,153,34,0.10)` | Modified files, warnings |
| `info` | `#58A6FF` | `rgba(88,166,255,0.10)` | Links, member connections, informational badges |

## Typography

### Font Families

| Usage | Font | Fallback |
|---|---|---|
| UI text | System default (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) | — |
| Code, diffs, line numbers | `Fira Code` | `"Cascadia Code", "JetBrains Mono", "Consolas", monospace` |

Bundle Fira Code (Regular weight) as a web font in the app.

### Font Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `title-lg` | 26px | Bold | Page titles (feature name) |
| `title` | 18px | SemiBold | Section titles (Discovery, Plan, Steps) |
| `body` | 14px | Normal | Body text, descriptions, markdown content |
| `label` | 12px | Normal | Labels, badges, secondary info |
| `code` | 13px | Normal (mono) | Code content, diff lines, file paths |
| `badge` | 8px | Bold | Member type badges in change map |

## Spacing

Base unit: `4px`. Use multiples.

| Token | Value | Usage |
|---|---|---|
| `space-xs` | 2px | Tight gaps — between phase items, inline elements |
| `space-sm` | 4px | Badge padding, member row margins |
| `space-md` | 8px | Standard inner padding, badge horizontal padding |
| `space-lg` | 16px | Card padding (subtle), toolbar areas |
| `space-xl` | 20px | Card padding (standard) |
| `space-2xl` | 28px | Dialog padding |

### Corner Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 3px | Phase items, minimal rounding |
| `radius-md` | 4px | Buttons, toolbar buttons, member badges |
| `radius` | 6px | Subtle cards, interactive cards |
| `radius-lg` | 8px | Standard cards, file boxes in change map |
| `radius-xl` | 10px | Badges, group regions |
| `radius-2xl` | 12px | Dialogs |

## Component Styles

### Cards

```
Standard card:    bg card, 20px padding, 8px radius, 1px border
Subtle card:      bg card, 16px padding, 6px radius, 1px border
Interactive card: bg card, 16px padding, 6px radius, 1px border
                  → hover: bg card-hover, 150ms transition
```

### Buttons

```
Ghost button:     transparent bg, no border, 10px/6px padding, secondary text
                  → hover: card bg, primary text
Danger button:    error bg, white text, 4px radius
                  → hover: #FF6B63
Toolbar button:   transparent bg, no border, min 28x26, 4px radius, secondary text
                  → hover: card bg, primary text
```

### Badges

```
Standard:  surface bg, 1px border, 10px radius, 8px/3px padding
Accent:    accent bg, no border, 10px radius, 8px/3px padding
Success:   success bg, no border, 10px radius, 8px/3px padding
Info:      info bg, no border, 10px radius, 8px/3px padding
```

### Dialogs

```
Overlay:  rgba(0,0,0,0.69)
Dialog:   elevated bg, 1px border-light, 12px radius, 28px padding
```

## Diff Viewer

### Line colors

| Change type | Background | Gutter symbol |
|---|---|---|
| Added line | `rgba(63,185,80,0.12)` | `+` in `success` |
| Removed line | `rgba(248,81,73,0.12)` | `-` in `error` |
| Modified context | `rgba(210,153,34,0.12)` | `~` in `warning` |
| Unchanged | transparent | — |

Use higher opacity (`0.31`) for the focused/selected line.

### Layout

```
Line number:  40px width, right-aligned, dim text, mono font
Gutter:       20px width, centered, bold, mono font
Content:      flex, mono 13px, 4px/2px padding per line
```

### File headers

| File state | Background | Text color |
|---|---|---|
| New file | `rgba(63,185,80,0.19)` | `success` |
| Deleted file | `rgba(248,81,73,0.19)` | `error` |
| Modified file | surface bg | `text-primary` |

## Change Map

### File boxes

```
Border:       1.5px, 8px radius, card bg
Header:       6px/10px padding, tinted background based on change type
Members:      list below header, 4px/2px margin per row
```

Header tint by category:

| Category | Background tint |
|---|---|
| Added | `success` at 30% |
| Modified | `warning` at 30% |
| Unchanged | `#484F58` at 30% |

### Member badges

Small type-initial badges next to member names:

```
Badge:    2px radius, 3px/0px padding, 8px bold font
Color:    tinted by member kind (class=info, method=accent, property=success)
```

### Connection lines

```
Default:  border color, 1px
Hovered:  info color (#58A6FF), 2px
Label:    text-secondary, 11px, positioned at midpoint
```

### Group regions (when steps group files by category)

```
Border:   1px, rgba(255,255,255,0.16), 10px radius
Fill:     category color at 8% opacity
```

Category background tints:

| Category | Tint |
|---|---|
| Database | `#2a3a5a` |
| API | `#2a4a4a` |
| General | `#2a2a3a` |

## Syntax Highlighting

VS Code dark palette for code blocks and diff content:

| Token type | Color | Hex |
|---|---|---|
| Keywords | Blue | `#569CD6` |
| Strings | Orange | `#CE9178` |
| Comments | Green | `#6A9955` |
| Numbers | Light green | `#B5CEA8` |
| Plain text | Primary text | `#E6EDF3` |

Use Shiki or Prism.js with a matching theme rather than implementing tokenization manually. Configure the theme to match these values.

## Workflow Progress

Step indicators showing feature lifecycle phases:

| Phase state | Background | Text | Font weight |
|---|---|---|---|
| Completed | `#1A6B37` | `text-primary` | Normal |
| Active | `#B8941F` | `text-primary` | Bold |
| Pending | `#252A35` | `#5C6370` | Normal |

```
Phase item:  3px radius, 8px/3px padding, 2px gap between items
Layout:      horizontal row
```

## Viewed File Indicators

| State | Color | Icon |
|---|---|---|
| Viewed | `success` (#3FB950) | Filled checkmark |
| Unviewed | `accent` (#D4A843) | Empty circle |

## Interactive States

### Transitions

- Card hover: `background-color 150ms ease`
- Button hover: immediate (no transition)
- Connection line highlight: immediate

### Cursor

- Interactive cards, file headers in change map: `pointer`
- Code content: `text`
- Drag handles (if any in change map): `grab` / `grabbing`

## Design Principles

1. **Layered depth** — use the five surface levels to create visual hierarchy without drop shadows
2. **Semantic color only** — green means success/added, red means error/deleted, orange means warning/modified. Don't use status colors decoratively.
3. **Gold accent sparingly** — the warm gold is distinctive; overuse dilutes it. Reserve for brand identity, active states, and primary actions.
4. **High contrast text** — `text-primary` on any surface level maintains readable contrast. Use `text-secondary` for de-emphasis, `text-dim` only for non-essential info.
5. **Consistent status mapping** — the same color means the same thing everywhere: `success` green for added lines, completed steps, viewed files, passed validation. Never use green for something unrelated to positive state.
