using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateBlockContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // target_segment_preset is NOT re-added here: it was already added by
            // the earlier 20260905015240_AddCampaignTargetSegmentPreset migration.
            // `dotnet ef migrations add` picked it up again only because the model
            // snapshot had drifted from that migration (a pre-existing gap, unrelated
            // to this change) — fixed below in the snapshot without a duplicate
            // ALTER TABLE that would fail on any database that already has the column.
            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "template_block",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Content",
                table: "template_block");
        }
    }
}
