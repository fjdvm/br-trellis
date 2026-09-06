namespace api_crms.Models;

public sealed class Workflow
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string TriggerType { get; set; } = string.Empty;
    public string StopCondition { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<WorkflowStep> Steps { get; } = new List<WorkflowStep>();
    public ICollection<WorkflowRun> Runs { get; } = new List<WorkflowRun>();
}
