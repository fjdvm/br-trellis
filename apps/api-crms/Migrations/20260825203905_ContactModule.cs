using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class ContactModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "company",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "custom_field_definition",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    field_type = table.Column<string>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_custom_field_definition", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "segment",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    type = table.Column<string>(type: "TEXT", nullable: false),
                    is_system_defined = table.Column<bool>(type: "INTEGER", nullable: false),
                    rule = table.Column<string>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_segment", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "contact",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: true),
                    email = table.Column<string>(type: "TEXT", nullable: true),
                    phone = table.Column<string>(type: "TEXT", nullable: true),
                    sentiment_score = table.Column<decimal>(type: "TEXT", nullable: true),
                    company_id = table.Column<Guid>(type: "TEXT", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contact", x => x.id);
                    table.ForeignKey(
                        name: "FK_contact_company_company_id",
                        column: x => x.company_id,
                        principalTable: "company",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "custom_field_option",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    custom_field_definition_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    label = table.Column<string>(type: "TEXT", nullable: false),
                    sort_order = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_custom_field_option", x => x.id);
                    table.ForeignKey(
                        name: "FK_custom_field_option_custom_field_definition_custom_field_definition_id",
                        column: x => x.custom_field_definition_id,
                        principalTable: "custom_field_definition",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "segment_membership",
                columns: table => new
                {
                    segment_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    contact_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_segment_membership", x => new { x.segment_id, x.contact_id });
                    table.ForeignKey(
                        name: "FK_segment_membership_contact_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contact",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_segment_membership_segment_segment_id",
                        column: x => x.segment_id,
                        principalTable: "segment",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "source_reference",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    contact_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    source_system = table.Column<string>(type: "TEXT", nullable: false),
                    source_id = table.Column<string>(type: "TEXT", nullable: false),
                    match_confidence = table.Column<decimal>(type: "TEXT", nullable: true),
                    status = table.Column<string>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_source_reference", x => x.id);
                    table.ForeignKey(
                        name: "FK_source_reference_contact_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contact",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "timeline_entry",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    contact_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    source_module = table.Column<string>(type: "TEXT", nullable: false),
                    entry_type = table.Column<string>(type: "TEXT", nullable: false),
                    summary = table.Column<string>(type: "TEXT", nullable: false),
                    occurred_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_timeline_entry", x => x.id);
                    table.ForeignKey(
                        name: "FK_timeline_entry_contact_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contact",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "custom_field_value",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    contact_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    custom_field_definition_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    text_value = table.Column<string>(type: "TEXT", nullable: true),
                    number_value = table.Column<decimal>(type: "TEXT", nullable: true),
                    date_value = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
                    bool_value = table.Column<bool>(type: "INTEGER", nullable: true),
                    option_id = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_custom_field_value", x => x.id);
                    table.ForeignKey(
                        name: "FK_custom_field_value_contact_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contact",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_custom_field_value_custom_field_definition_custom_field_definition_id",
                        column: x => x.custom_field_definition_id,
                        principalTable: "custom_field_definition",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_custom_field_value_custom_field_option_option_id",
                        column: x => x.option_id,
                        principalTable: "custom_field_option",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "identity_match_candidate",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    source_reference_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    candidate_contact_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    confidence_score = table.Column<decimal>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_identity_match_candidate", x => x.id);
                    table.ForeignKey(
                        name: "FK_identity_match_candidate_contact_candidate_contact_id",
                        column: x => x.candidate_contact_id,
                        principalTable: "contact",
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
                name: "IX_contact_company_id",
                table: "contact",
                column: "company_id");

            migrationBuilder.CreateIndex(
                name: "IX_custom_field_option_custom_field_definition_id",
                table: "custom_field_option",
                column: "custom_field_definition_id");

            migrationBuilder.CreateIndex(
                name: "IX_custom_field_value_contact_id_custom_field_definition_id",
                table: "custom_field_value",
                columns: new[] { "contact_id", "custom_field_definition_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_custom_field_value_custom_field_definition_id",
                table: "custom_field_value",
                column: "custom_field_definition_id");

            migrationBuilder.CreateIndex(
                name: "IX_custom_field_value_option_id",
                table: "custom_field_value",
                column: "option_id");

            migrationBuilder.CreateIndex(
                name: "IX_identity_match_candidate_candidate_contact_id",
                table: "identity_match_candidate",
                column: "candidate_contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_identity_match_candidate_source_reference_id",
                table: "identity_match_candidate",
                column: "source_reference_id");

            migrationBuilder.CreateIndex(
                name: "IX_segment_membership_contact_id",
                table: "segment_membership",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_source_reference_contact_id",
                table: "source_reference",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_source_reference_source_system_source_id",
                table: "source_reference",
                columns: new[] { "source_system", "source_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_timeline_entry_contact_id_occurred_at",
                table: "timeline_entry",
                columns: new[] { "contact_id", "occurred_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "custom_field_value");

            migrationBuilder.DropTable(
                name: "identity_match_candidate");

            migrationBuilder.DropTable(
                name: "segment_membership");

            migrationBuilder.DropTable(
                name: "timeline_entry");

            migrationBuilder.DropTable(
                name: "custom_field_option");

            migrationBuilder.DropTable(
                name: "source_reference");

            migrationBuilder.DropTable(
                name: "segment");

            migrationBuilder.DropTable(
                name: "custom_field_definition");

            migrationBuilder.DropTable(
                name: "contact");

            migrationBuilder.DropTable(
                name: "company");
        }
    }
}
