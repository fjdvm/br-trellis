using api_crms.Helpers;

namespace api_crms.Services;

public sealed partial class CampaignService
{
    public string RenderPreviewHtml(string? content) => EmailBodyRenderer.RenderToHtml(content);
}
