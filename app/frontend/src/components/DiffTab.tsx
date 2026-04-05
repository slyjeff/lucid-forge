import { useState, useRef, useEffect } from "react";
import { FileList } from "./FileList";
import { DiffViewer, DiffViewerHandle } from "./DiffViewer";
import { FileReasoning } from "./FileReasoning";
import { useDiff } from "../hooks/useDiff";
import { MarkFileViewed, UnmarkFileViewed } from "../../wailsjs/go/main/App";
import type { Step } from "../types";

interface DiffTabProps {
  step: Step;
  featureId: string;
}

const toolbarBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
  padding: "2px 8px",
  cursor: "pointer",
  borderRadius: "var(--radius-md)",
  fontSize: "var(--label)",
};

export function DiffTab({ step, featureId }: DiffTabProps) {
  const files = step.changeMap?.files ?? [];
  const [selectedFile, setSelectedFile] = useState(files[0]?.path ?? "");
  const [diffMode, setDiffMode] = useState<"side-by-side" | "unified">("side-by-side");
  const [hideWhitespace, setHideWhitespace] = useState(false);
  const { diff } = useDiff(featureId, step.order, selectedFile);
  const diffRef = useRef<DiffViewerHandle>(null);

  // Optimistic local viewed state to avoid re-render disruption from file watcher
  const [localViewed, setLocalViewed] = useState<string[]>(step.viewedFiles ?? []);
  useEffect(() => {
    setLocalViewed(step.viewedFiles ?? []);
  }, [step.viewedFiles]);

  const currentFile = files.find((f) => f.path === selectedFile);
  const isModified = diff && !diff.isNew && !diff.isDeleted;

  async function toggleViewed(path: string) {
    if (localViewed.includes(path)) {
      setLocalViewed(localViewed.filter((f) => f !== path));
      await UnmarkFileViewed(featureId, step.order, path);
    } else {
      setLocalViewed([...localViewed, path]);
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
        viewedFiles={localViewed}
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
          {isModified && (
            <>
              <button
                onClick={() => diffRef.current?.goToPrevChange()}
                style={toolbarBtnStyle}
                title="Previous change"
              >
                &#x25B2;
              </button>
              <button
                onClick={() => diffRef.current?.goToNextChange()}
                style={toolbarBtnStyle}
                title="Next change"
              >
                &#x25BC;
              </button>
            </>
          )}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
              color: "var(--text-secondary)",
              fontSize: "var(--label)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <input
              type="checkbox"
              checked={hideWhitespace}
              onChange={(e) => setHideWhitespace(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Hide whitespace
          </label>
          <button
            onClick={() =>
              setDiffMode(diffMode === "side-by-side" ? "unified" : "side-by-side")
            }
            style={toolbarBtnStyle}
          >
            {diffMode === "side-by-side" ? "Unified" : "Side-by-Side"}
          </button>
          <button
            onClick={() => toggleViewed(selectedFile)}
            style={{
              ...toolbarBtnStyle,
              color: localViewed.includes(selectedFile)
                ? "var(--success)"
                : "var(--text-secondary)",
            }}
          >
            {localViewed.includes(selectedFile) ? "\u2713 Viewed" : "Mark Viewed"}
          </button>
        </div>

        {/* Reasoning */}
        {currentFile?.reasoning && (
          <FileReasoning reasoning={currentFile.reasoning} category={currentFile.category} />
        )}

        {/* Monaco diff */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          {diff ? (
            <DiffViewer
              ref={diffRef}
              oldContent={diff.oldContent}
              newContent={diff.newContent}
              filePath={selectedFile}
              mode={diffMode}
              isNew={diff.isNew}
              isDeleted={diff.isDeleted}
              hideWhitespace={hideWhitespace}
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
