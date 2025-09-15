import { useState, useEffect, useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isToday, 
  isSameMonth, 
  addMonths, 
  subMonths,
  startOfDay,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventCard } from './EventCard';
import { useCalendarStore } from '@/stores/calendarStore';
import { Event } from '@shared/schema';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';

interface CalendarProps {
  onEventClick: (event: Event) => void;
  onDateClick: (date: string, defaultDate?: string) => void;
  viewerMode?: boolean;
}

export function Calendar({ onEventClick, onDateClick, viewerMode = false }: CalendarProps) {
  const {
    currentDate,
    setCurrentDate,
    viewMode,
    getEventsForDate,
    getFilteredEvents,
    updateEvent,
  } = useCalendarStore();

  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Generate calendar days for quarterly view
  const getQuarterMonths = (date: Date) => {
    const month = date.getMonth(); // 0-11
    
    // Q1: Aug(7) - Oct(9)
    if (month >= 7 && month <= 9) {
      return [7, 8, 9]; // Aug, Sep, Oct
    }
    // Q2: Nov(10) - Jan(0)
    else if (month >= 10 || month <= 0) {
      return [10, 11, 0]; // Nov, Dec, Jan
    }
    // Q3: Feb(1) - Apr(3)
    else if (month >= 1 && month <= 3) {
      return [1, 2, 3]; // Feb, Mar, Apr
    }
    // Q4: May(4) - Jul(6)
    else {
      return [4, 5, 6]; // May, Jun, Jul
    }
  };

  const getQuarterNumber = (date: Date) => {
    const month = date.getMonth(); // 0-11
    
    if (month >= 7 && month <= 9) return 1; // Q1: Aug-Oct
    if (month >= 10 || month <= 0) return 2; // Q2: Nov-Jan
    if (month >= 1 && month <= 3) return 3; // Q3: Feb-Apr
    return 4; // Q4: May-Jul
  };

  const threeMonthsData = useMemo(() => {
    const quarterMonths = getQuarterMonths(currentDate);
    const year = currentDate.getFullYear();
    
    return quarterMonths.map(monthIndex => {
      // Handle year transitions for Q2 (Nov-Dec-Jan)
      let monthYear = year;
      if (monthIndex === 0 && quarterMonths.includes(10)) {
        // January of next year when quarter includes November
        monthYear = year + 1;
      }
      
      const month = new Date(monthYear, monthIndex, 1);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      
      return {
        month,
        days: eachDayOfInterval({
          start: calendarStart,
          end: calendarEnd,
        })
      };
    });
  }, [currentDate]);

  const filteredEvents = getFilteredEvents();

  const previousQuarter = () => {
    // Move to previous quarter (3 months back)
    setCurrentDate(subMonths(currentDate, 3));
  };

  const nextQuarter = () => {
    // Move to next quarter (3 months forward)
    setCurrentDate(addMonths(currentDate, 3));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToQuarter = (quarter: string) => {
    const currentYear = new Date().getFullYear();
    let targetMonth: number;
    
    switch (quarter) {
      case 'Q1':
        targetMonth = 8; // September (middle of Q1: Aug-Oct)
        break;
      case 'Q2':
        targetMonth = 11; // December (middle of Q2: Nov-Jan)
        break;
      case 'Q3':
        targetMonth = 2; // March (middle of Q3: Feb-Apr)
        break;
      case 'Q4':
        targetMonth = 5; // June (middle of Q4: May-Jul)
        break;
      default:
        return;
    }
    
    setCurrentDate(new Date(currentYear, targetMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    onDateClick(dateStr, dateStr);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'event') {
      setActiveEvent(active.data.current.event);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveEvent(null);

    if (!over) return;

    const activeEvent = active.data.current?.event as Event;
    const overId = over.id as string;
    
    // Check if dropping on a date cell
    if (overId.startsWith('date-') && activeEvent) {
      const newDate = overId.replace('date-', '');
      
      if (newDate !== activeEvent.date) {
        try {
          await updateEvent(activeEvent.id, { date: newDate });
        } catch (error) {
          console.error('Failed to move event:', error);
        }
      }
    }
  };

  const renderWeekdays = () => {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return (
      <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200">
        {weekdays.map((day) => (
          <div key={day} className="p-4 text-center">
            <span className="text-sm font-semibold text-gray-700">{day}</span>
          </div>
        ))}
      </div>
    );
  };

  const DroppableDay = ({ day, monthData }: { day: Date; monthData: Date }) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const { setNodeRef, isOver } = useDroppable({
      id: `date-${dateStr}`,
    });

    const dayNumber = format(day, 'd');
    const isCurrentMonth = isSameMonth(day, monthData);
    const isCurrentDay = isToday(day);
    const dayEvents = getEventsForDate(dateStr);

    if (viewerMode) {
      // Viewer mode - no drag and drop, no date clicking
      return (
        <div
          key={dateStr}
          className={`min-h-20 p-1 border-b border-gray-200 ${
            isCurrentDay ? 'bg-blue-50 border-blue-200' : ''
          }`}
          data-testid={`calendar-date-${dateStr}`}
        >
          <span
            className={`text-xs mb-1 block ${
              isCurrentDay
                ? 'font-bold text-blue-600'
                : isCurrentMonth
                ? 'font-semibold text-gray-800'
                : 'text-gray-400'
            }`}
          >
            {dayNumber}
            {isCurrentDay && (
              <div className="text-xs text-blue-600 font-medium">Today</div>
            )}
          </span>
          
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={onEventClick}
                data-testid={`event-${event.id}`}
                viewerMode={true}
              />
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500 px-1">
                +{dayEvents.length - 2}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={setNodeRef}
        key={dateStr}
        className={`min-h-20 p-1 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
          isCurrentDay ? 'bg-blue-50 border-blue-200' : ''
        } ${isOver ? 'bg-blue-100 border-blue-300' : ''}`}
        onClick={() => handleDateClick(day)}
        data-testid={`calendar-date-${dateStr}`}
      >
        <span
          className={`text-xs mb-1 block ${
            isCurrentDay
              ? 'font-bold text-blue-600'
              : isCurrentMonth
              ? 'font-semibold text-gray-800'
              : 'text-gray-400'
          }`}
        >
          {dayNumber}
          {isCurrentDay && (
            <div className="text-xs text-blue-600 font-medium">Today</div>
          )}
        </span>
        
        <div className="space-y-1">
          {dayEvents.slice(0, 2).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={onEventClick}
              data-testid={`event-${event.id}`}
            />
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-gray-500 px-1">
              +{dayEvents.length - 2}
            </div>
          )}
        </div>
      </div>
    );
  };



  const renderMonth = (monthData: { month: Date; days: Date[] }, index: number) => {
    return (
      <div key={index} className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          {format(monthData.month, 'MMMM yyyy')}
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {renderWeekdays()}
          <div className="grid grid-cols-5 divide-x divide-gray-200">
            {monthData.days
              .filter(day => {
                const dayOfWeek = day.getDay();
                return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday (1) to Friday (5)
              })
              .map(day => (
                <DroppableDay key={format(day, 'yyyy-MM-dd')} day={day} monthData={monthData.month} />
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* Quarter Selector */}
          <Select 
            value={`Q${getQuarterNumber(currentDate)}`} 
            onValueChange={goToQuarter}
          >
            <SelectTrigger className="w-20 h-9 text-sm border-gray-300 hover:border-gray-400 focus:border-blue-500 transition-colors" data-testid="quarter-selector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
          <h2 
            className="text-2xl font-bold text-gray-800"
            data-testid="current-month-year"
          >
            {(() => {
              const quarterMonths = getQuarterMonths(currentDate);
              const year = currentDate.getFullYear();
              const firstMonth = new Date(year, quarterMonths[0], 1);
              const lastMonth = new Date(year, quarterMonths[2], 1);
              
              // Handle year transition for Q2
              if (quarterMonths.includes(0) && quarterMonths.includes(10)) {
                const adjustedLastMonth = new Date(year + 1, 0, 1);
                return `Q${getQuarterNumber(currentDate)}: ${format(firstMonth, 'MMM')} - ${format(adjustedLastMonth, 'MMM yyyy')}`;
              }
              
              return `Q${getQuarterNumber(currentDate)}: ${format(firstMonth, 'MMM')} - ${format(lastMonth, 'MMM yyyy')}`;
            })()}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={previousQuarter}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-800"
              data-testid="button-previous-quarter"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-[#02C8FF] hover:bg-[#02C8FF] hover:text-white rounded-lg transition-all duration-200"
              data-testid="button-go-to-today"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextQuarter}
              className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-800"
              data-testid="button-next-quarter"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <span data-testid="event-count-display">
              {filteredEvents.length} events
            </span>
            <span className="mx-2">•</span>
            <span className="text-xs">Stored locally</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid - 3 Months */}
      {viewerMode ? (
        <div className="space-y-8">
          {threeMonthsData.map((monthData, index) => renderMonth(monthData, index))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-8">
            {threeMonthsData.map((monthData, index) => renderMonth(monthData, index))}
          </div>
          
          <DragOverlay>
            {activeEvent ? (
              <EventCard event={activeEvent} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </main>
  );
}
