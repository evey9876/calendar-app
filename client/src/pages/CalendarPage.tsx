import { useEffect, useState } from "react";
import { Calendar } from "@/components/Calendar";
import { Sidebar } from "@/components/Sidebar";
import { CreateEventModal } from "@/components/CreateEventModal";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import { useCalendarStore } from "@/stores/calendarStore";
import { Event, InsertEvent, EventType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  exportPptxTable,
  exportPptxMonthGrid,
  exportPptxQuarterGrid,
} from "@/utils/exportPptx";
import { BulkEvent } from "@/utils/bulkParse";

export default function CalendarPage() {
  const {
    loadEvents,
    setSelectedEvent,
    exportEvents,
    importEvents,
    events,
    createEvent,
  } = useCalendarStore();
  const { toast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [createModalDefaultDate, setCreateModalDefaultDate] =
    useState<string>("");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleDateClick = (date: string) => {
    setCreateModalDefaultDate(date);
    setIsCreateModalOpen(true);
  };

  const handleExport = async () => {
    try {
      await exportEvents();
      toast({
        title: "Export successful",
        description: "Events exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export events",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    toast({
      title: "Import",
      description: "Import functionality to be implemented",
    });
  };

  const handleExportPptxTable = async () => {
    try {
      await exportPptxTable({ events });
      toast({
        title: "PowerPoint export successful",
        description: "Table view exported to PowerPoint",
      });
    } catch (error) {
      toast({
        title: "PowerPoint export failed",
        description: "Failed to export to PowerPoint",
        variant: "destructive",
      });
    }
  };

  const handleExportPptxMonthGrid = async () => {
    try {
      await exportPptxMonthGrid({ events });
      toast({
        title: "PowerPoint export successful",
        description: "Month grid exported to PowerPoint",
      });
    } catch (error) {
      toast({
        title: "PowerPoint export failed",
        description: "Failed to export to PowerPoint",
        variant: "destructive",
      });
    }
  };

  const handleExportPptxQuarterGrid = async () => {
    try {
      await exportPptxQuarterGrid({ events });
      toast({
        title: "PowerPoint export successful",
        description: "Quarter grid exported to PowerPoint",
      });
    } catch (error) {
      toast({
        title: "PowerPoint export failed",
        description: "Failed to export to PowerPoint",
        variant: "destructive",
      });
    }
  };

  const handleBulkImport = async (bulkEvents: BulkEvent[]) => {
    try {
      for (const bulkEvent of bulkEvents) {
        const eventData: InsertEvent = {
          title: bulkEvent.title,
          notes: "",
          date: bulkEvent.date,
          type: bulkEvent.type as EventType,
        };
        await createEvent(eventData);
      }
      toast({
        title: "Bulk import successful",
        description: `${bulkEvents.length} events imported successfully`,
      });
    } catch (error) {
      toast({
        title: "Bulk import failed",
        description: "Failed to import events",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <Sidebar
        onCreateEvent={() => setIsCreateModalOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
        onExportPptxTable={handleExportPptxTable}
        onExportPptxMonthGrid={handleExportPptxMonthGrid}
        onExportPptxQuarterGrid={handleExportPptxQuarterGrid}
        onBulkImport={handleBulkImport}
      />
      
      <Calendar
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
      />
      
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingEvent(null);
        }}
        defaultDate={createModalDefaultDate}
        editingEvent={editingEvent}
      />

      <EventDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={(event) => { 
          setEditingEvent(event);
          setCreateModalDefaultDate(event.date);
          setIsCreateModalOpen(true);
          setIsDetailsModalOpen(false);
        }}
      />
    </div>
  );
}
