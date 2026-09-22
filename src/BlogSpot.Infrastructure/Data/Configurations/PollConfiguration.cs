using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class PollConfiguration : IEntityTypeConfiguration<Poll>
{
    public void Configure(EntityTypeBuilder<Poll> builder)
    {
        builder.HasKey(p => p.Id);

        builder.HasQueryFilter(p => !p.BlogPost.IsDeleted);

        builder.Property(p => p.Question)
            .IsRequired()
            .HasMaxLength(200);

        // One poll per post
        builder.HasIndex(p => p.BlogPostId).IsUnique();

        builder.HasOne(p => p.BlogPost)
            .WithOne(b => b.Poll)
            .HasForeignKey<Poll>(p => p.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
