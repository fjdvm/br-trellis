namespace api_crms.CustomerIdentity.Persistence;

public sealed class Customer
{
    public Guid Id { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string? Phone { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<SourceReference> SourceReferences { get; } = new List<SourceReference>();
}
