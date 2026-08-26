import { render, screen } from "@testing-library/react";
import { AtRiskSegmentPage } from "@/components/features/contacts/AtRiskSegmentPage";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    segments: {
      list: jest.fn(),
      getMembers: jest.fn(),
    },
  },
}));

describe("AtRiskSegmentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders At-Risk segment members instead of a coming-soon placeholder", async () => {
    jest.mocked(crmClient.segments.list).mockResolvedValue([
      {
        id: "seg-at-risk",
        name: "At-Risk Customers",
        type: "Dynamic",
        isSystemDefined: true,
        rule: {
          matchMode: "MatchAll",
          conditions: [
            { field: "SentimentScore", operator: "less_than", value: "0" },
          ],
        },
        memberCount: 2,
      },
    ]);

    jest.mocked(crmClient.segments.getMembers).mockResolvedValue([
      {
        id: "ct-1",
        name: "Sofia Nakamura",
        email: "sofia@test.com",
        phone: "+1 555-0103",
        companyName: "Initech",
        lifetimeValue: 0,
      },
      {
        id: "ct-2",
        name: "Ava Patel",
        email: "ava@test.com",
        phone: "+1 555-0105",
        companyName: "Acme Corp",
        lifetimeValue: 500,
      },
    ]);

    render(<AtRiskSegmentPage />);

    // Should render real segment data, not "coming soon"
    expect(await screen.findByText("Sofia Nakamura")).toBeInTheDocument();
    expect(screen.getByText("Ava Patel")).toBeInTheDocument();
    expect(screen.getByText("At-Risk Customers")).toBeInTheDocument();
    expect(screen.queryByText("Coming Soon")).not.toBeInTheDocument();
    expect(crmClient.segments.getMembers).toHaveBeenCalledWith("seg-at-risk");
  });

  it("shows error when At-Risk segment is not found", async () => {
    jest.mocked(crmClient.segments.list).mockResolvedValue([]);

    render(<AtRiskSegmentPage />);

    expect(
      await screen.findByText("At-Risk Customers segment not found.")
    ).toBeInTheDocument();
  });
});
