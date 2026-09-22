using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// A user sharing another author's post to their own profile, with an optional quote/commentary.
/// </summary>
public class Repost : BaseEntity
{
    public string? Quote { get; set; }

    // Foreign keys
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;
}
