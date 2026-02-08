using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class BlogPostTagConfiguration : IEntityTypeConfiguration<BlogPostTag>
{
    public void Configure(EntityTypeBuilder<BlogPostTag> builder)
    {
        builder.HasKey(bt => new { bt.BlogPostId, bt.TagId });

        builder.HasOne(bt => bt.BlogPost)
            .WithMany(p => p.BlogPostTags)
            .HasForeignKey(bt => bt.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(bt => bt.Tag)
            .WithMany(t => t.BlogPostTags)
            .HasForeignKey(bt => bt.TagId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(bt => bt.TagId);
    }
}
