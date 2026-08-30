namespace api_crms.Models;

public sealed class CannedReplyCategory
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<CannedReply> CannedReplies { get; } = new List<CannedReply>();
}
