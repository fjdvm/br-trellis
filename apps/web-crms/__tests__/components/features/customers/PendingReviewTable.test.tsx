import { render, screen } from "@testing-library/react";
import { PendingReviewTable } from "@/features/customers/components/pending-review-table";
import { customerIdentityApi } from "@/features/customers/services/customers-api";

jest.mock("@/features/customers/services/customers-api", () => ({
  customerIdentityApi: {
      listPendingReviewCustomers: jest.fn(),
    }
}));

describe("PendingReviewTable", () => {
  it("displays a pending Customer with its candidate confidence", async () => {
    jest.mocked(customerIdentityApi.listPendingReviewCustomers).mockResolvedValue([
      {
        customer: {
          id: "pending-customer",
          name: "Maya C.",
          email: "maya.c@example.com",
          phone: null,
        },
        candidates: [
          {
            customer: {
              id: "candidate-customer",
              name: "Maya Chen",
              email: "maya@example.com",
              phone: "5550100",
            },
            confidenceScore: 0.5,
          },
        ],
      },
    ]);

    render(<PendingReviewTable />);

    expect(await screen.findByText("Maya C.")).toBeInTheDocument();
    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("50% confidence")).toBeInTheDocument();
  });
});
