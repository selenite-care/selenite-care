const dateLocale = "en-BD";

function parseDate(date: Date | string | null | undefined) {
  if (!date) {
    return null;
  }

  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function formatDate(date: Date | string | null | undefined): string {
  return formatDateOnly(date);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  const parsedDate = parseDate(date);

  if (!parsedDate) {
    return "N/A";
  }

  return `${formatDateOnly(parsedDate)}, ${formatTimeOnly(parsedDate)}`;
}

export function formatDateOnly(date: Date | string | null | undefined): string {
  const parsedDate = parseDate(date);

  if (!parsedDate) {
    return "N/A";
  }

  const parts = new Intl.DateTimeFormat(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).formatToParts(parsedDate);
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  const year = parts.find((part) => part.type === "year")?.value;

  if (!month || !day || !year) {
    return "N/A";
  }

  return `${month} ${day}, ${year}`;
}

export function formatTimeOnly(date: Date | string | null | undefined): string {
  const parsedDate = parseDate(date);

  if (!parsedDate) {
    return "N/A";
  }

  return new Intl.DateTimeFormat(dateLocale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsedDate);
}

export function formatRelative(date: Date | string | null | undefined): string {
  const parsedDate = parseDate(date);

  if (!parsedDate) {
    return "N/A";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const comparisonDate = new Date(parsedDate);
  comparisonDate.setHours(0, 0, 0, 0);

  const dayDifference = Math.floor(
    (today.getTime() - comparisonDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDifference === 0) {
    return "Today";
  }

  if (dayDifference === 1) {
    return "Yesterday";
  }

  if (dayDifference > 1 && dayDifference < 14) {
    return `${dayDifference} days ago`;
  }

  if (dayDifference >= 14 && dayDifference < 35) {
    return `${Math.floor(dayDifference / 7)} weeks ago`;
  }

  return formatDateOnly(parsedDate);
}
