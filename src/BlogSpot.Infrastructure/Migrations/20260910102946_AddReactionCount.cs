using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogSpot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReactionCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var intType = migrationBuilder.ActiveProvider == "Npgsql.EntityFrameworkCore.PostgreSQL"
                ? "integer" : "int";

            migrationBuilder.AddColumn<int>(
                name: "Count",
                table: "Reactions",
                type: intType,
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Count",
                table: "Reactions");
        }
    }
}
