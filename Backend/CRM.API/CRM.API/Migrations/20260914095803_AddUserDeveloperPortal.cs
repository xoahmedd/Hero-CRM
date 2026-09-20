using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserDeveloperPortal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            

            migrationBuilder.AddColumn<int>(
                name: "RequestedById",
                table: "Projects",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Description", "Name" },
                values: new object[] { "Developer who works on assigned tasks and projects", "Developer" });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Description", "Name" },
                values: new object[] { "Workspace requester who can submit tasks and project requests", "User" });


            migrationBuilder.CreateIndex(
                name: "IX_Projects_RequestedById",
                table: "Projects",
                column: "RequestedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Users_RequestedById",
                table: "Projects",
                column: "RequestedById",
                principalTable: "Users",
                principalColumn: "Id");

      
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Users_RequestedById",
                table: "Projects");



            migrationBuilder.DropIndex(
                name: "IX_Projects_RequestedById",
                table: "Projects");


            migrationBuilder.DropColumn(
                name: "RequestedById",
                table: "Projects");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Description", "Name" },
                values: new object[] { "Project and team manager", "Manager" });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Description", "Name" },
                values: new object[] { "Regular team member", "Employee" });
        }
    }
}
