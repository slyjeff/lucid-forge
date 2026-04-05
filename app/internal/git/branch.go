package git

import "strings"

// CurrentBranch returns the name of the current branch.
func CurrentBranch(repoRoot string) (string, error) {
	out, err := runGit(repoRoot, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(out), nil
}

// CurrentCommit returns the full SHA of HEAD.
func CurrentCommit(repoRoot string) (string, error) {
	out, err := runGit(repoRoot, "rev-parse", "HEAD")
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(out), nil
}
