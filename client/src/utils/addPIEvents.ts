import { useCalendarStore } from '@/stores/calendarStore';
import { InsertEvent } from '@shared/schema';

export const addPIPlanningEvents = async (): Promise<void> => {
  const events = [
    { title: "PI Planning Kickoff", date: "2025-07-01", type: "planning" as const },
    { title: "Requirements Gathering", date: "2025-07-08", type: "planning" as const },
    { title: "Product Mngt Leader Review", date: "2025-07-09", startDate: "2025-07-09", endDate: "2025-07-10", type: "meeting" as const },
    { title: "Product Mngt Alignment Meeting", date: "2025-07-17", type: "meeting" as const },
    { title: "Product Mngt Feature Pre-socialization with Eng/D&R", date: "2025-07-21", startDate: "2025-07-21", endDate: "2025-07-24", type: "planning" as const },
    { title: "PI Planning Session (2-day workshop)", date: "2025-07-21", startDate: "2025-07-21", endDate: "2025-07-24", type: "planning" as const },
    { title: "Commit Documentation", date: "2025-07-28", startDate: "2025-07-28", endDate: "2025-08-01", type: "planning" as const },
    { title: "SLT Commit Review", date: "2025-08-06", type: "meeting" as const },
    { title: "Jira Align Updates", date: "2025-08-07", startDate: "2025-08-07", endDate: "2025-08-08", type: "planning" as const }
  ];

  const { createEvent } = useCalendarStore.getState();
  
  for (const event of events) {
    await createEvent(event as InsertEvent);
  }
  
  console.log(`Added ${events.length} PI Planning events successfully`);
};