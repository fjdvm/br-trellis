import { act, renderHook, waitFor } from "@testing-library/react";
import { useTemplateBuilder } from "@/features/campaigns/hooks/use-template-builder";
import { blockTemplatesApi } from "@/features/campaigns/services/campaigns-api";

jest.mock("@/features/campaigns/services/campaigns-api", () => ({
  blockTemplatesApi: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
}));

describe("useTemplateBuilder save failure (#177)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("surfaces a user-facing error and keeps the modal open when saving fails", async () => {
    (blockTemplatesApi.create as jest.Mock).mockRejectedValue(new Error("Network error"));
    const refetch = jest.fn();
    const { result } = renderHook(() => useTemplateBuilder({ channel: "Email", refetch }));

    act(() => {
      result.current.handleOpenCreateModal();
      result.current.setBuilderName("My Template");
    });

    await act(async () => {
      await result.current.handleSaveTemplate();
    });

    await waitFor(() => expect(result.current.builderError).toBe("Network error"));
    expect(result.current.showBuilderModal).toBe(true);
    expect(refetch).not.toHaveBeenCalled();
  });
});
