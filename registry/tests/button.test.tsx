import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonVariants } from "@/components/ui/button";
import { expectNoAxeViolations } from "./a11y";

describe("Button", () => {
  it("renders a native button with type=button by default", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-variant", "solid");
  });

  it.each([
    ["solid", "bg-brand"],
    ["soft", "bg-subtle"],
    ["outline", "border-field"],
    ["ghost", "bg-transparent"],
    ["danger", "bg-danger"],
    ["link", "underline-offset-4"],
  ] as const)("applies the %s variant classes", (variant, expected) => {
    render(<Button variant={variant}>V</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-variant", variant);
    expect(button).toHaveClass(expected);
    expect(buttonVariants({ variant })).toContain(expected);
  });

  it("applies size classes and merges className overrides", () => {
    render(
      <Button size="sm" className="h-20">
        Small
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-20", "px-3");
    expect(button).not.toHaveClass("h-8");
  });

  it("fires onClick via mouse and keyboard", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("does not fire when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("loading state disables and sets aria-busy", () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("[data-slot=spinner]")).toBeInTheDocument();
  });

  it("asChild renders the child element with button styling", () => {
    render(
      <Button asChild variant="outline">
        <a href="/docs">Docs</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveClass("border-field");
    expect(link).not.toHaveAttribute("type");
  });

  it("forwards refs", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no axe violations (incl. icon-only with aria-label)", async () => {
    render(
      <div>
        <Button>Text</Button>
        <Button size="icon" aria-label="Settings">
          <svg aria-hidden="true" />
        </Button>
        <Button loading>Busy</Button>
      </div>,
    );
    await expectNoAxeViolations();
  });
});
