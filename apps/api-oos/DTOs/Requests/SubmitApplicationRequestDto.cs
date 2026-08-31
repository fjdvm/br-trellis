namespace ApiOos.DTOs.Requests;

using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

public class SubmitApplicationRequestDto
{
    [Required]
    public Guid JobPostingId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string CoverLetter { get; set; } = string.Empty;

    [Required]
    public IFormFile ResumeFile { get; set; } = null!;
}
