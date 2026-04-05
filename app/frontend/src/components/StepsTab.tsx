import { useState } from "react";
import { useSteps } from "../hooks/useSteps";
import { StepSidebar } from "./StepSidebar";
import { StepDetail } from "./StepDetail";

interface StepsTabProps {
  featureId: string;
}

export function StepsTab({ featureId }: StepsTabProps) {
  const { steps, loading } = useSteps(featureId);
  const [selectedStep, setSelectedStep] = useState(0);

  if (loading) {
    return (
      <div style={{ padding: "var(--space-xl)", color: "var(--text-secondary)" }}>
        Loading steps...
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div style={{ padding: "var(--space-xl)", color: "var(--text-secondary)" }}>
        No steps available.
      </div>
    );
  }

  const step = steps.find((s) => s.order === selectedStep) || steps[0];

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <StepSidebar
        steps={steps}
        selectedOrder={step.order}
        onSelect={setSelectedStep}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <StepDetail step={step} featureId={featureId} />
      </div>
    </div>
  );
}
