import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFeature } from "../hooks/useFeature";
import { TabBar } from "../components/TabBar";
import { DiscoveryTab } from "../components/DiscoveryTab";
import { UxDesignTab } from "../components/UxDesignTab";
import { PlanTab } from "../components/PlanTab";
import { StepsTab } from "../components/StepsTab";
import { IssuesTab } from "../components/IssuesTab";
import { ApprovalTab } from "../components/ApprovalTab";

export function FeatureReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { detail, loading, error } = useFeature(id);
  const [activeTab, setActiveTab] = useState("discovery");

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
  const hasSteps = feature.stepCount > 0;

  const tabs = [
    { id: "discovery", label: "Discovery" },
    { id: "ux-design", label: "UX Design", visible: feature.hasUxDesign },
    { id: "plan", label: "Plan" },
    { id: "steps", label: "Steps", visible: hasSteps },
    { id: "issues", label: "Issues", visible: review != null && review.issues?.length > 0 },
    { id: "approval", label: "Approval", visible: hasSteps },
  ];

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
      case "approval":
        return <ApprovalTab feature={feature} featureId={id!} />;
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
      <div style={{ flex: 1, minHeight: 0, overflow: activeTab === "steps" ? "hidden" : "auto" }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
