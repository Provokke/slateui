import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { expectNoAxeViolations } from "./a11y";

function Example(props: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue="account" {...props}>
      <TabsList aria-label="Settings">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="legacy" disabled>
          Legacy
        </TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel</TabsContent>
      <TabsContent value="billing">Billing panel</TabsContent>
      <TabsContent value="legacy">Legacy panel</TabsContent>
      <TabsContent value="team">Team panel</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("renders tablist/tab/tabpanel roles with selection state", async () => {
    render(<Example />);
    expect(screen.getByRole("tablist", { name: "Settings" })).toBeInTheDocument();
    const account = screen.getByRole("tab", { name: "Account" });
    expect(account).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveTextContent("Account panel");
    expect(panel).toHaveAttribute("aria-labelledby", account.id);
    expect(account).toHaveAttribute("aria-controls", panel.id);
    await expectNoAxeViolations();
  });

  it("moves with arrow keys, skips disabled tabs, wraps, Home/End", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Billing" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Billing panel");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Team" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Team" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();
  });

  it("supports manual activation and controlled value", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("team");
      return (
        <>
          <Example value={value} onValueChange={setValue} activationMode="manual" />
          <span data-testid="v">{value}</span>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Team panel");
    await user.click(screen.getByRole("tab", { name: "Billing" }));
    expect(screen.getByTestId("v")).toHaveTextContent("billing");
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();
    expect(screen.getByTestId("v")).toHaveTextContent("billing");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("v")).toHaveTextContent("account");
  });
});
