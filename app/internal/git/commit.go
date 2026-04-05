package git

import "fmt"

// CommitFiles stages the given files and creates a commit.
func CommitFiles(repoRoot string, files []string, message string) error {
	for _, f := range files {
		if _, err := runGit(repoRoot, "add", f); err != nil {
			return fmt.Errorf("staging %s: %w", f, err)
		}
	}
	if _, err := runGit(repoRoot, "commit", "-m", message); err != nil {
		return fmt.Errorf("committing: %w", err)
	}
	return nil
}
