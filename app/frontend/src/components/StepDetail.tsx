import { useState } from "react";
import { TabBar } from "./TabBar";
import { InsightsPanel } from "./InsightsPanel";
import { DiffTab } from "./DiffTab";
import { ChangeMapView } from "./ChangeMapView";
import type { Step } from "../types";

interface StepDetailProps {
  step: Step;
  featureId: string;
}

export function StepDetail({ step, featureId }: StepDetailProps) {
  const [subTab, setSubTab] = useState("insights");

  const subTabs = [
    { id: "insights", label: "Insights" },
    { id: "diff", label: "Diff" },
    { id: "map", label: "Map" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Step header */}
      <div
        style={{
          padding: "var(--space-md) var(--space-lg)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-md)",
        }}
      >
        <span
          style={{
            fontSize: "var(--title)",
            fontWeight: "var(--weight-semibold)",
          }}
        >
          {step.title}
        </span>
        <span
          style={{
            fontSize: "var(--label)",
            color: "var(--info)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "3px 8px",
          }}
        >
          {step.agent}
        </span>
      </div>

      {/* Sub-tab bar */}
      <TabBar tabs={subTabs} activeTab={subTab} onTabChange={setSubTab} />

      {/* Sub-tab content */}
      <div style={{ flex: 1, minHeight: 0, overflow: subTab === "diff" ? "hidden" : "auto" }}>
        {subTab === "insights" && <InsightsPanel step={step} />}
        {subTab === "diff" && <DiffTab step={step} featureId={featureId} />}
        {subTab === "map" && <ChangeMapView step={step} />}
      </div>
    </div>
  );
}
