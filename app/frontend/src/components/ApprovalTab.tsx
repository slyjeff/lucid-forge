import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApproveDialog } from "./ApproveDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { ApproveFeature, CancelFeature } from "../../wailsjs/go/main/App";
import type { Feature } from "../types";

interface ApprovalTabProps {
  feature: Feature;
  featureId: string;
}

export function ApprovalTab({ feature, featureId }: ApprovalTabProps) {
  const navigate = useNavigate();
  const [showApprove, setShowApprove] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isReviewable = feature.status === "user-review";

  async function handleApprove(message: string) {
    try {
      await ApproveFeature(featureId, message);
      setShowApprove(false);
      setActionError(null);
      navigate("/");
    } catch (err) {
      setActionError(String(err));
    }
  }

  async function handleCancel() {
    try {
      await CancelFeature(featureId);
      setShowCancel(false);
      setActionError(null);
      navigate("/");
    } catch (err) {
      setActionError(String(err));
    }
  }

  return (
    <div style={{ padding: "var(--space-xl)", maxWidth: 600 }}>
      <h3
        style={{
          fontSize: "var(--title)",
          fontWeight: "var(--weight-semibold)",
          marginBottom: "var(--space-lg)",
        }}
      >
        Approval
      </h3>

      {!isReviewable ? (
        <p style={{ color: "var(--text-secondary)" }}>
          This feature is <strong>{feature.status}</strong> and cannot be
          approved or cancelled.
        </p>
      ) : (
        <>
          <p
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-xl)",
              lineHeight: 1.6,
            }}
          >
            Approving will commit all changed files to the current branch.
            Cancelling will mark the feature as cancelled — the code changes
            remain on the working branch but will not be committed.
          </p>

          {actionError && (
            <div
              style={{
                color: "var(--error)",
                background: "var(--error-subtle)",
                padding: "var(--space-md) var(--space-lg)",
                borderRadius: "var(--radius)",
                marginBottom: "var(--space-lg)",
                fontSize: "var(--body)",
              }}
            >
              {actionError}
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-md)" }}>
            <button
              onClick={() => setShowApprove(true)}
              style={{
                background: "var(--success)",
                border: "none",
                color: "white",
                padding: "8px 20px",
                cursor: "pointer",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--body)",
                fontWeight: "var(--weight-semibold)",
              }}
            >
              Approve & Commit
            </button>
            <button
              onClick={() => setShowCancel(true)}
              style={{
                background: "transparent",
                border: "1px solid var(--error)",
                color: "var(--error)",
                padding: "8px 20px",
                cursor: "pointer",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--body)",
              }}
            >
              Cancel Feature
            </button>
          </div>
        </>
      )}

      <ApproveDialog
        open={showApprove}
        featureName={feature.name}
        onClose={() => setShowApprove(false)}
        onApprove={handleApprove}
      />
      <ConfirmDialog
        open={showCancel}
        title="Cancel Feature"
        message="This will mark the feature as cancelled. The code changes will remain on the working branch but will not be committed."
        confirmLabel="Cancel Feature"
        danger
        onClose={() => setShowCancel(false)}
        onConfirm={handleCancel}
      />
    </div>
  );
}
