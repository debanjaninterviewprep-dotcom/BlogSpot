using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

public class Like : BaseEntity
{
    // Foreign keys
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;
}
