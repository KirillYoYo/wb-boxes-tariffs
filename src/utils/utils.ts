export function parseDecimalValue(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) return null;

    if (typeof value === 'number') return value.toString();

    const cleaned = value.replace(',', '.').trim();

    if (cleaned === '-' || cleaned === '') return null;

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed.toString();
}