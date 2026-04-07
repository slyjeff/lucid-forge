#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$SCRIPT_DIR/app/skills"

usage() {
    echo "Usage: ./install.sh [--project <path>]"
    echo ""
    echo "Install LucidForge skills into Claude Code."
    echo ""
    echo "Options:"
    echo "  --project <path>   Install to a specific project's .claude/commands/"
    echo "                     (default: install globally to ~/.claude/commands/)"
    echo ""
    echo "Examples:"
    echo "  ./install.sh                          # global install"
    echo "  ./install.sh --project ~/myproject     # project install"
    exit 1
}

TARGET=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            if [[ -z "${2:-}" ]]; then
                echo "Error: --project requires a path argument"
                exit 1
            fi
            TARGET="$2/.claude/commands"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

if [[ -z "$TARGET" ]]; then
    TARGET="$HOME/.claude/commands"
fi

if [[ ! -d "$SKILL_DIR" ]]; then
    echo "Error: app/skills/ directory not found. Run this script from the LucidForge repo root."
    exit 1
fi

mkdir -p "$TARGET"

for skill in lucidforge lucidforge-agents lucidforge-cancel lucidforge-change lucidforge-commit; do
    cp "$SKILL_DIR/$skill/SKILL.md" "$TARGET/$skill.md"
done

echo "Installed LucidForge skills to $TARGET/"
echo ""
for skill in lucidforge lucidforge-agents lucidforge-cancel lucidforge-change lucidforge-commit; do
    echo "  $TARGET/$skill.md"
done
echo ""
echo "Open Claude Code and run /lucidforge-agents to get started."
