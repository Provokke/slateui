import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster, toast } from "@/components/ui/toast";
import { expectNoAxeViolations } from "./a11y";

afterEach(() => {
  act(() => toast.dismiss());
});

describe("Toast", () => {
  it("renders a labelled notifications region that starts empty", async () => {
    render(<Toaster />);
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(within(region).queryAllByRole("listitem")).toHaveLength(0);
    await expectNoAxeViolations();
  });

  it("shows polite status toasts and assertive error toasts", async () => {
    render(<Toaster />);
    act(() => {
      toast.success("Saved", { description: "Your changes are live." });
      toast.error("Upload failed");
    });
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("SavedYour changes are live.");
    expect(status).toHaveAttribute("aria-live", "polite");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Upload failed");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(screen.getAllByRole("listitem").map((li) => li.dataset.tone)).toEqual([
      "success",
      "error",
    ]);
    await expectNoAxeViolations();
  });

  it("dismisses via the close button, Escape, and programmatically", async () => {
    const user = userEvent.setup();
    render(<Toaster />);
    let id = "";
    act(() => {
      toast("One", { duration: Infinity });
      toast("Two", { duration: Infinity });
      id = toast("Three", { duration: Infinity });
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    await user.click(screen.getAllByRole("button", { name: "Dismiss notification" })[0]);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    screen.getAllByRole("button", { name: "Dismiss notification" })[0].focus();
    await user.keyboard("{Escape}");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    act(() => toast.dismiss(id));
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("auto-dismisses after its duration", async () => {
    render(<Toaster />);
    act(() => {
      toast("Quick", { duration: 30 });
    });
    expect(screen.getByText("Quick")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Quick")).not.toBeInTheDocument());
  });

  it("runs actions, updates by id and respects the limit", async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn();
    render(<Toaster limit={2} />);
    act(() => {
      toast("A", { duration: Infinity });
      toast("B", { duration: Infinity });
      toast("Deleted", {
        id: "del",
        duration: Infinity,
        action: { label: "Undo", onClick: onUndo },
      });
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("A")).not.toBeInTheDocument();
    act(() => {
      toast("Deleted 2 files", {
        id: "del",
        duration: Infinity,
        action: { label: "Undo", onClick: onUndo },
      });
    });
    expect(screen.getByText("Deleted 2 files")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.queryByText("Deleted 2 files")).not.toBeInTheDocument();
  });
});
