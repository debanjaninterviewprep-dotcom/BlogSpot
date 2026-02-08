using BlogSpot.Application.DTOs.Blog;
using BlogSpot.Application.DTOs.Common;

namespace BlogSpot.Application.Interfaces;

/// <summary>
/// Service for managing user notifications.
/// </summary>
public interface INotificationService
{
    Task<PagedResult<NotificationDto>> GetNotificationsAsync(Guid userId, PaginationParams pagination, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);
    Task MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken ct = default);
    Task MarkAllAsReadAsync(Guid userId, CancellationToken ct = default);
    Task CreateNotificationAsync(Guid userId, Guid actorId, string type, string message, Guid? referenceId = null, CancellationToken ct = default);
}
