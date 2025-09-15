import { Event, InsertEvent } from '@shared/schema';
import { apiRequest } from './queryClient';

class ApiCalendarStorage {
  async createEvent(eventData: InsertEvent): Promise<Event> {
    const res = await apiRequest('POST', '/api/events', eventData);
    return await res.json();
  }

  async getEvent(id: string): Promise<Event | undefined> {
    try {
      const res = await apiRequest('GET', `/api/events/${id}`);
      return await res.json();
    } catch (error: any) {
      if (error.message.includes('404')) {
        return undefined;
      }
      throw error;
    }
  }

  async getAllEvents(): Promise<Event[]> {
    const res = await apiRequest('GET', '/api/events');
    return await res.json();
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    const res = await apiRequest('GET', `/api/events/range/${startDate}/${endDate}`);
    return await res.json();
  }

  async getEventsByType(type: string): Promise<Event[]> {
    const res = await apiRequest('GET', `/api/events/type/${type}`);
    return await res.json();
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const res = await apiRequest('PUT', `/api/events/${id}`, updates);
    return await res.json();
  }

  async deleteEvent(id: string): Promise<void> {
    await apiRequest('DELETE', `/api/events/${id}`);
  }

  async searchEvents(query: string): Promise<Event[]> {
    // For now, get all events and filter client-side
    // In the future, this could be optimized with a server-side search endpoint
    const allEvents = await this.getAllEvents();
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
    // Import events one by one to the database
    for (const event of events) {
      // Remove timestamps since they'll be set by the server
      const { id, createdAt, updatedAt, ...eventData } = event;
      await this.createEvent(eventData);
    }
  }

  async clearAll(): Promise<void> {
    // Get all events and delete them one by one
    const events = await this.getAllEvents();
    for (const event of events) {
      await this.deleteEvent(event.id);
    }
  }
}

export const storage = new ApiCalendarStorage();