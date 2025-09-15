import PptxGenJS from "pptxgenjs";
import { TYPE_COLORS } from "../constants/colors";
import { Event, EventType } from "@shared/schema";

/** Public API **/
export function exportPptxTable({ events, fileName = "calendar-2025-26-table.pptx" }: { events: Event[], fileName?: string }) {
  const pptx = new PptxGenJS();
  addTitle(pptx, "Operating Year Calendar 2025–26", "Table per Month");
  for (const month of iterateOperatingMonths()) {
    addMonthTableSlide(pptx, month, events);
  }
  pptx.writeFile({ fileName });
}

export function exportPptxMonthGrid({ events, fileName = "calendar-2025-26-month-grid.pptx" }: { events: Event[], fileName?: string }) {
  const pptx = new PptxGenJS();
  addTitle(pptx, "Operating Year Calendar 2025–26", "Monthly Calendar Grid (Mon–Sun)");
  for (const month of iterateOperatingMonths()) {
    addMonthGridSlide(pptx, month, events);
  }
  pptx.writeFile({ fileName });
}

export function exportPptxQuarterGrid({ events, fileName = "calendar-2025-26-quarter-grid.pptx" }: { events: Event[], fileName?: string }) {
  const pptx = new PptxGenJS();
  addTitle(pptx, "Operating Year Calendar 2025–26", "Quarterly Calendar Grid (Mon–Sun)");
  const quarters = operatingYearQuarters(); // 4 quarters of 3 months each starting Aug
  for (const q of quarters) {
    addQuarterGridSlide(pptx, q, events);
  }
  pptx.writeFile({ fileName });
}

// Legacy function for backward compatibility
export function exportToPptx({ events, fileName = "calendar-2025-26.pptx" }: { events: Event[], fileName?: string }) {
  return exportPptxTable({ events, fileName });
}

/** Slides: title **/
function addTitle(pptx: any, main: string, sub: string) {
  const s = pptx.addSlide();
  s.addText(main, { x: 0.7, y: 1.2, fontSize: 28, bold: true });
  s.addText(sub, { x: 0.7, y: 1.9, fontSize: 16 });
}

/** Slide: month TABLE **/
function addMonthTableSlide(pptx: any, month: any, events: Event[]) {
  const s = pptx.addSlide();
  s.addText(month.label, { x: 0.5, y: 0.4, fontSize: 22, bold: true });

  const items = eventsForMonth(events, month.year, month.monthIdx);
  const rows = [
    [
      { text: "Date", options: { bold: true } },
      { text: "Type", options: { bold: true } },
      { text: "Title", options: { bold: true } },
    ],
    ...items.map((e: any) => [
      formatDate(e.date),
      prettyType(e.type),
      { text: e.title || "", options: { color: TYPE_COLORS[e.type as EventType] || "000000" } },
    ]),
  ];

  s.addTable(rows, {
    x: 0.5,
    y: 1.0,
    w: 9.0,
    colW: [1.4, 2.2, 5.4],
    border: { type: "none" },
    margin: 2,
    fontSize: 14,
    fill: { color: "FFFFFF" },
  });
}

/** Slide: month GRID **/
function addMonthGridSlide(pptx: any, month: any, events: Event[]) {
  const s = pptx.addSlide();
  s.addText(month.label, { x: 0.5, y: 0.3, fontSize: 22, bold: true });

  const matrix = monthMatrix(month.year, month.monthIdx, 1); // Monday = 1
  const itemsByDay = bucketEventsByISODate(events);

  // Layout (16:9 default 10 x 5.625 inches)
  const marginX = 0.4;
  const marginY = 0.9;
  const gridW = 9.2;
  const gridH = 4.4;
  const cols = 7;
  const rows = 6; // 6 weeks
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  // Weekday headers
  const weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  weekdays.forEach((wd, i) => {
    s.addText(wd, { x: marginX + i * cellW + 0.05, y: marginY - 0.35, fontSize: 12, bold: true });
  });

  // Cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = matrix[r][c]; // { date: Date|null, inMonth: boolean }
      const x = marginX + c * cellW;
      const y = marginY + r * cellH;

      // Cell background/frame
      s.addShape(pptx.ShapeType.rect, {
        x, y, w: cellW - 0.02, h: cellH - 0.02,
        line: { color: "CFCFCF", width: 0.5 },
        fill: cell?.inMonth ? "FFFFFF" : "F6F6F6",
        shadow: { type: "outer" },
      });

      if (cell?.date) {
        // Date number (top-right)
        const dd = String(cell.date.getDate());
        s.addText(dd, { x: x + cellW - 0.28, y: y + 0.05, fontSize: 11 });

        // Events for this date
        const iso = toISODate(cell.date);
        const dayEvents = itemsByDay.get(iso) || [];
        let yCursor = y + 0.28;
        const yLimit = y + cellH - 0.08;

        dayEvents.forEach((evt: any) => {
          if (yCursor > yLimit) return; // clip overflow
          // colored chip + title
          const chipW = cellW - 0.12;
          const chipH = 0.2;
          s.addShape(pptx.ShapeType.roundRect, {
            x: x + 0.06, y: yCursor, w: chipW, h: chipH,
            fill: TYPE_COLORS[evt.type as EventType] || "999999",
            line: { color: "FFFFFF" },
            rectRadius: 4,
          });
          s.addText(shorten(evt.title || "", 36), {
            x: x + 0.1, y: yCursor + 0.02, fontSize: 10, color: "FFFFFF",
          });
          yCursor += chipH + 0.06;
        });
      }
    }
  }
}

/** Slide: QUARTER GRID (3 months on one slide) **/
function addQuarterGridSlide(pptx: any, quarter: any, events: Event[]) {
  const s = pptx.addSlide();
  s.addText(quarter.label, { x: 0.5, y: 0.2, fontSize: 20, bold: true });

  const area = { x: 0.4, y: 0.6, w: 9.2, h: 4.8 };
  const months = quarter.months; // [{year, monthIdx, label}, ... 3 items]
  const colW = area.w / 3;
  months.forEach((m: any, idx: number) => {
    // Subheading
    s.addText(m.label, { x: area.x + idx * colW + 0.02, y: area.y - 0.3, fontSize: 14, bold: true });

    // Draw a small month grid inside column
    const matrix = monthMatrix(m.year, m.monthIdx, 1);
    const inner = { x: area.x + idx * colW, y: area.y, w: colW - 0.06, h: area.h };
    drawCompactMonthGrid(pptx, s, matrix, events, inner);
  });
}

/** Compact month grid helper used in Quarter slides **/
function drawCompactMonthGrid(pptx: any, slide: any, matrix: any, events: Event[], rect: any) {
  const cols = 7, rows = 6;
  const cellW = rect.w / cols;
  const cellH = rect.h / (rows + 0.7); // leave space for weekday header
  const startY = rect.y + 0.3;

  const itemsByDay = bucketEventsByISODate(events);
  const weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  weekdays.forEach((wd, i) => {
    slide.addText(wd, { x: rect.x + i * cellW + 0.02, y: rect.y, fontSize: 9, bold: true });
  });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = matrix[r][c];
      const x = rect.x + c * cellW;
      const y = startY + r * cellH;

      slide.addShape(pptx.ShapeType.rect, {
        x, y, w: cellW - 0.01, h: cellH - 0.01,
        line: { color: "D4D4D4", width: 0.25 },
        fill: cell?.inMonth ? "FFFFFF" : "F7F7F7",
      });

      if (cell?.date) {
        slide.addText(String(cell.date.getDate()), { x: x + cellW - 0.22, y: y + 0.02, fontSize: 8 });
        const iso = toISODate(cell.date);
        const dayEvents = itemsByDay.get(iso) || [];
        // Render up to 2 tiny dots by type under the date number
        let dotX = x + 0.06;
        const dotY = y + 0.22;
        dayEvents.slice(0, 4).forEach((evt: any) => {
          slide.addShape(pptx.ShapeType.ellipse, {
            x: dotX, y: dotY, w: 0.08, h: 0.08, fill: TYPE_COLORS[evt.type as EventType] || "999999", line: { type: "none" },
          });
          dotX += 0.12;
        });
      }
    }
  }
}

/** ========== Utilities ========== **/

const OPERATING_START = new Date("2025-08-01");
const OPERATING_END   = new Date("2026-07-31");

function iterateOperatingMonths() {
  const months = [];
  let y = OPERATING_START.getFullYear();
  let m = OPERATING_START.getMonth();
  while (y < OPERATING_END.getFullYear() || (y === OPERATING_END.getFullYear() && m <= OPERATING_END.getMonth())) {
    months.push({ year: y, monthIdx: m, label: monthLabel(y, m) });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return months;
}

function operatingYearQuarters() {
  // Q1: Aug–Oct 2025, Q2: Nov–Jan, Q3: Feb–Apr, Q4: May–Jul
  const start = { y: 2025, m: 7 }; // Aug (0-index = 7)
  const labels = ["Q1 (Aug–Oct 2025)","Q2 (Nov 2025–Jan 2026)","Q3 (Feb–Apr 2026)","Q4 (May–Jul 2026)"];
  const quarters = [];
  let y = start.y, m = start.m;
  for (let q = 0; q < 4; q++) {
    const months = [];
    for (let i = 0; i < 3; i++) {
      months.push({ year: y, monthIdx: m, label: monthLabel(y, m) });
      m++; if (m > 11) { m = 0; y++; }
    }
    quarters.push({ label: labels[q], months });
  }
  return quarters;
}

function monthMatrix(year: number, monthIdx: number, weekStartsOn = 1 /* 0=Sun,1=Mon */) {
  // Build a 6x7 matrix of dates (Date|null) for the given month
  const first = new Date(Date.UTC(year, monthIdx, 1));
  const last = new Date(Date.UTC(year, monthIdx + 1, 0));
  const firstDow = (first.getUTCDay() + 7 - weekStartsOn) % 7; // 0..6 offset
  const daysInMonth = last.getUTCDate();

  const matrix = Array.from({ length: 6 }, () => Array(7).fill(null));
  let r = 0, c = firstDow;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(Date.UTC(year, monthIdx, day));
    matrix[r][c] = { date: d, inMonth: true };
    c++;
    if (c > 6) { c = 0; r++; }
  }

  // Fill before first day
  let prev = new Date(Date.UTC(year, monthIdx, 0)); // last day prev month
  for (let i = firstDow - 1; i >= 0; i--) {
    matrix[0][i] = { date: new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate() - (firstDow - 1 - i))), inMonth: false };
  }
  // Fill after last day
  let rr = r, cc = c;
  let nextDay = 1;
  while (rr < 6) {
    matrix[rr][cc] = { date: new Date(Date.UTC(year, monthIdx + 1, nextDay++)), inMonth: false };
    cc++;
    if (cc > 6) { cc = 0; rr++; }
  }
  return matrix;
}

function bucketEventsByISODate(events: Event[]) {
  const map = new Map();
  const inRange = events
    .map((e) => ({ ...e, _d: new Date(e.date) }))
    .filter((e) => e._d >= OPERATING_START && e._d <= OPERATING_END)
    .sort((a, b) => a._d.getTime() - b._d.getTime());

  inRange.forEach((e) => {
    const key = toISODate(e._d);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  });
  return map;
}

function eventsForMonth(events: Event[], year: number, monthIdx: number) {
  return events
    .map((e) => ({ ...e, _d: new Date(e.date) }))
    .filter((e) => e._d.getFullYear() === year && e._d.getMonth() === monthIdx)
    .sort((a, b) => a._d.getTime() - b._d.getTime());
}

function monthLabel(y: number, m: number) {
  const names = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${names[m]} ${y}`;
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
  return `${dd} ${mon}`;
}

function prettyType(t: string) {
  return (t || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function shorten(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}