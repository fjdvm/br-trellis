namespace api_crms.Models;

public sealed class Company
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<Contact> Contacts { get; } = new List<Contact>();
}
