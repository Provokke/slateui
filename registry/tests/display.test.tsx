import { render, screen } from "@testing-library/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { expectNoAxeViolations } from "./a11y";

describe("Card", () => {
  it("renders header/title/description/content/footer with an h3 title by default", async () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>Requests this month</CardDescription>
        </CardHeader>
        <CardContent>12,400</CardContent>
        <CardFooter>
          <Button size="sm">Upgrade</Button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Usage" })).toBeInTheDocument();
    expect(screen.getByText("Requests this month").tagName).toBe("P");
    expect(screen.getByTestId("card")).toHaveClass("rounded-xl", "bg-surface");
    await expectNoAxeViolations();
  });

  it("lets the title heading level be changed", () => {
    render(<CardTitle as="h2">Billing</CardTitle>);
    expect(screen.getByRole("heading", { level: 2, name: "Billing" })).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it.each([
    ["neutral", "bg-subtle"],
    ["brand", "bg-brand"],
    ["success", "bg-success"],
    ["warning", "bg-warning"],
    ["danger", "bg-danger"],
    ["outline", "border-field"],
  ] as const)("tone=%s", (tone, cls) => {
    render(<Badge tone={tone}>{tone}</Badge>);
    const badge = screen.getByText(tone);
    expect(badge).toHaveClass(cls);
    expect(badge).toHaveAttribute("data-tone", tone);
  });

  it("defaults to neutral and is axe-clean", async () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toHaveAttribute("data-tone", "neutral");
    await expectNoAxeViolations();
  });
});

describe("Alert", () => {
  it("uses role=status for informational tones", async () => {
    render(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>You can add components with the CLI.</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("status");
    expect(alert).toHaveTextContent("Heads up");
    expect(alert).toHaveAttribute("data-tone", "info");
    await expectNoAxeViolations();
  });

  it("uses role=alert for danger and allows overriding role", () => {
    render(
      <>
        <Alert tone="danger">Payment failed</Alert>
        <Alert tone="success" role="note">
          Saved
        </Alert>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Payment failed");
    expect(screen.getByRole("note")).toHaveTextContent("Saved");
  });
});

describe("Separator", () => {
  it("is decorative (role=none) by default", () => {
    const { container } = render(<Separator />);
    expect(container.firstElementChild).toHaveAttribute("role", "none");
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("is a semantic separator with orientation when not decorative", async () => {
    render(<Separator decorative={false} orientation="vertical" />);
    const sep = screen.getByRole("separator");
    expect(sep).toHaveAttribute("aria-orientation", "vertical");
    expect(sep).toHaveClass("w-px");
    await expectNoAxeViolations();
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive technology and merges classes", async () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const el = container.firstElementChild!;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("animate-pulse", "h-4", "w-32");
    await expectNoAxeViolations();
  });
});
