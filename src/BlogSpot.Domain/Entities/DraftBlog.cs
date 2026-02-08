using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// Auto-saved draft blogs per user. Separate from published BlogPosts.
/// </summary>
public class DraftBlog : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }

    /// <summary>Reference to existing BlogPost if editing a published post.</summary>
    public Guid? BlogPostId { get; set; }
    public BlogPost? BlogPost { get; set; }

    // Foreign key
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
}
