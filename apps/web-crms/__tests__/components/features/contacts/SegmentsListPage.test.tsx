import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentsListPage } from "@/features/segments/components/segments-list-page";
import { segmentsApi } from "@/features/segments/services/segments-api";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/features/segments/services/segments-api", () => ({
  segmentsApi: {
    list: jest.fn(),
    getMembers: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe("SegmentsListPage", () => {
  beforeAll(() => {
    if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
    if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
    if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
    if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders segments with name, type, rule badges, and member count", async () => {
    jest.mocked(segmentsApi.list).mockResolvedValue([
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
    expect(screen.getAllByText("Dynamic").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Static").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getAllByText("All").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("SentimentScore less_than 0")).toBeInTheDocument();
    expect(screen.getByText("Manual membership")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows membership view when View Members button is clicked", async () => {
    jest.mocked(segmentsApi.list).mockResolvedValue([
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

    jest.mocked(segmentsApi.getMembers).mockResolvedValue([
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
    expect(segmentsApi.getMembers).toHaveBeenCalledWith("seg-1");
  });

  it("navigates back to list from membership view", async () => {
    jest.mocked(segmentsApi.list).mockResolvedValue([
      {
        id: "seg-1",
        name: "VIP List",
        type: "Static",
        isSystemDefined: false,
        rule: null,
        memberCount: 1,
      },
    ]);

    jest.mocked(segmentsApi.getMembers).mockResolvedValue([
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

  it("opens Add Segment sheet and submits a new segment", async () => {
    jest.mocked(segmentsApi.list).mockResolvedValue([]);
    jest.mocked(segmentsApi.create).mockResolvedValue({
      id: "seg-new",
      name: "High Value Leads",
      type: "Dynamic",
      isSystemDefined: false,
      rule: {
        matchMode: "MatchAll",
        conditions: [{ field: "LifetimeValue", operator: "greater_than", value: "1000" }],
      },
      memberCount: 0,
    });

    render(<SegmentsListPage />);

    // Click Add Segment button
    const addButton = screen.getByRole("button", { name: /Add Segment/i });
    fireEvent.click(addButton);

    // Fill in name
    const nameInput = screen.getByLabelText(/Segment Name/i);
    fireEvent.change(nameInput, { target: { value: "High Value Leads" } });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: "Create Segment" }));

    await waitFor(() => {
      expect(segmentsApi.create).toHaveBeenCalledWith({
        name: "High Value Leads",
        type: "Dynamic",
        rule: {
          matchMode: "MatchAll",
          conditions: [{ field: "LifetimeValue", operator: "greater_than", value: "1000" }],
        },
      });
    });
  });

  it("filters segments by type and archive tab", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    jest.mocked(segmentsApi.list).mockResolvedValue([
      {
        id: "seg-dyn",
        name: "Dynamic Segment",
        type: "Dynamic",
        isSystemDefined: false,
        rule: null,
        memberCount: 5,
      },
      {
        id: "seg-stat",
        name: "Static Segment",
        type: "Static",
        isSystemDefined: false,
        rule: null,
        memberCount: 2,
      },
      {
        id: "seg-arch",
        name: "Archived Segment",
        type: "Static",
        isSystemDefined: false,
        isArchived: true,
        rule: null,
        memberCount: 0,
      },
    ]);

    render(<SegmentsListPage />);

    // Default "All" shows active segments
    expect(await screen.findByText("Dynamic Segment")).toBeInTheDocument();
    expect(screen.getByText("Static Segment")).toBeInTheDocument();
    expect(screen.queryByText("Archived Segment")).not.toBeInTheDocument();

    // Click "Dynamic" tab
    await user.click(screen.getByRole("tab", { name: "Dynamic" }));
    await waitFor(() => {
      expect(screen.queryByText("Static Segment")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Dynamic Segment")).toBeInTheDocument();

    // Click "Archive" tab
    await user.click(screen.getByRole("tab", { name: "Archive" }));
    await waitFor(() => {
      expect(screen.getByText("Archived Segment")).toBeInTheDocument();
    });
    expect(screen.queryByText("Dynamic Segment")).not.toBeInTheDocument();
  });

  it("offers 3 dots options to edit, archive, and delete segment", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    jest.mocked(segmentsApi.list).mockResolvedValue([
      {
        id: "seg-1",
        name: "Active Segment",
        type: "Dynamic",
        isSystemDefined: false,
        rule: null,
        memberCount: 3,
      },
    ]);

    render(<SegmentsListPage />);

    await screen.findByText("Active Segment");

    // Click 3 dots menu button
    const optionsBtn = screen.getByLabelText("Segment options");
    await user.click(optionsBtn);

    expect(await screen.findByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Archive" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();

    // Click Archive
    await user.click(screen.getByRole("menuitem", { name: "Archive" }));
    await waitFor(() => {
      expect(segmentsApi.update).toHaveBeenCalledWith("seg-1", { isArchived: true });
    });
  });
});
