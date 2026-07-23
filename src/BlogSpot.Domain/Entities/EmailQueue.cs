using BlogSpot.Domain.Common;
using BlogSpot.Domain.Enums;

namespace BlogSpot.Domain.Entities;

public class EmailQueue : BaseEntity
{
    public string ToEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public EmailStatus Status { get; set; } = EmailStatus.Queued;
    public DateTime? SentAt { get; set; }
    public string? Error { get; set; }
    public int RetryCount { get; set; } = 0;
}
