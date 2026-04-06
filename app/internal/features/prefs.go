package features

import (
	"encoding/json"
	"os"
	"path/filepath"
)

const maxRecentProjects = 10

type prefs struct {
	LastProjectRoot    string   `json:"lastProjectRoot"` // kept for migration
	RecentProjectRoots []string `json:"recentProjectRoots"`
}

func prefsPath() string {
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = os.TempDir()
	}
	return filepath.Join(configDir, "LucidForge", "prefs.json")
}

func loadPrefs() prefs {
	data, err := os.ReadFile(prefsPath())
	if err != nil {
		return prefs{}
	}
	var p prefs
	if err := json.Unmarshal(data, &p); err != nil {
		return prefs{}
	}
	// Migrate legacy single-value field
	if len(p.RecentProjectRoots) == 0 && p.LastProjectRoot != "" {
		p.RecentProjectRoots = []string{p.LastProjectRoot}
	}
	return p
}

func savePrefs(p prefs) {
	data, _ := json.MarshalIndent(p, "", "  ")
	path := prefsPath()
	os.MkdirAll(filepath.Dir(path), 0755)
	os.WriteFile(path, data, 0644)
}

// LoadLastProjectRoot returns the most recently opened project root, or empty string.
func LoadLastProjectRoot() string {
	p := loadPrefs()
	if len(p.RecentProjectRoots) > 0 {
		return p.RecentProjectRoots[0]
	}
	return ""
}

// LoadRecentProjectRoots returns all saved recent project roots.
func LoadRecentProjectRoots() []string {
	return loadPrefs().RecentProjectRoots
}

// SaveLastProjectRoot persists root as the most recent project, deduplicating the list.
func SaveLastProjectRoot(root string) {
	p := loadPrefs()
	recent := []string{root}
	for _, r := range p.RecentProjectRoots {
		if r != root {
			recent = append(recent, r)
		}
	}
	if len(recent) > maxRecentProjects {
		recent = recent[:maxRecentProjects]
	}
	p.RecentProjectRoots = recent
	p.LastProjectRoot = root
	savePrefs(p)
}

// RemoveProjectRoot removes a specific root from the recent list.
func RemoveProjectRoot(root string) {
	p := loadPrefs()
	var recent []string
	for _, r := range p.RecentProjectRoots {
		if r != root {
			recent = append(recent, r)
		}
	}
	p.RecentProjectRoots = recent
	if p.LastProjectRoot == root {
		if len(recent) > 0 {
			p.LastProjectRoot = recent[0]
		} else {
			p.LastProjectRoot = ""
		}
	}
	savePrefs(p)
}
