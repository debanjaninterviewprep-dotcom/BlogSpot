using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BlogSpot.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RedesignActivityLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var isNpgsql = migrationBuilder.ActiveProvider == "Npgsql.EntityFrameworkCore.PostgreSQL";
            var varchar100 = isNpgsql ? "character varying(100)" : "nvarchar(100)";
            var varchar1000 = isNpgsql ? "character varying(1000)" : "nvarchar(1000)";

            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogs_Users_UserId",
                table: "ActivityLogs");

            migrationBuilder.DropIndex(
                name: "IX_ActivityLogs_UserId",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "Details",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "Endpoint",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "EntityId",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "EntityType",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "HttpMethod",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "StatusCode",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "ActivityLogs");

            migrationBuilder.AddColumn<string>(
                name: "Logger",
                table: "ActivityLogs",
                type: varchar100,
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Message",
                table: "ActivityLogs",
                type: varchar1000,
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            var isNpgsql = migrationBuilder.ActiveProvider == "Npgsql.EntityFrameworkCore.PostgreSQL";
            var varcharMax = isNpgsql ? "text" : "nvarchar(max)";
            var varchar200 = isNpgsql ? "character varying(200)" : "nvarchar(200)";
            var varchar50 = isNpgsql ? "character varying(50)" : "nvarchar(50)";
            var varchar10 = isNpgsql ? "character varying(10)" : "nvarchar(10)";
            var varchar45 = isNpgsql ? "character varying(45)" : "nvarchar(45)";
            var varchar500 = isNpgsql ? "character varying(500)" : "nvarchar(500)";
            var intType = isNpgsql ? "integer" : "int";
            var guidType = isNpgsql ? "uuid" : "uniqueidentifier";

            migrationBuilder.DropColumn(
                name: "Logger",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "Message",
                table: "ActivityLogs");

            migrationBuilder.AddColumn<string>(
                name: "Details",
                table: "ActivityLogs",
                type: varcharMax,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Endpoint",
                table: "ActivityLogs",
                type: varchar200,
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EntityId",
                table: "ActivityLogs",
                type: varchar50,
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EntityType",
                table: "ActivityLogs",
                type: varchar50,
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HttpMethod",
                table: "ActivityLogs",
                type: varchar10,
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "ActivityLogs",
                type: varchar45,
                maxLength: 45,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StatusCode",
                table: "ActivityLogs",
                type: intType,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "ActivityLogs",
                type: varchar500,
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "ActivityLogs",
                type: guidType,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_UserId",
                table: "ActivityLogs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogs_Users_UserId",
                table: "ActivityLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
