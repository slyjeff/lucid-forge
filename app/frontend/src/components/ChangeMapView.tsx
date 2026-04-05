import type { Step, ChangeMapFile } from "../types";

interface ChangeMapViewProps {
  step: Step;
}

function categoryTint(category: string): string {
  switch (category) {
    case "add":
      return "var(--map-added-tint)";
    case "modify":
      return "var(--map-modified-tint)";
    default:
      return "var(--map-unchanged-tint)";
  }
}

function categoryBorder(category: string): string {
  switch (category) {
    case "add":
      return "var(--success)";
    case "modify":
      return "var(--warning)";
    case "delete":
      return "var(--error)";
    default:
      return "var(--border)";
  }
}

function kindColor(kind: string): string {
  switch (kind) {
    case "class":
    case "interface":
    case "struct":
    case "record":
    case "enum":
      return "var(--info)";
    case "method":
    case "function":
    case "constructor":
      return "var(--accent)";
    case "property":
    case "field":
      return "var(--success)";
    case "component":
    case "route":
    case "endpoint":
      return "var(--warning)";
    default:
      return "var(--text-dim)";
  }
}

function kindInitial(kind: string): string {
  return kind.charAt(0).toUpperCase();
}

function FileBox({ file }: { file: ChangeMapFile }) {
  const filename = file.path.split("/").pop() || file.path;

  return (
    <div
      style={{
        background: "var(--card)",
        border: `1.5px solid ${categoryBorder(file.category)}`,
        borderRadius: "var(--radius-lg)",
        minWidth: 200,
        maxWidth: 280,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "6px 10px",
          background: categoryTint(file.category),
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--code)",
          fontWeight: "var(--weight-semibold)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={file.path}
      >
        {filename}
      </div>

      {/* Members */}
      {file.members && file.members.length > 0 && (
        <div style={{ padding: "var(--space-sm) var(--space-md)" }}>
          {file.members.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                padding: "2px 0",
              }}
            >
              <span
                style={{
                  fontSize: "var(--badge)",
                  fontWeight: "var(--weight-bold)",
                  color: kindColor(m.kind),
                  background: `color-mix(in srgb, ${kindColor(m.kind)} 15%, transparent)`,
                  borderRadius: 2,
                  padding: "0 3px",
                  minWidth: 12,
                  textAlign: "center",
                }}
              >
                {kindInitial(m.kind)}
              </span>
              <span
                style={{
                  fontSize: "var(--label)",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChangeMapView({ step }: ChangeMapViewProps) {
  const files = step.changeMap?.files ?? [];
  const connections = step.changeMap?.connections ?? [];

  if (files.length === 0) {
    return (
      <div style={{ padding: "var(--space-xl)", color: "var(--text-secondary)" }}>
        No change map available.
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-xl)", overflow: "auto" }}>
      {/* File boxes grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-lg)",
          marginBottom: "var(--space-xl)",
        }}
      >
        {files.map((file) => (
          <FileBox key={file.path} file={file} />
        ))}
      </div>

      {/* Connections list */}
      {connections.length > 0 && (
        <div>
          <h3
            style={{
              fontWeight: "var(--weight-semibold)",
              marginBottom: "var(--space-md)",
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontSize: "var(--label)",
            }}
          >
            Connections
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            {connections.map((c, i) => (
              <div
                key={i}
                style={{
                  fontSize: "var(--label)",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--info)" }}>
                  {c.from}
                </span>
                <span style={{ color: "var(--text-dim)" }}>&rarr;</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--info)" }}>
                  {c.to}
                </span>
                <span style={{ color: "var(--text-dim)" }}>({c.relationship})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
