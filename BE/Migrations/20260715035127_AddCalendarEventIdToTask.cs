using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Assistant.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarEventIdToTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "end_time",
                table: "time_tracking",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AddColumn<Guid>(
                name: "CalendarEventId",
                table: "tasks",
                type: "uuid",
                nullable: true);
            migrationBuilder.CreateIndex(
                name: "IX_tasks_CalendarEventId",
                table: "tasks",
                column: "CalendarEventId");

            migrationBuilder.AddForeignKey(
                name: "FK_tasks_calendar_events_CalendarEventId",
                table: "tasks",
                column: "CalendarEventId",
                principalTable: "calendar_events",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tasks_calendar_events_CalendarEventId",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_tasks_CalendarEventId",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "CalendarEventId",
                table: "tasks");

            migrationBuilder.AlterColumn<DateTime>(
                name: "end_time",
                table: "time_tracking",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);
        }
    }
}
