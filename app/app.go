package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"app/internal/agents"
	"app/internal/artifacts"
	"app/internal/features"
	"app/internal/git"

	"github.com/pkg/browser"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App provides Wails-bound methods for the frontend.
type App struct {
	ctx            context.Context
	projectRoot    string
	artifactStore  *artifacts.Store
	agentStore     *agents.Store
	featureWatcher *features.Watcher
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Try last opened project first
	if last := features.LoadLastProjectRoot(); last != "" {
		if _, err := os.Stat(last); err == nil {
			a.setProjectRoot(last)
			return
		}
	}

	// Fall back to detecting from CWD
	cwd, _ := os.Getwd()
	root, err := features.FindProjectRoot(cwd)
	if err != nil {
		root = cwd
	}
	a.setProjectRoot(root)
}

func (a *App) shutdown(ctx context.Context) {
	if a.featureWatcher != nil {
		a.featureWatcher.Close()
	}
}

func (a *App) setProjectRoot(root string) {
	a.projectRoot = root
	features.SaveLastProjectRoot(root)
	a.artifactStore = artifacts.NewStore(root)
	a.agentStore = agents.NewStore(filepath.Join(root, ".claude", "agents"))

	// Stop existing watcher
	if a.featureWatcher != nil {
		a.featureWatcher.Close()
	}

	// Start file watcher
	w, err := features.NewWatcher(root, func() {
		runtime.EventsEmit(a.ctx, "features:changed")
	})
	if err == nil {
		a.featureWatcher = w
	}
}

// --- Project ---

func (a *App) GetProjectRoot() string {
	return a.projectRoot
}

func (a *App) SelectProjectRoot() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Project Root",
	})
	if err != nil {
		return "", err
	}
	if dir == "" {
		return a.projectRoot, nil // user cancelled
	}
	a.setProjectRoot(dir)
	runtime.EventsEmit(a.ctx, "features:changed")
	return dir, nil
}

// --- Features ---

func (a *App) GetFeatures() ([]artifacts.Feature, error) {
	return a.artifactStore.ListFeatures()
}

func (a *App) GetFeature(id string) (*artifacts.Feature, error) {
	return a.artifactStore.LoadFeature(id)
}

func (a *App) GetDiscovery(featureID string) (string, error) {
	return a.artifactStore.LoadDiscovery(featureID)
}

func (a *App) GetUxDesign(featureID string) (string, error) {
	return a.artifactStore.LoadUxDesign(featureID)
}

func (a *App) GetMockups(featureID string) ([]string, error) {
	return a.artifactStore.ListMockups(featureID)
}

func (a *App) GetPlan(featureID string) (string, error) {
	return a.artifactStore.LoadPlan(featureID)
}

func (a *App) GetSteps(featureID string) ([]artifacts.Step, error) {
	return a.artifactStore.LoadSteps(featureID)
}

func (a *App) GetStep(featureID string, stepOrder int) (*artifacts.Step, error) {
	return a.artifactStore.LoadStep(featureID, stepOrder)
}

func (a *App) GetReview(featureID string) (*artifacts.Review, error) {
	return a.artifactStore.LoadReview(featureID)
}

// --- Diffs ---

func (a *App) GetDiff(featureID string, stepOrder int, filePath string) (*git.FileDiff, error) {
	feature, err := a.artifactStore.LoadFeature(featureID)
	if err != nil {
		return nil, err
	}
	return git.ComputeFileDiff(a.projectRoot, feature.BaseCommit, filePath)
}

// --- Review Actions ---

func (a *App) MarkFileViewed(featureID string, stepOrder int, filePath string) error {
	step, err := a.artifactStore.LoadStep(featureID, stepOrder)
	if err != nil {
		return err
	}
	// Add file if not already viewed
	for _, f := range step.ViewedFiles {
		if f == filePath {
			return nil
		}
	}
	viewed := append(step.ViewedFiles, filePath)
	return a.artifactStore.SaveViewedFiles(featureID, stepOrder, viewed)
}

func (a *App) UnmarkFileViewed(featureID string, stepOrder int, filePath string) error {
	step, err := a.artifactStore.LoadStep(featureID, stepOrder)
	if err != nil {
		return err
	}
	var viewed []string
	for _, f := range step.ViewedFiles {
		if f != filePath {
			viewed = append(viewed, f)
		}
	}
	return a.artifactStore.SaveViewedFiles(featureID, stepOrder, viewed)
}

func (a *App) ApproveFeature(featureID string, commitMessage string) error {
	feature, err := a.artifactStore.LoadFeature(featureID)
	if err != nil {
		return err
	}
	if feature.Status != artifacts.StatusUserReview {
		return fmt.Errorf("feature %s is not in user-review status", featureID)
	}

	// Collect all changed files across all steps
	steps, err := a.artifactStore.LoadSteps(featureID)
	if err != nil {
		return err
	}
	seen := make(map[string]bool)
	var files []string
	for _, step := range steps {
		for _, f := range step.ChangeMap.Files {
			if !seen[f.Path] {
				seen[f.Path] = true
				files = append(files, f.Path)
			}
		}
	}

	if err := git.CommitFiles(a.projectRoot, files, commitMessage); err != nil {
		return fmt.Errorf("committing: %w", err)
	}
	return a.artifactStore.UpdateFeatureStatus(featureID, artifacts.StatusApproved)
}

// SaveFileContent writes content to a file in the working tree.
func (a *App) SaveFileContent(filePath string, content string) error {
	absPath := filepath.Join(a.projectRoot, filePath)
	return os.WriteFile(absPath, []byte(content), 0644)
}

func (a *App) CancelFeature(featureID string) error {
	return a.artifactStore.UpdateFeatureStatus(featureID, artifacts.StatusCancelled)
}

// --- Mockups ---

func (a *App) OpenMockup(featureID, filename string) error {
	path := a.artifactStore.MockupPath(featureID, filename)
	return browser.OpenFile(path)
}

// --- Agents ---

func (a *App) GetAgents() ([]agents.Agent, error) {
	return a.agentStore.ListAgents()
}

func (a *App) GetAgent(name string) (*agents.Agent, error) {
	return a.agentStore.LoadAgent(name)
}

func (a *App) SaveAgent(agent agents.Agent) error {
	return a.agentStore.SaveAgent(agent)
}

func (a *App) CreateAgent(agent agents.Agent) error {
	return a.agentStore.CreateAgent(agent)
}

func (a *App) DeleteAgent(name string) error {
	return a.agentStore.DeleteAgent(name)
}

func (a *App) MergeAgents(sourceName, targetName string) error {
	return a.agentStore.MergeAgents(sourceName, targetName)
}
