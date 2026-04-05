import { useState } from "react";

interface FileReasoningProps {
  reasoning: string;
  category?: string;
}

function actionLabel(category?: string): string {
  switch (category) {
    case "add": return "Why this file was added";
    case "delete": return "Why this file was deleted";
    default: return "Why this file changed";
  }
}

export function FileReasoning({ reasoning, category }: FileReasoningProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: "var(--text-secondary)",
          padding: "var(--space-sm) var(--space-lg)",
          cursor: "pointer",
          textAlign: "left",
          fontSize: "var(--label)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
        }}
      >
        <span style={{ fontSize: 10 }}>{expanded ? "\u25BC" : "\u25B6"}</span>
        {actionLabel(category)}
      </button>
      {expanded && (
        <div
          style={{
            padding: "0 var(--space-lg) var(--space-md)",
            fontSize: "var(--body)",
            lineHeight: 1.5,
            color: "var(--text-primary)",
          }}
        >
          {reasoning}
        </div>
      )}
    </div>
  );
}
