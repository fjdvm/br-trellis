/**
 * @jest-environment node
 */
import { aiClient } from "@/features/dashboard/services/ai-client";

const BASE = "https://localhost:5005";

beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({ threshold: 0.5 }),
  } as unknown as Response);
});

describe("aiClient", () => {
  it("uses api-crm while preserving its existing configuration call contract", async () => {
    await aiClient.config.getChurnThreshold();

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/config/churn-threshold`,
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });
});
