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
    public int Status { get; set; } // PostStatus enum value
    public DateTime? ScheduledPublishAt { get; set; }
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
    public int CurrentUserReactionCount { get; set; }

    // Reposts
    public int RepostCount { get; set; }
    public bool IsRepostedByCurrentUser { get; set; }
    public string? CurrentUserRepostQuote { get; set; }

    // Poll (null when this post has no poll)
    public PollDto? Poll { get; set; }

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

public class RepostDto
{
    public Guid Id { get; set; }
    public string? Quote { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserDisplayName { get; set; }
    public string? UserProfilePictureUrl { get; set; }
    public BlogPostDto Post { get; set; } = null!;
}

public class RepostSummaryDto
{
    public int RepostCount { get; set; }
    public bool IsRepostedByCurrentUser { get; set; }
    public string? CurrentUserQuote { get; set; }
}

public class ToggleRepostDto
{
    [System.ComponentModel.DataAnnotations.MaxLength(280)]
    public string? Quote { get; set; }
}

public class PollDto
{
    public Guid Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public bool IsExpired { get; set; }
    public int TotalVotes { get; set; }
    public Guid? CurrentUserVotedOptionId { get; set; }
    public List<PollOptionDto> Options { get; set; } = new();
}

public class PollOptionDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int VoteCount { get; set; }
    public double VotePercentage { get; set; }
}

/// <summary>Input shape used to create (or, if no votes yet, replace) a post's poll from CreateBlogPostDto/UpdateBlogPostDto.</summary>
public class CreatePollDto
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(200, MinimumLength = 3)]
    public string Question { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.MinLength(2)]
    [System.ComponentModel.DataAnnotations.MaxLength(6)]
    public List<string> Options { get; set; } = new();

    public DateTime? ExpiresAt { get; set; }
}

public class VotePollDto
{
    [System.ComponentModel.DataAnnotations.Required]
    public Guid OptionId { get; set; }
}
