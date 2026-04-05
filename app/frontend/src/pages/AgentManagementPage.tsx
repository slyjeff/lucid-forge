import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAgents } from "../hooks/useAgents";
import { AgentEditor } from "../components/AgentEditor";
import { MergeDialog } from "../components/MergeDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { Agent } from "../types";

export function AgentManagementPage() {
  const navigate = useNavigate();
  const { agents, loading, save, create, remove, merge } = useAgents();
  const [editing, setEditing] = useState<Agent | null>(null);
  const [creating, setCreating] = useState(false);
  const [merging, setMerging] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState<Agent | null>(null);

  async function handleSave(agent: Agent) {
    if (creating) {
      await create(agent);
      setCreating(false);
    } else {
      await save(agent);
      setEditing(null);
    }
  }

  async function handleDelete() {
    if (deleting) {
      await remove(deleting.name);
      setDeleting(null);
    }
  }

  async function handleMerge(targetName: string) {
    if (merging) {
      await merge(merging.name, targetName);
      setMerging(null);
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          padding: "var(--space-lg) var(--space-xl)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-lg)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "var(--title)",
            padding: "0 var(--space-sm)",
          }}
        >
          &larr;
        </button>
        <span
          style={{
            fontSize: "var(--title-lg)",
            fontWeight: "var(--weight-bold)",
            flex: 1,
          }}
        >
          Agents
        </span>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            style={{
              background: "var(--accent)",
              border: "none",
              color: "white",
              padding: "6px 16px",
              cursor: "pointer",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--body)",
              fontWeight: "var(--weight-semibold)",
            }}
          >
            + New Agent
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "var(--space-xl)" }}>
        {/* Create form */}
        {creating && (
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <AgentEditor
              onSave={handleSave}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <AgentEditor
              agent={editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        {/* Agent list */}
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
        ) : agents.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>
            No LucidForge agents found. Run /lucidforge-agents to generate them.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            {agents.map((a) => (
              <div
                key={a.name}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-xl)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "var(--space-sm)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--title)",
                      fontWeight: "var(--weight-semibold)",
                    }}
                  >
                    {a.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                    <span
                      style={{
                        fontSize: "var(--label)",
                        color: "var(--info)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-xl)",
                        padding: "3px 8px",
                      }}
                    >
                      {a.model}
                    </span>
                  </div>
                </div>

                {a.identity && (
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "var(--body)",
                      marginBottom: "var(--space-md)",
                    }}
                  >
                    {a.identity}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-sm)",
                    flexWrap: "wrap",
                    marginBottom: "var(--space-md)",
                  }}
                >
                  {a.directories?.map((d) => (
                    <span
                      key={d}
                      style={{
                        fontSize: "var(--label)",
                        color: "var(--text-dim)",
                        background: "var(--surface)",
                        borderRadius: "var(--radius-md)",
                        padding: "2px 6px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "var(--space-md)" }}>
                  <button
                    onClick={() => { setEditing(a); setCreating(false); }}
                    style={ghostBtnStyle}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setMerging(a)}
                    style={ghostBtnStyle}
                  >
                    Merge
                  </button>
                  {a.name.toLowerCase() !== "general" && (
                    <button
                      onClick={() => setDeleting(a)}
                      style={{ ...ghostBtnStyle, color: "var(--error)" }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merge dialog */}
      {merging && (
        <MergeDialog
          open={true}
          source={merging}
          targets={agents.filter((a) => a.name !== merging.name)}
          onClose={() => setMerging(null)}
          onMerge={handleMerge}
        />
      )}

      {/* Delete dialog */}
      {deleting && (
        <ConfirmDialog
          open={true}
          title="Delete Agent"
          message={`Are you sure you want to delete "${deleting.name}"? This will remove the agent file.`}
          confirmLabel="Delete"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

const ghostBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-secondary)",
  padding: "4px 8px",
  cursor: "pointer",
  borderRadius: "var(--radius-md)",
  fontSize: "var(--label)",
};
