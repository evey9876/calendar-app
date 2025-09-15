import { Event, EventType } from '@shared/schema';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  onClick?: (event: Event) => void;
  isDragging?: boolean;
  viewerMode?: boolean;
}

const eventTypeColors: Record<EventType, string> = {
  PLANNING: 'bg-[#07182D]',
  MEETING: 'bg-[#02C8FF]',
  MONTHLY_REVIEW: 'bg-[#FF007F]',
  HOLIDAYS: 'bg-[#FF9000]',
};

export function EventCard({ event, onClick, isDragging = false, viewerMode = false }: EventCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDragActive,
  } = useDraggable({
    id: event.id,
    data: {
      type: 'event',
      event,
    },
    disabled: viewerMode, // Disable dragging in viewer mode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging || isDragActive ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && !isDragActive) {
      e.stopPropagation();
      onClick?.(event);
    }
  };

  // Check if this is a multi-day event
  const isMultiDay = event.endDate && event.endDate !== event.date;
  
  // Format date range for multi-day events
  const formatDateRange = () => {
    if (!isMultiDay) return '';
    
    try {
      const startDate = new Date(event.date + 'T00:00:00');
      const endDate = new Date(event.endDate! + 'T00:00:00');
      
      const startFormatted = format(startDate, 'MMM d');
      const endFormatted = format(endDate, 'MMM d');
      
      return `${startFormatted} - ${endFormatted}`;
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'px-2 py-1 rounded text-xs font-medium text-white cursor-move hover:shadow-sm transition-all duration-200 mb-1 select-none',
        eventTypeColors[event.type],
        isDragging || isDragActive ? 'cursor-grabbing' : 'cursor-grab'
      )}
      data-testid={`event-card-${event.id}`}
    >
      <div className="truncate" title={event.title}>
        {event.title}
      </div>
      {event.startTime && !isMultiDay && (
        <div className="text-xs opacity-90">
          {event.startTime}
          {event.endTime && ` - ${event.endTime}`}
        </div>
      )}
    </div>
  );
}
