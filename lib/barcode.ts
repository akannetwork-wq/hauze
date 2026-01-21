/**
 * Utility for generating EAN-13 style barcodes
 */

/**
 * Calculates EAN-13 checksum digit
 */
export function calculateEAN13Checksum(code: string): number {
    if (code.length !== 12) {
        throw new Error('EAN-13 checksum requires a 12-digit string');
    }

    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(code[i], 10);
        // EAN-13 weights: Odd positions (1,3,5...) multiplied by 1, Even (2,4,6...) by 3
        // Note: JS is 0-indexed, so 0 is 1st (odd), 1 is 2nd (even)
        sum += digit * (i % 2 === 0 ? 1 : 3);
    }

    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Generates a random 13-digit barcode with EAN-13 checksum.
 * Uses '200' prefix for internal use.
 */
export function generateBarcode(): string {
    // Use '200' prefix for internal use barcodes
    // Next 9 digits are random
    const prefix = '200';
    let randomDigits = '';
    for (let i = 0; i < 9; i++) {
        randomDigits += Math.floor(Math.random() * 10).toString();
    }

    const base = prefix + randomDigits;
    const checksum = calculateEAN13Checksum(base);

    return base + checksum.toString();
}

/**
 * Validates if a string is a valid EAN-13 barcode
 */
export function isValidBarcode(barcode: string): boolean {
    if (!/^\d{13}$/.test(barcode)) return false;

    const base = barcode.slice(0, 12);
    const check = parseInt(barcode[13], 10);

    try {
        return calculateEAN13Checksum(base) === check;
    } catch {
        return false;
    }
}
