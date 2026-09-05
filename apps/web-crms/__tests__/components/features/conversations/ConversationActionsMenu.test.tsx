import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ConversationActionsMenu,
  type ConversationAction,
} from "@/features/conversations/components/conversation-actions-menu";
import type { TicketStatus } from "@/types/ticket-detail";

// Radix DropdownMenu relies on pointer-capture APIs jsdom does not implement.
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

function renderMenu(
  props: Partial<React.ComponentProps<typeof ConversationActionsMenu>> = {}
) {
  const onAction = props.onAction ?? jest.fn();
  const status: TicketStatus = props.status ?? "Claimed";
  render(
    <ConversationActionsMenu
      status={status}
      busy={props.busy ?? false}
      onAction={onAction}
    />
  );
  return { onAction };
}

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /conversation actions/i }));
  return user;
}

describe("ConversationActionsMenu", () => {
  it("renders a 3-dot trigger for an active ticket", () => {
    renderMenu({ status: "Ongoing" });
    expect(
      screen.getByRole("button", { name: /conversation actions/i })
    ).toBeInTheDocument();
  });

  it("renders nothing for a terminal (Completed) ticket", () => {
    const { container } = render(
      <ConversationActionsMenu
        status="Completed"
        busy={false}
        onAction={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a terminal (Canceled) ticket", () => {
    const { container } = render(
      <ConversationActionsMenu
        status="Canceled"
        busy={false}
        onAction={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("offers Ongoing, Complete, Unclaim and Cancel for a Claimed ticket", async () => {
    renderMenu({ status: "Claimed" });
    await openMenu();

    expect(
      await screen.findByRole("menuitem", { name: /mark as ongoing/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /mark as complete/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /^unclaim$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /cancel ticket/i })
    ).toBeInTheDocument();
  });

  it("omits 'Mark as Ongoing' when the ticket is already Ongoing", async () => {
    renderMenu({ status: "Ongoing" });
    await openMenu();

    await screen.findByRole("menuitem", { name: /mark as complete/i });
    expect(
      screen.queryByRole("menuitem", { name: /mark as ongoing/i })
    ).not.toBeInTheDocument();
  });

  it("disables the trigger while busy", () => {
    renderMenu({ status: "Ongoing", busy: true });
    expect(
      screen.getByRole("button", { name: /conversation actions/i })
    ).toBeDisabled();
  });

  it("opens a confirmation modal before firing an action", async () => {
    const onAction = jest.fn();
    renderMenu({ status: "Claimed", onAction });
    const user = await openMenu();

    await user.click(
      await screen.findByRole("menuitem", { name: /mark as complete/i })
    );

    // Modal shown; action NOT yet fired (confirmation still pending).
    expect(
      await screen.findByRole("dialog")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/mark conversation as complete/i)
    ).toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();
  });

  it("fires onAction with the chosen action after confirming", async () => {
    const onAction = jest.fn();
    renderMenu({ status: "Claimed", onAction });
    const user = await openMenu();

    await user.click(
      await screen.findByRole("menuitem", { name: /mark as ongoing/i })
    );
    await user.click(
      await screen.findByRole("button", { name: /^mark ongoing$/i })
    );

    await waitFor(() =>
      expect(onAction).toHaveBeenCalledWith<[ConversationAction]>("ongoing")
    );
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("fires the unclaim action after confirming", async () => {
    const onAction = jest.fn();
    renderMenu({ status: "Ongoing", onAction });
    const user = await openMenu();

    await user.click(
      await screen.findByRole("menuitem", { name: /^unclaim$/i })
    );
    await user.click(
      await screen.findByRole("button", { name: /^unclaim$/i })
    );

    await waitFor(() => expect(onAction).toHaveBeenCalledWith("unclaim"));
  });

  it("does not fire the action when the modal is dismissed", async () => {
    const onAction = jest.fn();
    renderMenu({ status: "Claimed", onAction });
    const user = await openMenu();

    await user.click(
      await screen.findByRole("menuitem", { name: /cancel ticket/i })
    );
    await user.click(await screen.findByRole("button", { name: /dismiss/i }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(onAction).not.toHaveBeenCalled();
  });
});
