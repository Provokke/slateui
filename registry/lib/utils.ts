import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Join class names conditionally and resolve conflicting Tailwind utilities
 * so that the last one wins (e.g. `cn("px-2", "px-4")` -> `"px-4"`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
