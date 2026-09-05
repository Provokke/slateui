import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { expectNoAxeViolations } from "./a11y";

function Fruit(props: React.ComponentProps<typeof Select>) {
  return (
    <>
      <Label htmlFor="fruit">Fruit</Label>
      <Select {...props}>
        <SelectTrigger id="fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="cherry" disabled>
              Cherry
            </SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="durian">Durian</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

describe("Select", () => {
  it("renders a combobox trigger with placeholder", async () => {
    render(<Fruit />);
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveTextContent("Pick a fruit");
    await expectNoAxeViolations();
  });

  it("opens with the keyboard, navigates and selects", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fruit onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Apple", "Banana", "Cherry", "Durian"]);
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("option", { name: "Banana" }));
    expect(onValueChange).toHaveBeenCalledWith("banana");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Banana");
  });

  it("closes on Escape without changing the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fruit defaultValue="apple" onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent("Apple");
  });

  it("supports controlled value", () => {
    function Controlled() {
      const [value, setValue] = useState("durian");
      return <Fruit value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Durian");
  });

  it("can be disabled", () => {
    render(<Fruit disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
