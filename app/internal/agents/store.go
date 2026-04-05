package agents

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Store manages LucidForge agent files in a .claude/agents/ directory.
type Store struct {
	dir string
}

// NewStore creates a Store for the given .claude/agents/ directory.
func NewStore(agentsDir string) *Store {
	return &Store{dir: agentsDir}
}

// ListAgents returns all agents with lucidforge: true.
func (s *Store) ListAgents() ([]Agent, error) {
	entries, err := os.ReadDir(s.dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("reading agents directory: %w", err)
	}

	var agents []Agent
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".md") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(s.dir, entry.Name()))
		if err != nil {
			continue
		}
		agent, err := ParseAgentFile(string(data), entry.Name())
		if err != nil {
			continue
		}
		if agent.LucidForge {
			agents = append(agents, *agent)
		}
	}
	return agents, nil
}

// LoadAgent finds and returns an agent by name.
func (s *Store) LoadAgent(name string) (*Agent, error) {
	agents, err := s.ListAgents()
	if err != nil {
		return nil, err
	}
	for i := range agents {
		if agents[i].Name == name {
			return &agents[i], nil
		}
	}
	return nil, fmt.Errorf("agent %q not found", name)
}

// SaveAgent writes an agent back to its file.
func (s *Store) SaveAgent(agent Agent) error {
	if agent.Filename == "" {
		return fmt.Errorf("agent has no filename")
	}
	content := SerializeAgent(&agent)
	return os.WriteFile(filepath.Join(s.dir, agent.Filename), []byte(content), 0644)
}

// CreateAgent creates a new agent file.
func (s *Store) CreateAgent(agent Agent) error {
	if agent.Filename == "" {
		agent.Filename = toFilename(agent.Name)
	}
	path := filepath.Join(s.dir, agent.Filename)
	if _, err := os.Stat(path); err == nil {
		return fmt.Errorf("agent file %s already exists", agent.Filename)
	}
	if err := os.MkdirAll(s.dir, 0755); err != nil {
		return fmt.Errorf("creating agents directory: %w", err)
	}
	agent.LucidForge = true
	content := SerializeAgent(&agent)
	return os.WriteFile(path, []byte(content), 0644)
}

// DeleteAgent removes an agent file. Refuses to delete the General agent.
func (s *Store) DeleteAgent(name string) error {
	if strings.EqualFold(name, "general") {
		return fmt.Errorf("cannot delete the General agent")
	}
	agent, err := s.LoadAgent(name)
	if err != nil {
		return err
	}
	return os.Remove(filepath.Join(s.dir, agent.Filename))
}

// MergeAgents merges source into target: appends directories (deduped),
// instructions, and learnings. Then deletes the source.
func (s *Store) MergeAgents(sourceName, targetName string) error {
	source, err := s.LoadAgent(sourceName)
	if err != nil {
		return fmt.Errorf("loading source agent: %w", err)
	}
	target, err := s.LoadAgent(targetName)
	if err != nil {
		return fmt.Errorf("loading target agent: %w", err)
	}

	// Merge directories (dedup)
	existing := make(map[string]bool)
	for _, d := range target.Directories {
		existing[d] = true
	}
	for _, d := range source.Directories {
		if !existing[d] {
			target.Directories = append(target.Directories, d)
		}
	}

	// Merge instructions
	if source.Instructions != "" {
		if target.Instructions != "" {
			target.Instructions += "\n\n" + source.Instructions
		} else {
			target.Instructions = source.Instructions
		}
	}

	// Merge learnings
	if source.Learnings != "" {
		if target.Learnings != "" {
			target.Learnings += "\n\n" + source.Learnings
		} else {
			target.Learnings = source.Learnings
		}
	}

	if err := s.SaveAgent(*target); err != nil {
		return fmt.Errorf("saving target agent: %w", err)
	}
	return s.DeleteAgent(sourceName)
}

func toFilename(name string) string {
	lower := strings.ToLower(name)
	kebab := strings.ReplaceAll(lower, " ", "-")
	return "lf-" + kebab + ".md"
}
