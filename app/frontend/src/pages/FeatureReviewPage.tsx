import { useParams, useNavigate } from "react-router-dom";
import { useFeature } from "../hooks/useFeature";

export function FeatureReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { detail, loading, error } = useFeature(id);

  if (loading) {
    return (
      <div style={{ padding: "var(--space-xl)", color: "var(--text-secondary)" }}>
        Loading...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: "var(--space-xl)", color: "var(--error)" }}>
        {error || "Feature not found"}
      </div>
    );
  }

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
          {detail.feature.name}
        </span>
        <span
          style={{
            fontSize: "var(--label)",
            color: "var(--text-dim)",
          }}
        >
          ${detail.feature.usage?.totalCostUsd?.toFixed(2) ?? "0.00"}
        </span>
      </div>

      <div style={{ flex: 1, padding: "var(--space-xl)", color: "var(--text-secondary)" }}>
        Feature review tabs coming in Phase 6.
      </div>
    </div>
  );
}
