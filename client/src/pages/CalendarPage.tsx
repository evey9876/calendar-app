import { useEffect, useState } from 'react';
import { Calendar } from '@/components/Calendar';
import { Sidebar } from '@/components/Sidebar';
import { CreateEventModal } from '@/components/CreateEventModal';
import { EventDetailsModal } from '@/components/EventDetailsModal';
import { useCalendarStore } from '@/stores/calendarStore';
import { Event, InsertEvent } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { exportPptxTable, exportPptxMonthGrid, exportPptxQuarterGrid } from '@/utils/exportPptx';
import BulkPasteImporter from '@/components/BulkPasteImporter';
import { BulkEvent } from '@/utils/bulkParse';

export default function CalendarPage() {
  const { loadEvents, setSelectedEvent, exportEvents, importEvents, events, createEvent } = useCalendarStore();
  const { toast } = useToast();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [createModalDefaultDate, setCreateModalDefaultDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleDateClick = (dateStr: string, defaultDate?: string) => {
    setEditingEvent(null);
    if (defaultDate) {
      setCreateModalDefaultDate(defaultDate);
    }
    setIsCreateModalOpen(true);
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setCreateModalDefaultDate('');
    setIsCreateModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setCreateModalDefaultDate('');
    setIsDetailsModalOpen(false); // Close details modal when opening edit
    setIsCreateModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const jsonData = await exportEvents();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendar-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export successful',
        description: 'Your calendar has been exported successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export calendar. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importEvents(text);
        
        toast({
          title: 'Import successful',
          description: 'Your calendar has been imported successfully.',
        });
      } catch (error) {
        toast({
          title: 'Import failed',
          description: 'Failed to import calendar. Please check the file format.',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  // Bulk import handler
  const handleBulkImport = async (parsedEvents: BulkEvent[]) => {
    try {
      for (const evt of parsedEvents) {
        const insertEvent: InsertEvent = {
          title: evt.title,
          date: evt.date,
          type: evt.type as 'PLANNING' | 'MEETING' | 'MONTHLY_REVIEW' | 'HOLIDAYS',
          ...(evt.startDate && evt.endDate && {
            startDate: evt.startDate,
            endDate: evt.endDate,
          }),
        };
        await createEvent(insertEvent);
      }

      toast({
        title: 'Success',
        description: `Successfully imported ${parsedEvents.length} events!`,
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: 'Import failed',
        description: 'Failed to import events. Please check your input format.',
        variant: 'destructive',
      });
    }
  };

  const handleExportPptxTable = async () => {
    try {
      exportPptxTable({ 
        events, 
        fileName: `calendar-table-${new Date().toISOString().split('T')[0]}.pptx` 
      });
      
      toast({
        title: 'PowerPoint table export successful',
        description: 'Your calendar table presentation has been generated and downloaded.',
      });
    } catch (error) {
      toast({
        title: 'PowerPoint export failed',
        description: 'Failed to generate PowerPoint presentation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportPptxMonthGrid = async () => {
    try {
      exportPptxMonthGrid({ 
        events, 
        fileName: `calendar-monthly-${new Date().toISOString().split('T')[0]}.pptx` 
      });
      
      toast({
        title: 'PowerPoint monthly grid export successful',
        description: 'Your monthly calendar grid presentation has been generated and downloaded.',
      });
    } catch (error) {
      toast({
        title: 'PowerPoint export failed',
        description: 'Failed to generate PowerPoint presentation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportPptxQuarterGrid = async () => {
    try {
      exportPptxQuarterGrid({ 
        events, 
        fileName: `calendar-quarterly-${new Date().toISOString().split('T')[0]}.pptx` 
      });
      
      toast({
        title: 'PowerPoint quarterly grid export successful',
        description: 'Your quarterly calendar grid presentation has been generated and downloaded.',
      });
    } catch (error) {
      toast({
        title: 'PowerPoint export failed',
        description: 'Failed to generate PowerPoint presentation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <Sidebar
        onCreateEvent={handleCreateEvent}
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
        onEdit={handleEditEvent}
      />
    </div>
  );
}
