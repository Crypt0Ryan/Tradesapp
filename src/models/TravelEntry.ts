export type TravelEntrySource = 'manual' | 'gps_auto';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface TravelEntry {
  id: string;
  job_id: string;
  user_id: string;
  start_location: GeoPoint | null;
  end_location: GeoPoint | null;
  distance_km: number;
  source: TravelEntrySource;
  personal: boolean;
  date: string;
  /** Set for a fixed daily run (km_per_day x days = distance_km); unset for a one-off trip. */
  km_per_day?: number | null;
  days?: number | null;
}

export type NewTravelEntry = Omit<TravelEntry, 'id'>;
