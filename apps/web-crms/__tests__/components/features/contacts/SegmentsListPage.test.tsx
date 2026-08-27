import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SegmentsListPage } from "@/components/features/contacts/SegmentsListPage";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    segments: {
      list: jest.fn(),
      getMembers: jest.fn(),
    },
  },
}));

describe("SegmentsListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders segments with name, type, rule badges, and member count", async () => {
    jest.mocked(crmClient.segments.list).mockResolvedValue([
      {
        id: "seg-1",
        name: "At-Risk Customers",
        type: "Dynamic",
        isSystemDefined: true,
        rule: {
          matchMode: "MatchAll",
          conditions: [
            { field: "SentimentScore", operator: "less_than", value: "0" },
          ],
        },
        memberCount: 3,
      },
      {
        id: "seg-2",
        name: "VIP List",
        type: "Static",
        isSystemDefined: false,
        rule: null,
        memberCount: 2,
      },
    ]);

    render(<SegmentsListPage />);

    expect(await screen.findByText("At-Risk Customers")).toBeInTheDocument();
    expect(screen.getByText("VIP List")).toBeInTheDocument();
    expect(screen.getByText("Dynamic")).toBeInTheDocument();
    expect(screen.getByText("Static")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("SentimentScore less_than 0")).toBeInTheDocument();
    expect(screen.getByText("Manual membership")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows membership view when View Members button is clicked", async () => {
    jest.mocked(crmClient.segments.list).mockResolvedValue([
      {
        id: "seg-1",
        name: "At-Risk Customers",
        type: "Dynamic",
        isSystemDefined: true,
        rule: {
          matchMode: "MatchAll",
          conditions: [
            { field: "SentimentScore", operator: "less_than", value: "0" },
          ],
        },
        memberCount: 1,
      },
    ]);

    jest.mocked(crmClient.segments.getMembers).mockResolvedValue([
      {
        id: "contact-1",
        name: "Sofia Nakamura",
        email: "sofia.n@initech.co",
        phone: "+1 555-0103",
        companyName: "Initech Solutions",
        lifetimeValue: 0,
      },
    ]);

    render(<SegmentsListPage />);

    // Wait for list to load
    await screen.findByText("At-Risk Customers");

    // Click the view members button
    const viewButton = screen.getByTitle("View members");
    fireEvent.click(viewButton);

    // Should show membership view
    await waitFor(() => {
      expect(screen.getByText("Sofia Nakamura")).toBeInTheDocument();
    });
    expect(screen.getByText("sofia.n@initech.co")).toBeInTheDocument();
    expect(screen.getByText("Back to Segments")).toBeInTheDocument();
    expect(crmClient.segments.getMembers).toHaveBeenCalledWith("seg-1");
  });

  it("navigates back to list from membership view", async () => {
    jest.mocked(crmClient.segments.list).mockResolvedValue([
      {
        id: "seg-1",
        name: "VIP List",
        type: "Static",
        isSystemDefined: false,
        rule: null,
        memberCount: 1,
      },
    ]);

    jest.mocked(crmClient.segments.getMembers).mockResolvedValue([
      {
        id: "contact-1",
        name: "Maya Chen",
        email: "maya@example.com",
        phone: null,
        companyName: null,
        lifetimeValue: 1500,
      },
    ]);

    render(<SegmentsListPage />);

    await screen.findByText("VIP List");
    fireEvent.click(screen.getByTitle("View members"));
    await screen.findByText("Maya Chen");

    // Click back button
    fireEvent.click(screen.getByText("Back to Segments"));

    // Should show segment list again
    await waitFor(() => {
      expect(screen.getByText("VIP List")).toBeInTheDocument();
    });
  });
});
