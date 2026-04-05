import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content" style={{ lineHeight: 1.7 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                fontSize: "var(--title-lg)",
                fontWeight: "var(--weight-bold)",
                marginBottom: "var(--space-lg)",
                marginTop: "var(--space-xl)",
                color: "var(--text-primary)",
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                fontSize: "var(--title)",
                fontWeight: "var(--weight-semibold)",
                marginBottom: "var(--space-md)",
                marginTop: "var(--space-xl)",
                color: "var(--text-primary)",
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontSize: "var(--body)",
                fontWeight: "var(--weight-semibold)",
                marginBottom: "var(--space-sm)",
                marginTop: "var(--space-lg)",
                color: "var(--text-primary)",
              }}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p
              style={{
                marginBottom: "var(--space-md)",
                color: "var(--text-primary)",
              }}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul
              style={{
                marginBottom: "var(--space-md)",
                paddingLeft: "var(--space-xl)",
              }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              style={{
                marginBottom: "var(--space-md)",
                paddingLeft: "var(--space-xl)",
              }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: "var(--space-xs)" }}>{children}</li>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              return (
                <code
                  style={{
                    display: "block",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "var(--space-lg)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--code)",
                    overflowX: "auto",
                    whiteSpace: "pre",
                  }}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius-sm)",
                  padding: "1px 4px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--code)",
                }}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre style={{ marginBottom: "var(--space-md)" }}>{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: "3px solid var(--accent)",
                paddingLeft: "var(--space-lg)",
                color: "var(--text-secondary)",
                marginBottom: "var(--space-md)",
              }}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: "auto", marginBottom: "var(--space-md)" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  fontSize: "var(--body)",
                }}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              style={{
                textAlign: "left",
                padding: "var(--space-md)",
                borderBottom: "2px solid var(--border)",
                color: "var(--text-primary)",
                fontWeight: "var(--weight-semibold)",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: "var(--space-md)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {children}
            </td>
          ),
          hr: () => (
            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--border)",
                margin: "var(--space-xl) 0",
              }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
