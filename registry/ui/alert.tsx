import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const alertVariants = cva(
  "relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-lg border border-l-4 px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>:not(svg)]:col-start-2",
  {
    variants: {
      tone: {
        info: "border-edge border-l-brand bg-surface text-surface-ink",
        success: "border-edge border-l-success bg-surface text-surface-ink",
        warning: "border-edge border-l-warning bg-surface text-surface-ink",
        danger: "border-danger/40 border-l-danger bg-danger/5 text-ink",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

/**
 * Static, inline callout. Danger alerts use role="alert" (assertive) so screen
 * readers announce them immediately; other tones use role="status" (polite).
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, tone, role, ...props }, ref) => (
    <div
      ref={ref}
      role={role ?? (tone === "danger" ? "alert" : "status")}
      data-tone={tone ?? "info"}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  ),
);
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("font-semibold leading-tight", className)} {...props} />
  ),
);
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-muted-ink [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";
