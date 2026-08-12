import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { db } from '../../db/database';
import { createClient } from '../../db/clientRepository';
import { CURRENT_USER_ID } from '../currentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/components/ui/sidebar';
import { ClientNode } from './ClientNode';

export function Sidebar({
  selectedJobId,
  onSelectJob,
}: {
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
}) {
  const clients = useLiveQuery(() => db.clients.toArray(), []);
  const { isMobile, setOpenMobile } = useSidebar();

  function handleSelectJob(jobId: string | null) {
    onSelectJob(jobId);
    if (isMobile) setOpenMobile(false);
  }

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

  const sidebarInputClass =
    'bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50';

  return (
    <nav className="flex flex-1 flex-col gap-4 px-4 py-6">
      <h2 className="px-1 text-sm font-semibold tracking-wide text-sidebar-foreground/70 uppercase">
        Clients &amp; Jobs
      </h2>

      <form onSubmit={handleAddClient} className="flex flex-col gap-2">
        <Input
          type="text"
          placeholder="Client name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={sidebarInputClass}
        />
        <Input
          type="text"
          placeholder="Phone / email"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          className={sidebarInputClass}
        />
        <Button type="submit" variant="secondary" className="gap-1.5">
          <Plus className="size-4" />
          Add client
        </Button>
      </form>

      <ul className="flex flex-col gap-1">
        {clients?.map((client) => (
          <ClientNode key={client.id} client={client} selectedJobId={selectedJobId} onSelectJob={handleSelectJob} />
        ))}
        {clients?.length === 0 && <li className="px-1 text-sm text-sidebar-foreground/60">No clients yet.</li>}
      </ul>
    </nav>
  );
}
