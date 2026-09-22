using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// A simple single-choice poll embedded in a blog post.
/// </summary>
public class Poll : BaseEntity
{
    public string Question { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }

    // Foreign key (one poll per post)
    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;

    public ICollection<PollOption> Options { get; set; } = new List<PollOption>();
}
