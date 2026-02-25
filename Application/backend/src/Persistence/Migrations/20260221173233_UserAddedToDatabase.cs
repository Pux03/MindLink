using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UserAddedToDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_guesses_players_PlayerId",
                table: "guesses");

            migrationBuilder.DropForeignKey(
                name: "FK_hints_players_PlayerId",
                table: "hints");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "players");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "game_sessions",
                newName: "Code");

            migrationBuilder.AlterColumn<string>(
                name: "Color",
                table: "teams",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "players",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_players_UserId",
                table: "players",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_guesses_players_PlayerId",
                table: "guesses",
                column: "PlayerId",
                principalTable: "players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_hints_players_PlayerId",
                table: "hints",
                column: "PlayerId",
                principalTable: "players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_players_users_UserId",
                table: "players",
                column: "UserId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_guesses_players_PlayerId",
                table: "guesses");

            migrationBuilder.DropForeignKey(
                name: "FK_hints_players_PlayerId",
                table: "hints");

            migrationBuilder.DropForeignKey(
                name: "FK_players_users_UserId",
                table: "players");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropIndex(
                name: "IX_players_UserId",
                table: "players");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "players");

            migrationBuilder.RenameColumn(
                name: "Code",
                table: "game_sessions",
                newName: "Name");

            migrationBuilder.AlterColumn<int>(
                name: "Color",
                table: "teams",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "players",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_guesses_players_PlayerId",
                table: "guesses",
                column: "PlayerId",
                principalTable: "players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_hints_players_PlayerId",
                table: "hints",
                column: "PlayerId",
                principalTable: "players",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
