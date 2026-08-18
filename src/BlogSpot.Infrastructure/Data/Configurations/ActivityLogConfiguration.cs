using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedOnAdd();

        builder.Property(a => a.Action).HasMaxLength(100).IsRequired();
        builder.Property(a => a.Logger).HasMaxLength(100).IsRequired();
        builder.Property(a => a.Level).HasConversion<string>().HasMaxLength(10);
        builder.Property(a => a.Message).HasMaxLength(1000);
        builder.Property(a => a.UserName).HasMaxLength(50);
        builder.Property(a => a.Timestamp).IsRequired();

        // Index for common queries
        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => a.Action);
        builder.HasIndex(a => a.Level);
    }
}
