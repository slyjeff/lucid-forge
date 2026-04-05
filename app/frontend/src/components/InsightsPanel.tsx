import type { Step } from "../types";

interface InsightsPanelProps {
  step: Step;
}

export function InsightsPanel({ step }: InsightsPanelProps) {
  return (
    <div
      style={{
        padding: "var(--space-xl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-lg)",
        maxWidth: 800,
      }}
    >
      {/* Change Summary */}
      <div>
        <h3
          style={{
            fontWeight: "var(--weight-semibold)",
            marginBottom: "var(--space-md)",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontSize: "var(--label)",
          }}
        >
          Summary
        </h3>
        <p style={{ lineHeight: 1.6 }}>{step.changeSummary}</p>
      </div>

      {/* Patterns */}
      {step.patterns && step.patterns.length > 0 && (
        <div>
          <h3
            style={{
              fontWeight: "var(--weight-semibold)",
              marginBottom: "var(--space-md)",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: "var(--label)",
            }}
          >
            Patterns
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
            {step.patterns.map((p, i) => (
              <div
                key={i}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "var(--space-md) var(--space-lg)",
                }}
              >
                <span style={{ fontWeight: "var(--weight-semibold)" }}>
                  {p.name}
                </span>
                {p.description && (
                  <span style={{ color: "var(--text-secondary)" }}>
                    {" "}
                    &mdash; {p.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks */}
      {step.tasks && step.tasks.length > 0 && (
        <div>
          <h3
            style={{
              fontWeight: "var(--weight-semibold)",
              marginBottom: "var(--space-md)",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: "var(--label)",
            }}
          >
            Tasks
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            {step.tasks.map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-md)",
                  padding: "var(--space-sm) 0",
                }}
              >
                <span
                  style={{
                    color: t.completed ? "var(--success)" : "var(--text-dim)",
                    fontSize: 14,
                  }}
                >
                  {t.completed ? "\u2713" : "\u25CB"}
                </span>
                <span
                  style={{
                    color: t.completed
                      ? "var(--text-primary)"
                      : "var(--text-secondary)",
                  }}
                >
                  {t.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation */}
      <div>
        <h3
          style={{
            fontWeight: "var(--weight-semibold)",
            marginBottom: "var(--space-md)",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontSize: "var(--label)",
          }}
        >
          Validation
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <span
            style={{
              color: step.validation?.passed ? "var(--success)" : "var(--error)",
              fontWeight: "var(--weight-semibold)",
            }}
          >
            {step.validation?.passed ? "Passed" : "Failed"}
          </span>
          {step.validation?.retries > 0 && (
            <span style={{ color: "var(--text-dim)", fontSize: "var(--label)" }}>
              ({step.validation.retries} {step.validation.retries === 1 ? "retry" : "retries"})
            </span>
          )}
        </div>
      </div>

      {/* Usage */}
      <div>
        <h3
          style={{
            fontWeight: "var(--weight-semibold)",
            marginBottom: "var(--space-md)",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontSize: "var(--label)",
          }}
        >
          Usage
        </h3>
        <div
          style={{
            display: "flex",
            gap: "var(--space-xl)",
            fontSize: "var(--label)",
            color: "var(--text-dim)",
          }}
        >
          <span>
            In: {(step.usage?.inputTokens ?? 0).toLocaleString()}
          </span>
          <span>
            Out: {(step.usage?.outputTokens ?? 0).toLocaleString()}
          </span>
          <span>${(step.usage?.costUsd ?? 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
