using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// Tag entity for categorizing blog posts.
/// </summary>
public class Tag : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string NormalizedName { get; set; } = string.Empty;

    // Navigation
    public ICollection<BlogPostTag> BlogPostTags { get; set; } = new List<BlogPostTag>();
}
