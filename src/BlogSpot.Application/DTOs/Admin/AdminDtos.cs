namespace BlogSpot.Application.DTOs.Admin;

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int PostsCount { get; set; }
    public int CommentsCount { get; set; }
}

public class AdminPostDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AuthorUserName { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminCommentDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string PostTitle { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
