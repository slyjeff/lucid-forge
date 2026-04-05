import { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({ open, onClose, children }: DialogProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--elevated)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-2xl)",
          padding: "var(--space-2xl)",
          minWidth: 400,
          maxWidth: 560,
        }}
      >
        {children}
      </div>
    </div>
  );
}
