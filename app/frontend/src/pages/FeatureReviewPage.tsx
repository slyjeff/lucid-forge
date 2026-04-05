import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFeature } from "../hooks/useFeature";
import { TabBar } from "../components/TabBar";
import { DiscoveryTab } from "../components/DiscoveryTab";
import { UxDesignTab } from "../components/UxDesignTab";
import { PlanTab } from "../components/PlanTab";
import { StepsTab } from "../components/StepsTab";
import { IssuesTab } from "../components/IssuesTab";
import { ApproveDialog } from "../components/ApproveDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ApproveFeature, CancelFeature } from "../../wailsjs/go/main/App";

export function FeatureReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { detail, loading, error } = useFeature(id);
  const [activeTab, setActiveTab] = useState("discovery");
  const [showApprove, setShowApprove] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) {
    return (
      <div style={{ padding: "var(--space-xl)", color: "var(--text-secondary)" }}>
        Loading...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: "var(--space-xl)", color: "var(--error)" }}>
        {error || "Feature not found"}
      </div>
    );
  }

  const { feature, discovery, uxDesign, plan, mockups, review } = detail;
  const isReviewable = feature.status === "user-review";

  const tabs = [
    { id: "discovery", label: "Discovery" },
    { id: "ux-design", label: "UX Design", visible: feature.hasUxDesign },
    { id: "plan", label: "Plan" },
    { id: "steps", label: "Steps" },
    { id: "issues", label: "Issues", visible: review != null && review.issues?.length > 0 },
  ];

  async function handleApprove(message: string) {
    try {
      await ApproveFeature(id!, message);
      setShowApprove(false);
      setActionError(null);
      navigate("/");
    } catch (err) {
      setActionError(String(err));
    }
  }

  async function handleCancel() {
    try {
      await CancelFeature(id!);
      setShowCancel(false);
      setActionError(null);
      navigate("/");
    } catch (err) {
      setActionError(String(err));
    }
  }

  function renderTabContent() {
    switch (activeTab) {
      case "discovery":
        return <DiscoveryTab content={discovery} />;
      case "ux-design":
        return (
          <UxDesignTab
            content={uxDesign}
            featureId={id!}
            mockups={mockups}
          />
        );
      case "plan":
        return <PlanTab content={plan} />;
      case "steps":
        return <StepsTab featureId={id!} />;
      case "issues":
        return <IssuesTab review={review} />;
      default:
        return null;
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: "var(--space-lg) var(--space-xl)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-lg)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "var(--title)",
            padding: "0 var(--space-sm)",
          }}
        >
          &larr;
        </button>
        <span
          style={{
            fontSize: "var(--title-lg)",
            fontWeight: "var(--weight-bold)",
            flex: 1,
          }}
        >
          {feature.name}
        </span>
        <span style={{ fontSize: "var(--label)", color: "var(--text-dim)" }}>
          ${feature.usage?.totalCostUsd?.toFixed(2) ?? "0.00"}
        </span>
      </div>

      {/* Tab Bar */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: "auto" }}>{renderTabContent()}</div>

      {/* Footer */}
      {isReviewable && (
        <div
          style={{
            padding: "var(--space-lg) var(--space-xl)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "var(--space-md)",
          }}
        >
          {actionError && (
            <span style={{ color: "var(--error)", fontSize: "var(--label)", flex: 1 }}>
              {actionError}
            </span>
          )}
          <button
            onClick={() => setShowCancel(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--error)",
              padding: "6px 10px",
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--body)",
            }}
          >
            Cancel Feature
          </button>
          <button
            onClick={() => setShowApprove(true)}
            style={{
              background: "var(--success)",
              border: "none",
              color: "white",
              padding: "6px 16px",
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--body)",
              fontWeight: "var(--weight-semibold)",
            }}
          >
            Approve
          </button>
        </div>
      )}

      {/* Dialogs */}
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
