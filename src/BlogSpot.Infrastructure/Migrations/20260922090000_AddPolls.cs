using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogSpot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPolls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var isNpgsql = migrationBuilder.ActiveProvider == "Npgsql.EntityFrameworkCore.PostgreSQL";
            var guidType = isNpgsql ? "uuid" : "uniqueidentifier";
            var dateType = isNpgsql ? "timestamp with time zone" : "datetime2";
            var questionType = isNpgsql ? "character varying(200)" : "nvarchar(200)";
            var textType = isNpgsql ? "character varying(100)" : "nvarchar(100)";

            migrationBuilder.CreateTable(
                name: "Polls",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: guidType, nullable: false),
                    BlogPostId = table.Column<Guid>(type: guidType, nullable: false),
                    Question = table.Column<string>(type: questionType, maxLength: 200, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: dateType, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: dateType, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: dateType, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Polls", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Polls_BlogPosts_BlogPostId",
                        column: x => x.BlogPostId,
                        principalTable: "BlogPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Polls_BlogPostId",
                table: "Polls",
                column: "BlogPostId",
                unique: true);

            migrationBuilder.CreateTable(
                name: "PollOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: guidType, nullable: false),
                    PollId = table.Column<Guid>(type: guidType, nullable: false),
                    Text = table.Column<string>(type: textType, maxLength: 100, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: dateType, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: dateType, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PollOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PollOptions_Polls_PollId",
                        column: x => x.PollId,
                        principalTable: "Polls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PollOptions_PollId",
                table: "PollOptions",
                column: "PollId");

            migrationBuilder.CreateTable(
                name: "PollVotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: guidType, nullable: false),
                    PollOptionId = table.Column<Guid>(type: guidType, nullable: false),
                    UserId = table.Column<Guid>(type: guidType, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: dateType, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: dateType, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PollVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PollVotes_PollOptions_PollOptionId",
                        column: x => x.PollOptionId,
                        principalTable: "PollOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PollVotes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PollVotes_PollOptionId",
                table: "PollVotes",
                column: "PollOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_PollVotes_UserId_PollOptionId",
                table: "PollVotes",
                columns: new[] { "UserId", "PollOptionId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PollVotes");

            migrationBuilder.DropTable(
                name: "PollOptions");

            migrationBuilder.DropTable(
                name: "Polls");
        }
    }
}
