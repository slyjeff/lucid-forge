package main

import (
	"embed"
	"os"
	"path/filepath"
	"strings"
)

//go:embed skills
var skillFiles embed.FS

var skillMap = map[string]string{
	"lucidforge.md":        "skills/lucidforge/SKILL.md",
	"lucidforge-agents.md": "skills/lucidforge-agents/SKILL.md",
	"lucidforge-cancel.md": "skills/lucidforge-cancel/SKILL.md",
	"lucidforge-change.md": "skills/lucidforge-change/SKILL.md",
	"lucidforge-commit.md": "skills/lucidforge-commit/SKILL.md",
}

func skillsCommandsDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".claude", "commands"), nil
}

func skillsSkillsDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".claude", "skills"), nil
}

func skillsInstalledIn(dir string) bool {
	for name := range skillMap {
		if _, err := os.Stat(filepath.Join(dir, name)); os.IsNotExist(err) {
			return false
		}
	}
	return true
}

// skillsInstalledInSkillsDir checks ~/.claude/skills/<name>/SKILL.md layout.
func skillsInstalledInSkillsDir(dir string) bool {
	for name := range skillMap {
		skillName := strings.TrimSuffix(name, ".md")
		if _, err := os.Stat(filepath.Join(dir, skillName, "SKILL.md")); os.IsNotExist(err) {
			return false
		}
	}
	return true
}

func installSkillsTo(dir string) error {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	for destName, srcPath := range skillMap {
		content, err := skillFiles.ReadFile(srcPath)
		if err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(dir, destName), content, 0644); err != nil {
			return err
		}
	}
	return nil
}

func skillsInstalled() bool {
	if dir, err := skillsCommandsDir(); err == nil && skillsInstalledIn(dir) {
		return true
	}
	if dir, err := skillsSkillsDir(); err == nil && skillsInstalledInSkillsDir(dir) {
		return true
	}
	return false
}

func installSkills() error {
	dir, err := skillsCommandsDir()
	if err != nil {
		return err
	}
	return installSkillsTo(dir)
}
