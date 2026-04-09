import { useState, useRef, useEffect } from "react";
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
  selectedFile: string;
  onSelectedFileChange: (path: string) => void;
}

function StepDropdown({
  step,
  steps,
  onStepChange,
}: {
  step: Step;
  steps: Step[];
  onStepChange: (order: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", maxWidth: 400 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "var(--space-sm) var(--space-md)",
          color: "var(--text-primary)",
          fontSize: "var(--body)",
          fontWeight: "var(--weight-semibold)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          maxWidth: 400,
          textAlign: "left",
          width: "100%",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {step.title}
        </span>
        <span style={{ fontSize: "0.7em", opacity: 0.6, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            zIndex: 100,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {steps.map((s) => (
            <div
              key={s.order}
              onClick={() => {
                onStepChange(s.order);
                setOpen(false);
              }}
              style={{
                padding: "var(--space-sm) var(--space-md)",
                color: s.order === step.order ? "var(--info)" : "var(--text-primary)",
                background: s.order === step.order ? "var(--bg)" : "transparent",
                cursor: "pointer",
                fontSize: "var(--body)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              onMouseEnter={(e) => {
                if (s.order !== step.order)
                  (e.currentTarget as HTMLDivElement).style.background = "var(--bg)";
              }}
              onMouseLeave={(e) => {
                if (s.order !== step.order)
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              {s.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StepDetail({
  step,
  steps,
  featureId,
  subTab,
  onSubTabChange,
  onStepChange,
  selectedFile,
  onSelectedFileChange,
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
        <StepDropdown step={step} steps={steps} onStepChange={onStepChange} />
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
        {subTab === "diff" && (
          <DiffTab
            step={step}
            featureId={featureId}
            selectedFile={selectedFile}
            onSelectedFileChange={onSelectedFileChange}
          />
        )}
        {subTab === "map" && <ChangeMapView step={step} />}
      </div>
    </div>
  );
}
