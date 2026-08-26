using api_crms.Enums;

namespace api_crms.Models;

public sealed class WorkflowRun
{
    public Guid Id { get; set; }
    public Guid WorkflowId { get; set; }
    public Guid EntityId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int CurrentStepIndex { get; set; }
    public WorkflowRunStatus Status { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset NextStepDueAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public Workflow Workflow { get; set; } = null!;
}
