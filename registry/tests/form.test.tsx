import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { expectNoAxeViolations } from "./a11y";

function SignupForm({ onSubmit }: { onSubmit: (data: Record<string, string>) => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <Form
      aria-label="Sign up"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<
          string,
          string
        >;
        if (!data.username || data.username.length < 3) {
          setError("Username must be at least 3 characters.");
          return;
        }
        setError(null);
        onSubmit(data);
      }}
    >
      <FormField name="username" error={error} required>
        <FormLabel>Username</FormLabel>
        <FormControl>
          <Input />
        </FormControl>
        <FormDescription>Your public handle.</FormDescription>
        <FormMessage />
      </FormField>
      <Button type="submit">Create account</Button>
    </Form>
  );
}

describe("Form helpers", () => {
  it("links label, control and description", async () => {
    render(<SignupForm onSubmit={() => {}} />);
    const input = screen.getByRole("textbox", { name: /Username/ });
    expect(input).toHaveAttribute("name", "username");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAccessibleDescription("Your public handle.");
    expect(input).not.toHaveAttribute("aria-invalid");
    await expectNoAxeViolations();
  });

  it("marks the control invalid and announces the error", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SignupForm onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: /Username/ });
    await user.type(input, "ab");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Your public handle. Username must be at least 3 characters.",
    );
    expect(screen.getByText("Username must be at least 3 characters.")).toHaveClass("text-danger");
    await expectNoAxeViolations();

    await user.type(input, "c");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(onSubmit).toHaveBeenCalledWith({ username: "abc" });
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText(/at least 3/)).not.toBeInTheDocument();
  });

  it("omits aria-describedby when there is no description or error", () => {
    render(
      <FormField>
        <FormLabel>Plain</FormLabel>
        <FormControl>
          <Input />
        </FormControl>
        <FormMessage />
      </FormField>,
    );
    expect(screen.getByRole("textbox", { name: "Plain" })).not.toHaveAttribute("aria-describedby");
  });

  it("useFormField throws outside of FormField", () => {
    function Orphan() {
      useFormField();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/inside <FormField>/);
    spy.mockRestore();
  });
});
