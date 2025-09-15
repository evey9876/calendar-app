import { parse } from 'date-fns';

// Helper function to format date safely without timezone issues
export function formatDateSafe(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface ParsedEvent {
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type?: 'PLANNING' | 'MEETING' | 'MONTHLY_REVIEW' | 'HOLIDAYS';
}

export function parseNaturalLanguage(input: string): ParsedEvent | null {
  const cleanInput = input.trim().toLowerCase();
  
  // Extract event type from common keywords
  let type: 'PLANNING' | 'MEETING' | 'MONTHLY_REVIEW' | 'HOLIDAYS' | undefined;
  if (cleanInput.includes('planning') || cleanInput.includes('pi planning') || cleanInput.includes('qbr planning')) {
    type = 'PLANNING';
  } else if (cleanInput.includes('monthly review') || cleanInput.includes('month review') || cleanInput.includes('monthly')) {
    type = 'MONTHLY_REVIEW';
  } else if (cleanInput.includes('meeting') || cleanInput.includes('standup') || cleanInput.includes('review') || cleanInput.includes('retrospective') || cleanInput.includes('qbr')) {
    type = 'MEETING';
  } else if (cleanInput.includes('holiday') || cleanInput.includes('vacation') || cleanInput.includes('thanksgiving') || cleanInput.includes('veterans') || cleanInput.includes('christmas')) {
    type = 'HOLIDAYS';
  }

  // Extract date range patterns first (e.g., "15-17 Oct", "Dec 1-3", "12/1-12/3")
  const dateRangePatterns = [
    /(\d{1,2})\s*-\s*(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    /(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})/,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\s*-\s*(\d{1,2})/i,
  ];

  // Extract single date patterns
  const datePatterns = [
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{1,2})\/(\d{1,2})/,
    /(today|tomorrow)/i,
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  ];

  let parsedDate: string | null = null;
  let parsedEndDate: string | null = null;
  const today = new Date();

  // Check for date ranges first
  for (const pattern of dateRangePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const year = today.getFullYear();
      const monthMap: { [key: string]: number } = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };

      if (match[3] && match[1] && match[2]) {
        // Pattern: "15-17 Oct"
        const month = monthMap[match[3].toLowerCase()];
        if (month !== undefined) {
          const startDay = parseInt(match[1]);
          const endDay = parseInt(match[2]);
          const monthStr = (month + 1).toString().padStart(2, '0');
          parsedDate = `${year}-${monthStr}-${startDay.toString().padStart(2, '0')}`;
          parsedEndDate = `${year}-${monthStr}-${endDay.toString().padStart(2, '0')}`;
        }
      } else if (match[1] && match[2] && match[3] && match[4]) {
        // Pattern: "12/1-12/3" 
        const startMonth = parseInt(match[1]);
        const startDay = parseInt(match[2]);
        const endMonth = parseInt(match[3]);
        const endDay = parseInt(match[4]);
        parsedDate = `${year}-${startMonth.toString().padStart(2, '0')}-${startDay.toString().padStart(2, '0')}`;
        parsedEndDate = `${year}-${endMonth.toString().padStart(2, '0')}-${endDay.toString().padStart(2, '0')}`;
      } else if (match[1] && match[2] && match[3]) {
        // Pattern: "Oct 15-17"
        const month = monthMap[match[1].toLowerCase()];
        if (month !== undefined) {
          const startDay = parseInt(match[2]);
          const endDay = parseInt(match[3]);
          const monthStr = (month + 1).toString().padStart(2, '0');
          parsedDate = `${year}-${monthStr}-${startDay.toString().padStart(2, '0')}`;
          parsedEndDate = `${year}-${monthStr}-${endDay.toString().padStart(2, '0')}`;
        }
      }
      break;
    }
  }

  // If no date range found, check for single dates
  if (!parsedDate) {
  
    for (const pattern of datePatterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        if (match[0].toLowerCase() === 'today') {
          parsedDate = formatDateSafe(today);
        } else if (match[0].toLowerCase() === 'tomorrow') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          parsedDate = formatDateSafe(tomorrow);
        } else if (match[1] && match[2]) {
          // Handle "15 Oct" format
          const monthMap: { [key: string]: number } = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
          };
          const month = monthMap[match[2].toLowerCase()];
          if (month !== undefined) {
            const year = today.getFullYear();
            const day = parseInt(match[1]);
            // Create date string directly to avoid timezone issues
            const monthStr = (month + 1).toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            parsedDate = `${year}-${monthStr}-${dayStr}`;
          }
        }
        break;
      }
    }
  }

  // Extract time patterns
  const timePatterns = [
    /(\d{1,2})\s*-\s*(\d{1,2})\s*(am|pm)?/i,
    /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
    /(\d{1,2})\s*(am|pm)/i,
  ];

  let startTime: string | undefined;
  let endTime: string | undefined;

  for (const pattern of timePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      if (match[3] && match[1] && match[2]) {
        // Format like "2-4pm" or "9-11am"
        const isPM = match[3].toLowerCase() === 'pm';
        let start = parseInt(match[1]);
        let end = parseInt(match[2]);
        
        if (isPM && start !== 12) start += 12;
        if (isPM && end !== 12) end += 12;
        
        startTime = `${start.toString().padStart(2, '0')}:00`;
        endTime = `${end.toString().padStart(2, '0')}:00`;
      } else if (match[1] && match[2]) {
        // Format like "9am"
        let hour = parseInt(match[1]);
        const isPM = match[2] && match[2].toLowerCase() === 'pm';
        if (isPM && hour !== 12) hour += 12;
        startTime = `${hour.toString().padStart(2, '0')}:00`;
      }
      break;
    }
  }

  // Extract title (everything before the date/time info)
  let title = input;
  if (parsedDate) {
    // Remove date references from title
    title = title.replace(/\s+(on|at)?\s+\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, '');
    title = title.replace(/\s+(today|tomorrow)/i, '');
    title = title.replace(/\s+\d{1,2}\/\d{1,2}(\/\d{4})?/i, '');
  }
  if (startTime || endTime) {
    // Remove time references from title
    title = title.replace(/\s+\d{1,2}\s*-\s*\d{1,2}\s*(am|pm)?/i, '');
    title = title.replace(/\s+\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/i, '');
    title = title.replace(/\s+\d{1,2}\s*(am|pm)/i, '');
  }

  title = title.trim();

  if (!title || !parsedDate) {
    return null;
  }

  return {
    title,
    date: parsedDate,
    endDate: parsedEndDate,
    startTime,
    endTime,
    type,
  };
}
