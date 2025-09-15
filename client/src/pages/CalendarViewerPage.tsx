import { useEffect, useState } from 'react';
import { useCalendarStore } from '@/stores/calendarStore';
import { Calendar } from '@/components/Calendar';
import { EventDetailsViewerModal } from '../components/EventDetailsViewerModal';
import { ViewerSidebar } from '@/components/ViewerSidebar';
import { Event } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { exportPptxTable, exportPptxMonthGrid, exportPptxQuarterGrid } from '@/utils/exportPptx';

export default function CalendarViewerPage() {
  const { loadEvents, setSelectedEvent, exportEvents, events } = useCalendarStore();
  const { toast } = useToast();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  // Disable date clicks in viewer mode
  const handleDateClick = () => {
    // No action for viewers
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
      <ViewerSidebar
        onExport={handleExport}
        onExportPptxTable={handleExportPptxTable}
        onExportPptxMonthGrid={handleExportPptxMonthGrid}
        onExportPptxQuarterGrid={handleExportPptxQuarterGrid}
      />
      
      <Calendar
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        viewerMode={true}
      />
      
      <EventDetailsViewerModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
      />
    </div>
  );
}