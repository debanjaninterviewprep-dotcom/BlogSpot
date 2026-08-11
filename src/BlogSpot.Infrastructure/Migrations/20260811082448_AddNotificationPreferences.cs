using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogSpot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var textType = migrationBuilder.ActiveProvider == "Npgsql.EntityFrameworkCore.PostgreSQL"
                ? "text" : "nvarchar(max)";

            migrationBuilder.AddColumn<string>(
                name: "NotificationPreferences",
                table: "Profiles",
                type: textType,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotificationPreferences",
                table: "Profiles");
        }
    }
}
