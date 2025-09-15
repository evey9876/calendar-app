import * as chrono from "chrono-node";
import {
  parse as parseExact, formatISO, addDays, eachDayOfInterval, isAfter, isBefore
} from "date-fns";
import { EventType } from '@shared/schema';

const OPERATING_START = new Date("2025-08-01"); // Operating Year 2025-26
const OPERATING_END   = new Date("2026-07-31");

export interface BulkEvent {
  type: EventType;
  title: string;
  date: string;
  startDate?: string;
  endDate?: string;
}

// Heuristic type guesser
function guessType(titleRaw: string): EventType {
  const t = titleRaw.toLowerCase();
  if (t.includes("monthly review")) return "MONTHLY_REVIEW";
  if (t.includes("holiday") || t.includes("annual leave") || t.includes("pto")) return "HOLIDAYS";
  if (t.includes("meeting") || t.includes("review") || t.includes("alignment") || t.includes("kickoff")) return "MEETING";
  return "PLANNING";
}

function cleanTitle(s: string): string {
  return s.replace(/\s*\([^)]+\)\s*$/,"").trim(); // drop trailing (Wed-Thu) etc.
}

/**
 * Parse a line like:
 *  - "PI Planning Kickoff July 1, 2025 (Tue)"
 *  - "Product Mngt Leader Review July 9-10, 2025 (Wed-Thu)"
 *  - "PI Planning Session (2-day workshop) Week of July 21-24, 2025 (Mon-Thu)"
 *  - "Commit Documentation Week of July 28 - Aug 1, 2025 (Mon-Fri)"
 * Returns array of events (one per day for ranges)
 */
export function parseLineToEvents(line: string): BulkEvent[] {
  const raw = line.trim();
  if (!raw) return [];

  // Normalize en-dash/em-dash/spaces around hyphens
  let s = raw.replace(/[–—]/g, "-").replace(/\s*-\s*/g, " - ");

  // Drop day-of-week parentheses anywhere
  s = s.replace(/\([^)]+\)/g, "").trim();

  // Detect "Week of" block (treat like a range)
  const weekOf = /week of\s+/i.test(s);
  let titlePart = s;
  let datePart = s;

  // If there is an obvious month name, split title vs date by first month token
  const monthRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;
  const m = s.match(monthRegex);
  if (m) {
    const idx = s.toLowerCase().indexOf(m[0].toLowerCase());
    titlePart = cleanTitle(s.slice(0, idx));
    datePart = s.slice(idx);
  } else {
    // fallback: try whole string
    titlePart = cleanTitle(s);
  }

  // Prefer explicit ranges like "July 9-10, 2025" or "July 28 - Aug 1, 2025"
  const range1 = /([a-zA-Z]+)\s+(\d{1,2})\s*-\s*([a-zA-Z]+)?\s*(\d{1,2}),\s*(\d{4})/; // Jul 28 - Aug 1, 2025
  const range2 = /([a-zA-Z]+)\s+(\d{1,2})-(\d{1,2}),\s*(\d{4})/; // July 9-10, 2025

  let dates: Date[] = [];

  try {
    if (range1.test(datePart)) {
      const r = datePart.match(range1);
      if (r) {
        const m1 = r[1]; const d1 = r[2]; const m2 = r[3] || r[1]; const d2 = r[4]; const yyyy = r[5];
        const start = parseExact(`${m1} ${d1}, ${yyyy}`, "LLLL d, yyyy", new Date());
        const end   = parseExact(`${m2} ${d2}, ${yyyy}`, "LLLL d, yyyy", new Date());
        dates = eachDayOfInterval({ start, end });
      }
    } else if (range2.test(datePart)) {
      const r = datePart.match(range2);
      if (r) {
        const m = r[1]; const d1 = r[2]; const d2 = r[3]; const yyyy = r[4];
        const start = parseExact(`${m} ${d1}, ${yyyy}`, "LLLL d, yyyy", new Date());
        const end   = parseExact(`${m} ${d2}, ${yyyy}`, "LLLL d, yyyy", new Date());
        dates = eachDayOfInterval({ start, end });
      }
    } else if (weekOf) {
      // e.g., "Week of July 21-24, 2025" or "Week of July 28 - Aug 1, 2025"
      // Strip "week of"
      const after = datePart.replace(/week of\s+/i, "");
      // Try the same range matchers
      if (range1.test(after)) {
        const r = after.match(range1);
        if (r) {
          const m1 = r[1]; const d1 = r[2]; const m2 = r[3] || r[1]; const d2 = r[4]; const yyyy = r[5];
          const start = parseExact(`${m1} ${d1}, ${yyyy}`, "LLLL d, yyyy", new Date());
          const end   = parseExact(`${m2} ${d2}, ${yyyy}`, "LLLL d, yyyy", new Date());
          dates = eachDayOfInterval({ start, end });
        }
      } else if (range2.test(after)) {
        const r = after.match(range2);
        if (r) {
          const m = r[1]; const d1 = r[2]; const d2 = r[3]; const yyyy = r[4];
          const start = parseExact(`${m} ${d1}, ${yyyy}`, "LLLL d, yyyy", new Date());
          const end   = parseExact(`${m} ${d2}, ${yyyy}`, "LLLL d, yyyy", new Date());
          dates = eachDayOfInterval({ start, end });
        }
      } else {
        // fallback: let chrono find a single date, expand 5 business days
        const d = chrono.parseDate(after);
        if (d) {
          // Mon-Fri starting from parsed date
          const start = d;
          const end = addDays(start, 4);
          dates = eachDayOfInterval({ start, end });
        }
      }
    } else {
      // Single date: let chrono handle "July 1, 2025"
      const d = chrono.parseDate(datePart);
      if (d) dates = [d];
    }
  } catch (error) {
    console.warn('Date parsing error:', error);
    return [];
  }

  const title = cleanTitle(titlePart) || "Event";
  const type = guessType(title);

  // For multi-day events, return with startDate and endDate
  if (dates.length > 1) {
    const startDate = formatISO(dates[0], { representation: "date" });
    const endDate = formatISO(dates[dates.length - 1], { representation: "date" });
    
    return [{
      type,
      title,
      date: startDate, // Primary date for storage
      startDate,
      endDate
    }];
  } else {
    // Single day event
    return dates.map((d) => ({
      type,
      title,
      date: formatISO(d, { representation: "date" }),
    }));
  }
}

/**
 * Parse many lines → events; optionally clip to operating window.
 */
export function parseBulkText(text: string, { clipToOperatingYear = true } = {}): BulkEvent[] {
  const all = text
    .split(/\r?\n/)
    .flatMap(parseLineToEvents)
    .filter(Boolean);

  if (!clipToOperatingYear) return all;

  return all.filter(({ date }) => {
    const d = new Date(date);
    return !isBefore(d, OPERATING_START) && !isAfter(d, OPERATING_END);
  });
}