using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class BlogPostConfiguration : IEntityTypeConfiguration<BlogPost>
{
    public void Configure(EntityTypeBuilder<BlogPost> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Content)
            .IsRequired();

        builder.Property(p => p.Summary)
            .HasMaxLength(500);

        builder.Property(p => p.Slug)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(p => p.Category)
            .HasMaxLength(100);

        builder.Property(p => p.FeaturedImageUrl)
            .HasMaxLength(500);

        builder.HasIndex(p => p.Slug).IsUnique();
        builder.HasIndex(p => p.CreatedAt);
        builder.HasIndex(p => new { p.IsPublished, p.CreatedAt });
        builder.HasIndex(p => p.Category);

        // One-to-many with Images
        builder.HasMany(p => p.Images)
            .WithOne(i => i.BlogPost)
            .HasForeignKey(i => i.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);

        // One-to-many with Comments
        builder.HasMany(p => p.Comments)
            .WithOne(c => c.BlogPost)
            .HasForeignKey(c => c.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);

        // One-to-many with Likes
        builder.HasMany(p => p.Likes)
            .WithOne(l => l.BlogPost)
            .HasForeignKey(l => l.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);

        // One-to-many with Reactions
        builder.HasMany(p => p.Reactions)
            .WithOne(r => r.BlogPost)
            .HasForeignKey(r => r.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);

        // One-to-many with Bookmarks
        builder.HasMany(p => p.Bookmarks)
            .WithOne(b => b.BlogPost)
            .HasForeignKey(b => b.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
