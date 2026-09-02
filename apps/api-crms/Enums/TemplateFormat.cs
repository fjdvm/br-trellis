namespace api_crms.Enums;

// The rendering format of a Template's content. "Html" is the only format used
// this round; "Blocks" is reserved (unused) for a future drag-and-drop builder
// so that adding block-based templates later is additive rather than a rename-
// and-audit of every caller that assumed the content was always raw HTML.
public enum TemplateFormat
{
    Html,
    Blocks,
}
