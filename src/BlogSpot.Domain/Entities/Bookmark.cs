using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// Bookmarked/saved blog posts per user.
/// </summary>
public class Bookmark : BaseEntity
{
    // Foreign keys
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;
}
