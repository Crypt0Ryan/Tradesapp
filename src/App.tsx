import { ClientsPanel } from './features/clients/ClientsPanel';
import { JobsPanel } from './features/jobs/JobsPanel';

function App() {
  return (
    <main>
      <h1>Tradesapp</h1>
      <ClientsPanel />
      <JobsPanel />
    </main>
  )
}

export default App
