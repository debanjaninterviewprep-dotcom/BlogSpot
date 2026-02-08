using BlogSpot.Domain.Entities;

namespace BlogSpot.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<User> Users { get; }
    IRepository<Profile> Profiles { get; }
    IRepository<BlogPost> BlogPosts { get; }
    IRepository<Comment> Comments { get; }
    IRepository<Like> Likes { get; }
    IRepository<PostImage> PostImages { get; }
    IRepository<Reaction> Reactions { get; }
    IRepository<Bookmark> Bookmarks { get; }
    IRepository<Notification> Notifications { get; }
    IRepository<DraftBlog> Drafts { get; }
    IRepository<Tag> Tags { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
