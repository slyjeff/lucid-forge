import type { Step } from "../types";

interface StepSidebarProps {
  steps: Step[];
  selectedOrder: number;
  onSelect: (order: number) => void;
}

function viewedCount(step: Step): string {
  const total = step.changeMap?.files?.length ?? 0;
  const viewed = step.viewedFiles?.length ?? 0;
  return `${viewed}/${total}`;
}

function statusIndicator(step: Step): { color: string; symbol: string } {
  switch (step.status) {
    case "completed":
      return { color: "var(--success)", symbol: "\u25CF" }; // filled circle
    case "failed":
      return { color: "var(--error)", symbol: "\u25CF" };
    case "executing":
      return { color: "var(--accent)", symbol: "\u25CB" }; // empty circle
    default:
      return { color: "var(--text-dim)", symbol: "\u25CB" };
  }
}

export function StepSidebar({ steps, selectedOrder, onSelect }: StepSidebarProps) {
  return (
    <div
      style={{
        width: 220,
        minWidth: 180,
        borderRight: "1px solid var(--border)",
        overflow: "auto",
        background: "var(--surface)",
      }}
    >
      {steps.map((step) => {
        const active = step.order === selectedOrder;
        const indicator = statusIndicator(step);

        return (
          <div
            key={step.order}
            onClick={() => onSelect(step.order)}
            style={{
              padding: "var(--space-md) var(--space-lg)",
              cursor: "pointer",
              background: active ? "var(--card)" : "transparent",
              borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "background 100ms ease",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = "var(--card)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                marginBottom: "var(--space-xs)",
              }}
            >
              <span style={{ color: indicator.color, fontSize: 10 }}>
                {indicator.symbol}
              </span>
              <span
                style={{
                  fontSize: "var(--body)",
                  fontWeight: active ? "var(--weight-semibold)" : "var(--weight-normal)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {step.title}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "var(--label)",
                color: "var(--text-dim)",
                paddingLeft: 18,
              }}
            >
              <span>{step.agent}</span>
              <span>{viewedCount(step)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
