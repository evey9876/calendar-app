# Online Calendar

## Overview

A local-first online calendar application designed for organizational planning. The application allows users to quickly add events using natural language input, manage them via drag-and-drop functionality, and view them in color-coded categories. All data is stored locally in the browser's IndexedDB for offline functionality, with comprehensive export capabilities including JSON backup and professional PowerPoint presentations in multiple formats.

## User Preferences

Preferred communication style: Simple, everyday language.
Multi-day events: No start/end times displayed. No calendar icon or date range in event cards - only event title shown.
Calendar display: Show only Monday through Friday (no weekends).

## Access Modes

The application provides two distinct access modes with separate pages and functionality:

### Admin Page (`/`)
- **Full administrative access** with complete event management capabilities
- **Event Creation**: Quick add via natural language input and manual event creation forms
- **Bulk Import**: Paste multiple events at once using structured text format
- **All Export Features**: JSON export/import and PowerPoint export (Table, Monthly Grid, Quarterly Grid)
- **Event Categories**: Full filtering and viewing by event types (Planning, Meeting, Monthly Review, Holidays)
- **Search Functionality**: Filter events by title or keywords
- **Drag & Drop**: Move events between dates with visual feedback
- **Event Editing**: Modify existing events including title, type, dates, and times
- **Statistics**: View total event counts and storage information

### Viewer Page (`/viewer`)
- **Read-only access** for viewing calendar data without modification capabilities
- **Event Viewing**: Click events to see details but cannot edit or delete
- **Export Features**: Full access to JSON and PowerPoint export functionality
- **Event Categories**: Filter and view events by type with counts
- **Search Functionality**: Filter events by title or keywords
- **No Creation/Editing**: Cannot add new events or modify existing ones
- **No Bulk Import**: Bulk import functionality restricted to admin mode only
- **Statistics**: View total event counts and storage information

Both modes share the same underlying data storage and core viewing capabilities while maintaining clear separation between administrative and read-only functions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development tooling
- **State Management**: Zustand for client-side state management with a centralized calendar store
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for lightweight client-side routing
- **Data Fetching**: TanStack React Query for server state management and caching
- **Drag & Drop**: DND Kit for implementing drag-and-drop event management
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Server Framework**: Express.js with TypeScript running on Node.js
- **Development**: Hot module replacement via Vite integration in development mode
- **Storage Interface**: Abstract storage interface with in-memory implementation for flexibility
- **API Structure**: RESTful API design with `/api` prefix for all endpoints

### Data Storage Solutions
- **Primary Storage**: Browser-based IndexedDB using the `idb` library for local-first data persistence
- **Schema Management**: Zod schemas for runtime validation and type safety
- **Event Types**: Four predefined categories (Planning, Meeting, Monthly Review, Holidays) with specific color coding
- **Data Export/Import**: JSON format for manual backup and restore functionality
- **PowerPoint Export**: Three professional presentation formats:
  - Table Format: Monthly tables with color-coded event listings
  - Monthly Grid: Traditional calendar grids with event blocks
  - Quarterly Grid: Compact 3-month overview slides for executive presentations

### Client-Side Data Management
- **Local Storage**: IndexedDB for persistent event storage with offline capability
- **State Store**: Zustand store managing events, current date, view modes, and filters
- **Natural Language Processing**: Custom date parser for interpreting natural language event input
- **Drag & Drop**: Event repositioning across calendar dates with automatic date updates

### UI/UX Design Patterns
- **Responsive Design**: Mobile-first approach with desktop enhancements
- **Component Architecture**: Modular component structure with reusable UI primitives
- **Theme System**: CSS custom properties for consistent design tokens
- **Modal Management**: Dialog-based modals for event creation and detail viewing
- **Color Coding**: Predefined color scheme for different event types for visual categorization

## External Dependencies

### UI and Styling
- **@radix-ui/\***: Comprehensive set of unstyled, accessible UI primitives for complex components
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Type-safe variant API for component styling
- **lucide-react**: Icon library providing consistent iconography

### State Management and Data
- **zustand**: Lightweight state management solution for React applications
- **@tanstack/react-query**: Server state management with caching and synchronization
- **idb**: Promise-based wrapper for IndexedDB API
- **zod**: TypeScript-first schema declaration and validation library

### Form Handling
- **react-hook-form**: Performant forms with easy validation
- **@hookform/resolvers**: Validation resolvers for various schema libraries

### Drag and Drop
- **@dnd-kit/core**: Modern drag and drop toolkit for React
- **@dnd-kit/sortable**: Sortable preset for drag and drop functionality
- **@dnd-kit/utilities**: Utility functions for drag and drop operations

### Date Management
- **date-fns**: Modern JavaScript date utility library for parsing and formatting dates

### Document Generation
- **pptxgenjs**: PowerPoint generation library for creating professional presentations with calendar data

### Development Tools
- **vite**: Fast build tool and development server with hot module replacement
- **typescript**: Static type checking for enhanced developer experience
- **@replit/vite-plugin-runtime-error-modal**: Development-time error handling