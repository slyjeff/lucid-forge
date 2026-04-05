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


    </div>
  );
}
