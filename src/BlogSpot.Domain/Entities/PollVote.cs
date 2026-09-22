using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// A single user's vote for one PollOption. One vote per user per poll (enforced in BlogService).
/// </summary>
public class PollVote : BaseEntity
{
    // Foreign keys
    public Guid PollOptionId { get; set; }
    public PollOption PollOption { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
