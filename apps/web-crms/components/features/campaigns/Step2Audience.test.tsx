import React from "react";
import { render, screen } from "@testing-library/react";
import { Step2Audience, SYSTEM_PRESET_SEGMENTS } from "./Step2Audience";
import { useAudienceCounts } from "@/hooks/useAudienceCounts";

jest.mock("@/hooks/useAudienceCounts");

const mockUseAudienceCounts = useAudienceCounts as jest.MockedFunction<typeof useAudienceCounts>;

describe("Step2Audience", () => {
  const defaultProps = {
    segments: [],
    segmentId: "all",
    onSegmentIdChange: jest.fn(),
    emails: "",
    onEmailsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders error state when audience counts fetch fails", () => {
    mockUseAudienceCounts.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    });

    render(<Step2Audience {...defaultProps} />);

    expect(screen.getByText("Couldn't load audience counts")).toBeInTheDocument();
    expect(screen.queryByText("Auto-Sync Enabled")).not.toBeInTheDocument();
  });

  test("renders normal segment counts when fetch succeeds", () => {
    mockUseAudienceCounts.mockReturnValue({
      data: { all: 18, contacts: 9, companies: 5, ecommerce: 3 },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<Step2Audience {...defaultProps} />);

    expect(screen.queryByText("Couldn't load audience counts")).not.toBeInTheDocument();
    expect(screen.queryByText("Auto-Sync Enabled")).not.toBeInTheDocument();
  });
});
