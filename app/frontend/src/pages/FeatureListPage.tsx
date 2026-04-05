import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFeatures } from "../hooks/useFeatures";
import { GetProjectRoot, SelectProjectRoot, ApproveFeature, CancelFeature } from "../../wailsjs/go/main/App";
import { ApproveDialog } from "../components/ApproveDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import logo from "../assets/lucidforge-logo.png";
import type { Feature } from "../types";

function statusColor(status: string): string {
  switch (status) {
    case "user-review":
      return "var(--accent)";
    case "approved":
      return "var(--success)";
    case "cancelled":
      return "var(--error)";
    default:
      return "var(--text-secondary)";
  }
}

const iconBtnBase: React.CSSProperties = {
  background: "transparent",
  border: "1px solid transparent",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: "var(--radius-md)",
  fontSize: 16,
  lineHeight: 1,
  transition: "background 150ms ease, border-color 150ms ease",
};

interface FeatureCardProps {
  feature: Feature;
  onApprove: (feature: Feature) => void;
  onCancel: (feature: Feature) => void;
}

function FeatureCard({ feature, onApprove, onCancel }: FeatureCardProps) {
  const navigate = useNavigate();
  const isReviewable = feature.status === "user-review";

  return (
    <div
      onClick={() => navigate(`/feature/${feature.id}`)}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-xl)",
        cursor: "pointer",
        transition: "var(--transition-card)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--card-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--card)")
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-md)",
          marginBottom: "var(--space-md)",
        }}
      >
        <span
          style={{
            fontSize: "var(--title)",
            fontWeight: "var(--weight-semibold)",
            flex: 1,
          }}
        >
          {feature.name}
        </span>
        <span
          style={{
            fontSize: "var(--label)",
            fontWeight: "var(--weight-bold)",
            color: statusColor(feature.status),
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "3px 8px",
          }}
        >
          {feature.status}
        </span>
        {isReviewable && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", gap: "var(--space-xs)" }}
          >
            <button
              onClick={() => onApprove(feature)}
              style={{ ...iconBtnBase, color: "var(--success)" }}
              title="Commit feature"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--success-subtle)";
                e.currentTarget.style.borderColor = "var(--success)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              &#x2714;
            </button>
            <button
              onClick={() => onCancel(feature)}
              style={{ ...iconBtnBase, color: "var(--error)" }}
              title="Cancel feature"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--error-subtle)";
                e.currentTarget.style.borderColor = "var(--error)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              &#x2716;
            </button>
          </div>
        )}
      </div>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "var(--body)",
          marginBottom: "var(--space-md)",
        }}
      >
        {feature.description}
      </p>
      <div
        style={{
          display: "flex",
          gap: "var(--space-lg)",
          fontSize: "var(--label)",
          color: "var(--text-dim)",
        }}
      >
        <span>{feature.stepCount} steps</span>
      </div>
    </div>
  );
}

export function FeatureListPage() {
  const { features, loading, refetch } = useFeatures();
  const navigate = useNavigate();
  const [projectRoot, setProjectRoot] = useState("");
  const [approving, setApproving] = useState<Feature | null>(null);
  const [cancelling, setCancelling] = useState<Feature | null>(null);

  useEffect(() => {
    GetProjectRoot().then(setProjectRoot);
  }, []);

  async function handleSelectProject() {
    const root = await SelectProjectRoot();
    setProjectRoot(root);
    refetch();
  }

  async function handleApprove(message: string) {
    if (approving) {
      await ApproveFeature(approving.id, message);
      setApproving(null);
      refetch();
    }
  }

  async function handleCancel() {
    if (cancelling) {
      await CancelFeature(cancelling.id);
      setCancelling(null);
      refetch();
    }
  }

  return (
    <div style={{ position: "relative", height: "100%", overflow: "auto" }}>
      <img
        src={logo}
        alt=""
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 300,
          opacity: 0.06,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      <div style={{ position: "relative", padding: "var(--space-xl)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            marginBottom: "var(--space-lg)",
          }}
        >
          <button
            onClick={handleSelectProject}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--label)",
              fontFamily: "var(--font-mono)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 400,
            }}
            title={projectRoot}
          >
            {projectRoot || "Select project..."}
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate("/agents")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--body)",
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
            Agents
          </button>
        </div>
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
        ) : features.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No features yet.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            {features.map((f) => (
              <FeatureCard
                key={f.id}
                feature={f}
                onApprove={setApproving}
                onCancel={setCancelling}
              />
            ))}
          </div>
        )}
      </div>

      {approving && (
        <ApproveDialog
          open={true}
          featureName={approving.name}
          onClose={() => setApproving(null)}
          onApprove={handleApprove}
        />
      )}
      {cancelling && (
        <ConfirmDialog
          open={true}
          title="Cancel Feature"
          message={`Cancel "${cancelling.name}"? Code changes remain on the working branch but will not be committed.`}
          confirmLabel="Cancel Feature"
          danger
          onClose={() => setCancelling(null)}
          onConfirm={handleCancel}
        />
      )}
    </div>
  );
}
