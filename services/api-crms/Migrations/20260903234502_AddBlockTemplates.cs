using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddBlockTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "block_template",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    description = table.Column<string>(type: "TEXT", nullable: true),
                    channel = table.Column<string>(type: "TEXT", nullable: false),
                    is_archived = table.Column<bool>(type: "INTEGER", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_block_template", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "template_block",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    block_template_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    type = table.Column<string>(type: "TEXT", nullable: false),
                    label = table.Column<string>(type: "TEXT", nullable: false),
                    order = table.Column<int>(type: "INTEGER", nullable: false),
                    text_align = table.Column<string>(type: "TEXT", nullable: true),
                    is_bold = table.Column<bool>(type: "INTEGER", nullable: false),
                    is_italic = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_template_block", x => x.id);
                    table.ForeignKey(
                        name: "FK_template_block_block_template_block_template_id",
                        column: x => x.block_template_id,
                        principalTable: "block_template",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_template_block_block_template_id",
                table: "template_block",
                column: "block_template_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "template_block");

            migrationBuilder.DropTable(
                name: "block_template");
        }
    }
}
