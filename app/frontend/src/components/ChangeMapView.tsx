import { useState, useRef, useEffect, useCallback } from "react";
import type { Step, ChangeMapFile, Connection } from "../types";

interface ChangeMapViewProps {
  step: Step;
}

interface FilePosition {
  path: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function categoryBorder(category: string): string {
  switch (category) {
    case "add": return "var(--success)";
    case "modify": return "var(--warning)";
    case "delete": return "var(--error)";
    default: return "var(--border)";
  }
}

function categoryTint(category: string): string {
  switch (category) {
    case "add": return "var(--map-added-tint)";
    case "modify": return "var(--map-modified-tint)";
    default: return "var(--map-unchanged-tint)";
  }
}

function kindColor(kind: string): string {
  switch (kind) {
    case "class": case "interface": case "struct": case "record": case "enum":
      return "var(--info)";
    case "method": case "function": case "constructor":
      return "var(--accent)";
    case "property": case "field":
      return "var(--success)";
    case "component": case "route": case "endpoint":
      return "var(--warning)";
    default: return "var(--text-dim)";
  }
}

function kindInitial(kind: string): string {
  return kind.charAt(0).toUpperCase();
}

function groupByDirectory(files: ChangeMapFile[]): Map<string, ChangeMapFile[]> {
  const groups = new Map<string, ChangeMapFile[]>();
  for (const file of files) {
    const parts = file.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir)!.push(file);
  }
  return groups;
}

function getConnectionsForFile(path: string, connections: Connection[]): Connection[] {
  return connections.filter((c) => {
    const fromFile = c.from.split(":")[0];
    const toFile = c.to.split(":")[0];
    return fromFile === path || toFile === path;
  });
}

function getConnectedPath(path: string, conn: Connection): string {
  const fromFile = conn.from.split(":")[0];
  return fromFile === path ? conn.to.split(":")[0] : fromFile;
}

export function ChangeMapView({ step }: ChangeMapViewProps) {
  const files = step.changeMap?.files ?? [];
  const connections = step.changeMap?.connections ?? [];
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [positions, setPositions] = useState<Map<string, FilePosition>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const updatePositions = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPositions = new Map<string, FilePosition>();
    fileRefs.current.forEach((el, path) => {
      const rect = el.getBoundingClientRect();
      newPositions.set(path, {
        path,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      });
    });
    setPositions(newPositions);
  }, []);

  useEffect(() => {
    updatePositions();
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, [updatePositions, files]);

  const setFileRef = useCallback((path: string, el: HTMLDivElement | null) => {
    if (el) {
      fileRefs.current.set(path, el);
    } else {
      fileRefs.current.delete(path);
    }
  }, []);

  if (files.length === 0) {
    return (
      <div style={{ padding: "var(--space-xl)", color: "var(--text-secondary)" }}>
        No change map available.
      </div>
    );
  }

  const groups = groupByDirectory(files);
  const activeConnections = hoveredFile
    ? getConnectionsForFile(hoveredFile, connections)
    : [];

  const connectedPaths = new Set<string>();
  if (hoveredFile) {
    connectedPaths.add(hoveredFile);
    for (const conn of activeConnections) {
      connectedPaths.add(getConnectedPath(hoveredFile, conn));
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ padding: "var(--space-xl)", position: "relative", overflow: "auto" }}
    >
      {/* SVG overlay for connection lines */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        {activeConnections.map((conn, i) => {
          const fromFile = conn.from.split(":")[0];
          const toFile = conn.to.split(":")[0];
          const fromPos = positions.get(fromFile);
          const toPos = positions.get(toFile);
          if (!fromPos || !toPos) return null;

          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;

          return (
            <g key={i}>
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#58A6FF"
                strokeWidth={2}
                strokeDasharray="6 3"
              />
              <rect
                x={midX - conn.relationship.length * 3.2 - 6}
                y={midY - 10}
                width={conn.relationship.length * 6.4 + 12}
                height={20}
                rx={4}
                fill="#171B24"
                stroke="#3B4354"
                strokeWidth={1}
              />
              <text
                x={midX}
                y={midY + 4}
                textAnchor="middle"
                fill="#8B949E"
                fontSize={11}
                fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
              >
                {conn.relationship}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Directory groups */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-lg)",
        }}
      >
        {Array.from(groups.entries()).map(([dir, dirFiles]) => (
          <div
            key={dir}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--map-group-border)",
              borderRadius: "var(--radius-xl)",
              padding: "var(--space-lg)",
              minWidth: 220,
            }}
          >
            {/* Directory header */}
            <div
              style={{
                fontSize: "var(--label)",
                fontFamily: "var(--font-mono)",
                color: "var(--text-dim)",
                marginBottom: "var(--space-md)",
                paddingBottom: "var(--space-sm)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {dir}/
            </div>

            {/* File boxes */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-sm)",
              }}
            >
              {dirFiles.map((file) => {
                const filename = file.path.split("/").pop() || file.path;
                const isHovered = hoveredFile === file.path;
                const isConnected = connectedPaths.has(file.path);
                const dimmed = hoveredFile != null && !isConnected;

                return (
                  <div
                    key={file.path}
                    ref={(el) => setFileRef(file.path, el)}
                    onMouseEnter={() => {
                      setHoveredFile(file.path);
                      // Update positions on hover to account for scroll
                      requestAnimationFrame(updatePositions);
                    }}
                    onMouseLeave={() => setHoveredFile(null)}
                    style={{
                      background: "var(--card)",
                      border: `1.5px solid ${isHovered ? "#58A6FF" : categoryBorder(file.category)}`,
                      borderRadius: "var(--radius-lg)",
                      opacity: dimmed ? 0.35 : 1,
                      transition: "opacity 150ms ease, border-color 150ms ease",
                      cursor: "default",
                    }}
                  >
                    {/* File header */}
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
                        {file.members.map((m, j) => (
                          <div
                            key={j}
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
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
