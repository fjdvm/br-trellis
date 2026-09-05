using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignTargetSegmentPreset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "target_segment_preset",
                table: "campaign",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "target_segment_preset",
                table: "campaign");
        }
    }
}
