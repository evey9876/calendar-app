import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCalendarStore } from '@/stores/calendarStore';
import { EventType } from '@shared/schema';
import { X, Calendar, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface EventDetailsViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const eventTypeColors: Record<EventType, string> = {
  PLANNING: '#07182D',
  MEETING: '#02C8FF',
  MONTHLY_REVIEW: '#FF007F',
  HOLIDAYS: '#FF9000',
};

const eventTypeLabels: Record<EventType, string> = {
  PLANNING: 'Planning',
  MEETING: 'Meeting',
  MONTHLY_REVIEW: 'Monthly Review',
  HOLIDAYS: 'Holidays',
};

export function EventDetailsViewerModal({ isOpen, onClose }: EventDetailsViewerModalProps) {
  const { selectedEvent } = useCalendarStore();

  if (!selectedEvent) return null;

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, 'h:mm a');
    } catch {
      return timeStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-800">
              Event Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
              data-testid="close-details-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 
              className="text-lg font-semibold text-gray-900 mb-3"
              data-testid="event-title"
            >
              {selectedEvent.title}
            </h3>
          </div>

          <div className="flex items-center text-gray-600">
            <Calendar className="mr-3 w-4 h-4" />
            <div>
              <span data-testid="event-start-date">
                {formatDate(selectedEvent.date)}
              </span>
              {selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.date && (
                <span className="text-gray-500">
                  {' '} → {' '}
                  <span data-testid="event-end-date">
                    {formatDate(selectedEvent.endDate)}
                  </span>
                </span>
              )}
            </div>
          </div>

          {(selectedEvent.startTime || selectedEvent.endTime) && (
            <div className="flex items-center text-gray-600">
              <Clock className="mr-3 w-4 h-4" />
              <span data-testid="event-time">
                {selectedEvent.startTime && formatTime(selectedEvent.startTime)}
                {selectedEvent.startTime && selectedEvent.endTime && ' - '}
                {selectedEvent.endTime && formatTime(selectedEvent.endTime)}
              </span>
            </div>
          )}

          <div className="flex items-center text-gray-600">
            <Tag className="mr-3 w-4 h-4" />
            <span className="font-medium">Category:</span>
            <span 
              className="px-2 py-1 rounded text-white text-sm ml-2"
              style={{ backgroundColor: eventTypeColors[selectedEvent.type] }}
              data-testid="event-type"
            >
              {eventTypeLabels[selectedEvent.type]}
            </span>
          </div>

          {selectedEvent.notes && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
              <p 
                className="text-sm text-gray-600 leading-relaxed"
                data-testid="event-notes"
              >
                {selectedEvent.notes}
              </p>
            </div>
          )}

          <div className="flex justify-center mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 py-2 text-gray-600 border-gray-200 hover:bg-gray-50"
              data-testid="button-close-details"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}