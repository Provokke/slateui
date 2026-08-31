import { createRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { expectNoAxeViolations } from "./a11y";

describe("Input", () => {
  it("is labelled by a Label and accepts typing (uncontrolled)", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "email");
    await user.type(input, "ada@example.com");
    expect(input).toHaveValue("ada@example.com");
    await expectNoAxeViolations();
  });

  it("defaults type to text and forwards refs", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Name" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
    expect(ref.current).toBe(screen.getByRole("textbox"));
  });

  it("works controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <>
          <Input
            aria-label="Upper"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
          />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.type(screen.getByLabelText("Upper"), "abc");
    expect(screen.getByLabelText("Upper")).toHaveValue("ABC");
    expect(screen.getByRole("status")).toHaveTextContent("ABC");
  });

  it("supports disabled and aria-invalid states", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Locked" disabled aria-invalid="true" defaultValue="x" />);
    const input = screen.getByLabelText("Locked");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    await user.type(input, "yz");
    expect(input).toHaveValue("x");
  });
});

describe("Textarea", () => {
  it("renders a multi-line textbox with default rows", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" />
      </>,
    );
    const textarea = screen.getByRole("textbox", { name: "Bio" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("rows", "4");
    await user.type(textarea, "line one{enter}line two");
    expect(textarea).toHaveValue("line one\nline two");
    await expectNoAxeViolations();
  });

  it("merges className", () => {
    render(<Textarea aria-label="t" className="min-h-40" />);
    expect(screen.getByRole("textbox")).toHaveClass("min-h-40");
    expect(screen.getByRole("textbox")).not.toHaveClass("min-h-24");
  });
});

describe("Label", () => {
  it("clicking the label focuses the associated control", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="n">Name</Label>
        <Input id="n" />
      </>,
    );
    await user.click(screen.getByText("Name"));
    expect(screen.getByRole("textbox")).toHaveFocus();
  });
});
