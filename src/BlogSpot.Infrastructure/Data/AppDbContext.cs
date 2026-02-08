using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BlogSpot.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();
    public DbSet<PostImage> PostImages => Set<PostImage>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Like> Likes => Set<Like>();
    public DbSet<Follow> Follows => Set<Follow>();
    public DbSet<Reaction> Reactions => Set<Reaction>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<DraftBlog> DraftBlogs => Set<DraftBlog>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<BlogPostTag> BlogPostTags => Set<BlogPostTag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
