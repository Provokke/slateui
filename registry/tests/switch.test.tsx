import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { expectNoAxeViolations } from "./a11y";

describe("Switch", () => {
  it("exposes role=switch and toggles with click / Space / Enter", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Switch id="wifi" />
        <Label htmlFor="wifi">Wi-Fi</Label>
      </>,
    );
    const sw = screen.getByRole("switch", { name: "Wi-Fi" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
    await user.keyboard(" ");
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.keyboard("{Enter}");
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(sw).toHaveAttribute("data-state", "checked");
    await expectNoAxeViolations();
  });

  it("works controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [on, setOn] = useState(true);
      return (
        <>
          <Switch aria-label="Dark" checked={on} onCheckedChange={setOn} />
          <span data-testid="state">{on ? "on" : "off"}</span>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("switch"));
    expect(screen.getByTestId("state")).toHaveTextContent("off");
  });

  it("is inert when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch aria-label="x" disabled onCheckedChange={onChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
