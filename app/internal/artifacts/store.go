package artifacts

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Store reads and writes artifact files from a .lucidforge/features/ directory.
type Store struct {
	root string // project root containing .lucidforge/
}

// NewStore creates a Store rooted at the given project directory.
func NewStore(projectRoot string) *Store {
	return &Store{root: projectRoot}
}

func (s *Store) featuresDir() string {
	return filepath.Join(s.root, ".lucidforge", "features")
}

func (s *Store) featureDir(id string) string {
	return filepath.Join(s.featuresDir(), id)
}

// ListFeatures returns all reviewable features (user-review, approved, cancelled).
func (s *Store) ListFeatures() ([]Feature, error) {
	dir := s.featuresDir()
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("reading features directory: %w", err)
	}

	var features []Feature
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		f, err := s.LoadFeature(entry.Name())
		if err != nil {
			continue // skip unreadable features
		}
		features = append(features, *f)
	}
	return features, nil
}

// LoadFeature reads and parses feature.json for the given feature ID.
func (s *Store) LoadFeature(id string) (*Feature, error) {
	data, err := os.ReadFile(filepath.Join(s.featureDir(id), "feature.json"))
	if err != nil {
		return nil, fmt.Errorf("reading feature.json: %w", err)
	}
	var f Feature
	if err := json.Unmarshal(data, &f); err != nil {
		return nil, fmt.Errorf("parsing feature.json: %w", err)
	}
	return &f, nil
}

// LoadDiscovery reads the discovery.md file as a raw string.
func (s *Store) LoadDiscovery(featureID string) (string, error) {
	return s.readMarkdown(featureID, "discovery.md")
}

// LoadUxDesign reads the ux.md file as a raw string. Returns empty string if not present.
func (s *Store) LoadUxDesign(featureID string) (string, error) {
	content, err := s.readMarkdown(featureID, "ux.md")
	if err != nil && os.IsNotExist(err) {
		return "", nil
	}
	return content, err
}

// ListMockups returns filenames in the mockups/ directory.
func (s *Store) ListMockups(featureID string) ([]string, error) {
	dir := filepath.Join(s.featureDir(featureID), "mockups")
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("reading mockups directory: %w", err)
	}
	var names []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".html") {
			names = append(names, entry.Name())
		}
	}
	return names, nil
}

// LoadPlan reads the plan.md file as a raw string.
// Returns an empty string (no error) if the file does not exist yet.
func (s *Store) LoadPlan(featureID string) (string, error) {
	content, err := s.readMarkdown(featureID, "plan.md")
	if err != nil && os.IsNotExist(err) {
		return "", nil
	}
	return content, err
}

// LoadSteps reads all step JSON files for a feature, sorted by order.
func (s *Store) LoadSteps(featureID string) ([]Step, error) {
	dir := filepath.Join(s.featureDir(featureID), "steps")
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("reading steps directory: %w", err)
	}

	var steps []Step
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(dir, entry.Name()))
		if err != nil {
			continue
		}
		var step Step
		if err := json.Unmarshal(data, &step); err != nil {
			continue
		}
		steps = append(steps, step)
	}

	sort.Slice(steps, func(i, j int) bool {
		return steps[i].Order < steps[j].Order
	})
	return steps, nil
}

// LoadStep reads a single step artifact by order number.
func (s *Store) LoadStep(featureID string, order int) (*Step, error) {
	steps, err := s.LoadSteps(featureID)
	if err != nil {
		return nil, err
	}
	for i := range steps {
		if steps[i].Order == order {
			return &steps[i], nil
		}
	}
	return nil, fmt.Errorf("step %d not found for feature %s", order, featureID)
}

// LoadReview reads review.json. Returns nil if the file doesn't exist.
func (s *Store) LoadReview(featureID string) (*Review, error) {
	data, err := os.ReadFile(filepath.Join(s.featureDir(featureID), "review.json"))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("reading review.json: %w", err)
	}
	var r Review
	if err := json.Unmarshal(data, &r); err != nil {
		return nil, fmt.Errorf("parsing review.json: %w", err)
	}
	return &r, nil
}

// SaveViewedFiles updates the viewedFiles array in a step artifact file.
func (s *Store) SaveViewedFiles(featureID string, stepOrder int, files []string) error {
	dir := filepath.Join(s.featureDir(featureID), "steps")
	entries, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("reading steps directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}
		path := filepath.Join(dir, entry.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		var step Step
		if err := json.Unmarshal(data, &step); err != nil {
			continue
		}
		if step.Order != stepOrder {
			continue
		}

		step.ViewedFiles = files
		updated, err := json.MarshalIndent(step, "", "  ")
		if err != nil {
			return fmt.Errorf("marshaling step: %w", err)
		}
		return os.WriteFile(path, updated, 0644)
	}
	return fmt.Errorf("step %d not found for feature %s", stepOrder, featureID)
}

// UpdateFeatureStatus updates the status field in feature.json.
func (s *Store) UpdateFeatureStatus(featureID string, status FeatureStatus) error {
	path := filepath.Join(s.featureDir(featureID), "feature.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("reading feature.json: %w", err)
	}
	var f Feature
	if err := json.Unmarshal(data, &f); err != nil {
		return fmt.Errorf("parsing feature.json: %w", err)
	}
	f.Status = status
	updated, err := json.MarshalIndent(f, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling feature: %w", err)
	}
	return os.WriteFile(path, updated, 0644)
}

// MockupPath returns the full filesystem path to a mockup HTML file.
func (s *Store) MockupPath(featureID, filename string) string {
	return filepath.Join(s.featureDir(featureID), "mockups", filename)
}

func (s *Store) readMarkdown(featureID, filename string) (string, error) {
	data, err := os.ReadFile(filepath.Join(s.featureDir(featureID), filename))
	if err != nil {
		return "", err
	}
	return string(data), nil
}
