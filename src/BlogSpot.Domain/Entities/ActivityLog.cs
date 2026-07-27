using BlogSpot.Domain.Enums;

namespace BlogSpot.Domain.Entities;

public class ActivityLog
{
    public long Id { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public LogLevel Level { get; set; } = LogLevel.Info;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string HttpMethod { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public int? StatusCode { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation (optional — no FK constraint to avoid blocking log writes)
    public User? User { get; set; }
}
