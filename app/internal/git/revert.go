package git

import "fmt"

// RevertFile restores a file to its state at a given commit.
func RevertFile(repoRoot, commit, filePath string) error {
	_, err := runGit(repoRoot, "checkout", commit, "--", filePath)
	if err != nil {
		return fmt.Errorf("reverting %s: %w", filePath, err)
	}
	return nil
}
