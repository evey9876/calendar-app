import { InsertEvent } from '@shared/schema';
import { useCalendarStore } from '@/stores/calendarStore';

interface PIEvent {
  title: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  type: 'planning' | 'meeting';
}

export const createPIPlanningEvents = async (): Promise<void> => {
  const piEvents: PIEvent[] = [
    {
      title: "PI Planning Kickoff",
      date: "2025-07-01",
      type: "planning"
    },
    {
      title: "Requirements Gathering",
      date: "2025-07-08",
      type: "planning"
    },
    {
      title: "Product Mngt Leader Review",
      startDate: "2025-07-09",
      endDate: "2025-07-10",
      type: "meeting"
    },
    {
      title: "Product Mngt Alignment Meeting",
      date: "2025-07-17",
      type: "meeting"
    },
    {
      title: "Product Mngt Feature Pre-socialization with Eng/D&R",
      startDate: "2025-07-21",
      endDate: "2025-07-24",
      type: "planning"
    },
    {
      title: "PI Planning Session (2-day workshop)",
      startDate: "2025-07-21",
      endDate: "2025-07-24",
      type: "planning"
    },
    {
      title: "Commit Documentation",
      startDate: "2025-07-28",
      endDate: "2025-08-01",
      type: "planning"
    },
    {
      title: "SLT Commit Review",
      date: "2025-08-06",
      type: "meeting"
    },
    {
      title: "Jira Align Updates",
      startDate: "2025-08-07",
      endDate: "2025-08-08",
      type: "planning"
    }
  ];

  // Convert to InsertEvent format
  const insertEvents: InsertEvent[] = piEvents.map(event => {
    const base = {
      title: event.title,
      type: event.type as 'planning' | 'meeting'
    };
    
    if (event.startDate && event.endDate) {
      return {
        ...base,
        date: event.startDate, // Use startDate as the main date
        startDate: event.startDate,
        endDate: event.endDate
      } as InsertEvent;
    } else {
      return {
        ...base,
        date: event.date!
      } as InsertEvent;
    }
  });

  // Add events one by one using the store
  const { createEvent } = useCalendarStore.getState();
  for (const event of insertEvents) {
    await createEvent(event);
  }
  
  console.log(`Successfully added ${insertEvents.length} PI Planning events`);
};