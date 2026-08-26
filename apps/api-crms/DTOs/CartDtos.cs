namespace api_crms.DTOs;

public sealed record CartListItemDto(
    Guid Id,
    string PlatformCartId,
    Guid? ContactId,
    string? ContactName,
    string? ContactEmail,
    string Status,
    int ItemCount,
    decimal ItemsTotal,
    DateTimeOffset LastActivityAt,
    WorkflowRunSummaryDto? WorkflowRun);

public sealed record WorkflowRunSummaryDto(
    Guid Id,
    string WorkflowName,
    int CurrentStepIndex,
    int TotalSteps,
    string Status,
    DateTimeOffset NextStepDueAt);
