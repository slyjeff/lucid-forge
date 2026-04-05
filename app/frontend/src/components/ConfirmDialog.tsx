import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <h2
        style={{
          fontSize: "var(--title)",
          fontWeight: "var(--weight-semibold)",
          marginBottom: "var(--space-lg)",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {message}
      </p>
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
          onClick={onConfirm}
          style={{
            background: danger ? "var(--error)" : "var(--accent)",
            border: "none",
            color: "white",
            padding: "6px 16px",
            cursor: "pointer",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--body)",
            fontWeight: "var(--weight-semibold)",
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
