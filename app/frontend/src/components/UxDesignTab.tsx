import { MarkdownRenderer } from "./MarkdownRenderer";
import { OpenMockup } from "../../wailsjs/go/main/App";

interface UxDesignTabProps {
  content: string;
  featureId: string;
  mockups: string[];
}

export function UxDesignTab({ content, featureId, mockups }: UxDesignTabProps) {
  if (!content) {
    return (
      <p style={{ color: "var(--text-secondary)", padding: "var(--space-xl)" }}>
        No UX design document available.
      </p>
    );
  }

  return (
    <div style={{ padding: "var(--space-xl)", maxWidth: 800 }}>
      <MarkdownRenderer content={content} />

      {mockups.length > 0 && (
        <div style={{ marginTop: "var(--space-xl)" }}>
          <h3
            style={{
              fontSize: "var(--title)",
              fontWeight: "var(--weight-semibold)",
              marginBottom: "var(--space-md)",
            }}
          >
            Mockups
          </h3>
          <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
            {mockups.map((m) => (
              <button
                key={m}
                onClick={() => OpenMockup(featureId, m)}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "var(--space-md) var(--space-lg)",
                  color: "var(--info)",
                  cursor: "pointer",
                  fontSize: "var(--body)",
                  fontFamily: "var(--font-mono)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--card-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--card)")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
