import React from "react";
import { render, screen } from "@testing-library/react";
import { CustomerStatusBadge } from "@/features/customers/components/customer-status-badge";

describe("CustomerStatusBadge", () => {
  it("renders status text", () => {
    render(<CustomerStatusBadge status="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
