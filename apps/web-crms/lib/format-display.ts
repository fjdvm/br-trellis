/**
 * Display formatting utilities for consistent text output.
 */

/**
 * Formats a name to proper title case (e.g., "john smith" → "John Smith",
 * "JANE DOE" → "Jane Doe"). Handles hyphenated names and apostrophes.
 * Returns null/undefined unchanged so null-coalescing still works.
 */
export function formatName(name: string | null | undefined): string | null | undefined {
  if (!name) return name;
  return name
    .toLowerCase()
    .replace(/(?:^|\s|[-'])\S/g, (char) => char.toUpperCase());
}

/**
 * Formats a display value: trims and title-cases the text.
 * Returns "—" for null, undefined, or whitespace-only values.
 */
export function formatDisplayName(name: string | null | undefined): string {
  if (!name || !name.trim()) return "—";
  return formatName(name.trim())!;
}
