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
import { SpanningEventCard } from './SpanningEventCard';
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

  // Helper function to generate quarter header with proper year handling
  const generateQuarterHeader = (quarterData: any) => {
    const monthNames = quarterData.months.map((month: any) => format(month.month, 'MMM'));
    const years = quarterData.months.map((month: any) => format(month.month, 'yyyy'));
    
    // Check if all months are in the same year
    const uniqueYears = Array.from(new Set(years));
    
    if (uniqueYears.length === 1) {
      // All months in same year: "Q1: Aug - Sep - Oct 2025"
      return `${quarterData.quarterName}: ${monthNames.join(' - ')} ${uniqueYears[0]}`;
    } else {
      // Months span multiple years: "Q2: Nov - Dec 2025 - Jan 2026"
      const monthYearPairs = quarterData.months.map((month: any) => 
        `${format(month.month, 'MMM')} ${format(month.month, 'yyyy')}`
      );
      return `${quarterData.quarterName}: ${monthYearPairs.join(' - ')}`;
    }
  };

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

  // Generate data for all 4 quarters at once
  const allQuartersData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    const quarters = [
      { name: 'Q1', months: [7, 8, 9] },     // Aug, Sep, Oct
      { name: 'Q2', months: [10, 11, 0] },   // Nov, Dec, Jan
      { name: 'Q3', months: [1, 2, 3] },     // Feb, Mar, Apr
      { name: 'Q4', months: [4, 5, 6] }      // May, Jun, Jul
    ];
    
    return quarters.map(quarter => {
      const monthsData = quarter.months.map(monthIndex => {
        // Handle year transitions for operating year (Aug 2025 - Jul 2026)
        let monthYear = currentYear;
        
        // Q2: January is in next year when quarter includes November 
        if (monthIndex === 0 && quarter.months.includes(10)) {
          monthYear = currentYear + 1;
        }
        // Q3 and Q4: All months are in next year for operating year
        else if (quarter.name === 'Q3' || quarter.name === 'Q4') {
          monthYear = currentYear + 1;
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
      
      return {
        quarterName: quarter.name,
        months: monthsData
      };
    });
  }, []);

  const filteredEvents = getFilteredEvents();

  // Helper function to identify multi-day events
  const isMultiDayEvent = (event: Event) => {
    return event.endDate && event.endDate !== event.date;
  };

  // Helper function to get multi-day events for a specific month
  const getMultiDayEventsForMonth = (monthData: { month: Date; days: Date[] }) => {
    const monthStart = format(monthData.days[0], 'yyyy-MM-dd');
    const monthEnd = format(monthData.days[monthData.days.length - 1], 'yyyy-MM-dd');
    
    return filteredEvents.filter(event => {
      if (!isMultiDayEvent(event)) return false;
      
      // Check if event overlaps with this month's date range
      const eventStart = new Date(event.date + 'T00:00:00');
      const eventEnd = new Date(event.endDate! + 'T00:00:00');
      const rangeStart = new Date(monthStart + 'T00:00:00');
      const rangeEnd = new Date(monthEnd + 'T00:00:00');
      
      return eventEnd >= rangeStart && eventStart <= rangeEnd;
    });
  };

  // Helper function to group days into weeks for spanning events
  const groupDaysIntoWeeks = (days: Date[]) => {
    const workDays = days.filter(day => {
      const dayOfWeek = day.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday (1) to Friday (5)
    });
    
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    workDays.forEach(day => {
      const dayOfWeek = day.getDay();
      
      // Start new week on Monday
      if (dayOfWeek === 1 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [day];
      } else {
        currentWeek.push(day);
      }
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  // Lane assignment algorithm for multi-day events
  const assignEventLanes = (events: Event[], weekDays: Date[]) => {
    if (events.length === 0) return { eventLanes: new Map(), maxLanes: 0 };

    // Convert events to intervals with additional data
    const intervals = events.map(event => {
      const startDate = new Date(event.date + 'T00:00:00');
      const endDate = new Date(event.endDate! + 'T00:00:00');
      
      // Find indices within this week
      const startIdx = weekDays.findIndex(day => 
        format(day, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
      );
      const endIdx = weekDays.findIndex(day => 
        format(day, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')
      );

      return {
        event,
        start: startIdx >= 0 ? startIdx : 0,
        end: endIdx >= 0 ? endIdx : weekDays.length - 1,
        startDate,
        endDate
      };
    }).filter(interval => interval.start <= interval.end); // Only include events that span within this week

    // Sort by start day, then by duration (longer events first for better packing)
    intervals.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    // Greedy lane assignment
    const lanes: { start: number; end: number; eventId: string }[][] = [];
    const eventLanes = new Map<string, number>();

    for (const interval of intervals) {
      let assignedLane = -1;
      
      // Try to assign to existing lane
      for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
        const lane = lanes[laneIndex];
        let canFit = true;
        
        // Check if this interval overlaps with any event in this lane
        for (const existing of lane) {
          if (!(interval.end < existing.start || interval.start > existing.end)) {
            canFit = false;
            break;
          }
        }
        
        if (canFit) {
          assignedLane = laneIndex;
          lane.push({ 
            start: interval.start, 
            end: interval.end, 
            eventId: interval.event.id 
          });
          break;
        }
      }
      
      // If no existing lane works, create new lane
      if (assignedLane === -1) {
        assignedLane = lanes.length;
        lanes.push([{ 
          start: interval.start, 
          end: interval.end, 
          eventId: interval.event.id 
        }]);
      }
      
      eventLanes.set(interval.event.id, assignedLane);
    }

    return { eventLanes, maxLanes: lanes.length };
  };

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
          // For multi-day events, maintain the duration when moving
          if (isMultiDayEvent(activeEvent)) {
            const originalStart = new Date(activeEvent.date + 'T00:00:00');
            const originalEnd = new Date(activeEvent.endDate! + 'T00:00:00');
            const duration = originalEnd.getTime() - originalStart.getTime();
            
            const newStart = new Date(newDate + 'T00:00:00');
            const newEnd = new Date(newStart.getTime() + duration);
            
            await updateEvent(activeEvent.id, { 
              date: newDate,
              endDate: format(newEnd, 'yyyy-MM-dd')
            });
          } else {
            await updateEvent(activeEvent.id, { date: newDate });
          }
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

  const DroppableDay = ({ day, monthData, maxLanes = 0 }: { day: Date; monthData: Date; maxLanes?: number }) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const { setNodeRef, isOver } = useDroppable({
      id: `date-${dateStr}`,
    });

    const dayNumber = format(day, 'd');
    const isCurrentMonth = isSameMonth(day, monthData);
    const isCurrentDay = isToday(day);
    const dayEvents = getEventsForDate(dateStr).filter(event => !isMultiDayEvent(event));

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
          
          <div className="space-y-1" style={{ marginTop: `${20 + (maxLanes * 24)}px` }}>
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
        
        <div className="space-y-1" style={{ marginTop: `${20 + (maxLanes * 24)}px` }}>
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
    const weeks = groupDaysIntoWeeks(monthData.days);
    const multiDayEvents = getMultiDayEventsForMonth(monthData);
    
    return (
      <div key={index} className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          {format(monthData.month, 'MMMM yyyy')}
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {renderWeekdays()}
          
          {/* Render weeks with spanning events */}
          {weeks.map((weekDays, weekIndex) => {
            const weekStart = weekDays[0];
            const weekEnd = weekDays[weekDays.length - 1];
            
            // Get spanning events for this week
            const weekSpanningEvents = multiDayEvents.filter(event => {
              const eventStart = new Date(event.date + 'T00:00:00');
              const eventEnd = new Date(event.endDate! + 'T00:00:00');
              return eventEnd >= weekStart && eventStart <= weekEnd;
            });

            // Assign lanes for this week's events
            const { eventLanes, maxLanes } = assignEventLanes(weekSpanningEvents, weekDays);
            
            return (
              <div key={weekIndex} className="relative">
                {/* Spanning Events for this week */}
                {weekSpanningEvents.map(event => {
                  const eventStart = new Date(event.date + 'T00:00:00');
                  const eventEnd = new Date(event.endDate! + 'T00:00:00');
                  const lane = eventLanes.get(event.id) || 0;
                  
                  return (
                    <SpanningEventCard
                      key={`${event.id}-week-${weekIndex}`}
                      event={event}
                      onClick={onEventClick}
                      startDate={eventStart}
                      endDate={eventEnd}
                      weekDays={weekDays}
                      viewerMode={viewerMode}
                      lane={lane}
                      maxLanes={maxLanes}
                    />
                  );
                })}
                
                {/* Week Days Grid */}
                <div className="grid grid-cols-5 divide-x divide-gray-200">
                  {weekDays.map(day => (
                    <DroppableDay key={format(day, 'yyyy-MM-dd')} day={day} monthData={monthData.month} maxLanes={maxLanes} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 
            className="text-2xl font-bold text-gray-800"
            data-testid="current-year"
          >
            Operating Year {new Date().getFullYear()}-{(new Date().getFullYear() + 1).toString().slice(2)}
          </h2>
          <Button
            variant="ghost"
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-[#02C8FF] hover:bg-[#02C8FF] hover:text-white rounded-lg transition-all duration-200"
            data-testid="button-go-to-today"
          >
            Today
          </Button>
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

      {/* Calendar Grid - All 4 Quarters */}
      {viewerMode ? (
        <div className="space-y-12">
          {allQuartersData.map((quarterData, quarterIndex) => (
            <div key={quarterIndex} className="space-y-6">
              {/* Quarter Header */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {generateQuarterHeader(quarterData)}
                </h3>
              </div>
              
              {/* 3 Months in this Quarter */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {quarterData.months.map((monthData, monthIndex) => renderMonth(monthData, monthIndex))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-12">
            {allQuartersData.map((quarterData, quarterIndex) => (
              <div key={quarterIndex} className="space-y-6">
                {/* Quarter Header */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {generateQuarterHeader(quarterData)}
                  </h3>
                </div>
                
                {/* 3 Months in this Quarter */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {quarterData.months.map((monthData, monthIndex) => renderMonth(monthData, monthIndex))}
                </div>
              </div>
            ))}
          </div>
          
          <DragOverlay>
            {activeEvent ? (
              isMultiDayEvent(activeEvent) ? (
                <div className={`px-2 py-1 rounded text-xs font-medium text-white opacity-75 ${activeEvent.type === 'PLANNING' ? 'bg-[#2563eb]' : activeEvent.type === 'MEETING' ? 'bg-[#dc2626]' : activeEvent.type === 'MONTHLY_REVIEW' ? 'bg-[#000000]' : activeEvent.type === 'HOLIDAYS' ? 'bg-[#FF9000]' : 'bg-[#ec4899]'}`}>
                  {activeEvent.title}
                </div>
              ) : (
                <EventCard event={activeEvent} isDragging />
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </main>
  );
}
