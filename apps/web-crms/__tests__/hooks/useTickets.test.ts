import { renderHook, waitFor } from "@testing-library/react";
import { useTickets } from "@/hooks/useTickets";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    tickets: {
      list: jest.fn(),
    },
  },
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
    (crmClient.tickets.list as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useTickets(1, 20, "Unclaimed"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(crmClient.tickets.list).toHaveBeenCalledWith(1, 20, "Unclaimed", undefined);
  });
});
