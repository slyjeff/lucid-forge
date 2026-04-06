package agents

// Agent represents a parsed .claude/agents/*.md file with lucidforge: true.
type Agent struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Model        string   `json:"model"`
	LucidForge   bool     `json:"lucidforge"`
	Identity     string   `json:"identity"`
	Directories  []string `json:"directories"`
	Docs         []string `json:"docs"`
	Instructions string   `json:"instructions"`
	Learnings    string   `json:"learnings"`
	Filename     string   `json:"filename"`
}
