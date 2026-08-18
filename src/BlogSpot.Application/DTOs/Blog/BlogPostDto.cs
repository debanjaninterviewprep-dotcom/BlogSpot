namespace BlogSpot.Application.DTOs.Blog;

public class BlogPostDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string Slug { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public bool IsDraft { get; set; }
    public int ViewCount { get; set; }
    public int ReadingTimeMinutes { get; set; }
    public string? Category { get; set; }
    public string? FeaturedImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Author info
    public Guid AuthorId { get; set; }
    public string AuthorUserName { get; set; } = string.Empty;
    public string? AuthorDisplayName { get; set; }
    public string? AuthorProfilePictureUrl { get; set; }

    // Aggregates
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public bool IsBookmarkedByCurrentUser { get; set; }

    // Reactions
    public Dictionary<string, int> ReactionCounts { get; set; } = new();
    public string? CurrentUserReaction { get; set; }

    // Tags
    public List<string> Tags { get; set; } = new();

    // Images
    public List<PostImageDto> Images { get; set; } = new();
}

public class PostImageDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
}
