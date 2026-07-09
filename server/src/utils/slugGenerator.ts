/**
 * Generates a URL-safe slug from a given string.
 * Supports Unicode characters (French accents, Arabic, etc.)
 */
export const generateSlug = (text: string): string => {
  return text
    .toString()
    .normalize("NFD") // Decompose accented chars
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics
    .replace(/[\u0600-\u06FF]+/g, "") // Strip Arabic characters
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric
    .replace(/[\s_]+/g, "-") // Spaces/underscores → hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
};

/**
 * Generates a slug with a unique suffix to prevent duplicates.
 * @param text   The source text to slugify
 * @param suffix Optional custom suffix; defaults to a random 6-char hex string
 */
export const generateUniqueSlug = (text: string, suffix?: string): string => {
  const base = generateSlug(text);
  const uniquePart = suffix ?? Math.random().toString(16).slice(2, 8);
  return `${base}-${uniquePart}`;
};
