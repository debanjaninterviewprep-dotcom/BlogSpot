using System.ComponentModel.DataAnnotations;

namespace BlogSpot.Application.DTOs.Auth;

public class LoginDto
{
    /// <summary>Accepts either email address or username.</summary>
    [Required]
    public string EmailOrUsername { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
