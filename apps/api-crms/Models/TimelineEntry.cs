namespace api_crms.Models;

public sealed class TimelineEntry
{
    public Guid Id { get; set; }

    public Guid ContactId { get; set; }

    public string SourceModule { get; set; } = string.Empty;

    public string EntryType { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public DateTimeOffset OccurredAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public Contact Contact { get; set; } = null!;
}
