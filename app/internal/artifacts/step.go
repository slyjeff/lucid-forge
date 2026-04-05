package artifacts

type StepStatus string

const (
	StepPending   StepStatus = "pending"
	StepExecuting StepStatus = "executing"
	StepCompleted StepStatus = "completed"
	StepFailed    StepStatus = "failed"
)

type Step struct {
	Order         int        `json:"order"`
	Agent         string     `json:"agent"`
	Title         string     `json:"title"`
	Status        StepStatus `json:"status"`
	Tasks         []Task     `json:"tasks"`
	Validation    Validation `json:"validation"`
	ChangeMap     ChangeMap  `json:"changeMap"`
	Patterns      []Pattern  `json:"patterns"`
	ChangeSummary string     `json:"changeSummary"`
	Usage         StepUsage  `json:"usage"`
	ViewedFiles   []string   `json:"viewedFiles"`
}

type Task struct {
	Description string `json:"description"`
	Completed   bool   `json:"completed"`
}

type Validation struct {
	Passed  bool `json:"passed"`
	Retries int  `json:"retries"`
}

type ChangeMap struct {
	Files       []ChangeMapFile `json:"files"`
	Connections []Connection    `json:"connections"`
}

type ChangeMapFile struct {
	Path      string   `json:"path"`
	Category  string   `json:"category"`
	Reasoning string   `json:"reasoning"`
	Members   []Member `json:"members"`
}

type Member struct {
	Name string `json:"name"`
	Kind string `json:"kind"`
}

type Connection struct {
	From         string `json:"from"`
	To           string `json:"to"`
	Relationship string `json:"relationship"`
}

type Pattern struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type StepUsage struct {
	InputTokens  int     `json:"inputTokens"`
	OutputTokens int     `json:"outputTokens"`
	CostUsd      float64 `json:"costUsd"`
}
