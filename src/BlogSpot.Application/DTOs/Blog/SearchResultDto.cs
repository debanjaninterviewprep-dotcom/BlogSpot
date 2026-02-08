namespace BlogSpot.Application.DTOs.Blog;

/// <summary>
/// DTO for full-text search results across blogs, tags, and users.
/// </summary>
public class SearchResultDto
{
    public List<BlogPostDto> Posts { get; set; } = new();
    public List<UserSearchResultDto> Users { get; set; } = new();
    public List<string> Tags { get; set; } = new();
    public int TotalResults { get; set; }
}

public class UserSearchResultDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public int FollowersCount { get; set; }
}
