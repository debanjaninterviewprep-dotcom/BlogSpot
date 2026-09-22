using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogSpot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReadingLists : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var isNpgsql = migrationBuilder.ActiveProvider == "Npgsql.EntityFrameworkCore.PostgreSQL";
            var guidType = isNpgsql ? "uuid" : "uniqueidentifier";
            var dateType = isNpgsql ? "timestamp with time zone" : "datetime2";
            var boolType = isNpgsql ? "boolean" : "bit";
            var nameType = isNpgsql ? "character varying(100)" : "nvarchar(100)";
            var descriptionType = isNpgsql ? "character varying(500)" : "nvarchar(500)";

            migrationBuilder.CreateTable(
                name: "ReadingLists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: guidType, nullable: false),
                    UserId = table.Column<Guid>(type: guidType, nullable: false),
                    Name = table.Column<string>(type: nameType, maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: descriptionType, maxLength: 500, nullable: true),
                    IsPublic = table.Column<bool>(type: boolType, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: dateType, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: dateType, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReadingLists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReadingLists_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReadingLists_UserId",
                table: "ReadingLists",
                column: "UserId");

            migrationBuilder.CreateTable(
                name: "ReadingListItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: guidType, nullable: false),
                    ReadingListId = table.Column<Guid>(type: guidType, nullable: false),
                    BlogPostId = table.Column<Guid>(type: guidType, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: dateType, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: dateType, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReadingListItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReadingListItems_ReadingLists_ReadingListId",
                        column: x => x.ReadingListId,
                        principalTable: "ReadingLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReadingListItems_BlogPosts_BlogPostId",
                        column: x => x.BlogPostId,
                        principalTable: "BlogPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReadingListItems_BlogPostId",
                table: "ReadingListItems",
                column: "BlogPostId");

            migrationBuilder.CreateIndex(
                name: "IX_ReadingListItems_ReadingListId_BlogPostId",
                table: "ReadingListItems",
                columns: new[] { "ReadingListId", "BlogPostId" },
                unique: true);

            migrationBuilder.CreateTable(
                name: "ReadingListFollows",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: guidType, nullable: false),
                    ReadingListId = table.Column<Guid>(type: guidType, nullable: false),
                    UserId = table.Column<Guid>(type: guidType, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: dateType, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: dateType, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReadingListFollows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReadingListFollows_ReadingLists_ReadingListId",
                        column: x => x.ReadingListId,
                        principalTable: "ReadingLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReadingListFollows_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReadingListFollows_ReadingListId",
                table: "ReadingListFollows",
                column: "ReadingListId");

            migrationBuilder.CreateIndex(
                name: "IX_ReadingListFollows_UserId_ReadingListId",
                table: "ReadingListFollows",
                columns: new[] { "UserId", "ReadingListId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReadingListFollows");

            migrationBuilder.DropTable(
                name: "ReadingListItems");

            migrationBuilder.DropTable(
                name: "ReadingLists");
        }
    }
}
