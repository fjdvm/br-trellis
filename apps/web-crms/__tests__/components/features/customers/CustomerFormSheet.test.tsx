import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { CustomerFormSheet } from "@/components/features/customers/CustomerFormSheet";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    customers: {
      create: jest.fn(),
    },
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("CustomerFormSheet", () => {
  const onOpenChange = jest.fn();
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form dialog fields when open", () => {
    render(
      <CustomerFormSheet
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText("Add Customer Profile")).toBeInTheDocument();
    expect(screen.getByLabelText("First Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address *")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Customer Type *")).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
  });

  it("submits customer form successfully", async () => {
    (crmClient.customers.create as jest.Mock).mockResolvedValue({ id: "cust-100" });

    render(
      <CustomerFormSheet
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText("First Name *"), { target: { value: "Jane" } });
    fireEvent.change(screen.getByLabelText("Last Name *"), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText("Email Address *"), { target: { value: "jane@example.com" } });

    fireEvent.click(screen.getByRole("button", { name: /create profile/i }));

    await waitFor(() => {
      expect(crmClient.customers.create).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phoneNumber: undefined,
        customerType: "Regular",
        address: undefined,
      });
      expect(toast.success).toHaveBeenCalledWith('Customer "Jane Doe" created successfully!');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("calls onOpenChange(false) when cancel button is clicked", () => {
    render(
      <CustomerFormSheet
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
