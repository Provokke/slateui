"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------------------------------------
 * Form helpers wire labels, descriptions and error messages to a control with the right ids and
 * ARIA attributes. They are state-library agnostic: pass `error` from react-hook-form, zod,
 * a server action, or plain useState.
 * ----------------------------------------------------------------------------------------------*/

interface FieldContextValue {
  controlId: string;
  descriptionId: string;
  messageId: string;
  name?: string;
  error?: string;
  required?: boolean;
  hasDescription: boolean;
  setHasDescription: (value: boolean) => void;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

export function useFormField(): FieldContextValue {
  const ctx = React.useContext(FieldContext);
  if (!ctx) throw new Error("useFormField must be used inside <FormField>");
  return ctx;
}

export const Form = React.forwardRef<HTMLFormElement, React.FormHTMLAttributes<HTMLFormElement>>(
  ({ className, ...props }, ref) => (
    <form ref={ref} className={cn("grid gap-5", className)} {...props} />
  ),
);
Form.displayName = "Form";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  /** Error message; when set the control is marked aria-invalid and described by it. */
  error?: string | null;
  required?: boolean;
  /** Override the generated control id. */
  controlId?: string;
}

export function FormField({
  name,
  error,
  required,
  controlId,
  className,
  ...props
}: FormFieldProps) {
  const baseId = React.useId();
  const [hasDescription, setHasDescription] = React.useState(false);
  const value = React.useMemo<FieldContextValue>(
    () => ({
      controlId: controlId ?? `${baseId}-control`,
      descriptionId: `${baseId}-description`,
      messageId: `${baseId}-message`,
      name,
      error: error ?? undefined,
      required,
      hasDescription,
      setHasDescription,
    }),
    [baseId, controlId, name, error, required, hasDescription],
  );
  return (
    <FieldContext.Provider value={value}>
      <div
        data-invalid={error ? "" : undefined}
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FieldContext.Provider>
  );
}

export const FormLabel = React.forwardRef<
  React.ComponentRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, children, ...props }, ref) => {
  const field = useFormField();
  return (
    <Label
      ref={ref}
      htmlFor={field.controlId}
      className={cn(field.error && "text-danger", className)}
      {...props}
    >
      {children}
      {field.required ? (
        <span aria-hidden="true" className="text-danger">
          *
        </span>
      ) : null}
    </Label>
  );
});
FormLabel.displayName = "FormLabel";

/** Passes id / name / aria-* props to its single child (an Input, Textarea, SelectTrigger...). */
export const FormControl = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const field = useFormField();
    const describedBy =
      [field.hasDescription ? field.descriptionId : null, field.error ? field.messageId : null]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <Slot
        ref={ref}
        id={field.controlId}
        aria-describedby={describedBy}
        aria-invalid={field.error ? true : undefined}
        aria-required={field.required || undefined}
        {...(field.name ? { name: field.name } : {})}
        {...props}
      />
    );
  },
);
FormControl.displayName = "FormControl";

export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const field = useFormField();
  const { setHasDescription } = field;
  React.useEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);
  return (
    <p
      ref={ref}
      id={field.descriptionId}
      className={cn("text-xs text-muted-ink", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const field = useFormField();
  const body = field.error ?? children;
  if (!body) return null;
  return (
    <p
      ref={ref}
      id={field.messageId}
      className={cn("text-xs font-medium text-danger", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";
