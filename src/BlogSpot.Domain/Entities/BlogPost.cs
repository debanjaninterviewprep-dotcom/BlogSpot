using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// Represents a blog post with enhanced fields for production-ready platform.
/// </summary>
public class BlogPost : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string Slug { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = true;
    public bool IsDraft { get; set; } = false;
    public int ViewCount { get; set; } = 0;
    public int ReadingTimeMinutes { get; set; } = 0;
    public string? Category { get; set; }
    public string? FeaturedImageUrl { get; set; }

    // Foreign key
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;

    // Navigation properties
    public ICollection<PostImage> Images { get; set; } = new List<PostImage>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    public ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();
    public ICollection<BlogPostTag> BlogPostTags { get; set; } = new List<BlogPostTag>();
}
