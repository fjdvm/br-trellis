namespace ApiOos.Interfaces.Services;

/// <summary>
/// Reads the currently-Active Banner/Popup content from api-crms server-to-server
/// (ADR 0005/0008); web-shop never calls api-crms directly. Returns null when
/// nothing is active for the requested channel.
/// </summary>
public interface IActiveContentReader
{
    Task<ActiveContent?> GetActiveContentAsync(string channel, CancellationToken cancellationToken = default);
}

/// <summary>Active storefront content for one channel (Banner or Popup).</summary>
public sealed record ActiveContent(
    Guid CampaignId,
    string Channel,
    string? Heading,
    string? Body,
    string? ImageUrl,
    string? LinkUrl,
    string? CtaText,
    string? CtaUrl,
    bool Dismissible);
