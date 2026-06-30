using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Assistant.Migrations
{
    /// <inheritdoc />
    public partial class AddPriorityToCalendarEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "priority",
                table: "calendar_events",
                type: "integer",
                nullable: false,
                defaultValue: 2);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "priority",
                table: "calendar_events");
        }
    }
}
