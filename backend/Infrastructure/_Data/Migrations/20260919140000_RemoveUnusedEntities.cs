using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure._Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUnusedEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskTags");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "Attachments");

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "SubTasks");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = 'Status')
                BEGIN
                    UPDATE Projects 
                    SET Status = 'Finished' 
                    WHERE Status IN ('Finished', 'Completed');

                    UPDATE Projects 
                    SET Status = 'Cancelled' 
                    WHERE Status IN ('Cancelled', 'Canceled', 'Rejected');

                    UPDATE Projects 
                    SET Status = 'InProgress' 
                    WHERE Status NOT IN ('Finished', 'Cancelled');
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}

