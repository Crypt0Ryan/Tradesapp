import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { createClient } from '../../db/clientRepository';
import { CURRENT_USER_ID } from '../currentUser';
import { ClientNode } from './ClientNode';

export function Sidebar({
  selectedJobId,
  onSelectJob,
}: {
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
}) {
  const clients = useLiveQuery(() => db.clients.toArray(), []);

  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    await createClient({
      user_id: CURRENT_USER_ID,
      name: name.trim(),
      contact_info: contactInfo.trim(),
      address: '',
      notes: '',
    });

    setName('');
    setContactInfo('');
  }

  return (
    <nav>
      <h2>Clients &amp; Jobs</h2>

      <form onSubmit={handleAddClient}>
        <input type="text" placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          type="text"
          placeholder="Phone / email"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
        />
        <button type="submit">+ Add client</button>
      </form>

      <ul>
        {clients?.map((client) => (
          <ClientNode key={client.id} client={client} selectedJobId={selectedJobId} onSelectJob={onSelectJob} />
        ))}
        {clients?.length === 0 && <li>No clients yet.</li>}
      </ul>
    </nav>
  );
}
