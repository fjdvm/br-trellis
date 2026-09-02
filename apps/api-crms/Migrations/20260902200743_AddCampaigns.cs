using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaigns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "campaign",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    title = table.Column<string>(type: "TEXT", nullable: false),
                    status = table.Column<string>(type: "TEXT", nullable: false),
                    channels = table.Column<string>(type: "TEXT", nullable: false),
                    target_segment_id = table.Column<Guid>(type: "TEXT", nullable: true),
                    target_emails = table.Column<string>(type: "TEXT", nullable: true),
                    resolved_recipients = table.Column<string>(type: "TEXT", nullable: true),
                    schedule_type = table.Column<string>(type: "TEXT", nullable: false),
                    start_date = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    end_date = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    next_run_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    email_terminal = table.Column<bool>(type: "INTEGER", nullable: false),
                    created_by_id = table.Column<string>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campaign", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "campaign_channel_content",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    campaign_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    channel = table.Column<string>(type: "TEXT", nullable: false),
                    template_id = table.Column<Guid>(type: "TEXT", nullable: true),
                    subject = table.Column<string>(type: "TEXT", nullable: true),
                    heading = table.Column<string>(type: "TEXT", nullable: true),
                    body = table.Column<string>(type: "TEXT", nullable: true),
                    image_url = table.Column<string>(type: "TEXT", nullable: true),
                    link_url = table.Column<string>(type: "TEXT", nullable: true),
                    cta_text = table.Column<string>(type: "TEXT", nullable: true),
                    cta_url = table.Column<string>(type: "TEXT", nullable: true),
                    dismissible = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_campaign_channel_content", x => x.id);
                    table.ForeignKey(
                        name: "FK_campaign_channel_content_campaign_campaign_id",
                        column: x => x.campaign_id,
                        principalTable: "campaign",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_campaign_status",
                table: "campaign",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_campaign_channel_content_campaign_id_channel",
                table: "campaign_channel_content",
                columns: new[] { "campaign_id", "channel" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "campaign_channel_content");

            migrationBuilder.DropTable(
                name: "campaign");
        }
    }
}
