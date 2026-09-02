namespace ApiOos.Interfaces.Services;

/// <summary>
/// The single outbound seam to api-crms for Campaign dispatch (ADR 0008):
/// polls the due-campaigns endpoint and reports the send outcome back.
/// api-crms never calls api-oos.
/// </summary>
public interface ICampaignDispatchClient
{
    Task<IReadOnlyList<DueCampaign>> GetDueCampaignsAsync(CancellationToken cancellationToken = default);

    Task ReportDispatchResultAsync(
        Guid campaignId,
        CampaignDispatchReport report,
        CancellationToken cancellationToken = default);

    /// <summary>Relays a shopper's unsubscribe to api-crms (sets the opt-out flag).</summary>
    Task ReportOptOutAsync(string email, CancellationToken cancellationToken = default);
}

/// <summary>A due Email campaign as returned by api-crms (recipients pre-resolved).</summary>
public sealed record DueCampaign(
    Guid Id,
    string Title,
    string Subject,
    string Body,
    IReadOnlyList<string> Recipients);

/// <summary>The bulk-send outcome api-oos reports back to api-crms.</summary>
public sealed record CampaignDispatchReport(
    int TotalRecipients,
    int SentCount,
    int FailedCount,
    IReadOnlyList<string> Errors);
