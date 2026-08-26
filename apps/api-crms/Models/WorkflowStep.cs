namespace api_crms.Models;

public sealed class WorkflowStep
{
    public Guid Id { get; set; }
    public Guid WorkflowId { get; set; }
    public int StepOrder { get; set; }
    public TimeSpan WaitDuration { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string ActionConfig { get; set; } = string.Empty;
    public Workflow Workflow { get; set; } = null!;
}
