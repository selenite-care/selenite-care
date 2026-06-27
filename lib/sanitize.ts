const dangerousTagPattern =
  /<\s*(script|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const dangerousSelfClosingTagPattern =
  /<\s*(script|iframe|object|embed)\b[^>]*\/?\s*>/gi;
const htmlTagPattern = /<[^>]*>/g;
const htmlEntityPattern = /&[^;]+;/g;
const unsafeAttributePattern =
  /\s(?:on\w+|style|srcdoc)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const unsafeUrlPattern = /\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi;
const unsupportedTagPattern =
  /<\/?(?!\/?(?:p|br|strong|b|em|i|u|ul|ol|li|blockquote|a)\b)[^>]*>/gi;

export function sanitizeText(input: string): string {
  return input
    .replace(dangerousTagPattern, "")
    .replace(dangerousSelfClosingTagPattern, "")
    .replace(htmlTagPattern, "")
    .replace(htmlEntityPattern, " ")
    .trim();
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(dangerousTagPattern, "")
    .replace(dangerousSelfClosingTagPattern, "")
    .replace(unsafeUrlPattern, "")
    .replace(unsafeAttributePattern, "")
    .replace(unsupportedTagPattern, "")
    .trim();
}

export function sanitizeName(input: string): string {
  return input.replace(/[^a-zA-Z\s'-]/g, "").replace(/\s+/g, " ").trim();
}

export function sanitizePhone(input: string): string {
  return input.replace(/[^\d+-]/g, "").trim();
}

export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function sanitizeFormData<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).map(([fieldName, value]) => {
      if (typeof value !== "string") {
        return [fieldName, value];
      }

      const normalizedFieldName = fieldName.toLowerCase();

      if (normalizedFieldName.includes("email")) {
        return [fieldName, sanitizeEmail(value)];
      }

      if (
        normalizedFieldName.includes("phone") ||
        normalizedFieldName.includes("mobile") ||
        normalizedFieldName.includes("whatsapp")
      ) {
        return [fieldName, sanitizePhone(value)];
      }

      if (
        normalizedFieldName === "name" ||
        normalizedFieldName.endsWith("name") ||
        normalizedFieldName.includes("fullname") ||
        normalizedFieldName.includes("clientname")
      ) {
        return [fieldName, sanitizeName(value)];
      }

      if (
        normalizedFieldName.includes("html") ||
        normalizedFieldName.includes("content") ||
        normalizedFieldName.includes("diagnosis") ||
        normalizedFieldName.includes("routine") ||
        normalizedFieldName.includes("guideline") ||
        normalizedFieldName.includes("feedback") ||
        normalizedFieldName.includes("blog")
      ) {
        return [fieldName, sanitizeHtml(value)];
      }

      return [fieldName, sanitizeText(value)];
    }),
  ) as T;
}
