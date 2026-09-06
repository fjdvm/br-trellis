using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyBuyerTypeAndPrimaryContact : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "buyer_type",
                table: "company",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "primary_contact_id",
                table: "company",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_primary_contact_id",
                table: "company",
                column: "primary_contact_id");

            migrationBuilder.AddForeignKey(
                name: "FK_company_contact_primary_contact_id",
                table: "company",
                column: "primary_contact_id",
                principalTable: "contact",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_company_contact_primary_contact_id",
                table: "company");

            migrationBuilder.DropIndex(
                name: "IX_company_primary_contact_id",
                table: "company");

            migrationBuilder.DropColumn(
                name: "buyer_type",
                table: "company");

            migrationBuilder.DropColumn(
                name: "primary_contact_id",
                table: "company");
        }
    }
}
