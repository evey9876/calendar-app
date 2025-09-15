import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCalendarStore } from '@/stores/calendarStore';
import { parseNaturalLanguage } from '@/lib/dateParser';
import { useToast } from '@/hooks/use-toast';
import { EventType } from '@shared/schema';
import { Plus, Search, Download, Upload, Menu, PlusCircle, FileText, Calendar, Grid3X3, LayoutGrid, List } from 'lucide-react';
import BulkPasteImporter from '@/components/BulkPasteImporter';

interface SidebarProps {
  onCreateEvent: () => void;
  onExport: () => void;
  onImport: () => void;
  onExportPptxTable: () => void;
  onExportPptxMonthGrid: () => void;
  onExportPptxQuarterGrid: () => void;
  onBulkImport?: (events: any[]) => Promise<void>;
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

export function Sidebar({ onCreateEvent, onExport, onImport, onExportPptxTable, onExportPptxMonthGrid, onExportPptxQuarterGrid, onBulkImport }: SidebarProps) {
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    createEvent,
    events,
    getEventsByType,
  } = useCalendarStore();
  
  const { toast } = useToast();
  const [quickAddInput, setQuickAddInput] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const handleQuickAdd = async () => {
    if (!quickAddInput.trim()) return;

    setIsQuickAdding(true);
    try {
      const parsed = parseNaturalLanguage(quickAddInput);
      
      if (!parsed) {
        toast({
          title: 'Parse Error',
          description: 'Could not parse the event text. Try a format like "Team Meeting on Nov 15 2-4pm"',
          variant: 'destructive',
        });
        return;
      }

      await createEvent({
        title: parsed.title,
        type: parsed.type || 'MEETING',
        date: parsed.date,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
      });

      toast({
        title: 'Event created',
        description: `"${parsed.title}" has been added to your calendar.`,
      });

      setQuickAddInput('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickAdd();
    }
  };

  const getEventCountForType = (type: EventType) => {
    return getEventsByType(type).length;
  };

  return (
    <aside className="w-full lg:w-80 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            data-testid="mobile-menu-toggle"
          >
            <Menu className="text-gray-600" />
          </Button>
        </div>

        {/* Quick Add Event */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Add Event
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="e.g., PI Planning on 15 Oct 9-11am"
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02C8FF] focus:border-[#02C8FF] transition-all duration-200 text-sm"
              value={quickAddInput}
              onChange={(e) => setQuickAddInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isQuickAdding}
              data-testid="input-quick-add"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleQuickAdd}
              disabled={isQuickAdding || !quickAddInput.trim()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#02C8FF] hover:text-[#07182D] transition-colors"
              data-testid="button-quick-add"
            >
              <PlusCircle className="text-lg" />
            </Button>
          </div>
        </div>

        {/* Bulk Import Section */}
        {onBulkImport && (
          <div className="mb-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Bulk Import</h3>
              <BulkPasteImporter onImport={onBulkImport} />
            </div>
          </div>
        )}

        {/* Event Categories */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Event Categories
          </label>
          <div className="space-y-2">
            {Object.entries(eventTypeLabels).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? 'all' : type as EventType)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer w-full ${
                  filterType === type
                    ? 'border-[#02C8FF] bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                data-testid={`filter-${type.toLowerCase()}`}
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: eventTypeColors[type as EventType] }}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span 
                  className="text-xs text-gray-500"
                  data-testid={`count-${type.toLowerCase()}`}
                >
                  {getEventCountForType(type as EventType)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Search Events
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by title or keyword..."
              className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#02C8FF] focus:border-[#02C8FF] transition-all duration-200 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onCreateEvent}
            className="w-full px-4 py-3 bg-[#02C8FF] text-white rounded-xl hover:bg-opacity-90 transition-all duration-200 font-medium text-sm"
            data-testid="button-create-event"
          >
            <Plus className="mr-2 w-4 h-4" />
            Create Event
          </Button>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={onExport}
                className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                data-testid="button-export"
              >
                <Download className="mr-2 w-4 h-4" />
                JSON
              </Button>
              <Button
                variant="outline"
                onClick={onImport}
                className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                data-testid="button-import"
              >
                <Upload className="mr-2 w-4 h-4" />
                Import
              </Button>
            </div>
            
            <div className="border-t border-gray-200 pt-3">
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                PowerPoint Export
              </label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={onExportPptxTable}
                  className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  data-testid="button-export-pptx-table"
                >
                  <FileText className="mr-2 w-4 h-4" />
                  Table Format
                </Button>
                <Button
                  variant="outline"
                  onClick={onExportPptxMonthGrid}
                  className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  data-testid="button-export-pptx-month"
                >
                  <Calendar className="mr-2 w-4 h-4" />
                  Monthly Grid
                </Button>
                <Button
                  variant="outline"
                  onClick={onExportPptxQuarterGrid}
                  className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  data-testid="button-export-pptx-quarter"
                >
                  <LayoutGrid className="mr-2 w-4 h-4" />
                  Quarterly Grid
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Switch */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <a 
            href="/viewer"
            className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Switch to View-Only Mode
          </a>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <span data-testid="total-events">
              {events.length} events
            </span>
            <span className="mx-2">•</span>
            <span className="text-xs">Stored locally</span>
          </div>
        </div>
      </div>
      

    </aside>
  );
}
