namespace api_crms.Interfaces;

public interface ICartAbandonmentService
{
    /// <summary>
    /// Sweeps active carts and flags those that meet abandonment criteria.
    /// Returns the list of cart IDs that were flagged as abandoned.
    /// </summary>
    Task<IReadOnlyList<Guid>> SweepAbandonedCartsAsync(CancellationToken cancellationToken = default);
}
