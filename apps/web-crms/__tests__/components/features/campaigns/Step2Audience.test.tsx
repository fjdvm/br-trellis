import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Step2Audience } from "@/features/campaigns";

const mockSegment = {
  id: "seg-1",
  name: "VIP",
  memberCount: 10,
  description: "VIP customers",
  rule: null,
  createdAt: "",
  updatedAt: "",
};

function renderStep(emails = "", onEmailsChange = jest.fn()) {
  return render(
    <Step2Audience
      segments={[mockSegment]}
      segmentId="__none__"
      onSegmentIdChange={jest.fn()}
      emails={emails}
      onEmailsChange={onEmailsChange}
    />
  );
}

describe("Step2Audience – email badge input (#email-badge-bug)", () => {
  it("does NOT create badges while typing partial input (e.g. typing '.')", async () => {
    const user = userEvent.setup({ delay: null });
    const onEmailsChange = jest.fn();
    renderStep("", onEmailsChange);

    const input = screen.getByLabelText(/additional emails/i);

    // Type a partial email ending with '.' – should NOT trigger any onEmailsChange call
    await user.type(input, "test.");

    expect(onEmailsChange).not.toHaveBeenCalled();
  });

  it("creates exactly ONE badge when spacebar is pressed after a valid email", async () => {
    const user = userEvent.setup({ delay: null });
    const onEmailsChange = jest.fn();
    renderStep("", onEmailsChange);

    const input = screen.getByLabelText(/additional emails/i);
    await user.type(input, "user@example.com");
    await user.keyboard(" ");

    expect(onEmailsChange).toHaveBeenCalledTimes(1);
    expect(onEmailsChange).toHaveBeenCalledWith("user@example.com");
  });

  it("does NOT add a duplicate badge when spacebar is pressed for an already-added email", async () => {
    const user = userEvent.setup({ delay: null });
    const onEmailsChange = jest.fn();
    renderStep("user@example.com", onEmailsChange);

    const input = screen.getByLabelText(/additional emails/i);
    await user.type(input, "user@example.com");
    await user.keyboard(" ");

    expect(onEmailsChange).not.toHaveBeenCalled();
  });

  it("creates exactly ONE badge when Enter is pressed after a valid email", async () => {
    const user = userEvent.setup({ delay: null });
    const onEmailsChange = jest.fn();
    renderStep("", onEmailsChange);

    const input = screen.getByLabelText(/additional emails/i);
    await user.type(input, "bob@acme.com");
    await user.keyboard("{Enter}");

    expect(onEmailsChange).toHaveBeenCalledTimes(1);
    expect(onEmailsChange).toHaveBeenCalledWith("bob@acme.com");
  });

  it("shows a validation error when spacebar is pressed with an invalid email", async () => {
    const user = userEvent.setup({ delay: null });
    const onEmailsChange = jest.fn();
    renderStep("", onEmailsChange);

    const input = screen.getByLabelText(/additional emails/i);
    await user.type(input, "notanemail");
    await user.keyboard(" ");

    expect(onEmailsChange).not.toHaveBeenCalled();
    expect(screen.getByText(/is not a valid email address/i)).toBeInTheDocument();
  });

  it("pressing spacebar multiple times does NOT add multiple badges", async () => {
    const user = userEvent.setup({ delay: null });
    const onEmailsChange = jest.fn();
    renderStep("", onEmailsChange);

    const input = screen.getByLabelText(/additional emails/i);
    await user.type(input, "alice@test.com");
    // Press space multiple times
    await user.keyboard("   ");

    // First space adds it, subsequent spaces see empty input and do nothing
    expect(onEmailsChange).toHaveBeenCalledTimes(1);
  });
});
