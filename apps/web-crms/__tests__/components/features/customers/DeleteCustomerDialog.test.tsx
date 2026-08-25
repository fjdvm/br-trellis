import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { DeleteCustomerDialog } from "@/components/features/customers/DeleteCustomerDialog";
import { crmClient } from "@/lib/api/crm-client";
import type { CustomerListItem } from "@/types/customer";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    customers: {
      delete: jest.fn(),
    },
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockCustomer: CustomerListItem = {
  id: "cust-1",
  displayName: "Alice Smith",
  email: "alice@example.com",
  customerType: "Regular",
  status: "Active",
  createdAt: "2025-01-01T00:00:00Z",
};

describe("DeleteCustomerDialog", () => {
  const onOpenChange = jest.fn();
  const onDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when customer is null", () => {
    const { container } = render(
      <DeleteCustomerDialog
        customer={null}
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog title and customer name when open", () => {
    render(
      <DeleteCustomerDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />
    );
    expect(screen.getByText("Delete Customer Record")).toBeInTheDocument();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("shows Cancel and Delete Customer buttons", () => {
    render(
      <DeleteCustomerDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />
    );
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete customer/i })).toBeInTheDocument();
  });

  it("calls onDeleted and closes dialog after successful delete", async () => {
    (crmClient.customers.delete as jest.Mock).mockResolvedValue(undefined);

    render(
      <DeleteCustomerDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /delete customer/i }));

    await waitFor(() => {
      expect(crmClient.customers.delete).toHaveBeenCalledWith("cust-1");
      expect(onDeleted).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows 'Deleting...' while the delete is in flight", async () => {
    let resolveDelete!: () => void;
    (crmClient.customers.delete as jest.Mock).mockReturnValue(
      new Promise<void>((res) => {
        resolveDelete = res;
      })
    );

    render(
      <DeleteCustomerDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /delete customer/i }));
    expect(await screen.findByText("Deleting...")).toBeInTheDocument();

    resolveDelete();
    await waitFor(() => {
      expect(screen.queryByText("Deleting...")).not.toBeInTheDocument();
    });
  });

  it("shows error toast and does not call onDeleted on failure", async () => {
    (crmClient.customers.delete as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(
      <DeleteCustomerDialog
        customer={mockCustomer}
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /delete customer/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
