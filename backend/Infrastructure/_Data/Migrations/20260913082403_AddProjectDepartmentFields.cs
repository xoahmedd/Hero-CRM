using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure._Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectDepartmentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MissedDeadlineReason",
                table: "TaskItems",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReasonCategory",
                table: "TaskItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BusinessJustification",
                table: "Projects",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MissedDeadlineReason",
                table: "Projects",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReasonCategory",
                table: "Projects",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Projects",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestedBy",
                table: "Projects",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestingDepartment",
                table: "Projects",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProjectId",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TaskId",
                table: "Notifications",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_ProjectId",
                table: "Notifications",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_TaskId",
                table: "Notifications",
                column: "TaskId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notifications_ProjectId",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_TaskId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "MissedDeadlineReason",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "ReasonCategory",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "BusinessJustification",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "MissedDeadlineReason",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ReasonCategory",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "RequestedBy",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "RequestingDepartment",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "TaskId",
                table: "Notifications");
        }
    }
}
