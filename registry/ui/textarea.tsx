import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const base = [
  "flex min-h-24 w-full rounded-md border border-field bg-canvas px-3 py-2 text-sm text-ink shadow-xs",
  "placeholder:text-muted-ink outline-none transition-[border-color,box-shadow]",
  "focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/40",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30",
].join(" ");

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea ref={ref} rows={rows} className={cn(base, className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";
