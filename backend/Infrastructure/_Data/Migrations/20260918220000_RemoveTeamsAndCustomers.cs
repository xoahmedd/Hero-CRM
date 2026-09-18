using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure._Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTeamsAndCustomers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Customers_CustomerId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Projects_CustomerId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "Projects");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropTable(
                name: "TeamMembers");

            migrationBuilder.DropTable(
                name: "Teams");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "Projects",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_CustomerId",
                table: "Projects",
                column: "CustomerId");
        }
    }
}

