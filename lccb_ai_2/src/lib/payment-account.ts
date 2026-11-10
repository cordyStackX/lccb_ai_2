export function maskAccountNumber(accountNumber: string | number): string {
    const normalizedAccountNumber = String(accountNumber).replace(/[\s-]/g, "");

    if (normalizedAccountNumber.length <= 4) return normalizedAccountNumber;

    return `${"*".repeat(normalizedAccountNumber.length - 4)}${normalizedAccountNumber.slice(-4)}`;
}
