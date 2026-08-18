using BlogSpot.Domain.Common;
using BlogSpot.Domain.Enums;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// Emoji reactions (Like, Love, Fire, Clap) on blog posts.
/// </summary>
public class Reaction : BaseEntity
{
    public ReactionType Type { get; set; }

    // Foreign keys
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;
}
