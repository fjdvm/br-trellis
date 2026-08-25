import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TicketCreateSheet } from "@/components/features/tickets/TicketCreateSheet";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    tickets: {
      create: jest.fn(),
    },
  },
}));

describe("TicketCreateSheet", () => {
  const onSuccess = jest.fn();
  const onShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens modal and submits ticket form", async () => {
    (crmClient.tickets.create as jest.Mock).mockResolvedValue({
      id: "1",
      title: "Login issue",
      description: "Cannot login",
      status: "Unclaimed",
      customerName: "Alex Smith",
      createdAt: "2026-01-01",
    });

    render(
      <TicketCreateSheet
        onSuccess={onSuccess}
        onShowToast={onShowToast}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /create ticket/i }));

    expect(screen.getByText("Create Support Ticket")).toBeInTheDocument();
    expect(screen.getByLabelText("Ticket Title *")).toBeInTheDocument();
    expect(screen.getByLabelText("Description *")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Ticket Title *"), { target: { value: "Login issue" } });
    fireEvent.change(screen.getByLabelText("Description *"), { target: { value: "Cannot login" } });

    fireEvent.click(screen.getByRole("button", { name: "Submit Ticket" }));

    await waitFor(() => {
      expect(crmClient.tickets.create).toHaveBeenCalledWith(
        { title: "Login issue", description: "Cannot login", imageUrl: "" },
        "00000000-0000-0000-0000-000000000001"
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
