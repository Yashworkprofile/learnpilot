/** Whole percentages render without a decimal; fractional ones keep one. */
export function formatPercent(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}
