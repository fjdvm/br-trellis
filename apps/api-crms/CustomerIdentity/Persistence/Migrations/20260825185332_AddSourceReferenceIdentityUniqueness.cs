using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.CustomerIdentity.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSourceReferenceIdentityUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_source_reference_source_system_source_id",
                table: "source_reference",
                columns: new[] { "source_system", "source_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_source_reference_source_system_source_id",
                table: "source_reference");
        }
    }
}
