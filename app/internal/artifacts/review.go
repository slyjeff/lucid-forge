package artifacts

type Review struct {
	Issues []Issue    `json:"issues"`
	Usage  StepUsage  `json:"usage"`
}

type IssueSeverity string

const (
	SeverityError   IssueSeverity = "error"
	SeverityWarning IssueSeverity = "warning"
	SeverityInfo    IssueSeverity = "info"
)

type Issue struct {
	Severity    IssueSeverity `json:"severity"`
	Step        int           `json:"step"`
	Agent       string        `json:"agent"`
	File        string        `json:"file"`
	Description string        `json:"description"`
	Fixed       bool          `json:"fixed"`
}
