namespace BlogSpot.Application.DTOs.User;

public class NotificationPreferencesDto
{
    public bool Follow { get; set; } = true;
    public bool Reaction { get; set; } = true;
    public bool Comment { get; set; } = true;
    public bool CommentLike { get; set; } = true;
    public bool PostPublished { get; set; } = true;
}
