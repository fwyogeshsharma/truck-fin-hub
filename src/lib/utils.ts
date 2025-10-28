import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a string to title case
 * Example: "john doe" -> "John Doe"
 * Example: "JOHN DOE" -> "John Doe"
 */
export function toTitleCase(str: string | undefined | null): string {
  if (!str) return '';

  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
