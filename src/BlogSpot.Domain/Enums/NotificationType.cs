namespace BlogSpot.Domain.Enums;

/// <summary>
/// Types of notifications sent to users.
/// </summary>
public enum NotificationType
{
    Follow = 0,
    Reaction = 1,
    Comment = 2,
    PostPublished = 3
}
