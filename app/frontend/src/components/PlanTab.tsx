import { MarkdownRenderer } from "./MarkdownRenderer";

interface PlanTabProps {
  content: string;
}

export function PlanTab({ content }: PlanTabProps) {
  if (!content) {
    return (
      <p style={{ color: "var(--text-secondary)", padding: "var(--space-xl)" }}>
        No plan document available.
      </p>
    );
  }
  return (
    <div style={{ padding: "var(--space-xl)", maxWidth: 800 }}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
