using BlogSpot.Application.DTOs.Common;

namespace BlogSpot.Application.Interfaces;

public interface IEmailQueueService
{
    /// <summary>Queue a single email for sending.</summary>
    Task EnqueueAsync(string toEmail, string subject, string body, CancellationToken ct = default);

    /// <summary>Queue emails to multiple recipients.</summary>
    Task EnqueueBulkAsync(IEnumerable<string> toEmails, string subject, string body, CancellationToken ct = default);

    /// <summary>Process all queued emails (called by background job).</summary>
    Task ProcessQueueAsync(CancellationToken ct = default);

    /// <summary>Get email queue for admin dashboard.</summary>
    Task<PagedResult<EmailQueueDto>> GetEmailQueueAsync(PaginationParams pagination, CancellationToken ct = default);

    /// <summary>Send OTP to email for verification.</summary>
    Task<string> SendOtpAsync(string email, CancellationToken ct = default);

    /// <summary>Verify OTP code.</summary>
    Task<bool> VerifyOtpAsync(string email, string otpCode, CancellationToken ct = default);
}

public class EmailQueueDto
{
    public Guid Id { get; set; }
    public string ToEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public string? Error { get; set; }
}
