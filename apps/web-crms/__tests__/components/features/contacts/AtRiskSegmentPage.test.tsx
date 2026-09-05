import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentsListPage } from "@/features/contacts/components/segments-list-page";
import { segmentsApi } from "@/features/contacts/services/segments-api";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/features/contacts/services/segments-api", () => ({
  segmentsApi: {
      list: jest.fn(),
      getMembers: jest.fn(),
    }
}));

describe("At-Risk Customers via SegmentsListPage (preSelectedSegmentName)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders At-Risk segment members instead of a coming-soon placeholder", async () => {
    jest.mocked(segmentsApi.list).mockResolvedValue([
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

    jest.mocked(segmentsApi.getMembers).mockResolvedValue([
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

    render(<SegmentsListPage preSelectedSegmentName="At-Risk Customers" />);

    // Should render real segment data, not "coming soon"
    expect(await screen.findByText("Sofia Nakamura")).toBeInTheDocument();
    expect(screen.getByText("Ava Patel")).toBeInTheDocument();
    expect(screen.getByText("At-Risk Customers")).toBeInTheDocument();
    expect(screen.queryByText("Coming Soon")).not.toBeInTheDocument();
    expect(segmentsApi.getMembers).toHaveBeenCalledWith("seg-at-risk");
  });

  it("shows error when At-Risk segment is not found", async () => {
    jest.mocked(segmentsApi.list).mockResolvedValue([]);

    render(<SegmentsListPage preSelectedSegmentName="At-Risk Customers" />);

    expect(
      await screen.findByText('Segment "At-Risk Customers" not found.')
    ).toBeInTheDocument();
  });

  it("navigates to contact detail when clicking a member row", async () => {
    const user = userEvent.setup();

    jest.mocked(segmentsApi.list).mockResolvedValue([
      {
        id: "seg-at-risk",
        name: "At-Risk Customers",
        type: "Dynamic",
        isSystemDefined: true,
        rule: null,
        memberCount: 1,
      },
    ]);

    jest.mocked(segmentsApi.getMembers).mockResolvedValue([
      {
        id: "ct-1",
        name: "Sofia Nakamura",
        email: "sofia@test.com",
        phone: "+1 555-0103",
        companyName: "Initech",
        lifetimeValue: 0,
      },
    ]);

    render(<SegmentsListPage preSelectedSegmentName="At-Risk Customers" />);

    // Wait for member to appear
    const memberRow = await screen.findByText("Sofia Nakamura");
    // Click the row (click on the table row containing the member name)
    await user.click(memberRow.closest("tr")!);

    expect(mockPush).toHaveBeenCalledWith("/contacts/ct-1");
  });

  it("does not show Back to Segments button when preSelectedSegmentName is set", async () => {
    jest.mocked(segmentsApi.list).mockResolvedValue([
      {
        id: "seg-at-risk",
        name: "At-Risk Customers",
        type: "Dynamic",
        isSystemDefined: true,
        rule: null,
        memberCount: 1,
      },
    ]);

    jest.mocked(segmentsApi.getMembers).mockResolvedValue([
      {
        id: "ct-1",
        name: "Sofia Nakamura",
        email: "sofia@test.com",
        phone: null,
        companyName: null,
        lifetimeValue: 100,
      },
    ]);

    render(<SegmentsListPage preSelectedSegmentName="At-Risk Customers" />);

    await screen.findByText("Sofia Nakamura");
    expect(screen.queryByText("Back to Segments")).not.toBeInTheDocument();
  });
});
