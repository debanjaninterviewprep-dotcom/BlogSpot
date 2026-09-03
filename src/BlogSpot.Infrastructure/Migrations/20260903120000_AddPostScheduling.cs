using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogSpot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPostScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "BlogPosts",
                type: "integer",
                nullable: false,
                defaultValue: 0); // Draft = 0

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledPublishAt",
                table: "BlogPosts",
                type: "timestamp with time zone",
                nullable: true);

            // Migrate existing data: if IsPublished is true, set Status to Published (2)
            migrationBuilder.Sql(@"
                UPDATE ""BlogPosts""
                SET ""Status"" = CASE 
                    WHEN ""IsPublished"" = true THEN 2  -- Published
                    WHEN ""IsDraft"" = true THEN 0      -- Draft
                    ELSE 2                              -- Default to Published for old records
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledPublishAt",
                table: "BlogPosts");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "BlogPosts");
        }
    }
}
