import { useState } from "react";
import { Dialog } from "./Dialog";

interface ApproveDialogProps {
  open: boolean;
  featureName: string;
  onClose: () => void;
  onApprove: (message: string) => void;
}

export function ApproveDialog({
  open,
  featureName,
  onClose,
  onApprove,
}: ApproveDialogProps) {
  const [message, setMessage] = useState(
    `feat: ${featureName.toLowerCase()}`
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <h2
        style={{
          fontSize: "var(--title)",
          fontWeight: "var(--weight-semibold)",
          marginBottom: "var(--space-lg)",
        }}
      >
        Approve Feature
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: "var(--space-lg)",
        }}
      >
        This will commit all changes to the source branch.
      </p>
      <label
        style={{
          fontSize: "var(--label)",
          color: "var(--text-secondary)",
          display: "block",
          marginBottom: "var(--space-sm)",
        }}
      >
        Commit message
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        style={{
          width: "100%",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "var(--space-md)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--code)",
          resize: "vertical",
          marginBottom: "var(--space-lg)",
        }}
      />
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
          onClick={() => onApprove(message)}
          disabled={!message.trim()}
          style={{
            background: "var(--success)",
            border: "none",
            color: "white",
            padding: "6px 16px",
            cursor: message.trim() ? "pointer" : "not-allowed",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--body)",
            fontWeight: "var(--weight-semibold)",
            opacity: message.trim() ? 1 : 0.5,
          }}
        >
          Approve & Commit
        </button>
      </div>
    </Dialog>
  );
}
