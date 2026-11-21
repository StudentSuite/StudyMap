/** Whole-number formatting with thousands separators: 1133 -> "1,133". */
export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}
