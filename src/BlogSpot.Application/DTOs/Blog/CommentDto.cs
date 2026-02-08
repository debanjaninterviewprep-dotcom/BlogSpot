using System.ComponentModel.DataAnnotations;

namespace BlogSpot.Application.DTOs.Blog;

public class CreateCommentDto
{
    [Required, StringLength(2000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;

    public Guid? ParentCommentId { get; set; }
}

public class CommentDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsEdited { get; set; }
    public DateTime CreatedAt { get; set; }

    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserDisplayName { get; set; }
    public string? UserProfilePictureUrl { get; set; }

    public Guid? ParentCommentId { get; set; }
    public List<CommentDto> Replies { get; set; } = new();
}
