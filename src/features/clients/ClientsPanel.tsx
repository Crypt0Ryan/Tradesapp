import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { createClient } from '../../db/clientRepository';
import { CURRENT_USER_ID } from '../currentUser';

export function ClientsPanel() {
  const clients = useLiveQuery(() => db.clients.where('user_id').equals(CURRENT_USER_ID).toArray(), []);

  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  async function handleSubmit(e: React.FormEvent) {
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
    <section>
      <h2>Clients</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Phone / email"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
        />
        <button type="submit">Add client</button>
      </form>

      <ul>
        {clients?.map((client) => (
          <li key={client.id}>
            {client.name}
            {client.contact_info && ` — ${client.contact_info}`}
          </li>
        ))}
        {clients?.length === 0 && <li>No clients yet.</li>}
      </ul>
    </section>
  );
}
