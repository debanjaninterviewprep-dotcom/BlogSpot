using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class PollOptionConfiguration : IEntityTypeConfiguration<PollOption>
{
    public void Configure(EntityTypeBuilder<PollOption> builder)
    {
        builder.HasKey(o => o.Id);

        builder.HasQueryFilter(o => !o.Poll.BlogPost.IsDeleted);

        builder.Property(o => o.Text)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(o => o.PollId);

        builder.HasOne(o => o.Poll)
            .WithMany(p => p.Options)
            .HasForeignKey(o => o.PollId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
