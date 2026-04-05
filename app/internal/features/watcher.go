package features

import (
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

// Watcher monitors .lucidforge/features/ for changes and calls a callback.
type Watcher struct {
	fsWatcher *fsnotify.Watcher
	onChange  func()
	stop      chan struct{}
	done      chan struct{}
	mu        sync.Mutex
}

// NewWatcher creates a file watcher for the given project root.
// The onChange callback fires when files in .lucidforge/features/ change,
// debounced to avoid rapid-fire events.
func NewWatcher(projectRoot string, onChange func()) (*Watcher, error) {
	fsw, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	w := &Watcher{
		fsWatcher: fsw,
		onChange:  onChange,
		stop:      make(chan struct{}),
		done:      make(chan struct{}),
	}

	featuresDir := filepath.Join(projectRoot, ".lucidforge", "features")
	addDirRecursive(fsw, featuresDir)

	go w.loop()
	return w, nil
}

// Close stops the watcher.
func (w *Watcher) Close() {
	close(w.stop)
	<-w.done
	w.fsWatcher.Close()
}

func (w *Watcher) loop() {
	defer close(w.done)

	var debounceTimer *time.Timer
	const debounceDelay = 100 * time.Millisecond

	for {
		select {
		case <-w.stop:
			if debounceTimer != nil {
				debounceTimer.Stop()
			}
			return

		case event, ok := <-w.fsWatcher.Events:
			if !ok {
				return
			}
			// Watch new subdirectories as they're created
			if event.Op&fsnotify.Create != 0 {
				info, err := os.Stat(event.Name)
				if err == nil && info.IsDir() {
					addDirRecursive(w.fsWatcher, event.Name)
				}
			}
			// Debounce: reset timer on each event
			if debounceTimer != nil {
				debounceTimer.Stop()
			}
			debounceTimer = time.AfterFunc(debounceDelay, func() {
				w.mu.Lock()
				defer w.mu.Unlock()
				w.onChange()
			})

		case _, ok := <-w.fsWatcher.Errors:
			if !ok {
				return
			}
		}
	}
}

// addDirRecursive adds a directory and all its subdirectories to the watcher.
func addDirRecursive(fsw *fsnotify.Watcher, dir string) {
	filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			fsw.Add(path)
		}
		return nil
	})
}
