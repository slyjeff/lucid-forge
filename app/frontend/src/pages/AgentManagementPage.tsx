import { useNavigate } from "react-router-dom";
import { useAgents } from "../hooks/useAgents";

export function AgentManagementPage() {
  const navigate = useNavigate();
  const { agents, loading } = useAgents();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
      </div>

      <div style={{ flex: 1, padding: "var(--space-xl)" }}>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
