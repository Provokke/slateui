import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { expectNoAxeViolations } from "./a11y";

function Items() {
  return (
    <>
      <AccordionItem value="a">
        <AccordionTrigger>What is slateui?</AccordionTrigger>
        <AccordionContent>A copy-paste component system.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Do I install it?</AccordionTrigger>
        <AccordionContent>No, the CLI copies source files.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="c">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>Yes.</AccordionContent>
      </AccordionItem>
    </>
  );
}

describe("Accordion", () => {
  it("renders header buttons with aria-expanded/controls", async () => {
    render(
      <Accordion type="single" collapsible>
        <Items />
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "What is slateui?" });
    expect(trigger.closest("h3")).not.toBeNull();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.setup().click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const region = screen.getByRole("region", { name: "What is slateui?" });
    expect(region).toHaveTextContent("A copy-paste component system.");
    expect(trigger).toHaveAttribute("aria-controls", region.id);
    await expectNoAxeViolations();
  });

  it("single mode closes the previous item; collapsible allows closing", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible defaultValue="a">
        <Items />
      </Accordion>,
    );
    const a = screen.getByRole("button", { name: "What is slateui?" });
    const b = screen.getByRole("button", { name: "Do I install it?" });
    expect(a).toHaveAttribute("aria-expanded", "true");
    await user.click(b);
    expect(a).toHaveAttribute("aria-expanded", "false");
    expect(b).toHaveAttribute("aria-expanded", "true");
    await user.click(b);
    expect(b).toHaveAttribute("aria-expanded", "false");
  });

  it("multiple mode keeps several open", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Accordion type="multiple" onValueChange={onValueChange}>
        <Items />
      </Accordion>,
    );
    await user.click(screen.getByRole("button", { name: "What is slateui?" }));
    await user.click(screen.getByRole("button", { name: "Is it accessible?" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "c"]);
    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("supports arrow key / Home / End navigation between headers", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <Items />
      </Accordion>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "What is slateui?" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "Do I install it?" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "Is it accessible?" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: "What is slateui?" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "What is slateui?" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
