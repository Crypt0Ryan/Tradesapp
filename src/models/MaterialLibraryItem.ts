export interface MaterialLibraryItem {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  unit_cost: number;
  updated_at: string;
}

export type NewMaterialLibraryItem = Omit<MaterialLibraryItem, 'id' | 'updated_at'>;
