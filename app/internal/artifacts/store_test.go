package artifacts

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"
)

// --- helpers ---

func writeJSON(t *testing.T, path string, v any) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0644); err != nil {
		t.Fatal(err)
	}
}

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func makeFeature(id, name string, status FeatureStatus) Feature {
	return Feature{
		SchemaVersion: 1,
		ID:            id,
		Name:          name,
		Description:   "test feature",
		Status:        status,
		SourceBranch:  "main",
		WorkingBranch: "lucidforge/" + id,
		BaseCommit:    "abc123",
		CreatedAt:     time.Date(2026, 4, 4, 10, 0, 0, 0, time.UTC),
		HasUxDesign:   false,
		StepCount:     2,
		Usage: FeatureUsage{
			TotalCostUsd: 0.45,
		},
	}
}

func makeStep(order int, agent, title string) Step {
	return Step{
		Order:  order,
		Agent:  agent,
		Title:  title,
		Status: StepCompleted,
		Tasks: []Task{
			{Description: "task one", Completed: true},
		},
		Validation:    Validation{Passed: true, Retries: 0},
		ChangeMap:     ChangeMap{Files: []ChangeMapFile{}, Connections: []Connection{}},
		Patterns:      []Pattern{},
		ChangeSummary: "did stuff",
		Usage:         StepUsage{InputTokens: 1000, OutputTokens: 500, CostUsd: 0.05},
		ViewedFiles:   []string{},
	}
}

func setupFeature(t *testing.T, root string, f Feature) {
	t.Helper()
	dir := filepath.Join(root, ".lucidforge", "features", f.ID)
	writeJSON(t, filepath.Join(dir, "feature.json"), f)
}

// --- ListFeatures ---

func TestListFeatures_ReturnsAllStatuses(t *testing.T) {
	// Arrange
	root := t.TempDir()
	statuses := map[string]FeatureStatus{
		"feat-discovery":  StatusDiscovery,
		"feat-planning":   StatusPlanning,
		"feat-executing":  StatusExecuting,
		"feat-codereview": StatusCodeReview,
		"feat-userreview": StatusUserReview,
		"feat-approved":   StatusApproved,
		"feat-cancelled":  StatusCancelled,
	}
	for id, status := range statuses {
		setupFeature(t, root, makeFeature(id, id, status))
	}
	store := NewStore(root)

	// Act
	features, err := store.ListFeatures()

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(features) != 7 {
		t.Fatalf("expected 7 features, got %d", len(features))
	}
}

func TestListFeatures_EmptyDirectory(t *testing.T) {
	// Arrange
	root := t.TempDir()
	store := NewStore(root)

	// Act
	features, err := store.ListFeatures()

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(features) != 0 {
		t.Fatalf("expected 0 features, got %d", len(features))
	}
}

func TestListFeatures_SkipsMalformedJSON(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("good", "Good Feature", StatusUserReview))
	badDir := filepath.Join(root, ".lucidforge", "features", "bad")
	writeFile(t, filepath.Join(badDir, "feature.json"), "not json")
	store := NewStore(root)

	// Act
	features, err := store.ListFeatures()

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(features) != 1 {
		t.Fatalf("expected 1 feature, got %d", len(features))
	}
	if features[0].ID != "good" {
		t.Errorf("expected feature 'good', got %s", features[0].ID)
	}
}

// --- LoadFeature ---

func TestLoadFeature_Success(t *testing.T) {
	// Arrange
	root := t.TempDir()
	expected := makeFeature("auth", "Add Auth", StatusUserReview)
	expected.HasUxDesign = true
	setupFeature(t, root, expected)
	store := NewStore(root)

	// Act
	f, err := store.LoadFeature("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if f.ID != "auth" {
		t.Errorf("expected id 'auth', got %s", f.ID)
	}
	if f.Name != "Add Auth" {
		t.Errorf("expected name 'Add Auth', got %s", f.Name)
	}
	if !f.HasUxDesign {
		t.Error("expected hasUxDesign to be true")
	}
}

func TestLoadFeature_NotFound(t *testing.T) {
	// Arrange
	root := t.TempDir()
	store := NewStore(root)

	// Act
	_, err := store.LoadFeature("nonexistent")

	// Assert
	if err == nil {
		t.Fatal("expected error for nonexistent feature")
	}
}

// --- LoadDiscovery / LoadPlan / LoadUxDesign ---

func TestLoadDiscovery_Success(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	writeFile(t, filepath.Join(root, ".lucidforge", "features", "auth", "discovery.md"), "# Discovery\nSome content")
	store := NewStore(root)

	// Act
	content, err := store.LoadDiscovery("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if content != "# Discovery\nSome content" {
		t.Errorf("unexpected content: %s", content)
	}
}

func TestLoadUxDesign_ReturnsEmptyWhenMissing(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	store := NewStore(root)

	// Act
	content, err := store.LoadUxDesign("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if content != "" {
		t.Errorf("expected empty string, got %s", content)
	}
}

func TestLoadPlan_Success(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	writeFile(t, filepath.Join(root, ".lucidforge", "features", "auth", "plan.md"), "# Plan\n## Step 1")
	store := NewStore(root)

	// Act
	content, err := store.LoadPlan("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if content != "# Plan\n## Step 1" {
		t.Errorf("unexpected content: %s", content)
	}
}

// --- ListMockups ---

func TestListMockups_ReturnsHTMLFiles(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	mockDir := filepath.Join(root, ".lucidforge", "features", "auth", "mockups")
	writeFile(t, filepath.Join(mockDir, "login.html"), "<html></html>")
	writeFile(t, filepath.Join(mockDir, "dashboard.html"), "<html></html>")
	writeFile(t, filepath.Join(mockDir, "notes.txt"), "not a mockup")
	store := NewStore(root)

	// Act
	mockups, err := store.ListMockups("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(mockups) != 2 {
		t.Fatalf("expected 2 mockups, got %d", len(mockups))
	}
}

func TestListMockups_ReturnsNilWhenMissing(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	store := NewStore(root)

	// Act
	mockups, err := store.ListMockups("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if mockups != nil {
		t.Errorf("expected nil, got %v", mockups)
	}
}

// --- LoadSteps ---

func TestLoadSteps_SortedByOrder(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	stepsDir := filepath.Join(root, ".lucidforge", "features", "auth", "steps")
	writeJSON(t, filepath.Join(stepsDir, "01-frontend.json"), makeStep(1, "frontend", "Build UI"))
	writeJSON(t, filepath.Join(stepsDir, "00-backend.json"), makeStep(0, "backend", "Build API"))
	store := NewStore(root)

	// Act
	steps, err := store.LoadSteps("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(steps) != 2 {
		t.Fatalf("expected 2 steps, got %d", len(steps))
	}
	if steps[0].Order != 0 {
		t.Errorf("expected first step order 0, got %d", steps[0].Order)
	}
	if steps[1].Order != 1 {
		t.Errorf("expected second step order 1, got %d", steps[1].Order)
	}
}

func TestLoadSteps_SkipsMalformedJSON(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	stepsDir := filepath.Join(root, ".lucidforge", "features", "auth", "steps")
	writeJSON(t, filepath.Join(stepsDir, "00-backend.json"), makeStep(0, "backend", "Build API"))
	writeFile(t, filepath.Join(stepsDir, "01-broken.json"), "not json")
	store := NewStore(root)

	// Act
	steps, err := store.LoadSteps("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(steps) != 1 {
		t.Fatalf("expected 1 valid step, got %d", len(steps))
	}
}

func TestLoadSteps_EmptyWhenNoStepsDir(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	store := NewStore(root)

	// Act
	steps, err := store.LoadSteps("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(steps) != 0 {
		t.Fatalf("expected 0 steps, got %d", len(steps))
	}
}

// --- LoadStep ---

func TestLoadStep_FindsByOrder(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	stepsDir := filepath.Join(root, ".lucidforge", "features", "auth", "steps")
	writeJSON(t, filepath.Join(stepsDir, "00-backend.json"), makeStep(0, "backend", "Build API"))
	writeJSON(t, filepath.Join(stepsDir, "01-frontend.json"), makeStep(1, "frontend", "Build UI"))
	store := NewStore(root)

	// Act
	step, err := store.LoadStep("auth", 1)

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if step.Agent != "frontend" {
		t.Errorf("expected agent 'frontend', got %s", step.Agent)
	}
}

func TestLoadStep_NotFound(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	stepsDir := filepath.Join(root, ".lucidforge", "features", "auth", "steps")
	writeJSON(t, filepath.Join(stepsDir, "00-backend.json"), makeStep(0, "backend", "Build API"))
	store := NewStore(root)

	// Act
	_, err := store.LoadStep("auth", 99)

	// Assert
	if err == nil {
		t.Fatal("expected error for nonexistent step")
	}
}

// --- LoadReview ---

func TestLoadReview_Success(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	review := Review{
		Issues: []Issue{
			{Severity: SeverityWarning, Step: 0, Agent: "backend", File: "auth.go", Description: "hardcoded secret", Fixed: true},
		},
		Usage: StepUsage{InputTokens: 1000, OutputTokens: 500, CostUsd: 0.03},
	}
	writeJSON(t, filepath.Join(root, ".lucidforge", "features", "auth", "review.json"), review)
	store := NewStore(root)

	// Act
	r, err := store.LoadReview("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(r.Issues) != 1 {
		t.Fatalf("expected 1 issue, got %d", len(r.Issues))
	}
	if r.Issues[0].Severity != SeverityWarning {
		t.Errorf("expected severity 'warning', got %s", r.Issues[0].Severity)
	}
}

func TestLoadReview_ReturnsNilWhenMissing(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	store := NewStore(root)

	// Act
	r, err := store.LoadReview("auth")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if r != nil {
		t.Errorf("expected nil, got %+v", r)
	}
}

// --- SaveViewedFiles ---

func TestSaveViewedFiles_UpdatesStepFile(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	stepsDir := filepath.Join(root, ".lucidforge", "features", "auth", "steps")
	writeJSON(t, filepath.Join(stepsDir, "00-backend.json"), makeStep(0, "backend", "Build API"))
	store := NewStore(root)

	// Act
	err := store.SaveViewedFiles("auth", 0, []string{"src/auth.go", "src/models.go"})

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	step, err := store.LoadStep("auth", 0)
	if err != nil {
		t.Fatalf("error reloading step: %v", err)
	}
	if len(step.ViewedFiles) != 2 {
		t.Fatalf("expected 2 viewed files, got %d", len(step.ViewedFiles))
	}
	if step.ViewedFiles[0] != "src/auth.go" {
		t.Errorf("expected 'src/auth.go', got %s", step.ViewedFiles[0])
	}
}

func TestSaveViewedFiles_StepNotFound(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	stepsDir := filepath.Join(root, ".lucidforge", "features", "auth", "steps")
	writeJSON(t, filepath.Join(stepsDir, "00-backend.json"), makeStep(0, "backend", "Build API"))
	store := NewStore(root)

	// Act
	err := store.SaveViewedFiles("auth", 99, []string{"foo.go"})

	// Assert
	if err == nil {
		t.Fatal("expected error for nonexistent step")
	}
}

// --- UpdateFeatureStatus ---

func TestUpdateFeatureStatus_PersistsChange(t *testing.T) {
	// Arrange
	root := t.TempDir()
	setupFeature(t, root, makeFeature("auth", "Auth", StatusUserReview))
	store := NewStore(root)

	// Act
	err := store.UpdateFeatureStatus("auth", StatusApproved)

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	f, err := store.LoadFeature("auth")
	if err != nil {
		t.Fatalf("error reloading feature: %v", err)
	}
	if f.Status != StatusApproved {
		t.Errorf("expected status 'approved', got %s", f.Status)
	}
}

