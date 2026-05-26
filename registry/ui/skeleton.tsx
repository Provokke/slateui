import * as React from "react";
import { cn } from "@/lib/utils";

/** Placeholder block shown while content loads. Hidden from assistive tech. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-subtle", className)}
      {...props}
    />
  );
}
