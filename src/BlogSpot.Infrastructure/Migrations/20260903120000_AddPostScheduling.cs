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
            // Determine the type based on the database provider
            var isPostgres = migrationBuilder.ActiveProvider == "Npgsql.EntityFrameworkCore.PostgreSQL";
            var intType = isPostgres ? "integer" : "int";
            var dateTimeType = isPostgres ? "timestamp with time zone" : "datetime2";

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "BlogPosts",
                type: intType,
                nullable: false,
                defaultValue: 0); // Draft = 0

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledPublishAt",
                table: "BlogPosts",
                type: dateTimeType,
                nullable: true);

            // Migrate existing data: if IsPublished is true, set Status to Published (2)
            var updateSql = isPostgres
                ? @"UPDATE ""BlogPosts""
                   SET ""Status"" = CASE 
                       WHEN ""IsPublished"" = true THEN 2  -- Published
                       WHEN ""IsDraft"" = true THEN 0      -- Draft
                       ELSE 2                              -- Default to Published for old records
                   END"
                : @"UPDATE [BlogPosts]
                   SET [Status] = CASE 
                       WHEN [IsPublished] = 1 THEN 2  -- Published
                       WHEN [IsDraft] = 1 THEN 0      -- Draft
                       ELSE 2                         -- Default to Published for old records
                   END";

            migrationBuilder.Sql(updateSql);
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
