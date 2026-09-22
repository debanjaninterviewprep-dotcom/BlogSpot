using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class RepostConfiguration : IEntityTypeConfiguration<Repost>
{
    public void Configure(EntityTypeBuilder<Repost> builder)
    {
        builder.HasKey(r => r.Id);

        builder.HasQueryFilter(r => !r.BlogPost.IsDeleted);

        builder.Property(r => r.Quote).HasMaxLength(280);

        // One repost per user per post — reposting again toggles it off
        builder.HasIndex(r => new { r.UserId, r.BlogPostId }).IsUnique();
        builder.HasIndex(r => r.BlogPostId);

        builder.HasOne(r => r.User)
            .WithMany(u => u.Reposts)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.BlogPost)
            .WithMany(p => p.Reposts)
            .HasForeignKey(r => r.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
