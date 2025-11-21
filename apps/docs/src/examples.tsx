import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface Example {
  title: string;
  render: () => ReactNode;
}

export interface ComponentDoc {
  slug: string;
  name: string;
  description: string;
  examples: Example[];
  usage: string;
}

function DialogDemo() {
  const [name, setName] = useState("Ada Lovelace");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Changes are saved when you press Save.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="dialog-name">Display name</Label>
          <Input id="dialog-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => toast.success("Profile saved", { description: name })}>
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MenuDemo() {
  const [grid, setGrid] = useState(true);
  const [density, setDensity] = useState("comfortable");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>File</DropdownMenuLabel>
        <DropdownMenuItem>
          Rename <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Duplicate <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Share (soon)</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
          Show grid
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
          <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem tone="danger">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FormDemo() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  return (
    <Form
      className="w-full max-w-sm"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("handle")?.toString() ?? "";
        if (value.trim().length < 3) {
          setError("Handle must be at least 3 characters.");
          setDone(false);
        } else {
          setError(null);
          setDone(true);
        }
      }}
    >
      <FormField name="handle" error={error} required>
        <FormLabel>Handle</FormLabel>
        <FormControl>
          <Input placeholder="ada" />
        </FormControl>
        <FormDescription>Shown on your public profile.</FormDescription>
        <FormMessage />
      </FormField>
      <div className="flex items-center gap-3">
        <Button type="submit">Create account</Button>
        {done ? <span className="text-sm text-success">Looks good!</span> : null}
      </div>
    </Form>
  );
}

function ControlsDemo() {
  const [agree, setAgree] = useState<boolean | "indeterminate">("indeterminate");
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="cb-terms" checked={agree} onCheckedChange={setAgree} />
        <Label htmlFor="cb-terms">Accept terms and conditions</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb-disabled" disabled />
        <Label htmlFor="cb-disabled">Disabled</Label>
      </div>
    </div>
  );
}

const invoices = [
  { id: "INV-001", status: "Paid", method: "Card", amount: 250 },
  { id: "INV-002", status: "Pending", method: "Transfer", amount: 150 },
  { id: "INV-003", status: "Overdue", method: "Card", amount: 350 },
];

export const docs: ComponentDoc[] = [
  {
    slug: "button",
    name: "Button",
    description: "Triggers an action. Six variants, four sizes, loading state and asChild.",
    usage: `import { Button } from "@/components/ui/button";\n\n<Button variant="outline" size="sm">Cancel</Button>`,
    examples: [
      {
        title: "Variants",
        render: () => (
          <div className="flex flex-wrap gap-2">
            <Button>Solid</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="link">Link</Button>
          </div>
        ),
      },
      {
        title: "Sizes and states",
        render: () => (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Add item">
              +
            </Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <Button asChild variant="outline">
              <a href="#/components/card">As a link</a>
            </Button>
          </div>
        ),
      },
    ],
  },
  {
    slug: "input",
    name: "Input",
    description: "Single-line text field that pairs with Label.",
    usage: `<Label htmlFor="email">Email</Label>\n<Input id="email" type="email" />`,
    examples: [
      {
        title: "Default",
        render: () => (
          <div className="grid w-full max-w-sm gap-2">
            <Label htmlFor="in-email">Email</Label>
            <Input id="in-email" type="email" placeholder="you@example.com" />
          </div>
        ),
      },
      {
        title: "Invalid and disabled",
        render: () => (
          <div className="grid w-full max-w-sm gap-3">
            <Input aria-label="Invalid" aria-invalid="true" defaultValue="not-an-email" />
            <Input aria-label="Disabled" disabled placeholder="Disabled" />
          </div>
        ),
      },
    ],
  },
  {
    slug: "label",
    name: "Label",
    description: "Accessible label; clicking it focuses the associated control.",
    usage: `<Label htmlFor="name">Name</Label>`,
    examples: [
      {
        title: "Default",
        render: () => (
          <div className="flex items-center gap-2">
            <Checkbox id="lbl-cb" />
            <Label htmlFor="lbl-cb">Remember me</Label>
          </div>
        ),
      },
    ],
  },
  {
    slug: "textarea",
    name: "Textarea",
    description: "Multi-line text field.",
    usage: `<Textarea placeholder="Tell us more" />`,
    examples: [
      {
        title: "Default",
        render: () => (
          <div className="grid w-full max-w-md gap-2">
            <Label htmlFor="ta-msg">Message</Label>
            <Textarea id="ta-msg" placeholder="Type your message here." />
          </div>
        ),
      },
    ],
  },
  {
    slug: "checkbox",
    name: "Checkbox",
    description: "Tri-state checkbox: checked, unchecked or indeterminate.",
    usage: `<Checkbox id="terms" />\n<Label htmlFor="terms">Accept</Label>`,
    examples: [{ title: "States", render: () => <ControlsDemo /> }],
  },
  {
    slug: "switch",
    name: "Switch",
    description: "Binary on/off control exposed as role=switch.",
    usage: `<Switch id="wifi" />\n<Label htmlFor="wifi">Wi-Fi</Label>`,
    examples: [
      {
        title: "Default",
        render: () => (
          <div className="flex items-center gap-3">
            <Switch id="sw-air" defaultChecked />
            <Label htmlFor="sw-air">Airplane mode</Label>
          </div>
        ),
      },
    ],
  },
  {
    slug: "select",
    name: "Select",
    description: "Pick one value from a list, with typeahead and full keyboard support.",
    usage: `<Select>\n  <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>\n  <SelectContent><SelectItem value="a">A</SelectItem></SelectContent>\n</Select>`,
    examples: [
      {
        title: "Grouped",
        render: () => (
          <div className="grid w-60 gap-2">
            <Label htmlFor="sel-tz">Timezone</Label>
            <Select>
              <SelectTrigger id="sel-tz">
                <SelectValue placeholder="Select a timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Europe</SelectLabel>
                  <SelectItem value="lon">London</SelectItem>
                  <SelectItem value="ber">Berlin</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Americas</SelectLabel>
                  <SelectItem value="nyc">New York</SelectItem>
                  <SelectItem value="sfo">San Francisco</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ),
      },
    ],
  },
  {
    slug: "dialog",
    name: "Dialog",
    description: "Modal window. Traps focus, closes on Escape and restores focus to the trigger.",
    usage: `<Dialog>\n  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>\n  <DialogContent><DialogTitle>Title</DialogTitle></DialogContent>\n</Dialog>`,
    examples: [{ title: "Edit profile", render: () => <DialogDemo /> }],
  },
  {
    slug: "dropdown-menu",
    name: "Dropdown Menu",
    description: "Menu of actions with checkbox and radio items and roving focus.",
    usage: `<DropdownMenu>\n  <DropdownMenuTrigger asChild><Button>Open</Button></DropdownMenuTrigger>\n  <DropdownMenuContent><DropdownMenuItem>Rename</DropdownMenuItem></DropdownMenuContent>\n</DropdownMenu>`,
    examples: [{ title: "File menu", render: () => <MenuDemo /> }],
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    description: "Short label on hover or focus. Wrap your app in TooltipProvider once.",
    usage: `<Tooltip>\n  <TooltipTrigger asChild><Button>?</Button></TooltipTrigger>\n  <TooltipContent>Help</TooltipContent>\n</Tooltip>`,
    examples: [
      {
        title: "Icon button",
        render: () => (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Bold">
                <span className="font-bold">B</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold (Ctrl+B)</TooltipContent>
          </Tooltip>
        ),
      },
    ],
  },
  {
    slug: "popover",
    name: "Popover",
    description: "Floating panel for rich, interactive content anchored to a trigger.",
    usage: `<Popover>\n  <PopoverTrigger asChild><Button>Open</Button></PopoverTrigger>\n  <PopoverContent>...</PopoverContent>\n</Popover>`,
    examples: [
      {
        title: "Dimensions",
        render: () => (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Set dimensions</Button>
            </PopoverTrigger>
            <PopoverContent aria-label="Dimensions" className="grid gap-3">
              <p className="text-sm font-medium">Dimensions</p>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="pop-w">Width</Label>
                <Input id="pop-w" defaultValue="100%" className="col-span-2 h-8" />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <Label htmlFor="pop-h">Height</Label>
                <Input id="pop-h" defaultValue="auto" className="col-span-2 h-8" />
              </div>
            </PopoverContent>
          </Popover>
        ),
      },
    ],
  },
  {
    slug: "tabs",
    name: "Tabs",
    description: "Layered panels; arrow keys move between tabs.",
    usage: `<Tabs defaultValue="a">\n  <TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>\n  <TabsContent value="a">...</TabsContent>\n</Tabs>`,
    examples: [
      {
        title: "Account settings",
        render: () => (
          <Tabs defaultValue="account" className="w-full max-w-md">
            <TabsList aria-label="Account settings">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="account">Update your name and email.</TabsContent>
            <TabsContent value="password">Change your password.</TabsContent>
            <TabsContent value="billing">Manage your plan.</TabsContent>
          </Tabs>
        ),
      },
    ],
  },
  {
    slug: "accordion",
    name: "Accordion",
    description: "Stacked headings that reveal content.",
    usage: `<Accordion type="single" collapsible>\n  <AccordionItem value="a">\n    <AccordionTrigger>Q</AccordionTrigger>\n    <AccordionContent>A</AccordionContent>\n  </AccordionItem>\n</Accordion>`,
    examples: [
      {
        title: "FAQ",
        render: () => (
          <Accordion type="single" collapsible className="w-full max-w-md">
            <AccordionItem value="what">
              <AccordionTrigger>What is slateui?</AccordionTrigger>
              <AccordionContent>Accessible components you copy into your project.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="npm">
              <AccordionTrigger>Is it an npm dependency?</AccordionTrigger>
              <AccordionContent>No. The CLI copies source files; you own them.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="theme">
              <AccordionTrigger>Can I theme it?</AccordionTrigger>
              <AccordionContent>Yes, every color is a CSS variable.</AccordionContent>
            </AccordionItem>
          </Accordion>
        ),
      },
    ],
  },
  {
    slug: "card",
    name: "Card",
    description: "Surface for grouping related content.",
    usage: `<Card>\n  <CardHeader><CardTitle>Title</CardTitle></CardHeader>\n  <CardContent>...</CardContent>\n</Card>`,
    examples: [
      {
        title: "Plan",
        render: () => (
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Team plan</CardTitle>
              <CardDescription>For small teams shipping fast.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">
                $24<span className="text-sm font-normal text-muted-ink"> / month</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Upgrade</Button>
            </CardFooter>
          </Card>
        ),
      },
    ],
  },
  {
    slug: "badge",
    name: "Badge",
    description: "Compact status label in six tones.",
    usage: `<Badge tone="success">Paid</Badge>`,
    examples: [
      {
        title: "Tones",
        render: () => (
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="brand">Brand</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="outline">Outline</Badge>
          </div>
        ),
      },
    ],
  },
  {
    slug: "alert",
    name: "Alert",
    description: "Inline callout. Danger uses role=alert, others role=status.",
    usage: `<Alert tone="warning">\n  <AlertTitle>Heads up</AlertTitle>\n  <AlertDescription>...</AlertDescription>\n</Alert>`,
    examples: [
      {
        title: "Tones",
        render: () => (
          <div className="grid w-full max-w-lg gap-3">
            <Alert>
              <AlertTitle>New version available</AlertTitle>
              <AlertDescription>Run slateui diff to see what changed.</AlertDescription>
            </Alert>
            <Alert tone="success">
              <AlertTitle>Deployed</AlertTitle>
              <AlertDescription>Your site is live.</AlertDescription>
            </Alert>
            <Alert tone="warning">
              <AlertTitle>Quota at 90%</AlertTitle>
              <AlertDescription>Consider upgrading your plan.</AlertDescription>
            </Alert>
            <Alert tone="danger">
              <AlertTitle>Payment failed</AlertTitle>
              <AlertDescription>Update your card to keep your workspace.</AlertDescription>
            </Alert>
          </div>
        ),
      },
    ],
  },
  {
    slug: "avatar",
    name: "Avatar",
    description: "Image with an initials fallback while loading or on error.",
    usage: `<Avatar>\n  <AvatarImage src="/me.png" alt="Me" />\n  <AvatarFallback>ME</AvatarFallback>\n</Avatar>`,
    examples: [
      {
        title: "Fallbacks",
        render: () => (
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src="/does-not-exist.png" alt="Grace Hopper" />
              <AvatarFallback>GH</AvatarFallback>
            </Avatar>
            <Avatar className="size-12">
              <AvatarFallback>AL</AvatarFallback>
            </Avatar>
          </div>
        ),
      },
    ],
  },
  {
    slug: "separator",
    name: "Separator",
    description: "Divider, decorative by default.",
    usage: `<Separator />`,
    examples: [
      {
        title: "Horizontal and vertical",
        render: () => (
          <div className="w-full max-w-sm">
            <p className="text-sm font-medium">slateui</p>
            <p className="text-sm text-muted-ink">Copy-paste components.</p>
            <Separator className="my-3" />
            <div className="flex h-5 items-center gap-3 text-sm">
              <span>Docs</span>
              <Separator orientation="vertical" />
              <span>CLI</span>
              <Separator orientation="vertical" />
              <span>Source</span>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    description: "Loading placeholder hidden from assistive technology.",
    usage: `<Skeleton className="h-4 w-40" />`,
    examples: [
      {
        title: "Profile row",
        render: () => (
          <div className="flex items-center gap-3" role="status" aria-label="Loading profile">
            <Skeleton className="size-10 rounded-full" />
            <div className="grid gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ),
      },
    ],
  },
  {
    slug: "toast",
    name: "Toast",
    description: "Imperative notifications: call toast() anywhere, render <Toaster /> once.",
    usage: `import { toast, Toaster } from "@/components/ui/toast";\n\ntoast.success("Saved");`,
    examples: [
      {
        title: "Tones",
        render: () => (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast("Event created")}>
              Default
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success("Saved", { description: "All changes stored." })}
            >
              Success
            </Button>
            <Button variant="outline" onClick={() => toast.warning("Storage almost full")}>
              Warning
            </Button>
            <Button variant="outline" onClick={() => toast.error("Upload failed")}>
              Error
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast("Message archived", {
                  action: { label: "Undo", onClick: () => toast("Restored") },
                })
              }
            >
              With action
            </Button>
          </div>
        ),
      },
    ],
  },
  {
    slug: "table",
    name: "Table",
    description: "Semantic table primitives with caption, header and footer.",
    usage: `<Table>\n  <TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader>\n  <TableBody>...</TableBody>\n</Table>`,
    examples: [
      {
        title: "Invoices",
        render: () => (
          <Table>
            <TableCaption>Recent invoices</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.id}</TableCell>
                  <TableCell>
                    <Badge
                      tone={
                        inv.status === "Paid"
                          ? "success"
                          : inv.status === "Pending"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{inv.method}</TableCell>
                  <TableCell className="text-right">${inv.amount}.00</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">$750.00</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ),
      },
    ],
  },
  {
    slug: "form",
    name: "Form",
    description: "Field helpers that wire label, description and error to the control with ARIA.",
    usage: `<FormField name="email" error={error}>\n  <FormLabel>Email</FormLabel>\n  <FormControl><Input /></FormControl>\n  <FormMessage />\n</FormField>`,
    examples: [{ title: "Validation", render: () => <FormDemo /> }],
  },
];
