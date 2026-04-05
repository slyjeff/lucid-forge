import { useState } from "react";
import { useSteps } from "../hooks/useSteps";
import { StepDetail } from "./StepDetail";

interface StepsTabProps {
  featureId: string;
}

export function StepsTab({ featureId }: StepsTabProps) {
  const { steps, loading } = useSteps(featureId);
  const [selectedStep, setSelectedStep] = useState(0);
  const [subTab, setSubTab] = useState("diff");
  const [selectedFile, setSelectedFile] = useState<string>("");

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
        onSubTabChange={setSubTab}
        onStepChange={setSelectedStep}
        selectedFile={selectedFile}
        onSelectedFileChange={setSelectedFile}
      />
    </div>
  );
}
