import { render, screen } from "@testing-library/react";
import { CustomerListTable } from "@/features/customers/components/customer-list-table";
import { customerIdentityApi } from "@/features/customers/services/customers-api";

jest.mock("@/features/customers/services/customers-api", () => ({
  customerIdentityApi: {
      listCustomers: jest.fn(),
    }
}));

describe("CustomerListTable", () => {
  it("displays each customer's linked source references", async () => {
    jest.mocked(customerIdentityApi.listCustomers).mockResolvedValue([
      {
        id: "customer-1",
        name: "Maya Chen",
        email: "maya@example.com",
        phone: "5550100",
        sourceReferences: [
          { sourceSystem: "pos", sourceId: "pos-100" },
          { sourceSystem: "ecommerce", sourceId: "shop-200" },
        ],
      },
    ]);

    render(<CustomerListTable />);

    expect(await screen.findByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("pos · pos-100")).toBeInTheDocument();
    expect(screen.getByText("ecommerce · shop-200")).toBeInTheDocument();
  });
});
