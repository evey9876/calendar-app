# Calendar Application - Cursor Setup Guide

## Project Overview
A privacy-first TypeScript calendar application with advanced event management, natural language input, drag-and-drop functionality, and PowerPoint export capabilities.

## Features
- Natural language event input ("Meeting with John next Monday at 2pm")
- Drag-and-drop event management
- Multi-day event support
- Quarterly view system (Q1: Aug-Oct, Q2: Nov-Jan, Q3: Feb-Apr, Q4: May-Jul)
- Business-focused weekday display (Mon-Fri)
- Local IndexedDB storage for privacy
- PowerPoint export with multiple formats
- Dual-mode access: Editor and Read-only Viewer
- Bulk import with text parsing

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand + TanStack Query
- **UI**: Shadcn/ui + Radix UI + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Storage**: Local IndexedDB (idb library)
- **Drag & Drop**: DND Kit
- **Date Parsing**: chrono-node + date-fns
- **Document Export**: pptxgenjs

## Quick Setup for Cursor

### 1. Create New Project
```bash
mkdir calendar-app
cd calendar-app
```

### 2. Initialize Package.json
Copy the package.json from the file listing below and run:
```bash
npm install
```

### 3. Project Structure
Create the following directory structure:
```
calendar-app/
├── client/
│   ├── index.html
│   └── src/
│       ├── components/
│       ├── lib/
│       ├── hooks/
│       ├── pages/
│       ├── stores/
│       ├── utils/
│       ├── constants/
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── shared/
│   └── schema.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json
└── drizzle.config.ts
```

### 4. Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check
```

## Key Configuration Files

### package.json
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-select": "^2.1.7",
    "@tanstack/react-query": "^5.60.5",
    "chrono-node": "^2.8.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "express": "^4.21.2",
    "framer-motion": "^11.13.1",
    "idb": "^8.0.3",
    "lucide-react": "^0.453.0",
    "pptxgenjs": "^4.0.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "tailwind-merge": "^2.6.0",
    "wouter": "^3.3.5",
    "zod": "^3.24.2",
    "zustand": "^5.0.7"
  },
  "devDependencies": {
    "@types/express": "4.17.21",
    "@types/node": "20.16.11",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  }
}
```

### tsconfig.json
```json
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

### vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
```

## Important Notes for Cursor

1. **No Database Setup Required**: Uses IndexedDB for local storage
2. **Port Configuration**: Development server runs on port 5000
3. **Path Aliases**: Uses `@/` for client src and `@shared/` for shared schemas
4. **Environment**: Remove Replit-specific plugins from vite.config.ts
5. **Styling**: Uses Tailwind CSS with custom color variables
6. **Forms**: Uses react-hook-form with Zod validation

## Key Features Implementation

### Event Types with Colors
- Planning: Dark blue (#07182D)
- Meeting: Light blue (#02C8FF)
- Monthly Review: Pink (#FF007F)  
- Holidays: Orange (#FF9000)

### Natural Language Parsing
Uses chrono-node library to parse phrases like:
- "Meeting tomorrow at 2pm"
- "Conference next Monday to Wednesday"
- "Review session Friday afternoon"

### Storage Architecture
- **Primary**: IndexedDB for offline-first approach
- **Export**: JSON backup and PowerPoint presentations
- **State**: Zustand store with persistence

### Quarterly Calendar System
Custom quarterly view:
- Q1: August - October
- Q2: November - January  
- Q3: February - April
- Q4: May - July

## Next Steps After Setup

1. Copy all source files from the file listings below
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open browser to `http://localhost:5000`
5. Begin customizing for your needs

The application will work immediately with local storage - no database setup required!