namespace BlogSpot.Application.DTOs.User;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? CoverPhotoUrl { get; set; }
    public string? Website { get; set; }
    public string? Location { get; set; }
    public string? SocialLinks { get; set; }
    public List<string> Skills { get; set; } = new();
    public DateTime JoinedAt { get; set; }

    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public int PostsCount { get; set; }
    public bool IsFollowedByCurrentUser { get; set; }
}
