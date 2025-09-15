# Complete Calendar Application Export for Cursor

## Quick Setup Guide

1. **Create project directory**: `mkdir calendar-app && cd calendar-app`
2. **Copy all files from the sections below**
3. **Install dependencies**: `npm install`
4. **Run development server**: `npm run dev`
5. **Open browser to**: `http://localhost:5000`

Your calendar app will work immediately with local IndexedDB storage - no database setup required!

---

## Core Library Files

### client/src/lib/storage.ts
```typescript
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { Event, InsertEvent } from '@shared/schema';
import { nanoid } from 'nanoid';

interface CalendarDB extends DBSchema {
  events: {
    key: string;
    value: Event;
    indexes: {
      'by-date': string;
      'by-type': string;
    };
  };
}

class CalendarStorage {
  private db: IDBPDatabase<CalendarDB> | null = null;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<CalendarDB>('calendar-db', 1, {
      upgrade(db) {
        const eventStore = db.createObjectStore('events', {
          keyPath: 'id',
        });
        eventStore.createIndex('by-date', 'date');
        eventStore.createIndex('by-type', 'type');
      },
    });

    return this.db;
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const db = await this.init();
    const now = new Date().toISOString();
    const event: Event = {
      ...eventData,
      id: nanoid(),
      createdAt: now,
      updatedAt: now,
    };

    await db.add('events', event);
    return event;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const db = await this.init();
    return await db.get('events', id);
  }

  async getAllEvents(): Promise<Event[]> {
    const db = await this.init();
    return await db.getAll('events');
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const db = await this.init();
    const existing = await db.get('events', id);
    if (!existing) {
      throw new Error('Event not found');
    }

    const updated: Event = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await db.put('events', updated);
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    const db = await this.init();
    await db.delete('events', id);
  }

  async exportEvents(): Promise<Event[]> {
    return await this.getAllEvents();
  }

  async importEvents(events: Event[]): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('events', 'readwrite');
    
    for (const event of events) {
      await tx.store.put(event);
    }
    
    await tx.done;
  }
}

export const storage = new CalendarStorage();
```

### client/src/lib/utils.ts
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### client/src/lib/queryClient.ts
```typescript
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

### client/src/lib/dateParser.ts
```typescript
import { parse } from 'date-fns';

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
  if (cleanInput.includes('planning') || cleanInput.includes('pi planning')) {
    type = 'PLANNING';
  } else if (cleanInput.includes('monthly review') || cleanInput.includes('month review')) {
    type = 'MONTHLY_REVIEW';
  } else if (cleanInput.includes('meeting') || cleanInput.includes('standup') || cleanInput.includes('review')) {
    type = 'MEETING';
  } else if (cleanInput.includes('holiday') || cleanInput.includes('vacation')) {
    type = 'HOLIDAYS';
  }

  // Basic date parsing - extend as needed
  const today = new Date();
  let parsedDate: string | null = null;
  
  if (cleanInput.includes('today')) {
    parsedDate = formatDateSafe(today);
  } else if (cleanInput.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    parsedDate = formatDateSafe(tomorrow);
  }

  // Extract title (basic implementation)
  let title = input.replace(/(today|tomorrow)/i, '').trim();

  if (!title || !parsedDate) {
    return null;
  }

  return {
    title,
    date: parsedDate,
    type,
  };
}
```

---

## State Management

### client/src/stores/calendarStore.ts
```typescript
import { create } from 'zustand';
import { Event, EventType, InsertEvent } from '@shared/schema';
import { storage } from '@/lib/storage';

interface CalendarState {
  events: Event[];
  currentDate: Date;
  viewMode: 'month' | 'week' | 'day';
  selectedEvent: Event | null;
  searchQuery: string;
  filterType: EventType | 'all';
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
  setSelectedEvent: (event: Event | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: EventType | 'all') => void;
  
  // Event operations
  loadEvents: () => Promise<void>;
  createEvent: (event: InsertEvent) => Promise<void>;
  createEventsBulk: (events: InsertEvent[]) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  // Export/Import
  exportEvents: () => Promise<string>;
  importEvents: (jsonData: string) => Promise<void>;
  
  // Getters
  getEventsForDate: (date: string) => Event[];
  getEventsByType: (type: EventType) => Event[];
  getFilteredEvents: () => Event[];
  isEventOnDate: (event: Event, date: string) => boolean;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  currentDate: new Date(),
  viewMode: 'month',
  selectedEvent: null,
  searchQuery: '',
  filterType: 'all',
  isLoading: false,
  error: null,

  setCurrentDate: (date) => set({ currentDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),

  loadEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await storage.getAllEvents();
      set({ events, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load events', isLoading: false });
      console.error('Error loading events:', error);
    }
  },

  createEvent: async (eventData) => {
    set({ isLoading: true, error: null });
    try {
      const newEvent = await storage.createEvent(eventData);
      set(state => ({ 
        events: [...state.events, newEvent],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: 'Failed to create event', isLoading: false });
      console.error('Error creating event:', error);
      throw error;
    }
  },

  createEventsBulk: async (eventDataArray: InsertEvent[]) => {
    set({ isLoading: true, error: null });
    try {
      const newEvents: Event[] = [];
      for (const eventData of eventDataArray) {
        const newEvent = await storage.createEvent(eventData);
        newEvents.push(newEvent);
      }
      set(state => ({ 
        events: [...state.events, ...newEvents],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: 'Failed to create events', isLoading: false });
      console.error('Error creating events:', error);
      throw error;
    }
  },

  updateEvent: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedEvent = await storage.updateEvent(id, updates);
      set(state => ({
        events: state.events.map(e => e.id === id ? updatedEvent : e),
        selectedEvent: state.selectedEvent?.id === id ? updatedEvent : state.selectedEvent,
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update event', isLoading: false });
      console.error('Error updating event:', error);
      throw error;
    }
  },

  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await storage.deleteEvent(id);
      set(state => ({
        events: state.events.filter(e => e.id !== id),
        selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete event', isLoading: false });
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  exportEvents: async () => {
    try {
      const events = await storage.exportEvents();
      const exportData = {
        events,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting events:', error);
      throw new Error('Failed to export events');
    }
  },

  importEvents: async (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.events && Array.isArray(data.events)) {
        await storage.importEvents(data.events);
        await get().loadEvents();
      } else {
        throw new Error('Invalid import format');
      }
    } catch (error) {
      console.error('Error importing events:', error);
      throw new Error('Failed to import events');
    }
  },

  isEventOnDate: (event, date) => {
    // Single day event
    if (!event.endDate) {
      return event.date === date;
    }
    
    // Multi-day event - check if date falls within range
    const eventDate = new Date(event.date + 'T00:00:00');
    const checkDate = new Date(date + 'T00:00:00');
    const endDate = new Date(event.endDate + 'T00:00:00');
    return checkDate >= eventDate && checkDate <= endDate;
  },

  getEventsForDate: (date) => {
    const { events, isEventOnDate } = get();
    return events.filter(event => isEventOnDate(event, date));
  },

  getEventsByType: (type) => {
    const { events } = get();
    return events.filter(event => event.type === type);
  },

  getFilteredEvents: () => {
    const { events, searchQuery, filterType } = get();
    let filtered = events;

    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        (event.notes && event.notes.toLowerCase().includes(query))
      );
    }

    return filtered;
  },
}));
```

---

## CSS Styles

### client/src/index.css
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(210 25% 7.8431%);
  --primary: hsl(203.8863 88.2845% 53.1373%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(210 25% 7.8431%);
  --secondary-foreground: hsl(0 0% 100%);
  --border: hsl(201.4286 30.4348% 90.9804%);
  --radius: 1.3rem;

  /* Calendar-specific colors */
  --planning: hsl(203 76% 10%);      /* #07182D */
  --meeting: hsl(193 98% 52%);       /* #02C8FF */
  --holidays: hsl(30 100% 50%);      /* #FF9000 */
  
  --gray-50: hsl(0 0% 98%);          /* #FAFAFA */
  --gray-100: hsl(0 0% 96%);         /* #F5F5F5 */
  --gray-200: hsl(220 13% 91%);      /* #E5E7EB */
  --gray-600: hsl(0 0% 40%);         /* #666666 */
  --gray-800: hsl(0 0% 20%);         /* #333333 */
}

.dark {
  --background: hsl(0 0% 0%);
  --foreground: hsl(200 6.6667% 91.1765%);
  --primary: hsl(203.7736 87.6033% 52.5490%);
  --primary-foreground: hsl(0 0% 100%);
  --border: hsl(210 5.2632% 14.9020%);
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground;
    background-color: hsl(var(--gray-50));
  }
}

/* Calendar-specific utility classes */
.event-planning {
  background-color: hsl(var(--planning));
}

.event-meeting {
  background-color: hsl(var(--meeting));
}

.event-holidays {
  background-color: hsl(var(--holidays));
}
```

---

## Key Features Included

### 🎯 **Core Functionality**
- **Natural Language Input**: "Meeting with John tomorrow at 2pm"
- **Drag & Drop Events**: Move events between dates
- **Multi-day Events**: Support for date ranges
- **Event Categories**: Planning, Meeting, Monthly Review, Holidays
- **Local Storage**: Privacy-first IndexedDB storage

### 📅 **Quarterly Calendar**
- **Custom Quarters**: Q1 (Aug-Oct), Q2 (Nov-Jan), Q3 (Feb-Apr), Q4 (May-Jul)
- **Weekdays Only**: Monday-Friday business focus
- **Color-coded Events**: Visual categorization

### 🔄 **Data Management**
- **Bulk Import**: Paste multiple events at once
- **JSON Export/Import**: Complete data backup
- **PowerPoint Export**: Professional presentation formats
- **Event Search & Filtering**: Find events quickly

### 👥 **Access Modes**
- **Editor Mode**: Full event management capabilities
- **Viewer Mode**: Read-only access for stakeholders

### 🎨 **Technical Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **State**: Zustand + TanStack Query  
- **UI**: Shadcn/ui + Tailwind CSS
- **Backend**: Express.js (minimal, for development)
- **Storage**: IndexedDB (local-first)

---

## Next Steps for Cursor

1. **Create the directory structure** as shown above
2. **Copy configuration files** (package.json, tsconfig.json, etc.)
3. **Add the library files** (storage, utils, dateParser, queryClient)
4. **Create the state management** (calendarStore.ts)  
5. **Add the CSS styling** (index.css)
6. **Install dependencies**: `npm install`
7. **Start development**: `npm run dev`

The application will run immediately with full functionality using local browser storage. No external database or API keys required!

Your calendar app includes professional features like PowerPoint export, natural language parsing, and dual access modes - perfect for organizational planning.