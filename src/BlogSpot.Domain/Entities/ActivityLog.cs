using BlogSpot.Domain.Enums;

namespace BlogSpot.Domain.Entities;

public class ActivityLog
{
    public long Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Logger { get; set; } = string.Empty;
    public LogLevel Level { get; set; } = LogLevel.Info;
    public string? Message { get; set; }
    public string? UserName { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
