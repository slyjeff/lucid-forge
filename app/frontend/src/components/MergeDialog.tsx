import { useState } from "react";
import { Dialog } from "./Dialog";
import type { Agent } from "../types";

interface MergeDialogProps {
  open: boolean;
  source: Agent;
  targets: Agent[];
  onClose: () => void;
  onMerge: (targetName: string) => void;
}

export function MergeDialog({
  open,
  source,
  targets,
  onClose,
  onMerge,
}: MergeDialogProps) {
  const [selected, setSelected] = useState(targets[0]?.name ?? "");

  return (
    <Dialog open={open} onClose={onClose}>
      <h2
        style={{
          fontSize: "var(--title)",
          fontWeight: "var(--weight-semibold)",
          marginBottom: "var(--space-lg)",
        }}
      >
        Merge "{source.name}"
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: "var(--space-lg)",
        }}
      >
        Directories, instructions, and learnings will be merged into the target
        agent. "{source.name}" will be deleted.
      </p>
      <label
        style={{
          fontSize: "var(--label)",
          color: "var(--text-secondary)",
          display: "block",
          marginBottom: "var(--space-sm)",
        }}
      >
        Merge into
      </label>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        style={{
          width: "100%",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "var(--space-md)",
          color: "var(--text-primary)",
          fontSize: "var(--body)",
          marginBottom: "var(--space-lg)",
        }}
      >
        {targets.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-md)" }}>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            padding: "6px 10px",
            cursor: "pointer",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--body)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onMerge(selected)}
          disabled={!selected}
          style={{
            background: "var(--accent)",
            border: "none",
            color: "white",
            padding: "6px 16px",
            cursor: "pointer",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--body)",
            fontWeight: "var(--weight-semibold)",
          }}
        >
          Merge
        </button>
      </div>
    </Dialog>
  );
}
