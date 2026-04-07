import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Editor, loader } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export interface DiffViewerHandle {
  goToNextChange: () => void;
  goToPrevChange: () => void;
  openSearch: () => void;
  getModifiedContent: () => string | undefined;
}

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filePath: string;
  mode: "side-by-side" | "unified";
  isNew?: boolean;
  isDeleted?: boolean;
  hideWhitespace?: boolean;
  editable?: boolean;
  onContentChange?: (content: string) => void;
}

function getLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    go: "go", py: "python", rs: "rust", java: "java", cs: "csharp",
    rb: "ruby", php: "php", swift: "swift", kt: "kotlin", scala: "scala",
    html: "html", css: "css", scss: "scss", json: "json",
    yaml: "yaml", yml: "yaml", md: "markdown", sql: "sql",
    sh: "shell", bash: "shell", xml: "xml", toml: "toml", dockerfile: "dockerfile",
    dart: "dart", less: "less", graphql: "graphql", gql: "graphql",
    handlebars: "handlebars", hbs: "handlebars",
  };
  return map[ext] || "plaintext";
}

const sharedOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontFamily: "Fira Code, Cascadia Code, JetBrains Mono, Consolas, monospace",
  fontSize: 13,
  lineHeight: 20,
  folding: true,
  wordWrap: "off" as const,
  renderWhitespace: "none" as const,
  automaticLayout: true,
};

export const DiffViewer = forwardRef<DiffViewerHandle, DiffViewerProps>(
  function DiffViewer({ oldContent, newContent, filePath, mode, isNew, isDeleted, hideWhitespace, editable, onContentChange }, ref) {
    const language = getLanguage(filePath);
    const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const changeIndexRef = useRef(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const canEdit = editable && !isDeleted;

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
      openSearch: () => {
        if (diffEditorRef.current) {
          // Trigger find on the diff editor's modified side, focused
          const mod = diffEditorRef.current.getModifiedEditor();
          mod.focus();
          mod.trigger("keyboard", "actions.find", null);
        } else if (editorRef.current) {
          editorRef.current.trigger("keyboard", "actions.find", null);
        }
      },
      getModifiedContent: () => {
        if (editorRef.current) return editorRef.current.getValue();
        if (diffEditorRef.current) return diffEditorRef.current.getModifiedEditor().getValue();
        return undefined;
      },
    }));

    // Direct Monaco diff editor for modified files
    useEffect(() => {
      if (isNew || isDeleted || !containerRef.current) return;

      let diffEd: editor.IStandaloneDiffEditor | null = null;

      loader.init().then((monaco) => {
        if (!containerRef.current) return;

        diffEd = monaco.editor.createDiffEditor(containerRef.current, {
          ...sharedOptions,
          readOnly: !canEdit,
          renderSideBySide: mode === "side-by-side",
          ignoreTrimWhitespace: hideWhitespace ?? false,
          theme: "vs-dark",
        });

        const originalModel = monaco.editor.createModel(oldContent, language);
        const modifiedModel = monaco.editor.createModel(newContent, language);
        diffEd.setModel({ original: originalModel, modified: modifiedModel });

        diffEditorRef.current = diffEd;

        // Scroll to first change
        const tryScroll = () => {
          if (!diffEd) return;
          const changes = diffEd.getLineChanges();
          if (changes && changes.length > 0) {
            changeIndexRef.current = 0;
            revealChange(diffEd, changes[0]);
          } else {
            setTimeout(tryScroll, 20);
          }
        };
        setTimeout(tryScroll, 20);

        // Track edits
        if (canEdit && onContentChange) {
          modifiedModel.onDidChangeContent(() => {
            onContentChange(modifiedModel.getValue());
          });
        }
      });

      return () => {
        if (diffEd) {
          const model = diffEd.getModel();
          diffEd.dispose();
          model?.original?.dispose();
          model?.modified?.dispose();
        }
        diffEditorRef.current = null;
      };
    }, [filePath, mode, hideWhitespace, canEdit]);

    // Direct Monaco editor for new files (editable)
    useEffect(() => {
      if (!isNew || !canEdit || !containerRef.current) return;

      let ed: editor.IStandaloneCodeEditor | null = null;

      loader.init().then((monaco) => {
        if (!containerRef.current) return;
        ed = monaco.editor.create(containerRef.current, {
          value: newContent,
          language,
          theme: "vs-dark",
          readOnly: false,
          ...sharedOptions,
        });
        editorRef.current = ed;

        if (onContentChange) {
          ed.onDidChangeModelContent(() => {
            onContentChange(ed!.getValue());
          });
        }
      });

      return () => {
        if (ed) ed.dispose();
        editorRef.current = null;
      };
    }, [isNew, canEdit, filePath]);

    // New file (read-only) — use @monaco-editor/react
    if (isNew && !canEdit) {
      return (
        <div style={{ position: "absolute", inset: 0 }}>
          <Editor
            value={newContent}
            language={language}
            theme="vs-dark"
            height="100%"
            options={{ ...sharedOptions, readOnly: true }}
            onMount={(ed) => { editorRef.current = ed; }}
          />
        </div>
      );
    }

    // Deleted file — always read-only
    if (isDeleted) {
      return (
        <div style={{ position: "absolute", inset: 0 }}>
          <Editor
            value={oldContent}
            language={language}
            theme="vs-dark"
            height="100%"
            options={{ ...sharedOptions, readOnly: true }}
            onMount={(ed) => { editorRef.current = ed; }}
          />
        </div>
      );
    }

    // New file (editable) or modified file — rendered by direct Monaco in useEffect
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }
);

function revealChange(ed: editor.IStandaloneDiffEditor, change: editor.ILineChange) {
  const startLine = Math.max((change.modifiedStartLineNumber || 1) - 2, 1);
  const endLine = (change.modifiedEndLineNumber || change.modifiedStartLineNumber || 1) + 2;
  const modifiedEditor = ed.getModifiedEditor();
  modifiedEditor.revealRangeInCenter({
    startLineNumber: startLine,
    startColumn: 1,
    endLineNumber: endLine,
    endColumn: 1,
  });
}
