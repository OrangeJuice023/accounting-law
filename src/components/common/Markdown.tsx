import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Lesson Markdown renderer (GFM subset). External links open in a new tab
 * with noreferrer; typography comes from the .rr-prose stylesheet.
 */
export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => {
          const external = href?.startsWith('http://') || href?.startsWith('https://');
          return (
            <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
              {children}
            </a>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
