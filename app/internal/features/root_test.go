package features

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFindProjectRoot_FindsGitDir(t *testing.T) {
	// Arrange
	root := t.TempDir()
	os.MkdirAll(filepath.Join(root, ".git"), 0755)
	nested := filepath.Join(root, "src", "pkg")
	os.MkdirAll(nested, 0755)

	// Act
	found, err := FindProjectRoot(nested)

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found != root {
		t.Errorf("expected %s, got %s", root, found)
	}
}

func TestFindProjectRoot_FindsLucidForgeDir(t *testing.T) {
	// Arrange
	root := t.TempDir()
	os.MkdirAll(filepath.Join(root, ".lucidforge"), 0755)
	nested := filepath.Join(root, "deep", "path")
	os.MkdirAll(nested, 0755)

	// Act
	found, err := FindProjectRoot(nested)

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found != root {
		t.Errorf("expected %s, got %s", root, found)
	}
}

func TestFindProjectRoot_PrefersClosest(t *testing.T) {
	// Arrange
	outer := t.TempDir()
	os.MkdirAll(filepath.Join(outer, ".git"), 0755)
	inner := filepath.Join(outer, "subproject")
	os.MkdirAll(filepath.Join(inner, ".lucidforge"), 0755)

	// Act
	found, err := FindProjectRoot(inner)

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found != inner {
		t.Errorf("expected inner %s, got %s", inner, found)
	}
}

func TestFindProjectRoot_NoMarker(t *testing.T) {
	// Arrange — use the filesystem root which won't have .git or .lucidforge
	// We test with a path that's guaranteed to reach the filesystem root
	// without finding a marker by checking against an impossible nested path.
	dir := t.TempDir()
	nested := filepath.Join(dir, "a", "b")
	os.MkdirAll(nested, 0755)

	// Act
	found, err := FindProjectRoot(nested)

	// Assert — if a parent of TempDir has .git, the function finds it.
	// That's correct behavior. Only fail if it returns nested or dir itself.
	if err == nil && (found == nested || found == dir || found == filepath.Join(dir, "a")) {
		t.Fatal("should not find a marker in the temp dirs we created")
	}
}
