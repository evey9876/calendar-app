import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Event API routes
  
  // Get all events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Get single event
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // Create new event
  app.post("/api/events", async (req, res) => {
    try {
      // Validate request body against schema
      const validationResult = insertEventSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({ 
          error: "Validation failed", 
          details: errors 
        });
      }

      // Clean up the validated data (handle nullable fields and ensure proper types)
      const cleanedData = {
        ...validationResult.data,
        notes: validationResult.data.notes || undefined,
        endDate: validationResult.data.endDate || undefined,
        startTime: validationResult.data.startTime || undefined,
        endTime: validationResult.data.endTime || undefined,
        type: validationResult.data.type as any // Type is already validated by schema
      };
      
      const event = await storage.createEvent(cleanedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Update event
  app.put("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // Delete event
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Get events by date range
  app.get("/api/events/range/:startDate/:endDate", async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const events = await storage.getEventsByDateRange(startDate, endDate);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events by date range:", error);
      res.status(500).json({ error: "Failed to fetch events by date range" });
    }
  });

  // Get events by type
  app.get("/api/events/type/:type", async (req, res) => {
    try {
      const events = await storage.getEventsByType(req.params.type);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events by type:", error);
      res.status(500).json({ error: "Failed to fetch events by type" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
