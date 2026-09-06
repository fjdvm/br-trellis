namespace api_crms.Models;

public sealed class CustomFieldDefinition
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public CustomFieldType FieldType { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<CustomFieldOption> Options { get; } = new List<CustomFieldOption>();

    public ICollection<CustomFieldValue> Values { get; } = new List<CustomFieldValue>();
}
