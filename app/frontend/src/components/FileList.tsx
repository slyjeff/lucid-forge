import type { ChangeMapFile } from "../types";

interface FileListProps {
  files: ChangeMapFile[];
  viewedFiles: string[];
  selectedPath: string;
  onSelect: (path: string) => void;
  onToggleViewed: (path: string) => void;
}

function categoryColor(category: string): string {
  switch (category) {
    case "add":
      return "var(--success)";
    case "delete":
      return "var(--error)";
    case "modify":
      return "var(--warning)";
    default:
      return "var(--text-secondary)";
  }
}

function categoryLabel(category: string): string {
  switch (category) {
    case "add":
      return "A";
    case "delete":
      return "D";
    case "modify":
      return "M";
    default:
      return "?";
  }
}

export function FileList({
  files,
  viewedFiles,
  selectedPath,
  onSelect,
  onToggleViewed,
}: FileListProps) {
  const viewedCount = files.filter((f) => viewedFiles.includes(f.path)).length;

  return (
    <div
      style={{
        width: 220,
        minWidth: 180,
        borderRight: "1px solid var(--border)",
        overflow: "auto",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "var(--space-md) var(--space-lg)",
          borderBottom: "1px solid var(--border)",
          fontSize: "var(--label)",
          color: "var(--text-dim)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Files</span>
        <span>
          {viewedCount}/{files.length}
        </span>
      </div>

      {/* File entries */}
      {files.map((file) => {
        const active = file.path === selectedPath;
        const viewed = viewedFiles.includes(file.path);
        const filename = file.path.split("/").pop() || file.path;

        return (
          <div
            key={file.path}
            style={{
              display: "flex",
              alignItems: "center",
              background: active ? "var(--card)" : "transparent",
              transition: "background 100ms ease",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = "var(--card)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
          >
            {/* Viewed indicator — separate click zone */}
            <div
              onClick={() => onToggleViewed(file.path)}
              style={{
                color: viewed ? "var(--success)" : "var(--accent)",
                fontSize: 12,
                cursor: "pointer",
                flexShrink: 0,
                padding: "var(--space-sm) var(--space-sm) var(--space-sm) var(--space-lg)",
                userSelect: "none",
              }}
            >
              {viewed ? "\u2713" : "\u25CB"}
            </div>

            {/* File info — separate click zone */}
            <div
              onClick={() => onSelect(file.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                flex: 1,
                cursor: "pointer",
                padding: "var(--space-sm) var(--space-lg) var(--space-sm) 0",
                overflow: "hidden",
              }}
            >
              {/* Category badge */}
              <span
                style={{
                  color: categoryColor(file.category),
                  fontSize: "var(--label)",
                  fontWeight: "var(--weight-bold)",
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
                {categoryLabel(file.category)}
              </span>

              {/* Filename */}
              <span
                style={{
                  fontSize: "var(--label)",
                  fontFamily: "var(--font-mono)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  textDecoration: file.category === "delete" ? "line-through" : "none",
                }}
                title={file.path}
              >
                {filename}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
