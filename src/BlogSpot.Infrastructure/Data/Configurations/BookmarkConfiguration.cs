using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class BookmarkConfiguration : IEntityTypeConfiguration<Bookmark>
{
    public void Configure(EntityTypeBuilder<Bookmark> builder)
    {
        builder.HasKey(b => b.Id);

        // One bookmark per user per post
        builder.HasIndex(b => new { b.UserId, b.BlogPostId }).IsUnique();

        builder.HasOne(b => b.User)
            .WithMany(u => u.Bookmarks)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.BlogPost)
            .WithMany(p => p.Bookmarks)
            .HasForeignKey(b => b.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
