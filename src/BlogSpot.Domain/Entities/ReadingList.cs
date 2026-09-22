using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// A named, optionally-public collection of blog posts curated by a user (e.g. "My favorite DevOps articles").
/// </summary>
public class ReadingList : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; } = true;

    // Foreign key
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Navigation properties
    public ICollection<ReadingListItem> Items { get; set; } = new List<ReadingListItem>();
    public ICollection<ReadingListFollow> Followers { get; set; } = new List<ReadingListFollow>();
}
