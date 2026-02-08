using BlogSpot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BlogSpot.Infrastructure.Data.Configurations;

public class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.DisplayName).HasMaxLength(100);
        builder.Property(p => p.Bio).HasMaxLength(1000);
        builder.Property(p => p.ProfilePictureUrl).HasMaxLength(500);
        builder.Property(p => p.CoverPhotoUrl).HasMaxLength(500);
        builder.Property(p => p.Website).HasMaxLength(200);
        builder.Property(p => p.Location).HasMaxLength(100);
        builder.Property(p => p.SocialLinks).HasMaxLength(2000);
        builder.Property(p => p.Skills).HasMaxLength(1000);

        builder.HasIndex(p => p.UserId).IsUnique();
    }
}
