import { DiffEditor, Editor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filePath: string;
  mode: "side-by-side" | "unified";
  isNew?: boolean;
  isDeleted?: boolean;
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
      options: {
        isWholeLine: true,
        className,
      },
    });
  }
  editor.createDecorationsCollection(decorations);
}

export function DiffViewer({
  oldContent,
  newContent,
  filePath,
  mode,
  isNew,
  isDeleted,
}: DiffViewerProps) {
  const language = getLanguage(filePath);

  // New file — show single editor with green-tinted lines
  if (isNew) {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <style>{`
          .line-added { background: var(--diff-added-bg) !important; }
        `}</style>
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

  // Deleted file — show single editor with red-tinted lines
  if (isDeleted) {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <style>{`
          .line-removed { background: var(--diff-removed-bg) !important; }
        `}</style>
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

  // Modified file — show diff editor
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
        } as any}
        onMount={(editor) => {
          editor.updateOptions({
            hideUnchangedRegions: {
              enabled: true,
              contextLineCount: 3,
              minimumLineCount: 5,
            },
          } as any);
        }}
      />
    </div>
  );
}
