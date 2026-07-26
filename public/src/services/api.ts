import axios from 'axios';
import type { ProjectConfig } from '@/config/projects';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: BASE_URL });

export default api;

// Mattukosha's field shape today — once a second active project exists with
// different fields, this becomes a per-project generic/schema-driven type
// instead (see the backend's ProjectSchema for the equivalent shift there).
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

export const fetchStats = (project: ProjectConfig) => api.get<StatsData>(`${project.apiBase}/stats/`);

export const fetchEntry = (project: ProjectConfig, id: number) =>
  api.get<Entry>(`${project.apiBase}/entries/${id}/`);

export const filterEntries = (project: ProjectConfig, params: FilterParams) =>
  api.get<{ total: number; dataset: Entry[]; allLoaded: boolean }>(`${project.apiBase}/resources/entries`, { params });

export const searchEntries = (project: ProjectConfig, q: string) => filterEntries(project, { fstring: q });
