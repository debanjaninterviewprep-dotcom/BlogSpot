using System.ComponentModel.DataAnnotations;
using BlogSpot.Application.DTOs.Blog;

namespace BlogSpot.Application.DTOs.ReadingList;

public class ReadingListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserDisplayName { get; set; }
    public string? UserProfilePictureUrl { get; set; }
    public int ItemCount { get; set; }
    public int FollowerCount { get; set; }
    public bool IsFollowedByCurrentUser { get; set; }
}

public class ReadingListDetailDto : ReadingListDto
{
    public List<BlogPostDto> Posts { get; set; } = new();
}

public class CreateReadingListDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsPublic { get; set; } = true;
}

public class UpdateReadingListDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsPublic { get; set; } = true;
}
