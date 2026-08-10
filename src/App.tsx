import { useState } from 'react';
import { Sidebar } from './features/sidebar/Sidebar';
import { MainArea } from './features/jobs/MainArea';
import { TimesheetView } from './features/timesheet/TimesheetView';
import { ProfitabilityReport } from './features/profitability/ProfitabilityReport';

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
    <>
      <header>
        <h1>
          <img src="/logo.png" alt="Tradesapp" className="app-logo" />
        </h1>
        <button type="button" onClick={() => setShowTimesheet(true)}>
          Timesheet
        </button>
        <button type="button" onClick={() => setShowProfitability(true)}>
          Profitability
        </button>
      </header>
      <div className="app-layout">
        <aside className="app-sidebar">
          <Sidebar selectedJobId={selectedJobId} onSelectJob={setSelectedJobId} />
        </aside>
        <main className="app-main">
          <MainArea selectedJobId={selectedJobId} onCloseJob={() => setSelectedJobId(null)} />
        </main>
      </div>
    </>
  )
}

export default App
