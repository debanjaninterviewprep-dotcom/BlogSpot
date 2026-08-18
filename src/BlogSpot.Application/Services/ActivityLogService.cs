using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BlogSpot.Application.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly DbContext _dbContext;

    public ActivityLogService(DbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task Info(string action, string logger, string? userName = null, string? message = null, CancellationToken ct = default)
        => WriteAsync(action, logger, LogLevel.Info, userName, message, ct);

    public Task Warn(string action, string logger, string? userName = null, string? message = null, CancellationToken ct = default)
        => WriteAsync(action, logger, LogLevel.Warning, userName, message, ct);

    public Task Error(string action, string logger, string? userName = null, string? message = null, CancellationToken ct = default)
        => WriteAsync(action, logger, LogLevel.Error, userName, message, ct);

    private async Task WriteAsync(string action, string logger, LogLevel level, string? userName, string? message, CancellationToken ct)
    {
        var log = new ActivityLog
        {
            Action = action,
            Logger = logger,
            Level = level,
            UserName = userName,
            Message = message,
            Timestamp = DateTime.UtcNow
        };

        _dbContext.Set<ActivityLog>().Add(log);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<ActivityLogDto>> GetLogsAsync(ActivityLogFilterDto filter, CancellationToken ct = default)
    {
        var query = _dbContext.Set<ActivityLog>().AsQueryable();

        if (!string.IsNullOrEmpty(filter.Action))
            query = query.Where(l => l.Action.Contains(filter.Action));

        if (!string.IsNullOrEmpty(filter.Level))
            query = query.Where(l => l.Level.ToString() == filter.Level);

        if (filter.From.HasValue)
            query = query.Where(l => l.Timestamp >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(l => l.Timestamp <= filter.To.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(l => new ActivityLogDto
            {
                Id = l.Id,
                Action = l.Action,
                Logger = l.Logger,
                Level = l.Level.ToString(),
                Message = l.Message,
                UserName = l.UserName,
                Timestamp = l.Timestamp
            })
            .ToListAsync(ct);

        return new PagedResult<ActivityLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }
}
