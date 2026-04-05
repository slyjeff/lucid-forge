package features

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type prefs struct {
	LastProjectRoot string `json:"lastProjectRoot"`
}

func prefsPath() string {
	configDir, err := os.UserConfigDir()
	if err != nil {
		configDir = os.TempDir()
	}
	return filepath.Join(configDir, "LucidForge", "prefs.json")
}

// LoadLastProjectRoot returns the last opened project root, or empty string.
func LoadLastProjectRoot() string {
	data, err := os.ReadFile(prefsPath())
	if err != nil {
		return ""
	}
	var p prefs
	if err := json.Unmarshal(data, &p); err != nil {
		return ""
	}
	return p.LastProjectRoot
}

// SaveLastProjectRoot persists the project root for next launch.
func SaveLastProjectRoot(root string) {
	p := prefs{LastProjectRoot: root}
	data, _ := json.MarshalIndent(p, "", "  ")
	path := prefsPath()
	os.MkdirAll(filepath.Dir(path), 0755)
	os.WriteFile(path, data, 0644)
}
