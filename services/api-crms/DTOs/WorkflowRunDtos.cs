namespace api_crms.DTOs;

public sealed record WorkflowRunListItemDto(
    Guid Id,
    Guid WorkflowId,
    string WorkflowName,
    Guid EntityId,
    string EntityType,
    string? EntityLabel,
    int CurrentStepIndex,
    int TotalSteps,
    string Status,
    DateTimeOffset StartedAt,
    DateTimeOffset NextStepDueAt,
    DateTimeOffset? CompletedAt);
