using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_crms.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "lifetime_value",
                table: "contact",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "cart",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    platform_cart_id = table.Column<string>(type: "TEXT", nullable: false),
                    contact_id = table.Column<Guid>(type: "TEXT", nullable: true),
                    status = table.Column<string>(type: "TEXT", nullable: false),
                    last_activity_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cart", x => x.id);
                    table.ForeignKey(
                        name: "FK_cart_contact_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contact",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "order",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    platform_order_id = table.Column<string>(type: "TEXT", nullable: false),
                    contact_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    status = table.Column<string>(type: "TEXT", nullable: false),
                    total = table.Column<decimal>(type: "TEXT", nullable: false),
                    refunded_amount = table.Column<decimal>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_contact_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contact",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "processed_event",
                columns: table => new
                {
                    event_id = table.Column<string>(type: "TEXT", nullable: false),
                    event_type = table.Column<string>(type: "TEXT", nullable: false),
                    processed_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_processed_event", x => x.event_id);
                });

            migrationBuilder.CreateTable(
                name: "product",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    platform_product_id = table.Column<string>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    price = table.Column<decimal>(type: "TEXT", nullable: false),
                    in_stock = table.Column<bool>(type: "INTEGER", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "workflow",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    trigger_type = table.Column<string>(type: "TEXT", nullable: false),
                    stop_condition = table.Column<string>(type: "TEXT", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workflow", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cart_item",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    cart_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    product_id = table.Column<string>(type: "TEXT", nullable: false),
                    product_name = table.Column<string>(type: "TEXT", nullable: false),
                    quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    unit_price = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cart_item", x => x.id);
                    table.ForeignKey(
                        name: "FK_cart_item_cart_cart_id",
                        column: x => x.cart_id,
                        principalTable: "cart",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "order_line_item",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    order_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    product_id = table.Column<string>(type: "TEXT", nullable: false),
                    product_name = table.Column<string>(type: "TEXT", nullable: false),
                    quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    unit_price = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_line_item", x => x.id);
                    table.ForeignKey(
                        name: "FK_order_line_item_order_order_id",
                        column: x => x.order_id,
                        principalTable: "order",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workflow_run",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    workflow_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    entity_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    entity_type = table.Column<string>(type: "TEXT", nullable: false),
                    current_step_index = table.Column<int>(type: "INTEGER", nullable: false),
                    status = table.Column<string>(type: "TEXT", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    next_step_due_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workflow_run", x => x.id);
                    table.ForeignKey(
                        name: "FK_workflow_run_workflow_workflow_id",
                        column: x => x.workflow_id,
                        principalTable: "workflow",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workflow_step",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "TEXT", nullable: false),
                    workflow_id = table.Column<Guid>(type: "TEXT", nullable: false),
                    step_order = table.Column<int>(type: "INTEGER", nullable: false),
                    wait_duration = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    action_type = table.Column<string>(type: "TEXT", nullable: false),
                    action_config = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workflow_step", x => x.id);
                    table.ForeignKey(
                        name: "FK_workflow_step_workflow_workflow_id",
                        column: x => x.workflow_id,
                        principalTable: "workflow",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cart_contact_id",
                table: "cart",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_cart_platform_cart_id",
                table: "cart",
                column: "platform_cart_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cart_item_cart_id",
                table: "cart_item",
                column: "cart_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_contact_id",
                table: "order",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_order_platform_order_id",
                table: "order",
                column: "platform_order_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_order_line_item_order_id",
                table: "order_line_item",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_platform_product_id",
                table: "product",
                column: "platform_product_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_workflow_run_status_next_step_due_at",
                table: "workflow_run",
                columns: new[] { "status", "next_step_due_at" });

            migrationBuilder.CreateIndex(
                name: "IX_workflow_run_workflow_id",
                table: "workflow_run",
                column: "workflow_id");

            migrationBuilder.CreateIndex(
                name: "IX_workflow_step_workflow_id",
                table: "workflow_step",
                column: "workflow_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cart_item");

            migrationBuilder.DropTable(
                name: "order_line_item");

            migrationBuilder.DropTable(
                name: "processed_event");

            migrationBuilder.DropTable(
                name: "product");

            migrationBuilder.DropTable(
                name: "workflow_run");

            migrationBuilder.DropTable(
                name: "workflow_step");

            migrationBuilder.DropTable(
                name: "cart");

            migrationBuilder.DropTable(
                name: "order");

            migrationBuilder.DropTable(
                name: "workflow");

            migrationBuilder.DropColumn(
                name: "lifetime_value",
                table: "contact");
        }
    }
}
