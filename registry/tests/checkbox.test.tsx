import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { expectNoAxeViolations } from "./a11y";

describe("Checkbox", () => {
  it("toggles uncontrolled via click, label click and Space", async () => {
    const user = userEvent.setup();
    render(
      <div className="flex gap-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms</Label>
      </div>,
    );
    const box = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(box).toHaveAttribute("aria-checked", "false");
    await user.click(box);
    expect(box).toHaveAttribute("aria-checked", "true");
    expect(box).toHaveAttribute("data-state", "checked");
    await user.click(screen.getByText("Accept terms"));
    expect(box).toHaveAttribute("aria-checked", "false");
    box.focus();
    await user.keyboard(" ");
    expect(box).toHaveAttribute("aria-checked", "true");
    await expectNoAxeViolations();
  });

  it("supports controlled and indeterminate state", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [checked, setChecked] = useState<boolean | "indeterminate">("indeterminate");
      return (
        <Checkbox
          aria-label="Select all"
          checked={checked}
          onCheckedChange={(value) => {
            onChange(value);
            setChecked(value);
          }}
        />
      );
    }
    render(<Controlled />);
    const box = screen.getByRole("checkbox", { name: "Select all" });
    expect(box).toHaveAttribute("aria-checked", "mixed");
    await user.click(box);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(box).toHaveAttribute("aria-checked", "true");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Off" disabled />);
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("participates in native forms with a hidden input", () => {
    render(
      <form aria-label="f">
        <Checkbox aria-label="News" name="news" defaultChecked value="yes" />
      </form>,
    );
    const form = screen.getByRole("form") as HTMLFormElement;
    expect(new FormData(form).get("news")).toBe("yes");
  });
});
