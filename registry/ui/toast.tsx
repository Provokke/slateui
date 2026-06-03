"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------------------------------------
 * A tiny, dependency-free toast store. Call `toast()` from anywhere (event handlers, effects,
 * async code) and render a single <Toaster /> near the root of your app.
 * ----------------------------------------------------------------------------------------------*/

export type ToastTone = "default" | "success" | "warning" | "error";

export interface ToastOptions {
  id?: string;
  description?: React.ReactNode;
  tone?: ToastTone;
  /** Milliseconds before auto-dismiss. Use Infinity to keep it open. Default 5000. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastRecord extends Required<Pick<ToastOptions, "tone" | "duration">> {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastOptions["action"];
  createdAt: number;
}

type Listener = () => void;

let records: ToastRecord[] = [];
const listeners = new Set<Listener>();
let counter = 0;

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => records;
const EMPTY: ToastRecord[] = [];
const getServerSnapshot = () => EMPTY;

function push(title: React.ReactNode, options: ToastOptions = {}): string {
  const id = options.id ?? `toast-${++counter}`;
  const next: ToastRecord = {
    id,
    title,
    description: options.description,
    tone: options.tone ?? "default",
    duration: options.duration ?? 5000,
    action: options.action,
    createdAt: Date.now(),
  };
  const existing = records.findIndex((r) => r.id === id);
  records =
    existing === -1
      ? [...records, next]
      : records.map((r, index) => (index === existing ? next : r));
  emit();
  return id;
}

function dismiss(id?: string) {
  records = id === undefined ? [] : records.filter((r) => r.id !== id);
  emit();
}

type ToastFn = ((title: React.ReactNode, options?: ToastOptions) => string) & {
  success: (title: React.ReactNode, options?: Omit<ToastOptions, "tone">) => string;
  warning: (title: React.ReactNode, options?: Omit<ToastOptions, "tone">) => string;
  error: (title: React.ReactNode, options?: Omit<ToastOptions, "tone">) => string;
  dismiss: (id?: string) => void;
};

export const toast: ToastFn = Object.assign(push, {
  success: (title: React.ReactNode, options?: Omit<ToastOptions, "tone">) =>
    push(title, { ...options, tone: "success" }),
  warning: (title: React.ReactNode, options?: Omit<ToastOptions, "tone">) =>
    push(title, { ...options, tone: "warning" }),
  error: (title: React.ReactNode, options?: Omit<ToastOptions, "tone">) =>
    push(title, { ...options, tone: "error" }),
  dismiss,
});

/** Subscribe to the current list of toasts (useful for custom renderers). */
export function useToasts(): ToastRecord[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const toneAccent: Record<ToastTone, string> = {
  default: "before:bg-field",
  success: "before:bg-success",
  warning: "before:bg-warning",
  error: "before:bg-danger",
};

function ToastItem({ record }: { record: ToastRecord }) {
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused || !Number.isFinite(record.duration)) return;
    const timer = setTimeout(() => dismiss(record.id), record.duration);
    return () => clearTimeout(timer);
  }, [paused, record.duration, record.id]);

  return (
    <li
      data-tone={record.tone}
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-edge bg-surface py-3 pr-10 pl-4 text-sm text-surface-ink shadow-lg",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        toneAccent[record.tone],
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") dismiss(record.id);
      }}
    >
      <div
        role={record.tone === "error" ? "alert" : "status"}
        aria-live={record.tone === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        className="grid flex-1 gap-0.5"
      >
        <p className="font-semibold">{record.title}</p>
        {record.description ? <p className="text-muted-ink">{record.description}</p> : null}
      </div>
      {record.action ? (
        <button
          type="button"
          className="shrink-0 rounded-md border border-field px-2 py-1 text-xs font-medium outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
          onClick={() => {
            record.action?.onClick();
            dismiss(record.id);
          }}
        >
          {record.action.label}
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Dismiss notification"
        className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-md text-muted-ink outline-none hover:bg-subtle hover:text-ink focus-visible:ring-2 focus-visible:ring-focus"
        onClick={() => dismiss(record.id)}
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </li>
  );
}

export interface ToasterProps {
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
  /** Maximum number of toasts rendered at once (newest win). Default 4. */
  limit?: number;
  className?: string;
  label?: string;
}

const positions: Record<NonNullable<ToasterProps["position"]>, string> = {
  "top-right": "top-0 right-0 items-end",
  "top-center": "top-0 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-0 right-0 items-end",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
};

export function Toaster({
  position = "bottom-right",
  limit = 4,
  className,
  label = "Notifications",
}: ToasterProps) {
  const items = useToasts();
  const visible = items.slice(-limit);
  return (
    <section
      aria-label={label}
      className={cn(
        "pointer-events-none fixed z-[100] flex w-full max-w-sm flex-col p-4",
        positions[position],
        className,
      )}
    >
      <ol className="flex w-full flex-col gap-2">
        {visible.map((record) => (
          <ToastItem key={record.id} record={record} />
        ))}
      </ol>
    </section>
  );
}
