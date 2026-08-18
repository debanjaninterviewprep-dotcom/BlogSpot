using BlogSpot.Domain.Common;
using BlogSpot.Domain.Enums;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// Notification entity for real-time user notifications via SignalR.
/// </summary>
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>The user who triggered the notification.</summary>
    public Guid ActorId { get; set; }
    public User Actor { get; set; } = null!;

    public NotificationType Type { get; set; }

    /// <summary>Optional reference to blog post, comment, etc.</summary>
    public Guid? ReferenceId { get; set; }

    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
}
