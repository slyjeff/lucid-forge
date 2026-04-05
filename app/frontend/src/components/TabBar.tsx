interface Tab {
  id: string;
  label: string;
  visible?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const visibleTabs = tabs.filter((t) => t.visible !== false);

  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-xs)",
        borderBottom: "1px solid var(--border)",
        padding: "0 var(--space-xl)",
      }}
    >
      {visibleTabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
              color: active ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: active ? "var(--weight-semibold)" : "var(--weight-normal)",
              fontSize: "var(--body)",
              padding: "var(--space-md) var(--space-lg)",
              cursor: "pointer",
              transition: "color 100ms ease",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
