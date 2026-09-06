namespace ApiOos.Tests.Services;

using ApiOos.Data;
using ApiOos.DTOs.Requests;
using ApiOos.Exceptions;
using ApiOos.Models;
using ApiOos.Repositories;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text;
using Xunit;

public class JobServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly JobPostingRepository _jobPostingRepository;
    private readonly JobApplicationRepository _jobApplicationRepository;
    private readonly FakeWebHostEnvironment _webHostEnvironment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<JobService> _logger;
    private readonly JobService _jobService;

    public JobServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;

        _context = new AppDbContext(options);
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        _jobPostingRepository = new JobPostingRepository(_context);
        _jobApplicationRepository = new JobApplicationRepository(_context);
        _webHostEnvironment = new FakeWebHostEnvironment();

        var inMemorySettings = new Dictionary<string, string?> {
            {"Brevo:SmtpHost", "localhost"},
            {"Brevo:SmtpPort", "25"}
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        _logger = NullLogger<JobService>.Instance;

        _jobService = new JobService(
            _jobPostingRepository,
            _jobApplicationRepository,
            _webHostEnvironment,
            _configuration,
            _logger
        );
    }

    public void Dispose()
    {
        _context.Database.CloseConnection();
        _context.Dispose();
    }

    private class FakeWebHostEnvironment : IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot_test");
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public string ApplicationName { get; set; } = "ApiOos.Tests";
        public string EnvironmentName { get; set; } = "Development";
        public IFileProvider WebRootFileProvider { get; set; } = null!;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }

    private class FormFileMock : IFormFile
    {
        private readonly byte[] _content;

        public FormFileMock(string content, string fileName)
        {
            _content = Encoding.UTF8.GetBytes(content);
            FileName = fileName;
        }

        public string ContentType => "application/octet-stream";
        public string ContentDisposition => $"form-data; name=\"ResumeFile\"; filename=\"{FileName}\"";
        public IHeaderDictionary Headers => new HeaderDictionary();
        public long Length => _content.Length;
        public string Name => "ResumeFile";
        public string FileName { get; }

        public Stream OpenReadStream()
        {
            return new MemoryStream(_content);
        }

        public void CopyTo(Stream target)
        {
            using var stream = OpenReadStream();
            stream.CopyTo(target);
        }

        public async Task CopyToAsync(Stream target, System.Threading.CancellationToken cancellationToken = default)
        {
            using var stream = OpenReadStream();
            await stream.CopyToAsync(target, cancellationToken);
        }
    }

    [Fact]
    public async Task GetActiveJobPostingsAsync_ReturnsOnlyActiveJobs()
    {
        var activeJob = new JobPosting
        {
            Title = "Active Job",
            Description = "Description",
            IsActive = true,
            Location = "Manila",
            Department = "IT"
        };
        var inactiveJob = new JobPosting
        {
            Title = "Inactive Job",
            Description = "Description",
            IsActive = false,
            Location = "Laguna",
            Department = "HR"
        };

        _context.JobPostings.AddRange(activeJob, inactiveJob);
        await _context.SaveChangesAsync();

        var result = await _jobService.GetActiveJobPostingsAsync();

        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.First().Title.Should().Be("Active Job");
    }

    [Fact]
    public async Task SubmitApplicationAsync_WhenJobPostingNotFound_ThrowsNotFoundException()
    {
        var request = new SubmitApplicationRequestDto
        {
            JobPostingId = Guid.NewGuid(),
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "12345",
            CoverLetter = "Hi",
            ResumeFile = new FormFileMock("dummy pdf content", "resume.pdf")
        };

        var act = async () => await _jobService.SubmitApplicationAsync(request);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task SubmitApplicationAsync_WhenFileExtensionInvalid_ThrowsAppException()
    {
        var job = new JobPosting
        {
            Title = "Active Job",
            IsActive = true,
            Location = "Manila",
            Department = "IT"
        };
        _context.JobPostings.Add(job);
        await _context.SaveChangesAsync();

        var request = new SubmitApplicationRequestDto
        {
            JobPostingId = job.Id,
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "12345",
            CoverLetter = "Hi",
            ResumeFile = new FormFileMock("dummy exe content", "malicious.exe")
        };

        var act = async () => await _jobService.SubmitApplicationAsync(request);

        await act.Should().ThrowAsync<AppException>()
            .WithMessage("*Only .pdf, .doc, and .docx files are allowed*");
    }

    [Fact]
    public async Task SubmitApplicationAsync_WhenSuccessful_SavesToDbAndReturnsDto()
    {
        var job = new JobPosting
        {
            Title = "Software Engineer",
            IsActive = true,
            Location = "Manila",
            Department = "IT"
        };
        _context.JobPostings.Add(job);
        await _context.SaveChangesAsync();

        var request = new SubmitApplicationRequestDto
        {
            JobPostingId = job.Id,
            Name = "John Doe",
            Email = "john@example.com",
            Phone = "09123456789",
            CoverLetter = "Hi there",
            ResumeFile = new FormFileMock("dummy pdf content", "resume.pdf")
        };

        var result = await _jobService.SubmitApplicationAsync(request);

        result.Should().NotBeNull();
        result.Name.Should().Be("John Doe");
        result.JobTitle.Should().Be("Software Engineer");
        result.ResumeUrl.Should().StartWith("/uploads/resumes/");
        result.ResumeUrl.Should().EndWith(".pdf");

        // Verify it was stored in DB
        var savedApp = await _context.JobApplications.FirstOrDefaultAsync(a => a.Id == result.Id);
        savedApp.Should().NotBeNull();
        savedApp!.Name.Should().Be("John Doe");
        savedApp.ResumeUrl.Should().Be(result.ResumeUrl);

        // Verify local file exists
        var localFilePath = Path.Combine(_webHostEnvironment.WebRootPath, result.ResumeUrl.TrimStart('/'));
        File.Exists(localFilePath).Should().BeTrue();

        // Clean up test file
        if (File.Exists(localFilePath))
        {
            File.Delete(localFilePath);
        }
    }
}
