import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { CustomerFormSheet } from "@/features/customers/components/customer-form-sheet";
import { customerApi } from "@/features/customers/services/customers-api";

jest.mock("@/features/customers/services/customers-api", () => ({
  customerApi: {
      create: jest.fn(),
    }
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
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/customer type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });

  it("submits customer form successfully", async () => {
    (customerApi.create as jest.Mock).mockResolvedValue({ id: "cust-100" });

    render(
      <CustomerFormSheet
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Jane" } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Doe" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "jane@example.com" } });

    fireEvent.click(screen.getByRole("button", { name: /create profile/i }));

    await waitFor(() => {
      expect(customerApi.create).toHaveBeenCalledWith({
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
