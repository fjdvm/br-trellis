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

describe("useTemplateBuilder block reordering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("persists the reordered block sequence on save, not just the on-screen order", async () => {
    (blockTemplatesApi.create as jest.Mock).mockResolvedValue({ id: "new-template" });
    const refetch = jest.fn();
    const { result } = renderHook(() => useTemplateBuilder({ channel: "Email", refetch }));

    act(() => {
      result.current.handleOpenCreateModal();
      result.current.setBuilderName("Reorder Test");
    });

    const [blockA, blockB, blockC] = result.current.blocks;
    expect([blockA.label, blockB.label, blockC.label]).toEqual([
      "Hero Title",
      "Main Body Text",
      "Primary Action Button",
    ]);

    act(() => {
      result.current.reorderBlocks(blockC.id, blockA.id);
    });

    expect(result.current.blocks.map((b) => b.label)).toEqual([
      "Primary Action Button",
      "Hero Title",
      "Main Body Text",
    ]);

    await act(async () => {
      await result.current.handleSaveTemplate();
    });

    expect(blockTemplatesApi.create).toHaveBeenCalledTimes(1);
    const payload = (blockTemplatesApi.create as jest.Mock).mock.calls[0][0];
    expect(
      payload.blocks.map((b: { label: string; order: number }) => ({ label: b.label, order: b.order }))
    ).toEqual([
      { label: "Primary Action Button", order: 0 },
      { label: "Hero Title", order: 1 },
      { label: "Main Body Text", order: 2 },
    ]);
  });

  it("is a no-op when the active and target ids match", () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useTemplateBuilder({ channel: "Email", refetch }));
    const before = result.current.blocks.map((b) => b.id);

    act(() => {
      result.current.reorderBlocks(before[0], before[0]);
    });

    expect(result.current.blocks.map((b) => b.id)).toEqual(before);
  });
});
