// Formats plain scalar text fields (subject, heading) that carry the rich-text
// editor's "**bold**"/"*italic*" markers or already-authored HTML. Block/body
// content is rendered by the real backend renderer instead (see
// useRenderedPreviewHtml) — this no longer reimplements that logic.
export function renderFormattedText(text: string): React.ReactNode {
  if (!text) return text;

  if (/<[a-z][\s\S]*>/i.test(text)) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }

  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
