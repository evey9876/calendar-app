import { z } from "zod";
import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const eventTypeSchema = z.enum(["PLANNING", "MEETING", "MONTHLY_REVIEW", "HOLIDAYS", "QBR"]);

export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  type: eventTypeSchema,
  date: z.string(), // ISO date string (start date)
  endDate: z.string().optional(), // ISO date string (end date for multi-day events)
  startTime: z.string().optional(), // HH:MM format
  endTime: z.string().optional(), // HH:MM format
  notes: z.string().optional(),
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
});

export type Event = z.infer<typeof eventSchema>;
export type EventType = z.infer<typeof eventTypeSchema>;
export type InsertEvent = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;

export const createEventSchema = eventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => {
  // If endDate is provided, it should be on or after the start date
  if (data.endDate && data.date) {
    return new Date(data.endDate) >= new Date(data.date);
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

export const updateEventSchema = eventSchema.partial().required({ id: true });

// Export/Import schemas
export const exportDataSchema = z.object({
  events: z.array(eventSchema),
  exportedAt: z.string(),
  version: z.string(),
});

export type ExportData = z.infer<typeof exportDataSchema>;

// Drizzle database table definitions
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().$type<EventType>(),
  date: varchar("date", { length: 10 }).notNull(), // ISO date string (YYYY-MM-DD)
  endDate: varchar("end_date", { length: 10 }), // ISO date string for multi-day events
  startTime: varchar("start_time", { length: 5 }), // HH:MM format
  endTime: varchar("end_time", { length: 5 }), // HH:MM format  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Drizzle-generated schemas with Zod validation
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectEventSchema = createSelectSchema(events);

// Type exports for Drizzle
export type DbEvent = typeof events.$inferSelect;
export type DbInsertEvent = typeof events.$inferInsert;
