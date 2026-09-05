import { renderHook, waitFor } from "@testing-library/react";
import { useTickets } from "@/features/conversations/hooks/useTickets";
import { ticketsApi } from "@/features/conversations/services/conversations-api";

jest.mock("@/features/conversations/services/conversations-api", () => ({
  ticketsApi: {
      list: jest.fn(),
    }
}));

describe("useTickets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads tickets on mount", async () => {
    const mockData = {
      items: [{ id: "1", title: "Ticket 1", status: "Unclaimed", customerName: "John", createdAt: "2026-01-01" }],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
    };
    (ticketsApi.list as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useTickets(1, 20, "Unclaimed"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(ticketsApi.list).toHaveBeenCalledWith(1, 20, "Unclaimed", undefined);
  });
});
