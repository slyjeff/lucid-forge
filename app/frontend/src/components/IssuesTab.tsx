import type { Review } from "../types";

interface IssuesTabProps {
  review: Review | null;
}

function severityColor(severity: string): string {
  switch (severity) {
    case "error":
      return "var(--error)";
    case "warning":
      return "var(--warning)";
    case "info":
      return "var(--info)";
    default:
      return "var(--text-secondary)";
  }
}

function severityBg(severity: string): string {
  switch (severity) {
    case "error":
      return "var(--error-subtle)";
    case "warning":
      return "var(--warning-subtle)";
    case "info":
      return "var(--info-subtle)";
    default:
      return "var(--surface)";
  }
}

export function IssuesTab({ review }: IssuesTabProps) {
  if (!review || review.issues.length === 0) {
    return (
      <p style={{ color: "var(--text-secondary)", padding: "var(--space-xl)" }}>
        No issues found.
      </p>
    );
  }

  return (
    <div
      style={{
        padding: "var(--space-xl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
        maxWidth: 800,
      }}
    >
      {review.issues.map((issue, i) => (
        <div
          key={i}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-md)",
              marginBottom: "var(--space-md)",
            }}
          >
            <span
              style={{
                fontSize: "var(--label)",
                fontWeight: "var(--weight-bold)",
                color: severityColor(issue.severity),
                background: severityBg(issue.severity),
                borderRadius: "var(--radius-xl)",
                padding: "3px 8px",
                textTransform: "uppercase",
              }}
            >
              {issue.severity}
            </span>
            <span
              style={{
                fontSize: "var(--label)",
                color: "var(--text-dim)",
              }}
            >
              Step {issue.step} &middot; {issue.agent}
            </span>
            {issue.fixed && (
              <span
                style={{
                  fontSize: "var(--label)",
                  color: "var(--success)",
                  fontWeight: "var(--weight-bold)",
                }}
              >
                Fixed
              </span>
            )}
          </div>
          <p style={{ marginBottom: "var(--space-sm)" }}>{issue.description}</p>
          <span
            style={{
              fontSize: "var(--code)",
              fontFamily: "var(--font-mono)",
              color: "var(--info)",
            }}
          >
            {issue.file}
          </span>
        </div>
      ))}
    </div>
  );
}
