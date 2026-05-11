"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer grid size-4.5 shrink-0 place-items-center rounded-sm border border-field bg-canvas shadow-xs",
      "outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-brand-ink",
      "data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand data-[state=indeterminate]:text-brand-ink",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="group grid place-items-center">
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden="true">
        <path
          className="group-data-[state=indeterminate]:hidden"
          d="M3.5 8.5l3 3 6-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="hidden group-data-[state=indeterminate]:block"
          d="M4 8h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";
