using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.CustomerIdentity.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddIdentityMatchCandidates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "identity_match_candidate",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    source_reference_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    candidate_customer_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    confidence_score = table.Column<decimal>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_identity_match_candidate", x => x.id);
                    table.ForeignKey(
                        name: "FK_identity_match_candidate_customer_candidate_customer_id",
                        column: x => x.candidate_customer_id,
                        principalTable: "customer",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_identity_match_candidate_source_reference_source_reference_id",
                        column: x => x.source_reference_id,
                        principalTable: "source_reference",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_identity_match_candidate_candidate_customer_id",
                table: "identity_match_candidate",
                column: "candidate_customer_id");

            migrationBuilder.CreateIndex(
                name: "IX_identity_match_candidate_source_reference_id",
                table: "identity_match_candidate",
                column: "source_reference_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "identity_match_candidate");
        }
    }
}
