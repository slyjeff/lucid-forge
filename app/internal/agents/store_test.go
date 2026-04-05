package agents

import (
	"os"
	"path/filepath"
	"testing"
)

func writeAgentFile(t *testing.T, dir, filename, content string) {
	t.Helper()
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, filename), []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func makeSampleContent(name string, lucidforge bool, dirs []string) string {
	lfFlag := "false"
	if lucidforge {
		lfFlag = "true"
	}
	content := "---\nname: " + name + "\nmodel: claude-sonnet-4-6\nlucidforge: " + lfFlag + "\n---\n\nYou are " + name + ".\n\n## Directories\n\n"
	for _, d := range dirs {
		content += "- " + d + "\n"
	}
	content += "\n## Instructions\n\n## Learnings\n"
	return content
}

// --- ListAgents ---

func TestListAgents_FiltersToLucidForge(t *testing.T) {
	// Arrange
	dir := t.TempDir()
	writeAgentFile(t, dir, "lf-backend.md", makeSampleContent("Backend", true, []string{"src/api/"}))
	writeAgentFile(t, dir, "lf-frontend.md", makeSampleContent("Frontend", true, []string{"src/ui/"}))
	writeAgentFile(t, dir, "other.md", makeSampleContent("Other", false, []string{"lib/"}))
	store := NewStore(dir)

	// Act
	agents, err := store.ListAgents()

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(agents) != 2 {
		t.Fatalf("expected 2 lucidforge agents, got %d", len(agents))
	}
}

func TestListAgents_EmptyDirectory(t *testing.T) {
	// Arrange
	store := NewStore(t.TempDir())

	// Act
	agents, err := store.ListAgents()

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(agents) != 0 {
		t.Fatalf("expected 0 agents, got %d", len(agents))
	}
}

func TestListAgents_NonexistentDirectory(t *testing.T) {
	// Arrange
	store := NewStore(filepath.Join(t.TempDir(), "nonexistent"))

	// Act
	agents, err := store.ListAgents()

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if agents != nil {
		t.Errorf("expected nil, got %v", agents)
	}
}

// --- LoadAgent ---

func TestLoadAgent_FindsByName(t *testing.T) {
	// Arrange
	dir := t.TempDir()
	writeAgentFile(t, dir, "lf-backend.md", makeSampleContent("Backend", true, []string{"src/api/"}))
	store := NewStore(dir)

	// Act
	agent, err := store.LoadAgent("Backend")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if agent.Name != "Backend" {
		t.Errorf("expected name 'Backend', got %q", agent.Name)
	}
}

func TestLoadAgent_NotFound(t *testing.T) {
	// Arrange
	dir := t.TempDir()
	store := NewStore(dir)

	// Act
	_, err := store.LoadAgent("Nonexistent")

	// Assert
	if err == nil {
		t.Fatal("expected error for nonexistent agent")
	}
}

// --- CreateAgent ---

func TestCreateAgent_CreatesFile(t *testing.T) {
	// Arrange
	dir := filepath.Join(t.TempDir(), "agents")
	store := NewStore(dir)
	agent := Agent{
		Name:        "Database",
		Model:       "claude-sonnet-4-6",
		Identity:    "You handle database operations.",
		Directories: []string{"src/db/", "migrations/"},
	}

	// Act
	err := store.CreateAgent(agent)

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	loaded, err := store.LoadAgent("Database")
	if err != nil {
		t.Fatalf("error loading created agent: %v", err)
	}
	if loaded.Name != "Database" {
		t.Errorf("expected name 'Database', got %q", loaded.Name)
	}
	if !loaded.LucidForge {
		t.Error("expected lucidforge to be true")
	}
	if loaded.Filename != "lf-database.md" {
		t.Errorf("expected filename 'lf-database.md', got %q", loaded.Filename)
	}
}

func TestCreateAgent_RejectsExistingFile(t *testing.T) {
	// Arrange
	dir := t.TempDir()
	writeAgentFile(t, dir, "lf-backend.md", makeSampleContent("Backend", true, []string{"src/"}))
	store := NewStore(dir)

	// Act
	err := store.CreateAgent(Agent{Name: "Backend", Model: "claude-sonnet-4-6", Directories: []string{"src/"}})

	// Assert
	if err == nil {
		t.Fatal("expected error for existing file")
	}
}

// --- DeleteAgent ---

func TestDeleteAgent_RemovesFile(t *testing.T) {
	// Arrange
	dir := t.TempDir()
	writeAgentFile(t, dir, "lf-backend.md", makeSampleContent("Backend", true, []string{"src/"}))
	store := NewStore(dir)

	// Act
	err := store.DeleteAgent("Backend")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	_, err = store.LoadAgent("Backend")
	if err == nil {
		t.Fatal("expected agent to be deleted")
	}
}

func TestDeleteAgent_RefusesGeneral(t *testing.T) {
	// Arrange
	dir := t.TempDir()
	writeAgentFile(t, dir, "lf-general.md", makeSampleContent("General", true, []string{"src/"}))
	store := NewStore(dir)

	// Act
	err := store.DeleteAgent("General")

	// Assert
	if err == nil {
		t.Fatal("expected error when deleting General agent")
	}
}

// --- MergeAgents ---

func TestMergeAgents_CombinesAndDeletesSource(t *testing.T) {
	// Arrange
	dir := t.TempDir()
	sourceContent := "---\nname: Frontend\nmodel: claude-sonnet-4-6\nlucidforge: true\n---\n\nFrontend specialist.\n\n## Directories\n\n- src/ui/\n- src/components/\n\n## Instructions\n\nUse hooks.\n\n## Learnings\n\nPrefer functional components.\n"
	targetContent := "---\nname: General\nmodel: claude-sonnet-4-6\nlucidforge: true\n---\n\nGeneral agent.\n\n## Directories\n\n- src/ui/\n- src/utils/\n\n## Instructions\n\nFollow conventions.\n\n## Learnings\n\n"
	writeAgentFile(t, dir, "lf-frontend.md", sourceContent)
	writeAgentFile(t, dir, "lf-general.md", targetContent)
	store := NewStore(dir)

	// Act
	err := store.MergeAgents("Frontend", "General")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Source should be deleted
	_, err = store.LoadAgent("Frontend")
	if err == nil {
		t.Fatal("expected source agent to be deleted")
	}
	// Target should have merged content
	target, err := store.LoadAgent("General")
	if err != nil {
		t.Fatalf("error loading target: %v", err)
	}
	// Directories deduped (src/ui/ was in both)
	if len(target.Directories) != 3 {
		t.Errorf("expected 3 directories (deduped), got %d: %v", len(target.Directories), target.Directories)
	}
	if target.Instructions != "Follow conventions.\n\nUse hooks." {
		t.Errorf("unexpected instructions: %q", target.Instructions)
	}
	if target.Learnings != "Prefer functional components." {
		t.Errorf("unexpected learnings: %q", target.Learnings)
	}
}

// --- toFilename ---

func TestToFilename(t *testing.T) {
	tests := []struct {
		name     string
		expected string
	}{
		{"Backend API", "lf-backend-api.md"},
		{"General", "lf-general.md"},
		{"Frontend UI", "lf-frontend-ui.md"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Arrange / Act
			result := toFilename(tt.name)

			// Assert
			if result != tt.expected {
				t.Errorf("toFilename(%q) = %q, want %q", tt.name, result, tt.expected)
			}
		})
	}
}
