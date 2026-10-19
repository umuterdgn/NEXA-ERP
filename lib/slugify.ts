/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * SEO-friendly slug generator supporting Turkish characters
 */

export function slugify(text: string): string {
  const trMap: Record<string, string> = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  }

  let result = text || ""
  for (const [key, value] of Object.entries(trMap)) {
    result = result.replaceAll(key, value)
  }

  return result
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
