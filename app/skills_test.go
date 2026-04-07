package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestSkillsInstalledIn_MissingAll(t *testing.T) {
	dir := t.TempDir()
	if skillsInstalledIn(dir) {
		t.Fatal("expected false when no skills are installed")
	}
}

func TestSkillsInstalledIn_MissingOne(t *testing.T) {
	dir := t.TempDir()
	// Write all skills except one
	for name := range skillMap {
		if name == "lucidforge.md" {
			continue
		}
		if err := os.WriteFile(filepath.Join(dir, name), []byte("x"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	if skillsInstalledIn(dir) {
		t.Fatal("expected false when one skill is missing")
	}
}

func TestSkillsInstalledIn_AllPresent(t *testing.T) {
	dir := t.TempDir()
	for name := range skillMap {
		if err := os.WriteFile(filepath.Join(dir, name), []byte("x"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	if !skillsInstalledIn(dir) {
		t.Fatal("expected true when all skills are present")
	}
}

func TestInstallSkillsTo_CreatesFiles(t *testing.T) {
	dir := t.TempDir()
	if err := installSkillsTo(dir); err != nil {
		t.Fatalf("installSkillsTo failed: %v", err)
	}
	for name, srcPath := range skillMap {
		dest := filepath.Join(dir, name)
		data, err := os.ReadFile(dest)
		if err != nil {
			t.Errorf("skill file %s not created: %v", name, err)
			continue
		}
		embedded, _ := skillFiles.ReadFile(srcPath)
		if string(data) != string(embedded) {
			t.Errorf("skill file %s content mismatch", name)
		}
	}
}

func TestInstallSkillsTo_CreatesDir(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "nested", "commands")
	if err := installSkillsTo(dir); err != nil {
		t.Fatalf("installSkillsTo failed to create directory: %v", err)
	}
	if _, err := os.Stat(dir); err != nil {
		t.Fatalf("directory not created: %v", err)
	}
}

func TestInstallSkillsTo_ThenInstalled(t *testing.T) {
	dir := t.TempDir()
	if skillsInstalledIn(dir) {
		t.Fatal("expected false before install")
	}
	if err := installSkillsTo(dir); err != nil {
		t.Fatalf("installSkillsTo failed: %v", err)
	}
	if !skillsInstalledIn(dir) {
		t.Fatal("expected true after install")
	}
}
