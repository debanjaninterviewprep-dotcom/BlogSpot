using BlogSpot.Application.DTOs.Common;

namespace BlogSpot.Application.Interfaces;

public interface IActivityLogService
{
    Task LogAsync(
        string action,
        string httpMethod,
        string endpoint,
        Guid? userId = null,
        string? entityType = null,
        string? entityId = null,
        string? details = null,
        Domain.Enums.LogLevel level = Domain.Enums.LogLevel.Info,
        string? ipAddress = null,
        string? userAgent = null,
        int? statusCode = null,
        CancellationToken ct = default);

    Task<PagedResult<ActivityLogDto>> GetLogsAsync(ActivityLogFilterDto filter, CancellationToken ct = default);
}

public class ActivityLogDto
{
    public long Id { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string Level { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string HttpMethod { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public int? StatusCode { get; set; }
    public DateTime Timestamp { get; set; }
}

public class ActivityLogFilterDto
{
    private const int MaxPageSize = 100;
    private int _pageSize = 20;

    public int Page { get; set; } = 1;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }

    public Guid? UserId { get; set; }
    public string? Action { get; set; }
    public string? EntityType { get; set; }
    public string? Level { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}
