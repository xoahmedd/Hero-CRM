using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CRM.API.Migrations
{
    public partial class NormalizeHeroTaskWorkflow : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE [TaskItems] SET [Status] = 'Pending' WHERE [Status] = 'Review';");

            migrationBuilder.Sql(
                "UPDATE [TaskItems] SET [Status] = 'Finished' WHERE [Status] = 'Completed';");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE [TaskItems] SET [Status] = 'Review' WHERE [Status] = 'Pending';");

            migrationBuilder.Sql(
                "UPDATE [TaskItems] SET [Status] = 'Completed' WHERE [Status] = 'Finished';");
        }
    }
}
