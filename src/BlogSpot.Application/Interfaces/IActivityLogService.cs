using BlogSpot.Application.DTOs.Common;

namespace BlogSpot.Application.Interfaces;

public interface IActivityLogService
{
    Task Info(string action, string logger, string? userName = null, string? message = null, CancellationToken ct = default);
    Task Warn(string action, string logger, string? userName = null, string? message = null, CancellationToken ct = default);
    Task Error(string action, string logger, string? userName = null, string? message = null, CancellationToken ct = default);

    Task<PagedResult<ActivityLogDto>> GetLogsAsync(ActivityLogFilterDto filter, CancellationToken ct = default);
}

public class ActivityLogDto
{
    public long Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Logger { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string? Message { get; set; }
    public string? UserName { get; set; }
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

    public string? Action { get; set; }
    public string? Level { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}

