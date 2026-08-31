namespace ApiOos.Services;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

public class JobService : IJobService
{
    private readonly IJobPostingRepository _jobPostingRepository;
    private readonly IJobApplicationRepository _jobApplicationRepository;
    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<JobService> _logger;

    public JobService(
        IJobPostingRepository jobPostingRepository,
        IJobApplicationRepository jobApplicationRepository,
        IWebHostEnvironment webHostEnvironment,
        IConfiguration configuration,
        ILogger<JobService> logger)
    {
        _jobPostingRepository = jobPostingRepository;
        _jobApplicationRepository = jobApplicationRepository;
        _webHostEnvironment = webHostEnvironment;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<IEnumerable<JobPostingResponseDto>> GetActiveJobPostingsAsync()
    {
        var postings = await _jobPostingRepository.GetAllActiveAsync();
        return postings.Select(j => MapToPostingDto(j));
    }

    public async Task<JobPostingResponseDto?> GetJobPostingByIdAsync(Guid id)
    {
        var posting = await _jobPostingRepository.GetByIdAsync(id);
        if (posting == null || !posting.IsActive)
        {
            return null;
        }
        return MapToPostingDto(posting);
    }

    public async Task<JobApplicationResponseDto> SubmitApplicationAsync(SubmitApplicationRequestDto request)
    {
        var posting = await _jobPostingRepository.GetByIdAsync(request.JobPostingId);
        if (posting == null || !posting.IsActive)
        {
            throw new NotFoundException("Job posting not found or is no longer active.");
        }

        // Validate resume file
        if (request.ResumeFile == null || request.ResumeFile.Length == 0)
        {
            throw new AppException("Resume file is required.", 400);
        }

        var extension = Path.GetExtension(request.ResumeFile.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".pdf", ".doc", ".docx" };
        if (!allowedExtensions.Contains(extension))
        {
            throw new AppException("Only .pdf, .doc, and .docx files are allowed for resumes.", 400);
        }

        if (request.ResumeFile.Length > 5 * 1024 * 1024)
        {
            throw new AppException("Resume file size must not exceed 5MB.", 400);
        }

        // Store file locally
        var webRootPath = _webHostEnvironment.WebRootPath;
        if (string.IsNullOrEmpty(webRootPath))
        {
            webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }
        var uploadDir = Path.Combine(webRootPath, "uploads", "resumes");
        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadDir, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await request.ResumeFile.CopyToAsync(stream);
        }

        var resumeUrl = $"/uploads/resumes/{uniqueFileName}";

        // Save to DB
        var application = new JobApplication
        {
            JobPostingId = request.JobPostingId,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            CoverLetter = request.CoverLetter ?? string.Empty,
            ResumeUrl = resumeUrl,
            SubmittedAt = DateTime.UtcNow
        };

        var saved = await _jobApplicationRepository.CreateAsync(application);

        // Send Email Notification (optional SMTP)
        await SendEmailNotificationAsync(saved, posting.Title);

        return new JobApplicationResponseDto
        {
            Id = saved.Id,
            JobPostingId = saved.JobPostingId,
            JobTitle = posting.Title,
            Name = saved.Name,
            Email = saved.Email,
            Phone = saved.Phone,
            CoverLetter = saved.CoverLetter,
            ResumeUrl = saved.ResumeUrl,
            SubmittedAt = saved.SubmittedAt
        };
    }

    public async Task<JobPostingResponseDto> CreateJobPostingAsync(CreateJobPostingRequestDto request)
    {
        var posting = new JobPosting
        {
            Title = request.Title,
            Description = request.Description,
            Requirements = request.Requirements ?? string.Empty,
            Location = request.Location,
            Department = request.Department,
            Type = request.Type,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var saved = await _jobPostingRepository.CreateAsync(posting);
        return MapToPostingDto(saved);
    }

    private JobPostingResponseDto MapToPostingDto(JobPosting posting)
    {
        return new JobPostingResponseDto
        {
            Id = posting.Id,
            Title = posting.Title,
            Description = posting.Description,
            Requirements = posting.Requirements,
            Location = posting.Location,
            Department = posting.Department,
            Type = posting.Type,
            IsActive = posting.IsActive,
            CreatedAt = posting.CreatedAt,
            UpdatedAt = posting.UpdatedAt
        };
    }

    private async Task SendEmailNotificationAsync(JobApplication application, string jobTitle)
    {
        var host = _configuration["Brevo:SmtpHost"] ?? "smtp-relay.brevo.com";
        var portStr = _configuration["Brevo:SmtpPort"];
        int.TryParse(portStr, out var port);
        if (port == 0) port = 587;

        var username = _configuration["Brevo:Username"];
        var password = _configuration["Brevo:Password"];
        var fromEmail = _configuration["Brevo:FromEmail"] ?? "careers@brenhalaya.com";
        var toEmail = _configuration["Brevo:ToEmail"] ?? "hr@brenhalaya.com";

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            _logger.LogWarning("Brevo SMTP credentials not set. Job application submitted without sending email.");
            return;
        }

        try
        {
            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail, "BR Online Shop Careers"),
                Subject = $"New Application for {jobTitle}: {application.Name}",
                Body = $"Name: {application.Name}\nEmail: {application.Email}\nPhone: {application.Phone}\nPosition: {jobTitle}\n\nCover Letter:\n{application.CoverLetter}\n\nResume URL: {application.ResumeUrl}",
                IsBodyHtml = false
            };
            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Job application notification email successfully sent via Brevo SMTP to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send job application email via Brevo SMTP.");
        }
    }
}
