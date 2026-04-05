#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$SCRIPT_DIR/skill"

usage() {
    echo "Usage: ./install.sh [--project <path>]"
    echo ""
    echo "Install LucidForge skills into Claude Code."
    echo ""
    echo "Options:"
    echo "  --project <path>   Install to a specific project's .claude/skills/"
    echo "                     (default: install globally to ~/.claude/skills/)"
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
            TARGET="$2/.claude/skills"
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
    TARGET="$HOME/.claude/skills"
fi

if [[ ! -d "$SKILL_DIR/lucidforge" ]] || [[ ! -d "$SKILL_DIR/lucidforge-agents" ]] || [[ ! -d "$SKILL_DIR/lucidforge-commit" ]] || [[ ! -d "$SKILL_DIR/lucidforge-cancel" ]]; then
    echo "Error: skill/ directory not found. Run this script from the LucidForge repo root."
    exit 1
fi

mkdir -p "$TARGET"

cp -r "$SKILL_DIR/lucidforge" "$TARGET/"
cp -r "$SKILL_DIR/lucidforge-agents" "$TARGET/"
cp -r "$SKILL_DIR/lucidforge-commit" "$TARGET/"
cp -r "$SKILL_DIR/lucidforge-cancel" "$TARGET/"

echo "Installed LucidForge skills to $TARGET/"
echo ""
echo "  $TARGET/lucidforge/SKILL.md"
echo "  $TARGET/lucidforge-agents/SKILL.md"
echo "  $TARGET/lucidforge-commit/SKILL.md"
echo "  $TARGET/lucidforge-cancel/SKILL.md"
echo ""
echo "Open Claude Code and run /lucidforge-agents to get started."
