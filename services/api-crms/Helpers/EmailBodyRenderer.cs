using System.Text.Encodings.Web;
using System.Text.RegularExpressions;

namespace api_crms.Helpers;

public static class EmailBodyRenderer
{
    // Matches the "**bold**" / "*italic*" markers the rich-text editor's
    // Bold/Italic toolbar buttons insert around selected plain text.
    private static readonly Regex MarkdownLite = new(@"(\*\*.*?\*\*|\*.*?\*)", RegexOptions.Compiled);
    private static readonly Regex LooksLikeHtml = new(@"<[a-z][\s\S]*>", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public static string RenderToHtml(string? body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return string.Empty;
        }

        var trimmed = body.Trim();
        // Already-authored HTML (e.g. a Html-format template) passes through
        // untouched - it's already a complete document. Otherwise this is plain
        // text from the rich-text editor: encode it and turn its
        // "**bold**"/"*italic*" markers into real tags so they don't leak as
        // literal asterisks.
        return LooksLikeHtml.IsMatch(trimmed) ? body : RenderPlainText(body);
    }

    private static string RenderPlainText(string text) => EncodeBodyText(text).Replace("\n", "<br/>");

    // Shared by every free-text body/heading/paragraph rendering path: HTML-encodes
    // the text, then turns the rich text editor's "**bold**"/"*italic*" markers
    // into real tags.
    private static string EncodeBodyText(string text)
    {
        var encoded = HtmlEncoder.Default.Encode(text);
        return MarkdownLite.Replace(encoded, match =>
        {
            var value = match.Value;
            if (value.StartsWith("**") && value.EndsWith("**") && value.Length >= 4)
            {
                return $"<strong>{value[2..^2]}</strong>";
            }
            if (value.StartsWith("*") && value.EndsWith("*") && value.Length >= 2)
            {
                return $"<em>{value[1..^1]}</em>";
            }
            return value;
        });
    }
}
