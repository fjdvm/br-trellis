namespace ApiOos.Services;

using System.Net;
using System.Net.Mail;
using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

public class ContactService : IContactService
{
    private readonly IContactInquiryRepository _repository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ContactService> _logger;

    public ContactService(
        IContactInquiryRepository repository,
        IConfiguration configuration,
        ILogger<ContactService> logger)
    {
        _repository = repository;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ContactInquiryResponseDto> CreateInquiryAsync(CreateContactInquiryRequestDto dto)
    {
        var inquiry = new ContactInquiry
        {
            Name = dto.Name,
            Email = dto.Email,
            Subject = dto.Subject,
            Message = dto.Message,
            CreatedAt = DateTime.UtcNow
        };

        var saved = await _repository.CreateAsync(inquiry);

        // Attempt Brevo SMTP notification
        await SendEmailNotificationAsync(saved);

        return new ContactInquiryResponseDto
        {
            Id = saved.Id,
            Name = saved.Name,
            Email = saved.Email,
            Subject = saved.Subject,
            Message = saved.Message,
            CreatedAt = saved.CreatedAt
        };
    }

    private async Task SendEmailNotificationAsync(ContactInquiry inquiry)
    {
        var host = _configuration["Brevo:SmtpHost"] ?? "smtp-relay.brevo.com";
        var portStr = _configuration["Brevo:SmtpPort"];
        int.TryParse(portStr, out var port);
        if (port == 0) port = 587;

        var username = _configuration["Brevo:Username"];
        var password = _configuration["Brevo:Password"];
        var fromEmail = _configuration["Brevo:FromEmail"] ?? inquiry.Email;
        var toEmail = _configuration["Brevo:ToEmail"] ?? "support@brenhalaya.com";

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            _logger.LogWarning("Brevo SMTP credentials not set. Contact inquiry stored to database without sending email.");
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
                From = new MailAddress(fromEmail, "BR Online Shop Contact"),
                Subject = $"New Contact Inquiry: {inquiry.Subject}",
                Body = $"Name: {inquiry.Name}\nEmail: {inquiry.Email}\nSubject: {inquiry.Subject}\n\nMessage:\n{inquiry.Message}",
                IsBodyHtml = false
            };
            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Contact inquiry email successfully sent via Brevo SMTP to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send contact inquiry email via Brevo SMTP.");
        }
    }
}
