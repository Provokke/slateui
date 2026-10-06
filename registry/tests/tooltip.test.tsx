import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { expectNoAxeViolations } from "./a11y";

function Example() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" aria-label="Bold">
            B
          </Button>
        </TooltipTrigger>
        <TooltipContent>Make text bold (Ctrl+B)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip", () => {
  it("is hidden initially", () => {
    render(<Example />);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("opens on keyboard focus, describes the trigger, closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Bold" });
    expect(trigger).toHaveFocus();
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Make text bold (Ctrl+B)");
    expect(trigger).toHaveAttribute("aria-describedby", tip.id);
    await expectNoAxeViolations();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });

  it("opens on hover and closes when the trigger is activated", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.hover(screen.getByRole("button", { name: "Bold" }));
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bold" }));
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });

  it("supports controlled open", () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Info</TooltipTrigger>
          <TooltipContent>Always visible</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent("Always visible");
  });
});
