package git

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// --- helpers ---

func initRepo(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()

	run(t, dir, "git", "init")
	run(t, dir, "git", "config", "user.email", "test@test.com")
	run(t, dir, "git", "config", "user.name", "Test")

	writeTestFile(t, dir, "initial.txt", "hello")
	run(t, dir, "git", "add", "initial.txt")
	run(t, dir, "git", "commit", "-m", "initial commit")

	return dir
}

func run(t *testing.T, dir string, name string, args ...string) string {
	t.Helper()
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("%s %v failed: %v\n%s", name, args, err, string(out))
	}
	return strings.TrimSpace(string(out))
}

func writeTestFile(t *testing.T, dir, name, content string) {
	t.Helper()
	path := filepath.Join(dir, name)
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func getCommit(t *testing.T, dir string) string {
	t.Helper()
	return run(t, dir, "git", "rev-parse", "HEAD")
}

// --- ComputeFileDiff ---

func TestComputeFileDiff_ModifiedFile(t *testing.T) {
	// Arrange
	repo := initRepo(t)
	baseCommit := getCommit(t, repo)
	writeTestFile(t, repo, "initial.txt", "hello world")

	// Act
	diff, err := ComputeFileDiff(repo, baseCommit, "initial.txt")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if diff.OldContent != "hello" {
		t.Errorf("expected old content 'hello', got %q", diff.OldContent)
	}
	if diff.NewContent != "hello world" {
		t.Errorf("expected new content 'hello world', got %q", diff.NewContent)
	}
	if diff.IsNew {
		t.Error("expected IsNew to be false")
	}
	if diff.IsDeleted {
		t.Error("expected IsDeleted to be false")
	}
}

func TestComputeFileDiff_NewFile(t *testing.T) {
	// Arrange
	repo := initRepo(t)
	baseCommit := getCommit(t, repo)
	writeTestFile(t, repo, "newfile.txt", "brand new")

	// Act
	diff, err := ComputeFileDiff(repo, baseCommit, "newfile.txt")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !diff.IsNew {
		t.Error("expected IsNew to be true")
	}
	if diff.OldContent != "" {
		t.Errorf("expected empty old content, got %q", diff.OldContent)
	}
	if diff.NewContent != "brand new" {
		t.Errorf("expected new content 'brand new', got %q", diff.NewContent)
	}
}

func TestComputeFileDiff_DeletedFile(t *testing.T) {
	// Arrange
	repo := initRepo(t)
	baseCommit := getCommit(t, repo)
	os.Remove(filepath.Join(repo, "initial.txt"))

	// Act
	diff, err := ComputeFileDiff(repo, baseCommit, "initial.txt")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !diff.IsDeleted {
		t.Error("expected IsDeleted to be true")
	}
	if diff.OldContent != "hello" {
		t.Errorf("expected old content 'hello', got %q", diff.OldContent)
	}
	if diff.NewContent != "" {
		t.Errorf("expected empty new content, got %q", diff.NewContent)
	}
}

// --- GetFileAtCommit ---

func TestGetFileAtCommit_Success(t *testing.T) {
	// Arrange
	repo := initRepo(t)
	commit := getCommit(t, repo)

	// Act
	content, err := GetFileAtCommit(repo, commit, "initial.txt")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if content != "hello" {
		t.Errorf("expected 'hello', got %q", content)
	}
}

func TestGetFileAtCommit_FileNotInCommit(t *testing.T) {
	// Arrange
	repo := initRepo(t)
	commit := getCommit(t, repo)

	// Act
	_, err := GetFileAtCommit(repo, commit, "nonexistent.txt")

	// Assert
	if err == nil {
		t.Fatal("expected error for nonexistent file")
	}
}

// --- CommitFiles ---

func TestCommitFiles_CreatesCommit(t *testing.T) {
	// Arrange
	repo := initRepo(t)
	writeTestFile(t, repo, "new.txt", "new content")

	// Act
	err := CommitFiles(repo, []string{"new.txt"}, "add new file")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	log := run(t, repo, "git", "log", "--oneline", "-1")
	if !strings.Contains(log, "add new file") {
		t.Errorf("expected commit message in log, got %s", log)
	}
}

func TestCommitFiles_MultipleFiles(t *testing.T) {
	// Arrange
	repo := initRepo(t)
	writeTestFile(t, repo, "a.txt", "aaa")
	writeTestFile(t, repo, "b.txt", "bbb")

	// Act
	err := CommitFiles(repo, []string{"a.txt", "b.txt"}, "add two files")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	diff := run(t, repo, "git", "diff", "--name-only", "HEAD~1", "HEAD")
	if !strings.Contains(diff, "a.txt") || !strings.Contains(diff, "b.txt") {
		t.Errorf("expected both files in commit, got %s", diff)
	}
}

// --- CurrentBranch ---

func TestCurrentBranch_ReturnsBranchName(t *testing.T) {
	// Arrange
	repo := initRepo(t)

	// Act
	branch, err := CurrentBranch(repo)

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if branch != "master" && branch != "main" {
		t.Errorf("expected 'master' or 'main', got %s", branch)
	}
}

// --- CurrentCommit ---

func TestCurrentCommit_ReturnsSHA(t *testing.T) {
	// Arrange
	repo := initRepo(t)

	// Act
	sha, err := CurrentCommit(repo)

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sha) != 40 {
		t.Errorf("expected 40-char SHA, got %d chars: %s", len(sha), sha)
	}
}
