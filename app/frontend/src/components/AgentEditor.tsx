import { useState } from "react";
import type { Agent } from "../types";
import { agents as agentsNs } from "../types";

interface AgentEditorProps {
  agent?: Agent;
  onSave: (agent: Agent) => void;
  onCancel: () => void;
}

export function AgentEditor({ agent, onSave, onCancel }: AgentEditorProps) {
  const isNew = !agent;
  const [name, setName] = useState(agent?.name ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [model, setModel] = useState(agent?.model ?? "claude-sonnet-4-6");
  const [identity, setIdentity] = useState(agent?.identity ?? "");
  const [directories, setDirectories] = useState<string[]>(
    agent?.directories ?? []
  );
  const [instructions, setInstructions] = useState(agent?.instructions ?? "");
  const [dirInput, setDirInput] = useState("");

  function addDirectory() {
    const dir = dirInput.trim();
    if (dir && !directories.includes(dir)) {
      setDirectories([...directories, dir]);
      setDirInput("");
    }
  }

  function removeDirectory(dir: string) {
    setDirectories(directories.filter((d) => d !== dir));
  }

  function handleSave() {
    const updated = new agentsNs.Agent({
      name: name.trim(),
      description: description.trim(),
      model,
      lucidforge: true,
      identity: identity.trim(),
      directories,
      instructions: instructions.trim(),
      learnings: agent?.learnings ?? "",
      filename: agent?.filename ?? "",
    });
    onSave(updated);
  }

  const canSave = name.trim().length > 0 && (isNew ? directories.length > 0 : true);

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-xl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-lg)",
      }}
    >
      <h3
        style={{
          fontSize: "var(--title)",
          fontWeight: "var(--weight-semibold)",
        }}
      >
        {isNew ? "New Agent" : `Edit ${agent.name}`}
      </h3>

      {/* Name */}
      {isNew && (
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Backend API"
            style={inputStyle}
          />
        </Field>
      )}

      {/* Description */}
      <Field label="Description">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One-line description of this agent's scope"
          style={inputStyle}
        />
      </Field>

      {/* Model */}
      <Field label="Model">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={inputStyle}
        >
          <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
          <option value="claude-opus-4-6">claude-opus-4-6</option>
          <option value="claude-haiku-4-5">claude-haiku-4-5</option>
        </select>
      </Field>

      {/* Identity */}
      <Field label="Identity">
        <textarea
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          rows={2}
          placeholder="You are a ... specialist. You own ..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      {/* Directories */}
      <Field label="Directories">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
          {directories.map((d) => (
            <span
              key={d}
              style={{
                fontSize: "var(--label)",
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                background: "var(--surface)",
                borderRadius: "var(--radius-md)",
                padding: "2px 6px",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-xs)",
              }}
            >
              {d}
              <span
                onClick={() => removeDirectory(d)}
                style={{ cursor: "pointer", color: "var(--error)", fontSize: 10 }}
              >
                &times;
              </span>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <input
            value={dirInput}
            onChange={(e) => setDirInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDirectory()}
            placeholder="src/api/"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={addDirectory} style={ghostButtonStyle}>
            Add
          </button>
        </div>
      </Field>

      {/* Instructions */}
      <Field label="Instructions">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="Guidelines for this agent..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      {/* Learnings (read-only) */}
      {agent?.learnings && (
        <Field label="Learnings (read-only)">
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "var(--space-md)",
              fontSize: "var(--body)",
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
            }}
          >
            {agent.learnings}
          </div>
        </Field>
      )}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-md)" }}>
        <button onClick={onCancel} style={ghostButtonStyle}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            background: canSave ? "var(--accent)" : "var(--border)",
            border: "none",
            color: "white",
            padding: "6px 16px",
            cursor: canSave ? "pointer" : "not-allowed",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--body)",
            fontWeight: "var(--weight-semibold)",
          }}
        >
          {isNew ? "Create" : "Save"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          fontSize: "var(--label)",
          color: "var(--text-secondary)",
          display: "block",
          marginBottom: "var(--space-xs)",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "var(--space-md)",
  color: "var(--text-primary)",
  fontSize: "var(--body)",
  fontFamily: "inherit",
};

const ghostButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-secondary)",
  padding: "6px 10px",
  cursor: "pointer",
  borderRadius: "var(--radius-md)",
  fontSize: "var(--body)",
};
