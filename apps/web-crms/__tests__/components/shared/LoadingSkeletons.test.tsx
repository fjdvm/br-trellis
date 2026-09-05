import React from "react";
import { render, screen } from "@testing-library/react";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { DetailSkeleton } from "@/components/shared/detail-skeleton";

describe("TableSkeleton", () => {
  it("renders a table loading placeholder", () => {
    render(<TableSkeleton />);
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  it("exposes an accessible loading label", () => {
    render(<TableSkeleton />);
    expect(screen.getByRole("status", { name: /loading table/i })).toBeInTheDocument();
  });

  it("does not render a spinner icon", () => {
    const { container } = render(<TableSkeleton />);
    expect(container.querySelector(".animate-spin")).toBeNull();
    // Uses the shimmering skeleton primitive instead.
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });
});

describe("DetailSkeleton", () => {
  it("renders a detail loading placeholder", () => {
    render(<DetailSkeleton />);
    expect(screen.getByTestId("detail-skeleton")).toBeInTheDocument();
  });

  it("does not render a spinner icon", () => {
    const { container } = render(<DetailSkeleton />);
    expect(container.querySelector(".animate-spin")).toBeNull();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("renders the requested number of section cards", () => {
    const { container } = render(<DetailSkeleton cards={2} />);
    // Each section card is a bordered container.
    const cards = container.querySelectorAll(".border.border-border");
    expect(cards.length).toBe(2);
  });
});
