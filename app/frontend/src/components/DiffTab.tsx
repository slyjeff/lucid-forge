import { useState } from "react";
import { FileList } from "./FileList";
import { DiffViewer } from "./DiffViewer";
import { FileReasoning } from "./FileReasoning";
import { useDiff } from "../hooks/useDiff";
import { MarkFileViewed, UnmarkFileViewed } from "../../wailsjs/go/main/App";
import type { Step } from "../types";

interface DiffTabProps {
  step: Step;
  featureId: string;
}

export function DiffTab({ step, featureId }: DiffTabProps) {
  const files = step.changeMap?.files ?? [];
  const [selectedFile, setSelectedFile] = useState(files[0]?.path ?? "");
  const [diffMode, setDiffMode] = useState<"side-by-side" | "unified">("side-by-side");
  const { diff, loading } = useDiff(featureId, step.order, selectedFile);

  const viewedFiles = step.viewedFiles ?? [];
  const currentFile = files.find((f) => f.path === selectedFile);

  async function toggleViewed(path: string) {
    if (viewedFiles.includes(path)) {
      await UnmarkFileViewed(featureId, step.order, path);
    } else {
      await MarkFileViewed(featureId, step.order, path);
    }
  }

  if (files.length === 0) {
    return (
      <div style={{ padding: "var(--space-xl)", color: "var(--text-secondary)" }}>
        No files changed in this step.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* File list sidebar */}
      <FileList
        files={files}
        viewedFiles={viewedFiles}
        selectedPath={selectedFile}
        onSelect={setSelectedFile}
        onToggleViewed={toggleViewed}
      />

      {/* Diff area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div
          style={{
            padding: "var(--space-sm) var(--space-lg)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            fontSize: "var(--label)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--code)",
              flex: 1,
            }}
          >
            {selectedFile}
          </span>
          <button
            onClick={() =>
              setDiffMode(diffMode === "side-by-side" ? "unified" : "side-by-side")
            }
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              padding: "2px 8px",
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--label)",
            }}
          >
            {diffMode === "side-by-side" ? "Unified" : "Side-by-Side"}
          </button>
          <button
            onClick={() => toggleViewed(selectedFile)}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: viewedFiles.includes(selectedFile)
                ? "var(--success)"
                : "var(--text-secondary)",
              padding: "2px 8px",
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--label)",
            }}
          >
            {viewedFiles.includes(selectedFile) ? "\u2713 Viewed" : "Mark Viewed"}
          </button>
        </div>

        {/* Reasoning */}
        {currentFile?.reasoning && (
          <FileReasoning reasoning={currentFile.reasoning} />
        )}

        {/* Monaco diff */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          {diff ? (
            <DiffViewer
              oldContent={diff.oldContent}
              newContent={diff.newContent}
              filePath={selectedFile}
              mode={diffMode}
              isNew={diff.isNew}
              isDeleted={diff.isDeleted}
            />
          ) : (
            <div
              style={{
                padding: "var(--space-xl)",
                color: "var(--text-secondary)",
              }}
            >
              Select a file to view the diff.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
