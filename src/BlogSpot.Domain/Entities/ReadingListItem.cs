using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// A single blog post saved into a ReadingList.
/// </summary>
public class ReadingListItem : BaseEntity
{
    // Foreign keys
    public Guid ReadingListId { get; set; }
    public ReadingList ReadingList { get; set; } = null!;

    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;
}
