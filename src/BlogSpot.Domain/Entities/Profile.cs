using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// Enhanced user profile with skills, social links, and cover photo.
/// </summary>
public class Profile : BaseEntity
{
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? CoverPhotoUrl { get; set; }
    public string? Website { get; set; }
    public string? Location { get; set; }

    // Social links stored as JSON: {"github":"...","twitter":"...","linkedin":"..."}
    public string? SocialLinks { get; set; }

    // Skills stored as comma-separated: "C#, Angular, SQL"
    public string? Skills { get; set; }

    // Foreign key
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
