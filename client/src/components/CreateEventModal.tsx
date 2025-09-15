import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCalendarStore } from '@/stores/calendarStore';
import { createEventSchema, EventType, Event } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';
import { formatDateSafe } from '@/lib/dateParser';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  editingEvent?: Event | null;
}

const eventTypeLabels: Record<EventType, string> = {
  PLANNING: 'Planning',
  MEETING: 'Meeting',
  MONTHLY_REVIEW: 'Monthly Review',
  HOLIDAYS: 'Holidays',
};

export function CreateEventModal({ isOpen, onClose, defaultDate, editingEvent }: CreateEventModalProps) {
  const { createEvent, updateEvent, isLoading } = useCalendarStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      type: 'MEETING' as EventType,
      date: formatDateSafe(new Date()),
      endDate: '',
      startTime: '',
      endTime: '',
      notes: '',
    },
  });

  // Reset form when editing event changes
  useEffect(() => {
    if (editingEvent) {
      form.reset({
        title: editingEvent.title || '',
        type: editingEvent.type || 'MEETING',
        date: editingEvent.date || formatDateSafe(new Date()),
        endDate: editingEvent.endDate || '',
        startTime: editingEvent.startTime || '',
        endTime: editingEvent.endTime || '',
        notes: editingEvent.notes || '',
      });
    } else {
      form.reset({
        title: '',
        type: 'MEETING' as EventType,
        date: defaultDate || formatDateSafe(new Date()),
        endDate: '',
        startTime: '',
        endTime: '',
        notes: '',
      });
    }
  }, [editingEvent, defaultDate, form]);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      if (editingEvent) {
        // Update existing event
        await updateEvent(editingEvent.id, {
          ...data,
          endDate: data.endDate || undefined,
          startTime: data.startTime || undefined,
          endTime: data.endTime || undefined,
          notes: data.notes || undefined,
        });
        
        toast({
          title: 'Event updated',
          description: 'Your event has been updated successfully.',
        });
      } else {
        // Create new event
        await createEvent({
          ...data,
          endDate: data.endDate || undefined,
          startTime: data.startTime || undefined,
          endTime: data.endTime || undefined,
          notes: data.notes || undefined,
        });
        
        toast({
          title: 'Event created',
          description: 'Your event has been created successfully.',
        });
      }
      
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingEvent ? 'update' : 'create'} event. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-800">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
              data-testid="close-create-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Event Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter event title..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02C8FF] focus:border-[#02C8FF] transition-all duration-200"
                      data-testid="input-event-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Event Type
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02C8FF] focus:border-[#02C8FF] transition-all duration-200"
                        data-testid="select-event-type"
                      >
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(eventTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Start Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02C8FF] focus:border-[#02C8FF] transition-all duration-200"
                        data-testid="input-event-start-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      End Date (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02C8FF] focus:border-[#02C8FF] transition-all duration-200"
                        data-testid="input-event-end-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02C8FF] focus:border-[#02C8FF] transition-all duration-200"
                        data-testid="input-start-time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      End Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02C8FF] focus:border-[#02C8FF] transition-all duration-200"
                        data-testid="input-end-time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Additional details..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02C8FF] focus:border-[#02C8FF] transition-all duration-200 resize-none"
                      data-testid="textarea-event-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="flex-1 px-4 py-3 bg-[#02C8FF] text-white rounded-xl hover:bg-opacity-90 transition-all duration-200 font-medium"
                data-testid={editingEvent ? "button-update-event" : "button-create-event"}
              >
                <Plus className="w-4 h-4 mr-2" />
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
