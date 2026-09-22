using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class ReadingListFollowConfiguration : IEntityTypeConfiguration<ReadingListFollow>
{
    public void Configure(EntityTypeBuilder<ReadingListFollow> builder)
    {
        builder.HasKey(f => f.Id);

        // One follow per user per reading list
        builder.HasIndex(f => new { f.UserId, f.ReadingListId }).IsUnique();
        builder.HasIndex(f => f.ReadingListId);

        builder.HasOne(f => f.ReadingList)
            .WithMany(r => r.Followers)
            .HasForeignKey(f => f.ReadingListId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.User)
            .WithMany(u => u.ReadingListFollows)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
