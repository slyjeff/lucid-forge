package agents

import (
	"fmt"
	"strings"

	"gopkg.in/yaml.v3"
)

type frontmatter struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
	Model       string `yaml:"model"`
	LucidForge  bool   `yaml:"lucidforge"`
}

// ParseAgentFile parses a .claude/agents/*.md file into an Agent struct.
// Format: YAML frontmatter (---) followed by identity text, then ## sections.
func ParseAgentFile(content string, filename string) (*Agent, error) {
	fm, body, err := splitFrontmatter(content)
	if err != nil {
		return nil, err
	}

	var meta frontmatter
	if err := yaml.Unmarshal([]byte(fm), &meta); err != nil {
		return nil, fmt.Errorf("parsing frontmatter: %w", err)
	}

	agent := &Agent{
		Name:        meta.Name,
		Description: meta.Description,
		Model:       meta.Model,
		LucidForge:  meta.LucidForge,
		Filename:    filename,
	}

	sections := parseSections(body)
	agent.Identity = strings.TrimSpace(sections["_identity"])
	agent.Directories = parseList(sections["Directories"])
	agent.Instructions = strings.TrimSpace(sections["Instructions"])
	agent.Learnings = strings.TrimSpace(sections["Learnings"])

	return agent, nil
}

// SerializeAgent converts an Agent back to the .md file format.
func SerializeAgent(agent *Agent) string {
	var b strings.Builder

	b.WriteString("---\n")
	b.WriteString(fmt.Sprintf("name: %s\n", agent.Name))
	if agent.Description != "" {
		b.WriteString(fmt.Sprintf("description: %s\n", agent.Description))
	}
	b.WriteString(fmt.Sprintf("model: %s\n", agent.Model))
	b.WriteString("lucidforge: true\n")
	b.WriteString("---\n\n")

	if agent.Identity != "" {
		b.WriteString(agent.Identity)
		b.WriteString("\n\n")
	}

	b.WriteString("## Directories\n\n")
	for _, dir := range agent.Directories {
		b.WriteString(fmt.Sprintf("- %s\n", dir))
	}
	b.WriteString("\n")

	b.WriteString("## Instructions\n\n")
	if agent.Instructions != "" {
		b.WriteString(agent.Instructions)
		b.WriteString("\n")
	}
	b.WriteString("\n")

	b.WriteString("## Learnings\n\n")
	if agent.Learnings != "" {
		b.WriteString(agent.Learnings)
		b.WriteString("\n")
	}

	return b.String()
}

func splitFrontmatter(content string) (string, string, error) {
	if !strings.HasPrefix(content, "---") {
		return "", "", fmt.Errorf("missing frontmatter delimiter")
	}
	rest := content[3:]
	idx := strings.Index(rest, "\n---")
	if idx < 0 {
		return "", "", fmt.Errorf("missing closing frontmatter delimiter")
	}
	fm := strings.TrimSpace(rest[:idx])
	body := strings.TrimLeft(rest[idx+4:], "\r\n")
	return fm, body, nil
}

// parseSections splits body text into sections by ## headings.
// Text before the first ## heading goes into "_identity".
func parseSections(body string) map[string]string {
	sections := make(map[string]string)
	lines := strings.Split(body, "\n")

	currentSection := "_identity"
	var buf []string

	for _, line := range lines {
		if strings.HasPrefix(line, "## ") {
			sections[currentSection] = strings.Join(buf, "\n")
			currentSection = strings.TrimPrefix(line, "## ")
			buf = nil
		} else {
			buf = append(buf, line)
		}
	}
	sections[currentSection] = strings.Join(buf, "\n")

	return sections
}

// parseList extracts bulleted list items from a section body.
func parseList(section string) []string {
	var items []string
	for _, line := range strings.Split(section, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "- ") {
			items = append(items, strings.TrimPrefix(line, "- "))
		}
	}
	return items
}
