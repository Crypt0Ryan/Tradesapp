import { useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';
import { Sidebar as AppSidebar } from './features/sidebar/Sidebar';
import { MainArea } from './features/jobs/MainArea';
import { TimesheetView } from './features/timesheet/TimesheetView';
import { ProfitabilityReport } from './features/profitability/ProfitabilityReport';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

function App() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showTimesheet, setShowTimesheet] = useState(false);
  const [showProfitability, setShowProfitability] = useState(false);

  if (showTimesheet) {
    return <TimesheetView onClose={() => setShowTimesheet(false)} />;
  }

  if (showProfitability) {
    return <ProfitabilityReport onClose={() => setShowProfitability(false)} />;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <AppSidebar selectedJobId={selectedJobId} onSelectJob={setSelectedJobId} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar px-4 py-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground" />
            <img src="/logo.png" alt="Tradesapp" className="app-logo" />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowTimesheet(true)}
              className="gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Clock className="size-4" />
              <span className="hidden sm:inline">Timesheet</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowProfitability(true)}
              className="gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <TrendingUp className="size-4" />
              <span className="hidden sm:inline">Profitability</span>
            </Button>
          </div>
        </header>
        <MainArea selectedJobId={selectedJobId} onCloseJob={() => setSelectedJobId(null)} />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
