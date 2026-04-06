import { useState, useRef, useEffect, useCallback } from "react";
import { FileList, sortFiles, groupByDirectory } from "./FileList";
import { DiffViewer, DiffViewerHandle } from "./DiffViewer";
import { FileReasoning } from "./FileReasoning";
import { useDiff } from "../hooks/useDiff";
import { MarkFileViewed, UnmarkFileViewed, SaveFileContent } from "../../wailsjs/go/main/App";
import type { Step } from "../types";

interface DiffTabProps {
  step: Step;
  featureId: string;
  selectedFile: string;
  onSelectedFileChange: (path: string) => void;
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

export function DiffTab({ step, featureId, selectedFile: selectedFileProp, onSelectedFileChange }: DiffTabProps) {
  const files = step.changeMap?.files ?? [];
  const selectedFile = (selectedFileProp && files.some(f => f.path === selectedFileProp))
    ? selectedFileProp
    : files[0]?.path ?? "";

  function setSelectedFile(path: string) {
    onSelectedFileChange(path);
  }

  function updateDiffMode(mode: "side-by-side" | "unified") {
    setDiffMode(mode);
    localStorage.setItem("lucidforge:diffMode", mode);
  }

  function updateHideWhitespace(value: boolean) {
    setHideWhitespace(value);
    localStorage.setItem("lucidforge:hideWhitespace", String(value));
  }
  const [diffMode, setDiffMode] = useState<"side-by-side" | "unified">(() => {
    return (localStorage.getItem("lucidforge:diffMode") as "side-by-side" | "unified") || "side-by-side";
  });
  const [hideWhitespace, setHideWhitespace] = useState(() => {
    return localStorage.getItem("lucidforge:hideWhitespace") === "true";
  });
  const { diff } = useDiff(featureId, step.order, selectedFile);
  const diffRef = useRef<DiffViewerHandle>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Optimistic local viewed state to avoid re-render disruption from file watcher
  const [localViewed, setLocalViewed] = useState<string[]>(step.viewedFiles ?? []);
  useEffect(() => {
    setLocalViewed(step.viewedFiles ?? []);
  }, [step.viewedFiles]);

  const currentFile = files.find((f) => f.path === selectedFile);
  const matchedDiff = diff && diff.path === selectedFile ? diff : null;
  const isModified = matchedDiff && !matchedDiff.isNew && !matchedDiff.isDeleted;

  function handleContentChange(content: string) {
    // Debounced auto-save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      SaveFileContent(selectedFile, content);
    }, 500);
  }

  function markViewed(path: string) {
    const newViewed = [...localViewed, path];
    setLocalViewed(newViewed);
    MarkFileViewed(featureId, step.order, path);

    // Navigate to next unviewed file in display order
    const ordered = displayOrder();
    const idx = ordered.indexOf(path);
    for (let i = 1; i <= ordered.length; i++) {
      const candidate = ordered[(idx + i) % ordered.length];
      if (!newViewed.includes(candidate)) {
        setSelectedFile(candidate);
        break;
      }
    }
  }

  function unmarkViewed(path: string) {
    setLocalViewed(localViewed.filter((f) => f !== path));
    UnmarkFileViewed(featureId, step.order, path);
    // Explicitly do NOT navigate
  }

  function toggleViewed(path: string) {
    if (localViewed.includes(path)) {
      unmarkViewed(path);
    } else {
      markViewed(path);
    }
  }

  // Grouped state (lifted here so markViewed can use display order)
  const [grouped, setGrouped] = useState(() => {
    return localStorage.getItem("lucidforge:groupFiles") === "true";
  });

  function toggleGrouped() {
    const next = !grouped;
    setGrouped(next);
    localStorage.setItem("lucidforge:groupFiles", String(next));
  }

  // Ordered file paths matching what FileList renders
  function displayOrder(): string[] {
    if (grouped) {
      return groupByDirectory(files).flatMap((g) => g.files.map((f) => f.path));
    }
    return sortFiles(files).map((f) => f.path);
  }

  // Resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("lucidforge:sidebarWidth");
    return saved ? parseInt(saved, 10) : 250;
  });
  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      const newWidth = Math.max(120, Math.min(600, startWidth + e.clientX - startX));
      setSidebarWidth(newWidth);
    }
    function onMouseUp() {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // Persist on release
      setSidebarWidth((w) => {
        localStorage.setItem("lucidforge:sidebarWidth", String(w));
        return w;
      });
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sidebarWidth]);

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
      <div style={{ width: sidebarWidth, flexShrink: 0, borderRight: "1px solid var(--border)" }}>
        <FileList
          files={files}
          viewedFiles={localViewed}
          selectedPath={selectedFile}
          grouped={grouped}
          onToggleGrouped={toggleGrouped}
          onSelect={setSelectedFile}
          onToggleViewed={toggleViewed}
        />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 4,
          cursor: "col-resize",
          flexShrink: 0,
          background: "transparent",
          transition: "background 150ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; }}
        onMouseLeave={(e) => { if (!dragging.current) e.currentTarget.style.background = "transparent"; }}
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
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
            }}
          >
            {selectedFile}
            {matchedDiff && !matchedDiff.isDeleted && (
              <span style={{ color: "var(--text-dim)", fontSize: "var(--label)", fontFamily: "var(--font-ui)" }}>
                (editable)
              </span>
            )}
          </span>
          <button
            onClick={() => diffRef.current?.goToPrevChange()}
            style={{ ...toolbarBtnStyle, visibility: isModified ? "visible" : "hidden" }}
            title="Previous change"
          >
            &#x25B2;
          </button>
          <button
            onClick={() => diffRef.current?.goToNextChange()}
            style={{ ...toolbarBtnStyle, visibility: isModified ? "visible" : "hidden" }}
            title="Next change"
          >
            &#x25BC;
          </button>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              cursor: "pointer",
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            <input
              type="checkbox"
              checked={localViewed.includes(selectedFile)}
              onChange={() => toggleViewed(selectedFile)}
              style={{ cursor: "pointer" }}
            />
            <span style={{ color: "var(--text-secondary)", fontSize: "var(--label)" }}>
              Viewed
            </span>
          </label>
          <button
            onClick={() =>
              updateDiffMode(diffMode === "side-by-side" ? "unified" : "side-by-side")
            }
            style={toolbarBtnStyle}
          >
            {diffMode === "side-by-side" ? "Unified" : "Side-by-Side"}
          </button>
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
              onChange={(e) => updateHideWhitespace(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Hide whitespace
          </label>
          <button
            onClick={() => diffRef.current?.openSearch()}
            style={toolbarBtnStyle}
            title="Search (Ctrl+F)"
          >
            Search
          </button>
        </div>

        {/* Deleted file indicator */}
        {matchedDiff?.isDeleted && (
          <div
            style={{
              padding: "var(--space-sm) var(--space-lg)",
              background: "var(--error-subtle)",
              borderBottom: "1px solid var(--border)",
              color: "var(--error)",
              fontSize: "var(--label)",
              fontWeight: "var(--weight-semibold)",
            }}
          >
            This file was deleted
          </div>
        )}

        {/* Reasoning */}
        {currentFile?.reasoning && (
          <FileReasoning reasoning={currentFile.reasoning} category={currentFile.category} />
        )}

        {/* Monaco diff */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          {matchedDiff ? (
            <DiffViewer
              ref={diffRef}
              oldContent={matchedDiff.oldContent}
              newContent={matchedDiff.newContent}
              filePath={matchedDiff.path}
              mode={diffMode}
              isNew={matchedDiff.isNew}
              isDeleted={matchedDiff.isDeleted}
              hideWhitespace={hideWhitespace}
              editable={!matchedDiff.isDeleted}
              onContentChange={handleContentChange}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "var(--bg)" }} />
          )}
        </div>
      </div>
    </div>
  );
}
