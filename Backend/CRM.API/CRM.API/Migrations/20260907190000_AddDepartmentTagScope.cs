using CRM.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260907190000_AddDepartmentTagScope")]
    public partial class AddDepartmentTagScope : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrganizationTags_Name",
                table: "OrganizationTags");

            migrationBuilder.AddColumn<string>(
                name: "Scope",
                table: "OrganizationTags",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "Organization");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationTags_Scope_Name",
                table: "OrganizationTags",
                columns: new[] { "Scope", "Name" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrganizationTags_Scope_Name",
                table: "OrganizationTags");

            migrationBuilder.DropColumn(
                name: "Scope",
                table: "OrganizationTags");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationTags_Name",
                table: "OrganizationTags",
                column: "Name",
                unique: true);
        }
    }
}
