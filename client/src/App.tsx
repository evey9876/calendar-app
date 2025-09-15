import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CalendarPage from "@/pages/CalendarPage";
import CalendarViewerPage from "@/pages/CalendarViewerPage";
import NotFound from "@/pages/not-found";
import { useCalendarStore } from "@/stores/calendarStore";

// Expose store to window for console access
if (typeof window !== 'undefined') {
  (window as any).useCalendarStore = useCalendarStore;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={CalendarPage} />
      <Route path="/viewer" component={CalendarViewerPage} />
      <Route><NotFound /></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

