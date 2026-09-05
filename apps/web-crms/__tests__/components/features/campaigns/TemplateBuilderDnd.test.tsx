import { render, screen } from "@testing-library/react";
import { Image } from "lucide-react";
import { EmailBlockCard, type TemplateBlock } from "@/features/campaigns/components/template-builder-components";
import { PaletteDraggableItem } from "@/features/campaigns/components/template-builder-dnd";

jest.mock("@dnd-kit/core", () => ({
  ...jest.requireActual("@dnd-kit/core"),
  useDraggable: jest.fn(),
}));

import { useDraggable } from "@dnd-kit/core";

const block: TemplateBlock = { id: "1", type: "heading", label: "Hero", textAlign: "left" };

describe("Template builder drag visual feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("dims the palette item while it is being dragged", () => {
    (useDraggable as jest.Mock).mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      isDragging: true,
    });

    const { container } = render(
      <PaletteDraggableItem
        type="image"
        label="Image Placeholder"
        Icon={Image}
        count={0}
        max={3}
        disabled={false}
        onClick={jest.fn()}
      />
    );

    expect(container.firstChild).toHaveClass("opacity-30");
  });

  it("keeps the palette item at full opacity when idle", () => {
    (useDraggable as jest.Mock).mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      isDragging: false,
    });

    const { container } = render(
      <PaletteDraggableItem
        type="image"
        label="Image Placeholder"
        Icon={Image}
        count={0}
        max={3}
        disabled={false}
        onClick={jest.fn()}
      />
    );

    expect(container.firstChild).not.toHaveClass("opacity-30");
  });

  it("applies a primary ring around a canvas block card while it is the active drag item", () => {
    const { container, rerender } = render(
      <EmailBlockCard block={block} onUpdate={jest.fn()} onRemove={jest.fn()} isDragging={false} />
    );
    expect(container.firstChild).not.toHaveClass("ring-2");
    expect(screen.getByText("heading")).toBeInTheDocument();

    rerender(<EmailBlockCard block={block} onUpdate={jest.fn()} onRemove={jest.fn()} isDragging={true} />);
    expect(container.firstChild).toHaveClass("ring-2");
    expect(container.firstChild).toHaveClass("ring-primary");
  });
});
