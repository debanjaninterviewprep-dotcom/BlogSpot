using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Enums;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BlogSpot.Infrastructure.Services;

public class EmailQueueService : IEmailQueueService
{
    private readonly IUnitOfWork _uow;
    private readonly IConfiguration _config;
    private readonly ILogger<EmailQueueService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public EmailQueueService(IUnitOfWork uow, IConfiguration config, ILogger<EmailQueueService> logger, IHttpClientFactory httpClientFactory)
    {
        _uow = uow;
        _config = config;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task EnqueueAsync(string toEmail, string subject, string body, CancellationToken ct = default)
    {
        await _uow.EmailQueues.AddAsync(new EmailQueue
        {
            ToEmail = toEmail,
            Subject = subject,
            Body = body,
            Status = EmailStatus.Queued
        }, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task EnqueueBulkAsync(IEnumerable<string> toEmails, string subject, string body, CancellationToken ct = default)
    {
        var emails = toEmails.Select(email => new EmailQueue
        {
            ToEmail = email,
            Subject = subject,
            Body = body,
            Status = EmailStatus.Queued
        });
        await _uow.EmailQueues.AddRangeAsync(emails, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task ProcessQueueAsync(CancellationToken ct = default)
    {
        var pendingEmails = await _uow.EmailQueues.Query()
            .Where(e => e.Status == EmailStatus.Queued && e.RetryCount < 3)
            .OrderBy(e => e.CreatedAt)
            .Take(50) // Process max 50 at a time
            .ToListAsync(ct);

        if (!pendingEmails.Any()) return;

        _logger.LogInformation("Processing {Count} queued emails", pendingEmails.Count);

        foreach (var email in pendingEmails)
        {
            try
            {
                await SendEmailAsync(email.ToEmail, email.Subject, email.Body);
                email.Status = EmailStatus.Sent;
                email.SentAt = DateTime.UtcNow;
                email.Error = null;
            }
            catch (Exception ex)
            {
                email.RetryCount++;
                email.Error = ex.Message;
                if (email.RetryCount >= 3)
                    email.Status = EmailStatus.Failed;

                _logger.LogWarning(ex, "Failed to send email to {Email}, attempt {Retry}", email.ToEmail, email.RetryCount);
            }

            _uow.EmailQueues.Update(email);
        }

        await _uow.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<EmailQueueDto>> GetEmailQueueAsync(PaginationParams pagination, CancellationToken ct = default)
    {
        var query = _uow.EmailQueues.Query()
            .OrderByDescending(e => e.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(e => new EmailQueueDto
            {
                Id = e.Id,
                ToEmail = e.ToEmail,
                Subject = e.Subject,
                Status = e.Status.ToString(),
                CreatedAt = e.CreatedAt,
                SentAt = e.SentAt,
                Error = e.Error
            })
            .ToListAsync(ct);

        return new PagedResult<EmailQueueDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<string> SendOtpAsync(string email, CancellationToken ct = default)
    {
        // Invalidate any existing unused OTPs for this email
        var existing = await _uow.OtpVerifications.FindAsync(
            o => o.Email == email && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow, ct);
        foreach (var old in existing)
        {
            old.IsUsed = true;
            _uow.OtpVerifications.Update(old);
        }

        // Generate 6-digit OTP
        var otp = Random.Shared.Next(100000, 999999).ToString();

        await _uow.OtpVerifications.AddAsync(new OtpVerification
        {
            Email = email,
            OtpCode = otp,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        }, ct);

        // Queue the OTP email
        await _uow.EmailQueues.AddAsync(new EmailQueue
        {
            ToEmail = email,
            Subject = "BlogSpot - Verify your email",
            Body = $@"<div style='font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px'>
                <h2 style='color:#1d9bf0'>BlogSpot Email Verification</h2>
                <p>Your verification code is:</p>
                <div style='font-size:32px;font-weight:700;letter-spacing:8px;background:#f7f9f9;padding:16px 24px;border-radius:12px;text-align:center;margin:16px 0'>{otp}</div>
                <p style='color:#536471;font-size:14px'>This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
            </div>",
            Status = EmailStatus.Queued
        }, ct);

        await _uow.SaveChangesAsync(ct);
        return otp;
    }

    public async Task<bool> VerifyOtpAsync(string email, string otpCode, CancellationToken ct = default)
    {
        var verification = await _uow.OtpVerifications.Query()
            .Where(o => o.Email == email && o.OtpCode == otpCode && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (verification == null) return false;

        verification.IsUsed = true;
        _uow.OtpVerifications.Update(verification);
        await _uow.SaveChangesAsync(ct);
        return true;
    }

    private async Task SendEmailAsync(string to, string subject, string body)
    {
        var apiKey = _config["Email:BrevoApiKey"] ?? "";
        var fromEmail = _config["Email:FromEmail"] ?? "";
        var fromName = _config["Email:FromName"] ?? "BlogSpot";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Brevo API key not configured. Email to {To} skipped.", to);
            return;
        }

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("api-key", apiKey);

        var payload = new
        {
            sender = new { name = fromName, email = fromEmail },
            to = new[] { new { email = to } },
            subject = subject,
            htmlContent = body
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("https://api.brevo.com/v3/smtp/email", content);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            throw new Exception($"Brevo API error ({response.StatusCode}): {errorBody}");
        }
    }
}
