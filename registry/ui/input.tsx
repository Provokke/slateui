import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClasses = [
  "w-full rounded-md border border-field bg-canvas px-3 text-sm text-ink shadow-xs",
  "placeholder:text-muted-ink outline-none transition-[border-color,box-shadow]",
  "focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/40",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30",
].join(" ");

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        fieldClasses,
        "h-10 py-2 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
