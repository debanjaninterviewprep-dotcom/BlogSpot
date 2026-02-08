namespace BlogSpot.Domain.Entities;

/// <summary>
/// Many-to-many junction table between BlogPosts and Tags.
/// </summary>
public class BlogPostTag
{
    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;

    public Guid TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}
