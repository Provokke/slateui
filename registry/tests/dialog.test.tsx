import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { expectNoAxeViolations } from "./a11y";

function Example(props: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog onOpenChange={props.onOpenChange}>
      <DialogTrigger asChild>
        <Button>Edit profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your public details.</DialogDescription>
        </DialogHeader>
        <Input aria-label="Display name" defaultValue="Ada" />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("opens from the trigger with correct ARIA wiring", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Edit profile" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Edit profile" });
    expect(dialog).toHaveAccessibleDescription("Update your public details.");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expectNoAxeViolations();
  });

  it("moves focus inside, traps Tab and Shift+Tab, and restores focus on Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <>
        <button type="button">Outside before</button>
        <Example onOpenChange={onOpenChange} />
        <button type="button">Outside after</button>
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Edit profile" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog");
    // initial focus lands on the first focusable element
    expect(screen.getByLabelText("Display name")).toHaveFocus();
    // Tab many times: focus must never escape the dialog
    for (let i = 0; i < 8; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    for (let i = 0; i < 8; i++) {
      await user.tab({ shift: true });
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveFocus();
  });

  it("closes from the built-in close button and DialogClose", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    await user.click(await screen.findByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hides outside content from assistive tech while open", async () => {
    const user = userEvent.setup();
    render(
      <>
        <main>
          <p>Background</p>
        </main>
        <Example />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    await screen.findByRole("dialog");
    expect(screen.getByText("Background").closest('[aria-hidden="true"]')).not.toBeNull();
    // the dialog itself must remain exposed
    expect(screen.getByRole("dialog").closest('[aria-hidden="true"]')).toBeNull();
  });

  it("supports controlled open state and hideClose", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <span data-testid="state">{String(open)}</span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent hideClose aria-describedby={undefined}>
              <DialogTitle>Controlled</DialogTitle>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogContent>
          </Dialog>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("dialog", { name: "Controlled" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByTestId("state")).toHaveTextContent("false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
