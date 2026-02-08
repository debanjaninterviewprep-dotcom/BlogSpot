using BlogSpot.Application.DTOs.Blog;
using BlogSpot.Application.DTOs.Common;
using BlogSpot.Application.Interfaces;
using BlogSpot.Domain.Entities;
using BlogSpot.Domain.Enums;
using BlogSpot.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BlogSpot.Application.Services;

/// <summary>
/// Notification service for creating and managing user notifications.
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _uow;

    public NotificationService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<PagedResult<NotificationDto>> GetNotificationsAsync(Guid userId, PaginationParams pagination, CancellationToken ct = default)
    {
        var query = _uow.Notifications.Query()
            .Include(n => n.Actor).ThenInclude(a => a.Profile)
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var notifications = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedResult<NotificationDto>
        {
            Items = notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type.ToString(),
                Message = n.Message,
                ReferenceId = n.ReferenceId,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                ActorId = n.ActorId,
                ActorUserName = n.Actor.UserName,
                ActorDisplayName = n.Actor.Profile?.DisplayName,
                ActorProfilePictureUrl = n.Actor.Profile?.ProfilePictureUrl
            }).ToList(),
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default)
    {
        return await _uow.Notifications.CountAsync(
            n => n.UserId == userId && !n.IsRead, ct);
    }

    public async Task MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken ct = default)
    {
        var notification = await _uow.Notifications.GetByIdAsync(notificationId, ct);
        if (notification == null || notification.UserId != userId) return;

        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;
        _uow.Notifications.Update(notification);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken ct = default)
    {
        var unread = await _uow.Notifications.FindAsync(
            n => n.UserId == userId && !n.IsRead, ct);

        foreach (var notification in unread)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            _uow.Notifications.Update(notification);
        }

        await _uow.SaveChangesAsync(ct);
    }

    public async Task CreateNotificationAsync(Guid userId, Guid actorId, string type, string message, Guid? referenceId = null, CancellationToken ct = default)
    {
        if (userId == actorId) return; // Don't notify yourself

        if (!Enum.TryParse<NotificationType>(type, true, out var parsedType))
            parsedType = NotificationType.Comment;

        var notification = new Notification
        {
            UserId = userId,
            ActorId = actorId,
            Type = parsedType,
            Message = message,
            ReferenceId = referenceId
        };

        await _uow.Notifications.AddAsync(notification, ct);
        await _uow.SaveChangesAsync(ct);
    }
}
