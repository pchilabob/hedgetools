export type NadeRecord = {
  id: number;
  title: string;
  map: string;
  side: string;
  startPosition: string;
  targetPosition: string;
  nadeType: string;
  description: string;
  tags: string;
  localVideoPath: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NadeInput = Omit<NadeRecord, 'id' | 'createdAt' | 'updatedAt'>;

export type NadeFilters = {
  map?: string;
  side?: string;
  startPosition?: string;
  nadeType?: string;
  search?: string;
  sort?: 'new' | 'map' | 'title';
};
