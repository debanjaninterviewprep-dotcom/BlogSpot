using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class ReadingListItemConfiguration : IEntityTypeConfiguration<ReadingListItem>
{
    public void Configure(EntityTypeBuilder<ReadingListItem> builder)
    {
        builder.HasKey(i => i.Id);

        builder.HasQueryFilter(i => !i.BlogPost.IsDeleted);

        // A post can only appear once in a given reading list
        builder.HasIndex(i => new { i.ReadingListId, i.BlogPostId }).IsUnique();
        builder.HasIndex(i => i.BlogPostId);

        builder.HasOne(i => i.ReadingList)
            .WithMany(r => r.Items)
            .HasForeignKey(i => i.ReadingListId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.BlogPost)
            .WithMany(p => p.ReadingListItems)
            .HasForeignKey(i => i.BlogPostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
