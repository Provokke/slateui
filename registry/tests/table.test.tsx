import { render, screen, within } from "@testing-library/react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { expectNoAxeViolations } from "./a11y";

const invoices = [
  { id: "INV-1", status: "Paid", amount: 250 },
  { id: "INV-2", status: "Pending", amount: 150 },
];

describe("Table", () => {
  it("renders semantic table structure with caption and column headers", async () => {
    render(
      <Table>
        <TableCaption>Recent invoices</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell>{inv.id}</TableCell>
              <TableCell>{inv.status}</TableCell>
              <TableCell className="text-right">${inv.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right">$400</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );
    const table = screen.getByRole("table", { name: "Recent invoices" });
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual(["Invoice", "Status", "Amount"]);
    headers.forEach((h) => expect(h).toHaveAttribute("scope", "col"));
    expect(within(table).getAllByRole("row")).toHaveLength(4);
    expect(within(table).getByRole("cell", { name: "$400" })).toBeInTheDocument();
    expect(table.parentElement).toHaveClass("overflow-x-auto");
    await expectNoAxeViolations();
  });

  it("supports row headers via scope override and selected rows", () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-state="selected">
            <TableHead scope="row">Ada</TableHead>
            <TableCell>Admin</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("rowheader", { name: "Ada" })).toHaveAttribute("scope", "row");
    expect(screen.getByRole("row")).toHaveClass("data-[state=selected]:bg-subtle");
  });
});
