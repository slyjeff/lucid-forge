import { useState } from "react";
import { Dialog } from "./Dialog";

interface ProjectSwitcherDialogProps {
  open: boolean;
  recentRoots: string[];
  onSelect: (root: string) => void;
  onBrowse: () => void;
  onClose: () => void;
}

export function ProjectSwitcherDialog({
  open,
  recentRoots,
  onSelect,
  onBrowse,
  onClose,
}: ProjectSwitcherDialogProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  function shortPath(root: string): string {
    // Show last 2–3 path segments for readability
    const sep = root.includes("\\") ? "\\" : "/";
    const parts = root.split(sep).filter(Boolean);
    if (parts.length <= 3) return root;
    return sep + "..." + sep + parts.slice(-2).join(sep);
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        <div
          style={{
            fontSize: "var(--label)",
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "var(--space-xs)",
          }}
        >
          Recent Projects
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
          {recentRoots.map((root, i) => (
            <button
              key={root}
              onClick={() => onSelect(root)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              title={root}
              style={{
                background: hoveredIndex === i ? "var(--card)" : "transparent",
                border: "1px solid",
                borderColor: hoveredIndex === i ? "var(--border)" : "transparent",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                cursor: "pointer",
                padding: "8px 12px",
                textAlign: "left",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--label)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "background 120ms ease, border-color 120ms ease",
              }}
            >
              {shortPath(root)}
            </button>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "var(--space-md)",
            marginTop: "var(--space-xs)",
          }}
        >
          <button
            onClick={onBrowse}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "8px 14px",
              fontSize: "var(--body)",
              width: "100%",
              transition: "background 120ms ease, color 120ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--card)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Browse...
          </button>
        </div>
      </div>
    </Dialog>
  );
}
