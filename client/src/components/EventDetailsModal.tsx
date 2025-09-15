import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCalendarStore } from '@/stores/calendarStore';
import { Event, EventType } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { X, Edit, Trash2, Calendar, Clock, Tag, Check, X as XIcon } from 'lucide-react';
import { format } from 'date-fns';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (event: Event) => void;
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

export function EventDetailsModal({ isOpen, onClose, onEdit }: EventDetailsModalProps) {
  const { selectedEvent, deleteEvent, updateEvent, isLoading } = useCalendarStore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState<EventType>(selectedEvent?.type || 'MEETING');

  if (!selectedEvent) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEvent(selectedEvent.id);
      
      toast({
        title: 'Event deleted',
        description: 'The event has been deleted successfully.',
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(selectedEvent);
    onClose();
  };

  const handleCategoryEdit = () => {
    setNewCategory(selectedEvent.type);
    setIsEditingCategory(true);
  };

  const handleCategorySave = async () => {
    try {
      await updateEvent(selectedEvent.id, { type: newCategory });
      
      toast({
        title: 'Category updated',
        description: `Event category changed to ${eventTypeLabels[newCategory]}.`,
      });
      
      setIsEditingCategory(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update category. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCategoryCancel = () => {
    setNewCategory(selectedEvent.type);
    setIsEditingCategory(false);
  };

  const formatDate = (startDateStr: string, endDateStr?: string) => {
    try {
      const startDate = new Date(startDateStr + 'T00:00:00');
      const formattedStart = format(startDate, 'EEEE, MMMM d, yyyy');
      
      if (endDateStr && endDateStr !== startDateStr) {
        const endDate = new Date(endDateStr + 'T00:00:00');
        const formattedEnd = format(endDate, 'EEEE, MMMM d, yyyy');
        return `${formattedStart} - ${formattedEnd}`;
      }
      
      return formattedStart;
    } catch {
      return startDateStr;
    }
  };

  const formatTime = (startTime?: string, endTime?: string) => {
    if (!startTime) return 'All day';
    
    const formatTimeStr = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    };

    const start = formatTimeStr(startTime);
    if (endTime) {
      const end = formatTimeStr(endTime);
      return `${start} - ${end}`;
    }
    return start;
  };

  // Check if this is a multi-day event
  const isMultiDay = selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.date;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: eventTypeColors[selectedEvent.type] }}
              />
              <DialogTitle className="text-xl font-bold text-gray-800">
                {selectedEvent.title}
              </DialogTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="h-8 w-8 text-gray-400 hover:text-[#02C8FF]"
                data-testid="button-edit-event"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 text-gray-400 hover:text-red-500"
                data-testid="button-delete-event"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                data-testid="close-details-modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center text-gray-600">
            <Calendar className="mr-3 w-4 h-4" />
            <span data-testid="event-date">
              {formatDate(selectedEvent.date, selectedEvent.endDate)}
            </span>
          </div>

          {!isMultiDay && (
            <div className="flex items-center text-gray-600">
              <Clock className="mr-3 w-4 h-4" />
              <span data-testid="event-time">
                {formatTime(selectedEvent.startTime, selectedEvent.endTime)}
              </span>
            </div>
          )}

          <div className="flex items-center text-gray-600">
            <Tag className="mr-3 w-4 h-4" />
            <span className="font-medium">Category:</span>
            {isEditingCategory ? (
              <div className="flex items-center space-x-2 ml-2">
                <Select value={newCategory} onValueChange={(value: EventType) => setNewCategory(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: eventTypeColors[key as EventType] }}
                          />
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCategorySave}
                  data-testid="button-save-category"
                  className="h-6 w-6 p-0"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCategoryCancel}
                  data-testid="button-cancel-category"
                  className="h-6 w-6 p-0"
                >
                  <XIcon className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-2">
                <span 
                  className="px-2 py-1 rounded text-white text-sm"
                  style={{ backgroundColor: eventTypeColors[selectedEvent.type] }}
                  data-testid="event-type"
                >
                  {eventTypeLabels[selectedEvent.type]}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCategoryEdit}
                  data-testid="button-edit-category"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            )}
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

          <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 px-4 py-2 text-gray-600 border-gray-200 hover:bg-gray-50"
              data-testid="button-close-details"
            >
              Close
            </Button>
            {onEdit && (
              <Button
                onClick={() => onEdit(selectedEvent)}
                variant="default"
                className="flex-1 px-4 py-2 bg-[#02C8FF] hover:bg-[#0299CC] text-white"
                data-testid="button-edit-event"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              variant="destructive"
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white"
              data-testid="button-delete-event"
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deleting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
