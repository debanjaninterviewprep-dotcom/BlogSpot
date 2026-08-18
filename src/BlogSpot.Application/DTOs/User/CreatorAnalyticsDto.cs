namespace BlogSpot.Application.DTOs.User;

/// <summary>
/// Creator analytics dashboard data.
/// </summary>
public class CreatorAnalyticsDto
{
    public int TotalViews { get; set; }
    public int TotalReactions { get; set; }
    public int TotalComments { get; set; }
    public int TotalFollowers { get; set; }
    public int FollowersGrowthLast30Days { get; set; }
    public List<TopPostDto> TopPosts { get; set; } = new();
    public List<DailyStatDto> DailyStats { get; set; } = new();
}

public class TopPostDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int ReactionCount { get; set; }
    public int CommentCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DailyStatDto
{
    public DateTime Date { get; set; }
    public int Views { get; set; }
    public int Reactions { get; set; }
    public int Followers { get; set; }
}
