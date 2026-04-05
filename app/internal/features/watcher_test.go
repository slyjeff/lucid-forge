package features

import (
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"
)

func TestWatcher_DetectsFileChange(t *testing.T) {
	// Arrange
	root := t.TempDir()
	featDir := filepath.Join(root, ".lucidforge", "features", "test-feat")
	os.MkdirAll(featDir, 0755)

	var callCount atomic.Int32
	w, err := NewWatcher(root, func() {
		callCount.Add(1)
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer w.Close()

	// Act
	os.WriteFile(filepath.Join(featDir, "feature.json"), []byte("{}"), 0644)

	// Assert — wait for debounced callback
	deadline := time.After(2 * time.Second)
	for callCount.Load() == 0 {
		select {
		case <-deadline:
			t.Fatal("timed out waiting for change callback")
		default:
			time.Sleep(10 * time.Millisecond)
		}
	}
}

func TestWatcher_DebouncesBurstOfChanges(t *testing.T) {
	// Arrange
	root := t.TempDir()
	featDir := filepath.Join(root, ".lucidforge", "features", "test-feat")
	os.MkdirAll(featDir, 0755)

	var callCount atomic.Int32
	w, err := NewWatcher(root, func() {
		callCount.Add(1)
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer w.Close()

	// Act — write multiple files rapidly
	for i := 0; i < 10; i++ {
		os.WriteFile(filepath.Join(featDir, "file.json"), []byte("{}"), 0644)
	}

	// Assert — should debounce to a small number of calls
	time.Sleep(500 * time.Millisecond)
	count := callCount.Load()
	if count > 3 {
		t.Errorf("expected debounced calls (<=3), got %d", count)
	}
	if count == 0 {
		t.Error("expected at least 1 callback")
	}
}

func TestWatcher_DetectsNewSubdirectory(t *testing.T) {
	// Arrange
	root := t.TempDir()
	os.MkdirAll(filepath.Join(root, ".lucidforge", "features"), 0755)

	var callCount atomic.Int32
	w, err := NewWatcher(root, func() {
		callCount.Add(1)
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer w.Close()

	// Act — create a new feature directory and write a file in it
	newFeat := filepath.Join(root, ".lucidforge", "features", "new-feat")
	os.MkdirAll(newFeat, 0755)
	time.Sleep(50 * time.Millisecond) // let watcher pick up new dir
	os.WriteFile(filepath.Join(newFeat, "feature.json"), []byte("{}"), 0644)

	// Assert
	deadline := time.After(2 * time.Second)
	for callCount.Load() == 0 {
		select {
		case <-deadline:
			t.Fatal("timed out waiting for change callback on new subdirectory")
		default:
			time.Sleep(10 * time.Millisecond)
		}
	}
}
