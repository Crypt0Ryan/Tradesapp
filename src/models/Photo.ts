export interface Photo {
  id: string;
  job_id: string;
  image_url: string;
  caption: string;
  taken_at: string;
}

export type NewPhoto = Omit<Photo, 'id'>;
