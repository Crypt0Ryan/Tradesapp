import { useState } from 'react';
import { Sidebar } from './features/sidebar/Sidebar';
import { MainArea } from './features/jobs/MainArea';
import { TimesheetView } from './features/timesheet/TimesheetView';

function App() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showTimesheet, setShowTimesheet] = useState(false);

  if (showTimesheet) {
    return <TimesheetView onClose={() => setShowTimesheet(false)} />;
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
