import { DiffEditor } from "@monaco-editor/react";

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filePath: string;
  mode: "side-by-side" | "unified";
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

export function DiffViewer({ oldContent, newContent, filePath, mode }: DiffViewerProps) {
  return (
    <DiffEditor
      original={oldContent}
      modified={newContent}
      language={getLanguage(filePath)}
      theme="vs-dark"
      options={{
        readOnly: true,
        renderSideBySide: mode === "side-by-side",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontFamily: "Fira Code, Cascadia Code, JetBrains Mono, Consolas, monospace",
        fontSize: 13,
        lineHeight: 20,
        folding: true,
        wordWrap: "off",
        renderWhitespace: "none",
        contextmenu: false,
      }}
    />
  );
}
