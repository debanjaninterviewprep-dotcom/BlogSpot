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
        builder.Property(a => a.EntityType).HasMaxLength(50);
        builder.Property(a => a.EntityId).HasMaxLength(50);
        builder.Property(a => a.Level).HasConversion<string>().HasMaxLength(10);
        builder.Property(a => a.IpAddress).HasMaxLength(45);
        builder.Property(a => a.UserAgent).HasMaxLength(500);
        builder.Property(a => a.HttpMethod).HasMaxLength(10).IsRequired();
        builder.Property(a => a.Endpoint).HasMaxLength(200).IsRequired();
        builder.Property(a => a.Timestamp).IsRequired();

        // Index for common queries
        builder.HasIndex(a => a.Timestamp);
        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.Action);
        builder.HasIndex(a => a.Level);

        // Optional FK to User (no cascade — keep logs even if user is deleted)
        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
