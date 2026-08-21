import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { expectNoAxeViolations } from "./a11y";

function Example({ onSelect }: { onSelect?: (v: string) => void }) {
  const [showGrid, setShowGrid] = useState(true);
  const [density, setDensity] = useState("comfortable");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onSelect?.("rename")}>
          Rename <DropdownMenuShortcut>R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Archive</DropdownMenuItem>
        <DropdownMenuItem tone="danger" onSelect={() => onSelect?.("delete")}>
          Delete
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
          Show grid
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
          <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("opens with Enter, focuses the first item and exposes menu roles", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Options" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    trigger.focus();
    await user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
      "Rename R",
      "Archive",
      "Delete",
    ]);
    expect(screen.getByRole("menuitemcheckbox", { name: "Show grid" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menuitemradio", { name: "Comfortable" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(menu).toContainElement(document.activeElement as HTMLElement);
    await expectNoAxeViolations();
  });

  it("navigates with arrows (skipping disabled items) and selects with Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Example onSelect={onSelect} />);
    screen.getByRole("button", { name: "Options" }).focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("menu");
    expect(screen.getByRole("menuitem", { name: /Rename/ })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("delete");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("toggles checkbox and radio items", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Options" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Show grid" }));
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menuitemcheckbox", { name: "Show grid" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await user.click(screen.getByRole("menuitemradio", { name: "Compact" }));
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menuitemradio", { name: "Compact" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Options" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
