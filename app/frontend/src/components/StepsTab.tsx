import { useState } from "react";
import { useSteps } from "../hooks/useSteps";
import { StepDetail } from "./StepDetail";

interface StepsTabProps {
  featureId: string;
}

export function StepsTab({ featureId }: StepsTabProps) {
  const { steps, loading } = useSteps(featureId);
  const [selectedStep, setSelectedStep] = useState(0);
  const [subTab, setSubTab] = useState("insights");
  const [selectedFile, setSelectedFile] = useState<string>("");
  // Map of step order → last visited sub-tab. Absence means never visited.
  const [stepTabHistory] = useState<Map<number, string>>(new Map());

  function handleStepChange(order: number) {
    // Save current tab for the step we're leaving
    stepTabHistory.set(selectedStep, subTab);
    // Restore last tab for the new step, or default to "insights" if first visit
    const lastTab = stepTabHistory.get(order);
    setSubTab(lastTab ?? "insights");
    setSelectedFile("");
    setSelectedStep(order);
  }

  function handleSubTabChange(tab: string) {
    stepTabHistory.set(selectedStep, tab);
    setSubTab(tab);
  }

  // Show loading only on first load, not on refetches
  if (loading && steps.length === 0) {
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
    <div style={{ height: "100%", overflow: "hidden" }}>
      <StepDetail
        step={step}
        steps={steps}
        featureId={featureId}
        subTab={subTab}
        onSubTabChange={handleSubTabChange}
        onStepChange={handleStepChange}
        selectedFile={selectedFile}
        onSelectedFileChange={setSelectedFile}
      />
    </div>
  );
}
