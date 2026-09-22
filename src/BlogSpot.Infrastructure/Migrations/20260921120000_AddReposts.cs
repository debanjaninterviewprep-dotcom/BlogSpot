using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogSpot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReposts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var isNpgsql = migrationBuilder.ActiveProvider == "Npgsql.EntityFrameworkCore.PostgreSQL";
            var guidType = isNpgsql ? "uuid" : "uniqueidentifier";
            var dateType = isNpgsql ? "timestamp with time zone" : "datetime2";
            var quoteType = isNpgsql ? "character varying(280)" : "nvarchar(280)";

            migrationBuilder.CreateTable(
                name: "Reposts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: guidType, nullable: false),
                    UserId = table.Column<Guid>(type: guidType, nullable: false),
                    BlogPostId = table.Column<Guid>(type: guidType, nullable: false),
                    Quote = table.Column<string>(type: quoteType, maxLength: 280, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: dateType, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: dateType, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reposts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reposts_BlogPosts_BlogPostId",
                        column: x => x.BlogPostId,
                        principalTable: "BlogPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Reposts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reposts_BlogPostId",
                table: "Reposts",
                column: "BlogPostId");

            migrationBuilder.CreateIndex(
                name: "IX_Reposts_UserId_BlogPostId",
                table: "Reposts",
                columns: new[] { "UserId", "BlogPostId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Reposts");
        }
    }
}
