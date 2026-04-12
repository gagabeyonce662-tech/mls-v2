/**
 * Centralized formatting utilities to ensure consistency across the application.
 * Forces 'en-US' locale to prevent hydration mismatches.
 */

export function formatCurrency(value: number | string): string {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numericValue)) return "Price on request";

    return `$${numericValue.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
}

export function formatNumber(value: number | string): string {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numericValue)) return "0";

    return numericValue.toLocaleString("en-US");
}

export function formatArea(value: number | string, unit: string = "sqft"): string {
    const formattedNumber = formatNumber(value);
    return `${formattedNumber} ${unit}`;
}
