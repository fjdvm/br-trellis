import { render, screen } from "@testing-library/react";
import { PendingReviewTable } from "@/features/contacts/contacts/components/pending-review-table";
import { contactsApi } from "@/features/contacts/contacts/services/contacts-api";

jest.mock("@/features/contacts/contacts/services/contacts-api", () => ({
  contactsApi: {
      listPendingReview: jest.fn(),
    }
}));

describe("PendingReviewTable", () => {
  it("displays a pending Contact with its candidate confidence", async () => {
    jest.mocked(contactsApi.listPendingReview).mockResolvedValue([
      {
        contact: {
          id: "pending-contact",
          name: "Maya C.",
          email: "maya.c@example.com",
          phone: null,
        },
        candidates: [
          {
            contact: {
              id: "candidate-contact",
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
