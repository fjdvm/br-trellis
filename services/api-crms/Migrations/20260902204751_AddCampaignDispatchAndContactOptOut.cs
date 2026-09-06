using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignDispatchAndContactOptOut : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "marketing_opt_out",
                table: "contact",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "dispatch_errors",
                table: "campaign",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "dispatch_failed_count",
                table: "campaign",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "dispatch_sent_count",
                table: "campaign",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "dispatched_at",
                table: "campaign",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "marketing_opt_out",
                table: "contact");

            migrationBuilder.DropColumn(
                name: "dispatch_errors",
                table: "campaign");

            migrationBuilder.DropColumn(
                name: "dispatch_failed_count",
                table: "campaign");

            migrationBuilder.DropColumn(
                name: "dispatch_sent_count",
                table: "campaign");

            migrationBuilder.DropColumn(
                name: "dispatched_at",
                table: "campaign");
        }
    }
}
