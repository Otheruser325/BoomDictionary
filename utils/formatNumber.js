export function formatNumber(number) {
    if (number == null) {
        return 'N/A';
    }

    const numericValue = Number(number);

    if (Number.isFinite(numericValue)) {
        return new Intl.NumberFormat().format(numericValue);
    }

    return String(number);
}
