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

    public async Task LogAsync(
        string action,
        string httpMethod,
        string endpoint,
        Guid? userId = null,
        string? userName = null,
        string? entityType = null,
        string? entityId = null,
        string? details = null,
        LogLevel level = LogLevel.Info,
        string? ipAddress = null,
        string? userAgent = null,
        int? statusCode = null,
        CancellationToken ct = default)
    {
        var log = new ActivityLog
        {
            UserId = userId,
            UserName = userName,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            Level = level,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            HttpMethod = httpMethod,
            Endpoint = endpoint,
            StatusCode = statusCode,
            Timestamp = DateTime.UtcNow
        };

        _dbContext.Set<ActivityLog>().Add(log);
        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<ActivityLogDto>> GetLogsAsync(ActivityLogFilterDto filter, CancellationToken ct = default)
    {
        var query = _dbContext.Set<ActivityLog>().AsQueryable();

        if (filter.UserId.HasValue)
            query = query.Where(l => l.UserId == filter.UserId.Value);

        if (!string.IsNullOrEmpty(filter.Action))
            query = query.Where(l => l.Action.Contains(filter.Action));

        if (!string.IsNullOrEmpty(filter.EntityType))
            query = query.Where(l => l.EntityType == filter.EntityType);

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
                UserId = l.UserId,
                UserName = l.UserName,
                Action = l.Action,
                EntityType = l.EntityType,
                EntityId = l.EntityId,
                Details = l.Details,
                Level = l.Level.ToString(),
                IpAddress = l.IpAddress,
                UserAgent = l.UserAgent,
                HttpMethod = l.HttpMethod,
                Endpoint = l.Endpoint,
                StatusCode = l.StatusCode,
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
