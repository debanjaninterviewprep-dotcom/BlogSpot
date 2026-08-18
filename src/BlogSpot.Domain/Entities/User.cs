using BlogSpot.Domain.Common;
using BlogSpot.Domain.Enums;

namespace BlogSpot.Domain.Entities;

/// <summary>
/// User entity with enhanced navigation properties for social features.
/// </summary>
public class User : BaseEntity
{
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public Profile Profile { get; set; } = null!;
    public ICollection<BlogPost> BlogPosts { get; set; } = new List<BlogPost>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
    public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    public ICollection<Bookmark> Bookmarks { get; set; } = new List<Bookmark>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<DraftBlog> Drafts { get; set; } = new List<DraftBlog>();
    public ICollection<Follow> Followers { get; set; } = new List<Follow>();   // People who follow this user
    public ICollection<Follow> Following { get; set; } = new List<Follow>();   // People this user follows
}
