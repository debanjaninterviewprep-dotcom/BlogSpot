namespace BlogSpot.Application.DTOs.Blog;

/// <summary>
/// DTO for draft auto-save operations.
/// </summary>
public class DraftBlogDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public Guid? BlogPostId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO for saving/updating a draft.
/// </summary>
public class SaveDraftDto
{
    public Guid? Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public Guid? BlogPostId { get; set; }
}
