using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketAndMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ticket",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    contact_id = table.Column<Guid>(type: "TEXT", nullable: true),
                    subject = table.Column<string>(type: "TEXT", nullable: false),
                    status = table.Column<string>(type: "TEXT", nullable: false),
                    waiting_on = table.Column<string>(type: "TEXT", nullable: false),
                    assigned_to_id = table.Column<string>(type: "TEXT", nullable: true),
                    assigned_to_name = table.Column<string>(type: "TEXT", nullable: true),
                    assigned_to_email = table.Column<string>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ticket", x => x.id);
                    table.ForeignKey(
                        name: "FK_ticket_contact_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contact",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "message",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ticket_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    sender_type = table.Column<string>(type: "TEXT", nullable: false),
                    sender_contact_id = table.Column<Guid>(type: "TEXT", nullable: true),
                    sender_staff_id = table.Column<string>(type: "TEXT", nullable: true),
                    sender_staff_name = table.Column<string>(type: "TEXT", nullable: true),
                    content = table.Column<string>(type: "TEXT", nullable: false),
                    sent_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_message", x => x.id);
                    table.ForeignKey(
                        name: "FK_message_contact_sender_contact_id",
                        column: x => x.sender_contact_id,
                        principalTable: "contact",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_message_ticket_ticket_id",
                        column: x => x.ticket_id,
                        principalTable: "ticket",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_message_sender_contact_id",
                table: "message",
                column: "sender_contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_message_ticket_id_sent_at",
                table: "message",
                columns: new[] { "ticket_id", "sent_at" });

            migrationBuilder.CreateIndex(
                name: "IX_ticket_contact_id",
                table: "ticket",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_ticket_status",
                table: "ticket",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_ticket_waiting_on",
                table: "ticket",
                column: "waiting_on");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "message");

            migrationBuilder.DropTable(
                name: "ticket");
        }
    }
}
