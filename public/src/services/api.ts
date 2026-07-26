import axios from 'axios';
import { PROJECT } from '@/config/project';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: BASE_URL });

export default api;

export interface Entry {
  id: number;
  entry_id: string;
  name_of_the_mattu: string;
  link_to_pdf_document: string;
  date_kannada: string;
  date_english: string;
  notes: string;
  youtube_video_links: string[];
  view_count: number;
}

export interface StatsData {
  total: number;
  recently_added: Entry[];
  most_viewed: Entry[];
}

export type SortField = 'entry_id' | 'title' | 'date';
export type SortOrder = 'asc' | 'desc';

export interface FilterParams {
  fstring?: string;
  has_link?: 'true';
  sort?: SortField;
  order?: SortOrder;
  pageno?: number;
}

const base = PROJECT.apiBase;

export const fetchStats = () => api.get<StatsData>(`${base}/stats/`);

export const fetchEntry = (id: number) => api.get<Entry>(`${base}/entries/${id}/`);

export const filterEntries = (params: FilterParams) =>
  api.get<{ total: number; dataset: Entry[]; allLoaded: boolean }>(`${base}/resources/entries`, { params });

export const searchEntries = (q: string) => filterEntries({ fstring: q });
