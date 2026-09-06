namespace api_crms.Models;

public sealed class CustomFieldOption
{
    public Guid Id { get; set; }

    public Guid CustomFieldDefinitionId { get; set; }

    public string Label { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public CustomFieldDefinition Definition { get; set; } = null!;
}
