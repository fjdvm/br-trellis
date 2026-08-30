using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "source",
                table: "ticket",
                type: "TEXT",
                nullable: false,
                defaultValue: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_ticket_source",
                table: "ticket",
                column: "source");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ticket_source",
                table: "ticket");

            migrationBuilder.DropColumn(
                name: "source",
                table: "ticket");
        }
    }
}
