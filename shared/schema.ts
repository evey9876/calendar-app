import { z } from "zod";

export const eventTypeSchema = z.enum(["PLANNING", "MEETING", "MONTHLY_REVIEW", "HOLIDAYS"]);

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
