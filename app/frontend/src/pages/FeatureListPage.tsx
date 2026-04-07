import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFeatures } from "../hooks/useFeatures";
import { GetProjectRoot, SelectProjectRoot, CancelFeature, GetRecentProjectRoots, SwitchProjectRoot, SkillsInstalled, InstallSkills } from "../../wailsjs/go/main/App";
import { Dialog } from "../components/Dialog";
import { ProjectSwitcherDialog } from "../components/ProjectSwitcherDialog";
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

const iconBtnBase: React.CSSProperties = {
  background: "transparent",
  border: "1px solid transparent",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: "var(--radius-md)",
  fontSize: 16,
  lineHeight: 1,
  transition: "background 150ms ease, border-color 150ms ease",
};

interface FeatureCardProps {
  feature: Feature;
  onCancel: (feature: Feature) => void;
}

function FeatureCard({ feature, onCancel }: FeatureCardProps) {
  const navigate = useNavigate();
  const isReviewable = feature.status === "user-review";

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
          alignItems: "center",
          gap: "var(--space-md)",
          marginBottom: "var(--space-md)",
        }}
      >
        <span
          style={{
            fontSize: "var(--title)",
            fontWeight: "var(--weight-semibold)",
            flex: 1,
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
        {isReviewable && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", gap: "var(--space-xs)" }}
          >
            <button
              onClick={() => onCancel(feature)}
              style={{ ...iconBtnBase, color: "var(--error)" }}
              title="Cancel feature"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--error-subtle)";
                e.currentTarget.style.borderColor = "var(--error)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              &#x2716;
            </button>
          </div>
        )}
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
      </div>
    </div>
  );
}

const STATUS_ORDER: Record<string, number> = {
  "user-review": 0,
  "executing": 1,
  "code-review": 2,
  "documenting": 3,
  "planning": 4,
  "discovery": 5,
  "approved": 6,
  "cancelled": 7,
};

function sortFeatures(features: Feature[]): Feature[] {
  return [...features].sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function FeatureListPage() {
  const { features, loading, refetch } = useFeatures();
  const navigate = useNavigate();
  const [projectRoot, setProjectRoot] = useState("");
  const [cancelling, setCancelling] = useState<Feature | null>(null);
  const [recentRoots, setRecentRoots] = useState<string[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [skillsInstalled, setSkillsInstalled] = useState(true);
  const [skillsDismissed, setSkillsDismissed] = useState(false);
  const [installingSkills, setInstallingSkills] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  useEffect(() => {
    GetProjectRoot().then(setProjectRoot);
    SkillsInstalled().then(setSkillsInstalled);
  }, []);

  async function handleInstallSkills() {
    setInstallingSkills(true);
    setSkillsError(null);
    try {
      await InstallSkills();
      setSkillsInstalled(true);
    } catch (err) {
      setSkillsError(String(err));
    } finally {
      setInstallingSkills(false);
    }
  }

  async function handleSelectProject() {
    const recents = await GetRecentProjectRoots();
    if (recents.length === 0) {
      await doBrowse();
    } else {
      setRecentRoots(recents);
      setSwitcherOpen(true);
    }
  }

  async function handlePickRecent(root: string) {
    setSwitcherOpen(false);
    try {
      await SwitchProjectRoot(root);
      setProjectRoot(root);
      // Refresh recent list in case a non-existent entry was pruned
      setRecentRoots(await GetRecentProjectRoots());
      refetch();
    } catch {
      // Directory was removed — refresh and re-open with updated list
      const updated = await GetRecentProjectRoots();
      if (updated.length > 0) {
        setRecentRoots(updated);
        setSwitcherOpen(true);
      } else {
        await doBrowse();
      }
    }
  }

  async function doBrowse() {
    setSwitcherOpen(false);
    const root = await SelectProjectRoot();
    if (root) {
      setProjectRoot(root);
      refetch();
    }
  }

  async function handleCancel(revertChanges: boolean) {
    if (cancelling) {
      await CancelFeature(cancelling.id, revertChanges);
      setCancelling(null);
      refetch();
    }
  }

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
            alignItems: "center",
            gap: "var(--space-md)",
            marginBottom: "var(--space-lg)",
          }}
        >
          <button
            onClick={handleSelectProject}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--label)",
              fontFamily: "var(--font-mono)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 400,
            }}
            title={projectRoot}
          >
            {projectRoot ? projectRoot.split(/[\\/]/).filter(Boolean).pop() : "Select project..."}
          </button>
          <div style={{ flex: 1 }} />
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
        {!skillsInstalled && !skillsDismissed && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "10px var(--space-lg)",
            marginBottom: "var(--space-lg)",
            fontSize: "var(--body)",
          }}>
            <span style={{ flex: 1, color: "var(--text-secondary)" }}>
              LucidForge skills are not installed in Claude Code.
            </span>
            {skillsError && (
              <span style={{ color: "var(--error)", fontSize: "var(--label)" }}>{skillsError}</span>
            )}
            <button
              onClick={handleInstallSkills}
              disabled={installingSkills}
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                cursor: installingSkills ? "default" : "pointer",
                padding: "5px 14px",
                fontSize: "var(--body)",
                opacity: installingSkills ? 0.7 : 1,
              }}
            >
              {installingSkills ? "Installing..." : "Install"}
            </button>
            <button
              onClick={() => setSkillsDismissed(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: "4px 6px",
                fontSize: 14,
                lineHeight: 1,
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
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
            {sortFeatures(features).map((f) => (
              <FeatureCard
                key={f.id}
                feature={f}
                onCancel={setCancelling}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectSwitcherDialog
        open={switcherOpen}
        recentRoots={recentRoots}
        onSelect={handlePickRecent}
        onBrowse={doBrowse}
        onClose={() => setSwitcherOpen(false)}
      />

      {cancelling && (
        <Dialog open={true} onClose={() => setCancelling(null)}>
          <h2
            style={{
              fontSize: "var(--title)",
              fontWeight: "var(--weight-semibold)",
              marginBottom: "var(--space-lg)",
            }}
          >
            Cancel "{cancelling.name}"
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-xl)" }}>
            What should happen to the code changes?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <button
              onClick={() => handleCancel(false)}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "var(--space-md) var(--space-lg)",
                color: "var(--text-primary)",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "var(--body)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ fontWeight: "var(--weight-semibold)", marginBottom: 2 }}>Keep changes</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "var(--label)" }}>
                Mark as cancelled but leave files as-is in the working tree
              </div>
            </button>
            <button
              onClick={() => handleCancel(true)}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "var(--space-md) var(--space-lg)",
                color: "var(--text-primary)",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "var(--body)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--error)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ fontWeight: "var(--weight-semibold)", color: "var(--error)", marginBottom: 2 }}>Revert changes</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "var(--label)" }}>
                Mark as cancelled and revert all modified files to their original state
              </div>
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-lg)" }}>
            <button
              onClick={() => setCancelling(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                padding: "6px 10px",
                cursor: "pointer",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--body)",
              }}
            >
              Never mind
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
