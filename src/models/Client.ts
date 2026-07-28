export interface Client {
  id: string;
  user_id: string;
  name: string;
  contact_info: string;
  address: string;
  notes: string;
}

export type NewClient = Omit<Client, 'id'>;
