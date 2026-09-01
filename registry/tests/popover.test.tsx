import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { expectNoAxeViolations } from "./a11y";

function Example() {
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Dimensions</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Dimensions">
          <Input aria-label="Width" defaultValue="100%" />
          <PopoverClose asChild>
            <Button size="sm">Apply</Button>
          </PopoverClose>
        </PopoverContent>
      </Popover>
      <button type="button">Elsewhere</button>
    </>
  );
}

describe("Popover", () => {
  it("toggles via the trigger and wires aria-controls/expanded", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Dimensions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    const panel = await screen.findByRole("dialog", { name: "Dimensions" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", panel.id);
    expect(screen.getByLabelText("Width")).toHaveFocus();
    await expectNoAxeViolations();
    await user.click(trigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape (focus returns) and on outside click", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Dimensions" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("PopoverClose closes it", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Dimensions" }));
    await user.click(await screen.findByRole("button", { name: "Apply" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
