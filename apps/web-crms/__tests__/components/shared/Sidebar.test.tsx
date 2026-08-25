import React from "react";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/shared/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/settings",
}));

describe("Sidebar", () => {
  it("renders main navigation items and the settings tab above profile footer", () => {
    render(
      <SidebarProvider defaultOpen={true}>
        <Sidebar />
      </SidebarProvider>
    );

    // Verify main navigation items
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("Conversations")).toBeInTheDocument();
    expect(screen.getByText("Tickets")).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();

    // Verify settings item
    const settingsTab = screen.getByRole("link", { name: /settings/i });
    expect(settingsTab).toBeInTheDocument();
    expect(settingsTab).toHaveAttribute("href", "/settings");

    // Verify profile avatar / user name is rendered
    expect(screen.getByText("Bren Raphael")).toBeInTheDocument();
  });
});
