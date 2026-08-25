namespace api_crms.Models;

public sealed class Contact
{
    public Guid Id { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public decimal? SentimentScore { get; set; }

    public Guid? CompanyId { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public Company? Company { get; set; }

    public ICollection<SourceReference> SourceReferences { get; } = new List<SourceReference>();

    public ICollection<CustomFieldValue> CustomFieldValues { get; } = new List<CustomFieldValue>();

    public ICollection<TimelineEntry> TimelineEntries { get; } = new List<TimelineEntry>();
}
