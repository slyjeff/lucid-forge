package artifacts

import "time"

type FeatureStatus string

const (
	StatusDiscovery  FeatureStatus = "discovery"
	StatusPlanning   FeatureStatus = "planning"
	StatusExecuting  FeatureStatus = "executing"
	StatusCodeReview FeatureStatus = "code-review"
	StatusUserReview FeatureStatus = "user-review"
	StatusApproved   FeatureStatus = "approved"
	StatusCancelled  FeatureStatus = "cancelled"
)

type Feature struct {
	SchemaVersion int           `json:"schemaVersion"`
	ID            string        `json:"id"`
	Name          string        `json:"name"`
	Description   string        `json:"description"`
	Status        FeatureStatus `json:"status"`
	SourceBranch  string        `json:"sourceBranch"`
	WorkingBranch string        `json:"workingBranch"`
	BaseCommit    string        `json:"baseCommit"`
	CreatedAt     time.Time     `json:"createdAt"`
	HasUxDesign   bool          `json:"hasUxDesign"`
	StepCount     int           `json:"stepCount"`
	Usage         FeatureUsage  `json:"usage"`
}

type FeatureUsage struct {
	Discovery    PhaseUsage `json:"discovery"`
	Planning     PhaseUsage `json:"planning"`
	Execution    PhaseUsage `json:"execution"`
	Review       PhaseUsage `json:"review"`
	TotalCostUsd float64    `json:"totalCostUsd"`
}

type PhaseUsage struct {
	InputTokens  int     `json:"inputTokens"`
	OutputTokens int     `json:"outputTokens"`
	CostUsd      float64 `json:"costUsd"`
}

// IsReviewable returns true if the feature is in a state visible to readers.
func (f *Feature) IsReviewable() bool {
	return f.Status == StatusUserReview || f.Status == StatusApproved || f.Status == StatusCancelled
}
