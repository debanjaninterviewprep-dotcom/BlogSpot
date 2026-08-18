using System.ComponentModel.DataAnnotations;

namespace BlogSpot.Application.DTOs.Blog;

public class UpdateBlogPostDto
{
    [Required, StringLength(200, MinimumLength = 5)]
    public string Title { get; set; } = string.Empty;

    [Required, MinLength(20)]
    public string Content { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Summary { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    public List<string> Tags { get; set; } = new();

    public bool IsDraft { get; set; } = false;
}
