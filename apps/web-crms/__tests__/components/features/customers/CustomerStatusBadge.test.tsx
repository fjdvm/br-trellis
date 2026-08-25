import React from "react";
import { render, screen } from "@testing-library/react";
import { CustomerStatusBadge } from "@/components/features/customers/CustomerStatusBadge";

describe("CustomerStatusBadge", () => {
  it("renders 'Active' status text", () => {
    render(<CustomerStatusBadge status="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders 'Inactive' status text", () => {
    render(<CustomerStatusBadge status="Inactive" />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders 'Suspended' status text", () => {
    render(<CustomerStatusBadge status="Suspended" />);
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("renders a single root element", () => {
    const { container } = render(<CustomerStatusBadge status="Active" />);
    expect(container.children).toHaveLength(1);
  });
});
