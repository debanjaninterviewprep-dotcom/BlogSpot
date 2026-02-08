using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class ReactionConfiguration : IEntityTypeConfiguration<Reaction>
{
    public void Configure(EntityTypeBuilder<Reaction> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        // One reaction type per user per post
        builder.HasIndex(r => new { r.UserId, r.BlogPostId, r.Type }).IsUnique();
        builder.HasIndex(r => r.BlogPostId);

        builder.HasOne(r => r.User)
            .WithMany(u => u.Reactions)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.BlogPost)
            .WithMany(p => p.Reactions)
            .HasForeignKey(r => r.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
