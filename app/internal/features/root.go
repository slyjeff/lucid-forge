package features

import (
	"fmt"
	"os"
	"path/filepath"
)

// FindProjectRoot walks up from startDir looking for .lucidforge/ or .git/.
// Returns the first directory containing either marker.
func FindProjectRoot(startDir string) (string, error) {
	dir, err := filepath.Abs(startDir)
	if err != nil {
		return "", fmt.Errorf("resolving path: %w", err)
	}

	for {
		if hasMarker(dir) {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("no project root found from %s", startDir)
		}
		dir = parent
	}
}

func hasMarker(dir string) bool {
	for _, marker := range []string{".lucidforge", ".git"} {
		info, err := os.Stat(filepath.Join(dir, marker))
		if err == nil && info.IsDir() {
			return true
		}
	}
	return false
}
