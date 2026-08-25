namespace api_crms.DTOs;

public sealed record PendingReviewContact(
    PendingReviewContactDetails Contact,
    IReadOnlyList<PendingReviewContactCandidate> Candidates);

public sealed record PendingReviewContactDetails(
    Guid Id,
    string? Name,
    string? Email,
    string? Phone);

public sealed record PendingReviewContactCandidate(
    PendingReviewContactDetails Contact,
    decimal ConfidenceScore);

public sealed record ContactListItemDto(
    Guid Id,
    string? Name,
    string? Email,
    string? Phone,
    string? CompanyName,
    IReadOnlyList<ContactSourceReferenceDto> SourceReferences);

public sealed record ContactSourceReferenceDto(string SourceSystem, string SourceId);

public sealed record ContactDetailDto(
    Guid Id,
    string? Name,
    string? Email,
    string? Phone,
    decimal? SentimentScore,
    ContactCompanyDto? Company,
    IReadOnlyList<ContactSourceReferenceDto> SourceReferences,
    IReadOnlyList<ContactCustomFieldValueDto> CustomFields,
    IReadOnlyList<ContactTimelineEntryDto> TimelineEntries);

public sealed record ContactCompanyDto(Guid Id, string Name);

public sealed record ContactCustomFieldValueDto(
    Guid DefinitionId,
    string Name,
    string FieldType,
    string? TextValue,
    decimal? NumberValue,
    DateTimeOffset? DateValue,
    bool? BoolValue,
    ContactCustomFieldOptionDto? SelectedOption);

public sealed record ContactCustomFieldOptionDto(Guid Id, string Label);

public sealed record ContactTimelineEntryDto(
    Guid Id,
    string SourceModule,
    string EntryType,
    string Summary,
    DateTimeOffset OccurredAt);

public sealed record CustomFieldValueUpdateDto(
    Guid DefinitionId,
    string? TextValue,
    decimal? NumberValue,
    DateTimeOffset? DateValue,
    bool? BoolValue,
    Guid? OptionId);
