import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCalendarStore } from '@/stores/calendarStore';
import { EventType } from '@shared/schema';
import { Search, Download, Menu, FileText, Calendar, LayoutGrid } from 'lucide-react';

interface ViewerSidebarProps {
  onExport: () => void;
  onExportPptxTable: () => void;
  onExportPptxMonthGrid: () => void;
  onExportPptxQuarterGrid: () => void;
}

const eventTypeColors: Record<EventType, string> = {
  PLANNING: '#2563eb',
  MEETING: '#dc2626',
  MONTHLY_REVIEW: '#000000',
  HOLIDAYS: '#FF9000',
};

const eventTypeLabels: Record<EventType, string> = {
  PLANNING: 'PI Planning',
  MEETING: 'Sprint Start',
  MONTHLY_REVIEW: 'FY Week',
  HOLIDAYS: 'Holidays',
};

export function ViewerSidebar({ onExport, onExportPptxTable, onExportPptxMonthGrid, onExportPptxQuarterGrid }: ViewerSidebarProps) {
  const {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    events,
    getEventsByType,
  } = useCalendarStore();

  const getEventCountForType = (type: EventType) => {
    return getEventsByType(type).length;
  };

  return (
    <aside className="w-full lg:w-80 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Calendar View</h1>
            <p className="text-sm text-gray-600">Read-only mode</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            data-testid="mobile-menu-toggle"
          >
            <Menu className="text-gray-600" />
          </Button>
        </div>

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

        {/* Export Actions */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-gray-700">Export Options</h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={onExport}
              className="w-full px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              data-testid="button-export"
            >
              <Download className="mr-2 w-4 h-4" />
              Export JSON
            </Button>
            
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

        {/* Switch to Admin Mode */}
        <div className="pt-6 border-t border-gray-200">
          <a 
            href="/"
            className="w-full flex items-center justify-center px-4 py-3 text-sm bg-[#02C8FF] text-white rounded-lg hover:bg-[#0299CC] transition-colors font-medium"
            data-testid="link-admin-mode"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Switch to Admin Mode
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