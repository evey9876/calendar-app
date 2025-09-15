# Online Calendar - Quarterly Planning Application

A privacy-first calendar application designed for organizational planning with a unique quarterly view system. Built with React, TypeScript, and local storage for complete data privacy.

## 🎯 Key Features

### Quarterly View System
- **Q1**: August - October (Aug, Sep, Oct)
- **Q2**: November - January (Nov, Dec, Jan)
- **Q3**: February - April (Feb, Mar, Apr)
- **Q4**: May - July (May, Jun, Jul)

### Core Functionality
- **Natural Language Input**: Create events using phrases like "Team Meeting on Nov 15 2-4pm"
- **Drag & Drop**: Move events between dates with visual feedback
- **Four Event Types**: Planning, Meeting, Monthly Review, Holidays (color-coded)
- **Local Storage**: All data stored in browser's IndexedDB for privacy
- **Export/Import**: JSON backup and restore capabilities
- **PowerPoint Export**: Three professional presentation formats for planning meetings
- **Search & Filter**: Find events by title, type, or date range

### Privacy & Data
- **100% Local**: No data sent to external servers
- **Offline Capable**: Works without internet connection
- **Export Control**: You own and control all your data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd online-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5000](http://localhost:5000) in your browser

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **@dnd-kit** for drag and drop functionality
- **date-fns** for date manipulation
- **Zustand** for state management
- **PptxGenJS** for PowerPoint generation

### Backend
- **Express.js** with TypeScript
- **IndexedDB** for local data storage
- **Zod** for data validation

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code quality
- **Hot Module Replacement** for fast development

## 📅 Using the Calendar

### Creating Events

1. **Quick Add**: Click the "+" button and type naturally:
   - "Planning session on Sep 15 9-11am"
   - "Holiday on Dec 25"
   - "QBR meeting tomorrow 2pm"
   - "Monthly review on Aug 30"

2. **Manual Form**: Use the detailed form for precise event creation

### Navigation

- **Quarter Selector**: Use the dropdown (Q1-Q4) for quick navigation
- **Arrow Buttons**: Move between quarters
- **Today Button**: Jump to current quarter

### Managing Events

- **Drag & Drop**: Click and drag events to new dates
- **Edit**: Click on any event to view/edit details
- **Delete**: Remove events from the detail view
- **Filter**: Use sidebar filters by event type

### Data Management

- **JSON Export**: Download all events as JSON backup
- **JSON Import**: Upload JSON backup to restore events
- **PowerPoint Export**: Generate professional presentations in three formats:
  - **Table Format**: Clean monthly tables with color-coded events
  - **Monthly Grid**: Traditional calendar view with event blocks
  - **Quarterly Grid**: 3-month overview slides for executive presentations
- **Local Storage**: Data persists in your browser

## 🎨 Event Types & Colors

| Type | Color | Use Case |
|------|-------|----------|
| Planning | Dark Blue (#07182D) | Strategic planning, roadmaps |
| Meeting | Light Blue (#02C8FF) | Team meetings, standups, reviews |
| Monthly Review | Magenta (#FF007F) | Monthly retrospectives, reviews |
| Holidays | Orange (#FF9000) | Vacations, company holidays |

## 🔧 Configuration

The calendar uses a custom quarterly system designed for organizational planning. You can modify the quarter definitions in `client/src/components/Calendar.tsx`:

```typescript
const getQuarterMonths = (date: Date) => {
  const month = date.getMonth();
  
  // Q1: Aug(7) - Oct(9)
  if (month >= 7 && month <= 9) return [7, 8, 9];
  // Q2: Nov(10) - Jan(0)
  else if (month >= 10 || month <= 0) return [10, 11, 0];
  // Q3: Feb(1) - Apr(3)
  else if (month >= 1 && month <= 3) return [1, 2, 3];
  // Q4: May(4) - Jul(6)
  else return [4, 5, 6];
};
```

## 📱 Responsive Design

- **Desktop**: Full three-month quarterly view
- **Mobile**: Optimized single-column layout
- **Touch Support**: Drag and drop works on touch devices

## 🔒 Privacy & Security

- **No External APIs**: All data processing happens locally
- **No Analytics**: No tracking or data collection
- **No Account Required**: Start using immediately
- **Data Ownership**: Export your data anytime

## 🛠️ Development

### Project Structure
```
├── client/src/
│   ├── components/     # React components
│   ├── stores/         # Zustand state management
│   ├── lib/           # Utilities and helpers
│   └── pages/         # Application pages
├── server/            # Express backend
├── shared/            # Shared TypeScript schemas
└── components.json    # Shadcn/ui configuration
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding Features

1. **New Event Types**: Update `shared/schema.ts` and add colors
2. **Custom Views**: Modify quarter logic in Calendar component
3. **New Filters**: Extend the sidebar filter system
4. **Storage Options**: Implement additional storage backends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature description"`
5. Push to your fork: `git push origin feature-name`
6. Create a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋‍♂️ Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check this README and inline code comments
- **Examples**: See the demo data for usage patterns

## 🚧 Roadmap

- [x] PowerPoint export with multiple formats
- [x] Monthly Review event type
- [x] Enhanced presentation capabilities
- [ ] Recurring events support
- [ ] Calendar sync (optional)
- [ ] Team collaboration features
- [ ] Advanced filtering options
- [ ] Mobile app version
- [ ] Custom quarter definitions UI

---

**Built for organizational planning with privacy in mind.** 🗓️