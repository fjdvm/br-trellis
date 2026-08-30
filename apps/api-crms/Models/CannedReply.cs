namespace api_crms.Models;

public sealed class CannedReply
{
    public Guid Id { get; set; }

    public Guid CategoryId { get; set; }

    public CannedReplyCategory? Category { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }
}
