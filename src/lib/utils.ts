
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined): string {
  // Handle null and undefined values
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }

  // Convert to number if it's a string
  const numericValue = typeof value === 'string' ? Number(value) : value;

  // Check for invalid numbers (NaN, Infinity, -Infinity)
  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return 'R$ 0,00';
  }

  // Format valid numbers
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
}
