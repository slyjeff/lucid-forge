import type { ChangeMapFile } from "../types";

interface FileListProps {
  files: ChangeMapFile[];
  viewedFiles: string[];
  selectedPath: string;
  grouped: boolean;
  onToggleGrouped: () => void;
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

/** Sort files alphabetically by filename */
export function sortFiles(files: ChangeMapFile[]): ChangeMapFile[] {
  return [...files].sort((a, b) => {
    const aName = (a.path.split("/").pop() || a.path).toLowerCase();
    const bName = (b.path.split("/").pop() || b.path).toLowerCase();
    return aName.localeCompare(bName);
  });
}

/**
 * Group files by their immediate parent directory.
 * If two directories share the same leaf name (e.g. src/models/ and lib/models/),
 * disambiguate by showing enough path segments to distinguish them.
 */
export function groupByDirectory(files: ChangeMapFile[]): { label: string; dirPath: string; files: ChangeMapFile[] }[] {
  // Group by full parent directory path
  const dirMap = new Map<string, ChangeMapFile[]>();
  for (const file of files) {
    const parts = file.path.split("/");
    const dirPath = parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
    if (!dirMap.has(dirPath)) dirMap.set(dirPath, []);
    dirMap.get(dirPath)!.push(file);
  }

  // Determine labels — use leaf name, disambiguate duplicates
  const dirPaths = Array.from(dirMap.keys());
  const leafToFullPaths = new Map<string, string[]>();
  for (const dp of dirPaths) {
    const leaf = dp === "." ? "." : dp.split("/").pop()!;
    if (!leafToFullPaths.has(leaf)) leafToFullPaths.set(leaf, []);
    leafToFullPaths.get(leaf)!.push(dp);
  }

  const groups: { label: string; dirPath: string; files: ChangeMapFile[] }[] = [];
  for (const dp of dirPaths) {
    const leaf = dp === "." ? "." : dp.split("/").pop()!;
    const siblings = leafToFullPaths.get(leaf)!;
    // Disambiguate: show parent/leaf if leaf name is shared
    const label = siblings.length > 1
      ? dp.split("/").slice(-2).join("/")
      : (dp === "." ? "(root)" : leaf);
    groups.push({ label, dirPath: dp, files: sortFiles(dirMap.get(dp)!) });
  }

  // Sort groups alphabetically by label
  groups.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
  return groups;
}

function FileEntry({
  file,
  active,
  viewed,
  indented,
  onSelect,
  onToggleViewed,
}: {
  file: ChangeMapFile;
  active: boolean;
  viewed: boolean;
  indented?: boolean;
  onSelect: () => void;
  onToggleViewed: () => void;
}) {
  const filename = file.path.split("/").pop() || file.path;
  const indent = indented ? 12 : 0;

  return (
    <div
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
      {/* Viewed indicator */}
      <div
        onClick={onToggleViewed}
        style={{
          color: viewed ? "var(--success)" : "var(--accent)",
          fontSize: 12,
          cursor: "pointer",
          flexShrink: 0,
          paddingTop: "var(--space-sm)",
          paddingBottom: "var(--space-sm)",
          paddingLeft: `calc(var(--space-lg) + ${indent}px)`,
          paddingRight: "var(--space-sm)",
          userSelect: "none",
        }}
      >
        {viewed ? "\u2713" : "\u25CB"}
      </div>

      {/* File info */}
      <div
        onClick={onSelect}
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
}

export function FileList({
  files,
  viewedFiles,
  selectedPath,
  grouped,
  onToggleGrouped,
  onSelect,
  onToggleViewed,
}: FileListProps) {
  const viewedCount = files.filter((f) => viewedFiles.includes(f.path)).length;
  const sortedFiles = sortFiles(files);
  const groups = grouped ? groupByDirectory(files) : null;

  return (
    <div
      style={{
        overflow: "auto",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
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
          alignItems: "center",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          Files
          <button
            onClick={onToggleGrouped}
            title={grouped ? "Show flat list" : "Group by directory"}
            style={{
              background: grouped ? "var(--accent)" : "transparent",
              border: "1px solid var(--border)",
              color: grouped ? "var(--bg)" : "var(--text-dim)",
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              fontSize: 10,
              lineHeight: 1,
              padding: "1px 4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            &#128193;
          </button>
        </span>
        <span>
          {viewedCount}/{files.length}
        </span>
      </div>

      {/* File entries */}
      {groups
        ? groups.map((group) => (
            <div key={group.dirPath}>
              <div
                style={{
                  padding: "var(--space-sm) var(--space-lg)",
                  fontSize: "var(--label)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: "var(--weight-bold)",
                  color: "var(--warning)",
                  userSelect: "none",
                }}
              >
                {group.label}/
              </div>
              {group.files.map((file) => (
                <FileEntry
                  key={file.path}
                  file={file}
                  active={file.path === selectedPath}
                  viewed={viewedFiles.includes(file.path)}
                  indented
                  onSelect={() => onSelect(file.path)}
                  onToggleViewed={() => onToggleViewed(file.path)}
                />
              ))}
            </div>
          ))
        : sortedFiles.map((file) => (
            <FileEntry
              key={file.path}
              file={file}
              active={file.path === selectedPath}
              viewed={viewedFiles.includes(file.path)}
              onSelect={() => onSelect(file.path)}
              onToggleViewed={() => onToggleViewed(file.path)}
            />
          ))}
    </div>
  );
}
