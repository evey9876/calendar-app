import { type Event, type InsertEvent, type DbEvent, type DbInsertEvent } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for calendar events
export interface IStorage {
  // Event CRUD operations
  getAllEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]>;
  getEventsByType(type: string): Promise<Event[]>;
}

import { db } from "./db";
import { events } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// Convert DbEvent (with timestamp) to Event (with string dates)
function dbEventToEvent(dbEvent: DbEvent): Event {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    type: dbEvent.type as any,
    date: dbEvent.date,
    endDate: dbEvent.endDate || undefined,
    startTime: dbEvent.startTime || undefined,
    endTime: dbEvent.endTime || undefined,
    notes: dbEvent.notes || undefined,
    createdAt: dbEvent.createdAt.toISOString(),
    updatedAt: dbEvent.updatedAt.toISOString(),
  };
}

export class DatabaseStorage implements IStorage {
  async getAllEvents(): Promise<Event[]> {
    const dbEvents = await db.select().from(events).orderBy(events.date);
    return dbEvents.map(dbEventToEvent);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [dbEvent] = await db.select().from(events).where(eq(events.id, id));
    return dbEvent ? dbEventToEvent(dbEvent) : undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const now = new Date();
    const [dbEvent] = await db
      .insert(events)
      .values({
        title: event.title,
        type: event.type,
        date: event.date,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        notes: event.notes,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    
    return dbEventToEvent(dbEvent);
  }

  async updateEvent(id: string, eventUpdate: Partial<InsertEvent>): Promise<Event | undefined> {
    const [dbEvent] = await db
      .update(events)
      .set({
        ...eventUpdate,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();
    
    return dbEvent ? dbEventToEvent(dbEvent) : undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    const dbEvents = await db
      .select()
      .from(events)
      .where(and(gte(events.date, startDate), lte(events.date, endDate)))
      .orderBy(events.date);
    
    return dbEvents.map(dbEventToEvent);
  }

  async getEventsByType(type: string): Promise<Event[]> {
    const dbEvents = await db
      .select()
      .from(events)
      .where(eq(events.type, type as any))
      .orderBy(events.date);
    
    return dbEvents.map(dbEventToEvent);
  }
}

export const storage = new DatabaseStorage();
