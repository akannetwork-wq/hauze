/**
 * Slug generation utility with Turkish character support
 */

// Turkish character mapping
const TURKISH_CHAR_MAP: Record<string, string> = {
    'ğ': 'g', 'Ğ': 'g',
    'ü': 'u', 'Ü': 'u',
    'ş': 's', 'Ş': 's',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ç': 'c', 'Ç': 'c',
};

/**
 * Generate URL-safe slug from text with Turkish character support
 * @param text - Input text to convert to slug
 * @returns URL-safe slug
 */
export function generateSlug(text: string): string {
    if (!text) return '';

    let slug = text.toLowerCase().trim();

    // Replace Turkish characters
    for (const [turkishChar, latinChar] of Object.entries(TURKISH_CHAR_MAP)) {
        slug = slug.replace(new RegExp(turkishChar, 'g'), latinChar);
    }

    // Replace spaces and special chars with hyphens
    slug = slug
        .replace(/[^\w\s-]/g, '') // Remove non-word chars
        .replace(/\s+/g, '-')      // Replace spaces with -
        .replace(/-+/g, '-')       // Replace multiple - with single -
        .replace(/^-+/, '')        // Trim - from start
        .replace(/-+$/, '');       // Trim - from end

    return slug;
}
