import { ClientsPanel } from './features/clients/ClientsPanel';
import { JobsPanel } from './features/jobs/JobsPanel';
import { VoiceInboxPanel } from './features/voice/VoiceInboxPanel';

function App() {
  return (
    <main>
      <h1>Tradesapp</h1>
      <ClientsPanel />
      <JobsPanel />
      <VoiceInboxPanel />
    </main>
  )
}

export default App
