import { formatDateOnly } from "@/lib/dateUtils";

export const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function normalizeAvailabilityText(availability: string) {
  return availability
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/[\u0080-\u00FF]+/g, "-")
    .replace(/[^\x00-\x7F]+/g, "-")
    .trim();
}

export function parseAvailableDays(availability: string) {
  const allowed = new Set<number>();
  const normalizedAvailability = normalizeAvailabilityText(availability);
  const segments = normalizedAvailability
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const timeSegmentIndex = [...segments]
    .reverse()
    .findIndex(
      (segment) => /(?:AM|PM)/i.test(segment) && segment.includes("-"),
    );

  const daySegments =
    timeSegmentIndex === -1
      ? segments
      : segments.slice(0, segments.length - timeSegmentIndex - 1);

  for (const segment of daySegments) {
    const compactSegment = segment.replace(/\s+/g, "");

    if (!compactSegment) continue;

    if (compactSegment.includes("-")) {
      const [startDay, endDay] = compactSegment.split("-");
      const startIndex = dayOrder.indexOf(startDay);
      const endIndex = dayOrder.indexOf(endDay ?? startDay);

      if (startIndex === -1) continue;

      if (endIndex === -1 || startIndex === endIndex) {
        allowed.add(startIndex);
        continue;
      }

      if (startIndex < endIndex) {
        for (let index = startIndex; index <= endIndex; index += 1) {
          allowed.add(index);
        }
      } else {
        for (let index = startIndex; index < dayOrder.length; index += 1) {
          allowed.add(index);
        }
        for (let index = 0; index <= endIndex; index += 1) {
          allowed.add(index);
        }
      }

      continue;
    }

    const dayIndex = dayOrder.indexOf(compactSegment);
    if (dayIndex !== -1) allowed.add(dayIndex);
  }

  return allowed;
}

export function parseAvailabilityEndTime(availability: string) {
  const normalizedAvailability = normalizeAvailabilityText(availability);
  const segments = normalizedAvailability
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const timeSegment = [...segments]
    .reverse()
    .find((segment) => /(?:AM|PM)/i.test(segment) && segment.includes("-"));

  if (!timeSegment) return null;

  const [, endTimeRaw] = timeSegment.split("-");
  const endTimeLabel = endTimeRaw?.trim();
  if (!endTimeLabel) return null;

  const match = endTimeLabel.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return null;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const meridiem = match[3].toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  let hours24 = hours % 12;
  if (meridiem === "PM") hours24 += 12;

  return { endTimeLabel, hours24, minutes };
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatAvailabilityDateLabel(date: Date) {
  const [month = "", dayWithComma = ""] = formatDateOnly(date).split(" ");
  return `${dayOrder[date.getDay()]}, ${month} ${dayWithComma.replace(",", "")}`;
}
