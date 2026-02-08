namespace BlogSpot.Application.DTOs.Blog;

/// <summary>
/// DTO for notification items.
/// </summary>
public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }

    // Actor info
    public Guid ActorId { get; set; }
    public string ActorUserName { get; set; } = string.Empty;
    public string? ActorDisplayName { get; set; }
    public string? ActorProfilePictureUrl { get; set; }
}
