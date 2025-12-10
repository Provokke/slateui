// Copied into scaffolded apps by the e2e suite. Uses every slateui component so the
// type-check and production build exercise all of the copied source.
import { useState } from "react";
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
  DropdownMenuSeparator,
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
  SelectItem,
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function Showcase() {
  const [grid, setGrid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  return (
    <TooltipProvider>
      <main className={cn("mx-auto grid max-w-3xl gap-6 p-8", grid && "bg-canvas")}>
        <Card>
          <CardHeader>
            <CardTitle>slateui showcase</CardTitle>
            <CardDescription>Every component, compiled in a fresh app.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button onClick={() => toast.success("Saved")}>Toast</Button>
            <Badge tone="success">Live</Badge>
            <Avatar>
              <AvatarImage src="/avatar.png" alt="Avatar" />
              <AvatarFallback>SU</AvatarFallback>
            </Avatar>
            <Skeleton className="h-4 w-24" />
          </CardContent>
          <CardFooter>
            <Separator />
          </CardFooter>
        </Card>
        <Alert tone="warning">
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>This app was scaffolded by the e2e suite.</AlertDescription>
        </Alert>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            setError("Required");
          }}
        >
          <FormField name="email" error={error}>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" />
            </FormControl>
            <FormDescription>We never share it.</FormDescription>
            <FormMessage />
          </FormField>
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" />
          <div className="flex items-center gap-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept</Label>
            <Switch aria-label="Notifications" />
          </div>
          <Select defaultValue="a">
            <SelectTrigger aria-label="Choice">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">A</SelectItem>
              <SelectItem value="b">B</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit">Submit</Button>
        </Form>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog</DialogTitle>
              <DialogDescription>Body</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
              Grid
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="soft">Popover</Button>
          </PopoverTrigger>
          <PopoverContent>Popover body</PopoverContent>
        </Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" aria-label="Help">
              ?
            </Button>
          </TooltipTrigger>
          <TooltipContent>Help text</TooltipContent>
        </Tooltip>
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First</TabsContent>
          <TabsContent value="two">Second</TabsContent>
        </Tabs>
        <Accordion type="single" collapsible>
          <AccordionItem value="q">
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Table>
          <TableCaption>Table</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Ada</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </main>
      <Toaster />
    </TooltipProvider>
  );
}
