using api_crms.Enums;
using api_crms.Helpers;

namespace api_crms.Services;

public sealed partial class CampaignService
{
    public string RenderPreviewHtml(string? content, string? theme = null)
    {
        EmailTheme? parsedTheme = Enum.TryParse<EmailTheme>(theme, true, out var t) ? t : null;
        return EmailBodyRenderer.RenderToHtml(content, wrapContainer: false, theme: parsedTheme);
    }
}
