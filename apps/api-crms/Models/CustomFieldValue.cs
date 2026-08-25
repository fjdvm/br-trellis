namespace api_crms.Models;

public sealed class CustomFieldValue
{
    public Guid Id { get; set; }

    public Guid ContactId { get; set; }

    public Guid CustomFieldDefinitionId { get; set; }

    public string? TextValue { get; set; }

    public decimal? NumberValue { get; set; }

    public DateTimeOffset? DateValue { get; set; }

    public bool? BoolValue { get; set; }

    public Guid? OptionId { get; set; }

    public Contact Contact { get; set; } = null!;

    public CustomFieldDefinition Definition { get; set; } = null!;

    public CustomFieldOption? Option { get; set; }
}
