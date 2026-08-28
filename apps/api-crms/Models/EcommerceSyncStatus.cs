namespace api_crms.Models;

public sealed class EcommerceSyncStatus
{
    public int Id { get; set; } = 1; // Singleton row

    public DateTimeOffset? FirstEventReceivedAt { get; set; }

    public DateTimeOffset? LastEventReceivedAt { get; set; }
}
