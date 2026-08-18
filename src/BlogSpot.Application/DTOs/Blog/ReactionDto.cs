using System.ComponentModel.DataAnnotations;

namespace BlogSpot.Application.DTOs.Blog;

/// <summary>
/// DTO for adding/toggling a reaction on a blog post.
/// </summary>
public class ReactionDto
{
    [Required]
    public string Type { get; set; } = string.Empty; // Like, Love, Fire, Clap
}

/// <summary>
/// Summary of reactions on a blog post.
/// </summary>
public class ReactionSummaryDto
{
    public Dictionary<string, int> Counts { get; set; } = new();
    public int TotalCount { get; set; }
    public string? CurrentUserReaction { get; set; }
}
