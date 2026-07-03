import { render, screen } from "@testing-library/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { expectNoAxeViolations } from "./a11y";

describe("Avatar", () => {
  it("shows the fallback while the image has not loaded (jsdom never loads images)", async () => {
    render(
      <Avatar>
        <AvatarImage src="https://example.com/ada.png" alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("AL")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    await expectNoAxeViolations();
  });

  it("renders the image once loaded", async () => {
    const OriginalImage = window.Image;
    class LoadingImage extends OriginalImage {
      constructor() {
        super();
        setTimeout(() => this.dispatchEvent(new Event("load")), 0);
      }
      get complete() {
        return false;
      }
      get naturalWidth() {
        return 40;
      }
    }
    window.Image = LoadingImage as typeof Image;
    try {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/ada.png" alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>,
      );
      expect(await screen.findByRole("img", { name: "Ada Lovelace" })).toHaveAttribute(
        "src",
        "https://example.com/ada.png",
      );
      expect(screen.queryByText("AL")).not.toBeInTheDocument();
    } finally {
      window.Image = OriginalImage;
    }
  });

  it("merges size classes", () => {
    const { container } = render(
      <Avatar className="size-16">
        <AvatarFallback>XY</AvatarFallback>
      </Avatar>,
    );
    expect(container.firstElementChild).toHaveClass("size-16", "rounded-full");
    expect(container.firstElementChild).not.toHaveClass("size-10");
  });
});
