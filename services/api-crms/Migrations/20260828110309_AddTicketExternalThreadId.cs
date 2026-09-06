using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketExternalThreadId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "external_thread_id",
                table: "ticket",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ticket_external_thread_id",
                table: "ticket",
                column: "external_thread_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ticket_external_thread_id",
                table: "ticket");

            migrationBuilder.DropColumn(
                name: "external_thread_id",
                table: "ticket");
        }
    }
}
