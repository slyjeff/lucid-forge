import { MarkdownRenderer } from "./MarkdownRenderer";

interface DiscoveryTabProps {
  content: string;
}

export function DiscoveryTab({ content }: DiscoveryTabProps) {
  if (!content) {
    return (
      <p style={{ color: "var(--text-secondary)", padding: "var(--space-xl)" }}>
        No discovery document available.
      </p>
    );
  }
  return (
    <div style={{ padding: "var(--space-xl)", maxWidth: 800 }}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
