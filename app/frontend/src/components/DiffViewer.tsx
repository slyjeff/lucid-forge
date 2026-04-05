import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { DiffEditor, Editor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export interface DiffViewerHandle {
  goToNextChange: () => void;
  goToPrevChange: () => void;
}

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filePath: string;
  mode: "side-by-side" | "unified";
  isNew?: boolean;
  isDeleted?: boolean;
  hideWhitespace?: boolean;
}

function getLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    go: "go",
    py: "python",
    rs: "rust",
    java: "java",
    cs: "csharp",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    xml: "xml",
    toml: "toml",
    dockerfile: "dockerfile",
  };
  return map[ext] || "plaintext";
}

const baseOptions: editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontFamily: "Fira Code, Cascadia Code, JetBrains Mono, Consolas, monospace",
  fontSize: 13,
  lineHeight: 20,
  folding: true,
  wordWrap: "off",
  renderWhitespace: "none",
  contextmenu: false,
};

function decorateAllLines(
  editor: editor.IStandaloneCodeEditor,
  className: string
) {
  const model = editor.getModel();
  if (!model) return;
  const lineCount = model.getLineCount();
  const decorations: editor.IModelDeltaDecoration[] = [];
  for (let i = 1; i <= lineCount; i++) {
    decorations.push({
      range: { startLineNumber: i, startColumn: 1, endLineNumber: i, endColumn: 1 },
      options: { isWholeLine: true, className },
    });
  }
  editor.createDecorationsCollection(decorations);
}

function revealChange(ed: editor.IStandaloneDiffEditor, change: editor.ILineChange) {
  const startLine = Math.max((change.modifiedStartLineNumber || 1) - 2, 1);
  const endLine = (change.modifiedEndLineNumber || change.modifiedStartLineNumber || 1) + 2;
  // Get the modified editor to reveal the range
  const modifiedEditor = ed.getModifiedEditor();
  modifiedEditor.revealRangeInCenter({
    startLineNumber: startLine,
    startColumn: 1,
    endLineNumber: endLine,
    endColumn: 1,
  });
}

function scrollToFirstChange(ed: editor.IStandaloneDiffEditor, changeIndexRef: React.MutableRefObject<number>) {
  const tryScroll = () => {
    const changes = ed.getLineChanges();
    if (changes && changes.length > 0) {
      changeIndexRef.current = 0;
      revealChange(ed, changes[0]);
    } else {
      setTimeout(tryScroll, 20);
    }
  };
  setTimeout(tryScroll, 20);
}

export const DiffViewer = forwardRef<DiffViewerHandle, DiffViewerProps>(
  function DiffViewer({ oldContent, newContent, filePath, mode, isNew, isDeleted, hideWhitespace }, ref) {
    const language = getLanguage(filePath);
    const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
    const changeIndexRef = useRef(-1);

    useImperativeHandle(ref, () => ({
      goToNextChange: () => {
        const ed = diffEditorRef.current;
        if (!ed) return;
        const changes = ed.getLineChanges();
        if (!changes || changes.length === 0) return;
        changeIndexRef.current = Math.min(changeIndexRef.current + 1, changes.length - 1);
        revealChange(ed, changes[changeIndexRef.current]);
      },
      goToPrevChange: () => {
        const ed = diffEditorRef.current;
        if (!ed) return;
        const changes = ed.getLineChanges();
        if (!changes || changes.length === 0) return;
        changeIndexRef.current = Math.max(changeIndexRef.current - 1, 0);
        revealChange(ed, changes[changeIndexRef.current]);
      },
    }));

    // Scroll to first change when content changes
    const prevContentRef = useRef({ oldContent, newContent, filePath });
    useEffect(() => {
      const prev = prevContentRef.current;
      prevContentRef.current = { oldContent, newContent, filePath };

      if (prev.filePath === filePath && prev.oldContent === oldContent && prev.newContent === newContent) {
        return;
      }

      changeIndexRef.current = -1;
      if (diffEditorRef.current && !isNew && !isDeleted) {
        scrollToFirstChange(diffEditorRef.current, changeIndexRef);
      }
    }, [oldContent, newContent, filePath, isNew, isDeleted]);

    // New file
    if (isNew) {
      return (
        <div style={{ position: "absolute", inset: 0 }}>
          <style>{`.line-added { background: var(--diff-added-bg) !important; }`}</style>
          <Editor
            value={newContent}
            language={language}
            theme="vs-dark"
            height="100%"
            options={baseOptions}
            onMount={(editor) => decorateAllLines(editor, "line-added")}
          />
        </div>
      );
    }

    // Deleted file
    if (isDeleted) {
      return (
        <div style={{ position: "absolute", inset: 0 }}>
          <style>{`.line-removed { background: var(--diff-removed-bg) !important; }`}</style>
          <Editor
            value={oldContent}
            language={language}
            theme="vs-dark"
            height="100%"
            options={baseOptions}
            onMount={(editor) => decorateAllLines(editor, "line-removed")}
          />
        </div>
      );
    }

    // Modified file
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <DiffEditor
          original={oldContent}
          modified={newContent}
          language={language}
          theme="vs-dark"
          height="100%"
          options={{
            ...baseOptions,
            renderSideBySide: mode === "side-by-side",
            ignoreTrimWhitespace: hideWhitespace ?? false,
          }}
          onMount={(editor) => {
            diffEditorRef.current = editor;
            scrollToFirstChange(editor, changeIndexRef);
          }}
        />
      </div>
    );
  }
);
