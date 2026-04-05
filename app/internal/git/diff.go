package git

import (
	"fmt"
	"os"
	"path/filepath"
)

// FileDiff contains the old and new content for a single file, suitable for Monaco's diff editor.
type FileDiff struct {
	Path        string `json:"path"`
	OldContent  string `json:"oldContent"`
	NewContent  string `json:"newContent"`
	IsNew       bool   `json:"isNew"`
	IsDeleted   bool   `json:"isDeleted"`
}

// ComputeFileDiff returns old and new file content for diffing.
// Old content comes from the base commit via git show. New content comes from the working tree.
func ComputeFileDiff(repoRoot, baseCommit, filePath string) (*FileDiff, error) {
	diff := &FileDiff{Path: filePath}

	// Get old content from base commit
	oldContent, err := GetFileAtCommit(repoRoot, baseCommit, filePath)
	if err != nil {
		// File didn't exist at base commit — it's new
		diff.IsNew = true
		diff.OldContent = ""
	} else {
		diff.OldContent = oldContent
	}

	// Get new content from working tree
	absPath := filepath.Join(repoRoot, filePath)
	newData, err := os.ReadFile(absPath)
	if err != nil {
		if os.IsNotExist(err) {
			// File was deleted
			diff.IsDeleted = true
			diff.NewContent = ""
		} else {
			return nil, fmt.Errorf("reading working tree file: %w", err)
		}
	} else {
		diff.NewContent = string(newData)
	}

	return diff, nil
}

// GetFileAtCommit retrieves a file's content at a specific commit.
func GetFileAtCommit(repoRoot, commit, filePath string) (string, error) {
	ref := fmt.Sprintf("%s:%s", commit, filepath.ToSlash(filePath))
	content, err := runGit(repoRoot, "show", ref)
	if err != nil {
		return "", err
	}
	return content, nil
}
