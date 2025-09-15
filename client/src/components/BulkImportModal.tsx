import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCalendarStore } from '@/stores/calendarStore';
import { useToast } from '@/hooks/use-toast';
import { InsertEvent } from '@shared/schema';
import BulkPasteImporter from '@/components/BulkPasteImporter';
import { BulkEvent } from '@/utils/bulkParse';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const { createEvent } = useCalendarStore();
  const { toast } = useToast();

  const handleImport = async (parsedEvents: BulkEvent[]) => {
    try {
      if (parsedEvents.length === 0) {
        toast({
          title: 'No events found',
          description: 'Could not parse any events from the input text.',
          variant: 'destructive',
        });
        return;
      }

      // Convert parsed events to InsertEvent format and create them
      for (const event of parsedEvents) {
        const insertEvent: InsertEvent = {
          title: event.title,
          date: event.date,
          type: event.type as 'PLANNING' | 'MEETING' | 'MONTHLY_REVIEW' | 'HOLIDAYS',
          ...(event.startDate && event.endDate && {
            startDate: event.startDate,
            endDate: event.endDate,
          }),
        };
        
        await createEvent(insertEvent);
      }

      toast({
        title: 'Success',
        description: `Successfully imported ${parsedEvents.length} events!`,
      });

      onClose();
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: 'Import failed',
        description: 'Failed to import events. Please check your input format.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Events</DialogTitle>
        </DialogHeader>
        
        <BulkPasteImporter onImport={handleImport} />
      </DialogContent>
    </Dialog>
  );
}