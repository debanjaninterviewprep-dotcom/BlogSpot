using BlogSpot.Domain.Common;

namespace BlogSpot.Domain.Entities;

public class Comment : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public bool IsEdited { get; set; } = false;

    // Foreign keys
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;

    // Self-referencing for nested replies
    public Guid? ParentCommentId { get; set; }
    public Comment? ParentComment { get; set; }
    public ICollection<Comment> Replies { get; set; } = new List<Comment>();
}
