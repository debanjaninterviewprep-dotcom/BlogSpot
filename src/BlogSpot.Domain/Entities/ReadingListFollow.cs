using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// A user following (subscribing to) another user's public ReadingList.
/// </summary>
public class ReadingListFollow : BaseEntity
{
    // Foreign keys
    public Guid ReadingListId { get; set; }
    public ReadingList ReadingList { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
