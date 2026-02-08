using System.ComponentModel.DataAnnotations;

namespace BlogSpot.Application.DTOs.User;

public class UpdateProfileDto
{
    [StringLength(100)]
    public string? DisplayName { get; set; }

    [StringLength(1000)]
    public string? Bio { get; set; }

    [StringLength(200)]
    public string? Website { get; set; }

    [StringLength(100)]
    public string? Location { get; set; }

    /// <summary>JSON string: {"github":"...","twitter":"...","linkedin":"..."}</summary>
    public string? SocialLinks { get; set; }

    /// <summary>Comma-separated skills.</summary>
    public string? Skills { get; set; }
}
