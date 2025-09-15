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

  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    const db = await this.init();
    const tx = db.transaction('events', 'readonly');
    const index = tx.store.index('by-date');
    const events = await index.getAll(IDBKeyRange.bound(startDate, endDate));
    return events;
  }

  async getEventsByType(type: string): Promise<Event[]> {
    const db = await this.init();
    const tx = db.transaction('events', 'readonly');
    const index = tx.store.index('by-type');
    return await index.getAll(type);
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

  async searchEvents(query: string): Promise<Event[]> {
    const db = await this.init();
    const allEvents = await db.getAll('events');
    const lowerQuery = query.toLowerCase();
    
    return allEvents.filter(event => 
      event.title.toLowerCase().includes(lowerQuery) ||
      (event.notes && event.notes.toLowerCase().includes(lowerQuery))
    );
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

  async clearAll(): Promise<void> {
    const db = await this.init();
    await db.clear('events');
  }
}

export const storage = new CalendarStorage();
