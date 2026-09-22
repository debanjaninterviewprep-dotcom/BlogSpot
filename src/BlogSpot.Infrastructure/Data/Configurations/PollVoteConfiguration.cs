using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class PollVoteConfiguration : IEntityTypeConfiguration<PollVote>
{
    public void Configure(EntityTypeBuilder<PollVote> builder)
    {
        builder.HasKey(v => v.Id);

        builder.HasQueryFilter(v => !v.PollOption.Poll.BlogPost.IsDeleted);

        // A user can only vote once for a given option (poll-wide "one vote" is enforced in BlogService)
        builder.HasIndex(v => new { v.UserId, v.PollOptionId }).IsUnique();
        builder.HasIndex(v => v.PollOptionId);

        builder.HasOne(v => v.PollOption)
            .WithMany(o => o.Votes)
            .HasForeignKey(v => v.PollOptionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.User)
            .WithMany()
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
