import { useNavigate } from "react-router-dom";
import { useFeatures } from "../hooks/useFeatures";
import logo from "../assets/lucidforge-logo.png";
import type { Feature } from "../types";

function statusColor(status: string): string {
  switch (status) {
    case "user-review":
      return "var(--accent)";
    case "approved":
      return "var(--success)";
    case "cancelled":
      return "var(--error)";
    default:
      return "var(--text-secondary)";
  }
}

function FeatureCard({ feature }: { feature: Feature }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/feature/${feature.id}`)}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-xl)",
        cursor: "pointer",
        transition: "var(--transition-card)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--card-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--card)")
      }
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-md)",
        }}
      >
        <span
          style={{
            fontSize: "var(--title)",
            fontWeight: "var(--weight-semibold)",
          }}
        >
          {feature.name}
        </span>
        <span
          style={{
            fontSize: "var(--label)",
            fontWeight: "var(--weight-bold)",
            color: statusColor(feature.status),
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "3px 8px",
          }}
        >
          {feature.status}
        </span>
      </div>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "var(--body)",
          marginBottom: "var(--space-md)",
        }}
      >
        {feature.description}
      </p>
      <div
        style={{
          display: "flex",
          gap: "var(--space-lg)",
          fontSize: "var(--label)",
          color: "var(--text-dim)",
        }}
      >
        <span>{feature.stepCount} steps</span>
        <span>${feature.usage?.totalCostUsd?.toFixed(2) ?? "0.00"}</span>
      </div>
    </div>
  );
}

export function FeatureListPage() {
  const { features, loading } = useFeatures();
  const navigate = useNavigate();

  return (
    <div style={{ position: "relative", height: "100%", overflow: "auto" }}>
      <img
        src={logo}
        alt=""
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 300,
          opacity: 0.06,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      <div style={{ position: "relative", padding: "var(--space-xl)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "var(--space-lg)",
          }}
        >
          <button
            onClick={() => navigate("/agents")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--body)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--card)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Agents
          </button>
        </div>
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
        ) : features.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>No features yet.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            {features.map((f) => (
              <FeatureCard key={f.id} feature={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
