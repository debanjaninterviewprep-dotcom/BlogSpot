using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class DraftBlogConfiguration : IEntityTypeConfiguration<DraftBlog>
{
    public void Configure(EntityTypeBuilder<DraftBlog> builder)
    {
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Title).HasMaxLength(200);
        builder.Property(d => d.Summary).HasMaxLength(500);
        builder.Property(d => d.Category).HasMaxLength(100);
        builder.Property(d => d.Tags).HasMaxLength(500);

        builder.HasIndex(d => d.AuthorId);

        builder.HasOne(d => d.Author)
            .WithMany(u => u.Drafts)
            .HasForeignKey(d => d.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.BlogPost)
            .WithMany()
            .HasForeignKey(d => d.BlogPostId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
