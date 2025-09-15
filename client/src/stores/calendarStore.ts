import { create } from 'zustand';
import { Event, EventType, InsertEvent } from '@shared/schema';
import { storage } from '@/lib/storage';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
  searchEvents: (query: string) => Promise<void>;
  
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
  currentDate: new Date(2025, 0, 15), // Set to January 2025 to show Q2 with existing events
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

  searchEvents: async (query) => {
    set({ searchQuery: query });
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
        await get().loadEvents(); // Reload events
      } else {
        throw new Error('Invalid import format');
      }
    } catch (error) {
      console.error('Error importing events:', error);
      throw new Error('Failed to import events');
    }
  },

  isEventOnDate: (event, date) => {
    // Check if event occurs on the given date
    const eventDate = new Date(event.date + 'T00:00:00');
    const checkDate = new Date(date + 'T00:00:00');
    
    // Single day event
    if (!event.endDate) {
      return event.date === date;
    }
    
    // Multi-day event - check if date falls within range
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
