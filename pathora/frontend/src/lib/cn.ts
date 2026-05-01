import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Type alias for single element className
 */
export type ClassName = string | undefined;

/**
 * Type alias for multi-part component className record
 */
export type ClassNameRecord<T extends string> = Partial<Record<T, string>>;

/**
 * Merges Tailwind classes conditionally and safely, resolving conflicts.
 * Follows the project's cn() convention.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
