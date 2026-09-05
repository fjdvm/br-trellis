import React from "react";
import { render, screen } from "@testing-library/react";
import { CustomerTypeBadge } from "@/features/customers/components/customer-type-badge";

describe("CustomerTypeBadge", () => {
  it("renders type text", () => {
    render(<CustomerTypeBadge type="Regular" />);
    expect(screen.getByText("Regular")).toBeInTheDocument();
  });
});
