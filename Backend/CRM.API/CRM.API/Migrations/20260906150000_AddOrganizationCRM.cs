using CRM.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260906150000_AddOrganizationCRM")]
    public partial class AddOrganizationCRM : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OwnerId",
                table: "Customers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Region",
                table: "Customers",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Customers",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Other");

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Customers",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Contacts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrganizationId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    JobTitle = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contacts_Customers_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Convert legacy Customer records that had a separate Company value:
            // the company becomes the Organization and the old named person becomes its primary Contact.
            migrationBuilder.Sql(
                @"INSERT INTO [Contacts] ([OrganizationId], [Name], [JobTitle], [Email], [Phone], [IsPrimary], [CreatedAt], [UpdatedAt])
                  SELECT [Id], [Name], NULL, [Email], [Phone], 1, SYSUTCDATETIME(), NULL
                  FROM [Customers]
                  WHERE [Company] IS NOT NULL
                    AND LTRIM(RTRIM([Company])) <> ''
                    AND LTRIM(RTRIM([Name])) <> LTRIM(RTRIM([Company]));

                  UPDATE [Customers]
                  SET [Name] = [Company]
                  WHERE [Company] IS NOT NULL
                    AND LTRIM(RTRIM([Company])) <> '';");

            migrationBuilder.CreateTable(
                name: "OrganizationNotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrganizationId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrganizationNotes_Customers_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrganizationNotes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OrganizationTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Color = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationTags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrganizationTagAssignments",
                columns: table => new
                {
                    OrganizationId = table.Column<int>(type: "int", nullable: false),
                    TagId = table.Column<int>(type: "int", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationTagAssignments", x => new { x.OrganizationId, x.TagId });
                    table.ForeignKey(
                        name: "FK_OrganizationTagAssignments_Customers_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrganizationTagAssignments_OrganizationTags_TagId",
                        column: x => x.TagId,
                        principalTable: "OrganizationTags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Customers_OwnerId",
                table: "Customers",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Region",
                table: "Customers",
                column: "Region");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Status",
                table: "Customers",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Type",
                table: "Customers",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_Email",
                table: "Contacts",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_Name",
                table: "Contacts",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_OrganizationId",
                table: "Contacts",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationNotes_OrganizationId_CreatedAt",
                table: "OrganizationNotes",
                columns: new[] { "OrganizationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationNotes_UserId",
                table: "OrganizationNotes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationTagAssignments_TagId",
                table: "OrganizationTagAssignments",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationTags_Name",
                table: "OrganizationTags",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Users_OwnerId",
                table: "Customers",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Users_OwnerId",
                table: "Customers");

            migrationBuilder.DropTable(name: "Contacts");
            migrationBuilder.DropTable(name: "OrganizationNotes");
            migrationBuilder.DropTable(name: "OrganizationTagAssignments");
            migrationBuilder.DropTable(name: "OrganizationTags");

            migrationBuilder.DropIndex(name: "IX_Customers_OwnerId", table: "Customers");
            migrationBuilder.DropIndex(name: "IX_Customers_Region", table: "Customers");
            migrationBuilder.DropIndex(name: "IX_Customers_Status", table: "Customers");
            migrationBuilder.DropIndex(name: "IX_Customers_Type", table: "Customers");

            migrationBuilder.DropColumn(name: "OwnerId", table: "Customers");
            migrationBuilder.DropColumn(name: "Region", table: "Customers");
            migrationBuilder.DropColumn(name: "Type", table: "Customers");
            migrationBuilder.DropColumn(name: "Website", table: "Customers");
        }
    }
}
