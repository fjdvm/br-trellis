namespace ApiOos.DTOs.Responses;

public class JobApplicationResponseDto
{
    public Guid Id { get; set; }
    public Guid JobPostingId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string CoverLetter { get; set; } = string.Empty;
    public string ResumeUrl { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
}
