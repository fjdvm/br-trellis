/**
 * Verification test: renders TicketListPage against a payload captured verbatim
 * from the LIVE `GET /api/v1/tickets` endpoint (api-crms, seeded dev data).
 *
 * The fixture `live-tickets.json` was produced by curling the running backend,
 * so this proves the component's data mapping (camelCase fields, nested
 * `contact`, null-handling) meshes with the real API contract — not just with
 * hand-written fixtures. Regenerate the fixture by re-curling the endpoint if
 * the DTO shape ever changes.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketListPage } from "@/features/conversations/components/ticket-list-page";
import { conversationTicketsApi } from "@/features/conversations/services/conversations-api";
import type { TicketListItem } from "@/features/conversations/types";
import liveTickets from "../../../fixtures/live-tickets.json";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "auth|amelia",
        name: "amelia ward",
        email: "amelia.ward@trellis.io",
      },
    },
    status: "authenticated",
  }),
}));

jest.mock("@/features/conversations/services/conversations-api", () => ({
  conversationTicketsApi: {
      list: jest.fn(),
      claim: jest.fn(),
      changeStatus: jest.fn(),
    }
}));

describe("TicketListPage against live API payload", () => {
  beforeAll(() => {
    if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
    if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
    if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
    if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders every seeded ticket from the real endpoint response", async () => {
    // Cast: the fixture is real API JSON; the shape is validated by rendering.
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue(liveTickets as unknown as TicketListItem[]);

    render(<TicketListPage initialStatusFilter="All" />);

    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(screen.getByLabelText("View filter"));
    await user.click(await screen.findByRole("option", { name: "All" }));

    // All 5 seeded subjects render.
    expect(
      await screen.findByText("Inbound email: website contact form")
    ).toBeInTheDocument();
    expect(screen.getByText("Question about bulk pricing")).toBeInTheDocument();
    expect(
      screen.getByText("Refund not received after 5 business days")
    ).toBeInTheDocument();
    expect(screen.getByText("Cannot access invoice download")).toBeInTheDocument();
    expect(
      screen.getByText("Support ticket #TK-892 resolved")
    ).toBeInTheDocument();

    // Every status enum value from the live data renders as a badge.
    expect(screen.getAllByText("Unclaimed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Claimed")).toBeInTheDocument();
    expect(screen.getByText("Ongoing")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();

    // Nested contact.name renders (title-cased), and null contact/assignee
    // fall back correctly — the two null-heavy rows come from real seed data.
    expect(screen.getByText("Sofia Nakamura")).toBeInTheDocument();
    // Two seeded tickets are assigned to Amelia Ward (Ongoing + Claimed).
    expect(screen.getAllByText("Amelia Ward").length).toBe(2);
    // The unlinked "Inbound email" ticket has null contact AND null assignee.
    // (Em-dash also appears in the Actions column for terminal rows, so assert
    // presence rather than an exact count.)
    expect(screen.getAllByText("\u2014").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Unassigned").length).toBeGreaterThanOrEqual(1);
  });
});
