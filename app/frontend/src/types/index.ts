// Re-export Wails-generated types with convenience aliases and constants.
export { artifacts, agents, git } from "../../wailsjs/go/models";

export type Feature = import("../../wailsjs/go/models").artifacts.Feature;
export type Step = import("../../wailsjs/go/models").artifacts.Step;
export type ChangeMap = import("../../wailsjs/go/models").artifacts.ChangeMap;
export type ChangeMapFile = import("../../wailsjs/go/models").artifacts.ChangeMapFile;
export type Connection = import("../../wailsjs/go/models").artifacts.Connection;
export type Member = import("../../wailsjs/go/models").artifacts.Member;
export type Task = import("../../wailsjs/go/models").artifacts.Task;
export type Validation = import("../../wailsjs/go/models").artifacts.Validation;
export type Pattern = import("../../wailsjs/go/models").artifacts.Pattern;
export type Review = import("../../wailsjs/go/models").artifacts.Review;
export type Issue = import("../../wailsjs/go/models").artifacts.Issue;
export type FeatureUsage = import("../../wailsjs/go/models").artifacts.FeatureUsage;
export type PhaseUsage = import("../../wailsjs/go/models").artifacts.PhaseUsage;
export type StepUsage = import("../../wailsjs/go/models").artifacts.StepUsage;
export type Agent = import("../../wailsjs/go/models").agents.Agent;
export type FileDiff = import("../../wailsjs/go/models").git.FileDiff;

export type FeatureStatus =
  | "discovery"
  | "planning"
  | "executing"
  | "code-review"
  | "user-review"
  | "approved"
  | "cancelled";

export type StepStatus = "pending" | "executing" | "completed" | "failed";

export type IssueSeverity = "error" | "warning" | "info";

export type FileCategory = "add" | "modify" | "delete";
