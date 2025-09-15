import { Event, EventType } from '@shared/schema';
import { cn } from '@/lib/utils';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface SpanningEventCardProps {
  event: Event;
  onClick?: (event: Event) => void;
  startDate: Date;
  endDate: Date;
  weekDays: Date[]; // The days of the current week being rendered
  viewerMode?: boolean;
  lane?: number;
  maxLanes?: number;
}

const eventTypeColors: Record<EventType, string> = {
  PLANNING: 'bg-[#2563eb]',
  MEETING: 'bg-[#dc2626]',
  MONTHLY_REVIEW: 'bg-[#000000]',
  HOLIDAYS: 'bg-[#FF9000]',
  QBR: 'bg-[#ec4899]',
};

export function SpanningEventCard({ 
  event, 
  onClick, 
  startDate, 
  endDate, 
  weekDays,
  viewerMode = false,
  lane = 0,
  maxLanes = 1
}: SpanningEventCardProps) {
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `spanning-${event.id}`,
    data: {
      type: 'event',
      event,
    },
    disabled: viewerMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  
  // Find which days in the current week this event spans
  const eventDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekEventDays = weekDays.filter(weekDay => 
    eventDays.some(eventDay => 
      format(eventDay, 'yyyy-MM-dd') === format(weekDay, 'yyyy-MM-dd')
    )
  );

  if (weekEventDays.length === 0) return null;

  // Calculate position and width
  const startIndex = weekDays.findIndex(day => 
    format(day, 'yyyy-MM-dd') === format(weekEventDays[0], 'yyyy-MM-dd')
  );
  const spanDays = weekEventDays.length;
  
  // Position from left (20% per day in 5-day week)
  const leftPercent = (startIndex * 20);
  const widthPercent = (spanDays * 20) - 0.5; // Small gap between days

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'absolute h-5 rounded text-xs font-medium text-white hover:shadow-sm transition-all duration-200 z-10 flex items-center px-2',
        eventTypeColors[event.type],
        viewerMode ? 'cursor-pointer' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top: `${20 + (lane * 20)}px`, // Dynamic position based on lane
        ...style,
      }}
      onClick={handleClick}
      data-testid={`spanning-event-${event.id}`}
    >
      <span className="truncate text-xs">{event.title}</span>
    </div>
  );
}