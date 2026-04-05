import { TabBar } from "./TabBar";
import { InsightsPanel } from "./InsightsPanel";
import { DiffTab } from "./DiffTab";
import { ChangeMapView } from "./ChangeMapView";
import type { Step } from "../types";

interface StepDetailProps {
  step: Step;
  steps: Step[];
  featureId: string;
  subTab: string;
  onSubTabChange: (tab: string) => void;
  onStepChange: (order: number) => void;
}

export function StepDetail({
  step,
  steps,
  featureId,
  subTab,
  onSubTabChange,
  onStepChange,
}: StepDetailProps) {
  const subTabs = [
    { id: "insights", label: "Insights" },
    { id: "diff", label: "Diff" },
    { id: "map", label: "Map" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Step header with dropdown */}
      <div
        style={{
          padding: "var(--space-md) var(--space-lg)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-md)",
        }}
      >
        <select
          value={step.order}
          onChange={(e) => onStepChange(Number(e.target.value))}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "var(--space-sm) var(--space-md)",
            color: "var(--text-primary)",
            fontSize: "var(--body)",
            fontWeight: "var(--weight-semibold)",
            cursor: "pointer",
            maxWidth: 400,
          }}
        >
          {steps.map((s) => (
            <option key={s.order} value={s.order}>
              {s.title}
            </option>
          ))}
        </select>
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
      <TabBar tabs={subTabs} activeTab={subTab} onTabChange={onSubTabChange} />

      {/* Sub-tab content */}
      <div style={{ flex: 1, minHeight: 0, overflow: subTab === "diff" ? "hidden" : "auto" }}>
        {subTab === "insights" && <InsightsPanel step={step} />}
        {subTab === "diff" && <DiffTab step={step} featureId={featureId} />}
        {subTab === "map" && <ChangeMapView step={step} />}
      </div>
    </div>
  );
}
