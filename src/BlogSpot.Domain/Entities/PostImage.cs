using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

public class PostImage : BaseEntity
{
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; } = 0;

    // Foreign key
    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;
}
