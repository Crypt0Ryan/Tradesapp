import { useState } from 'react';
import { Sidebar } from './features/sidebar/Sidebar';
import { MainArea } from './features/jobs/MainArea';

function App() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  return (
    <>
      <header>
        <h1>Tradesapp</h1>
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
