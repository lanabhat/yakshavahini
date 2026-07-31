import axios from 'axios';
import type { ProjectConfig } from '@/config/projects';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: BASE_URL });

export default api;

export interface TaxonomyRef {
  id: number;
  name: string;
}

// Only the fields every project shares are enumerated — project-specific
// fields (Mattukosha's type/ragas/situations, Pustaka Kosha's
// authors/category/publisher/...) are read dynamically via the index
// signature, driven by each project's field schema (see config/projects.ts)
// instead of one hardcoded shape per project. Taxonomy fields serialize as
// `TaxonomyRef | null` (single) or `TaxonomyRef[]` (multi).
export interface Entry {
  id: number;
  entry_id: string;
  notes: string;
  view_count: number;
  [key: string]: unknown;
}

export interface GroupCount {
  name: string;
  count: number;
}

export interface TaxonomyItem {
  id: number;
  name: string;
  entry_count: number;
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
  [key: string]: unknown; // scalar facet params (?type=) and taxonomy id params (?category_id=)
}

export type LandingButtonTarget = 'home' | 'library' | 'external';

export interface LandingParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface LandingButtonBlock {
  type: 'button';
  label: string;
  target_type: LandingButtonTarget;
  url?: string;
}

export type LandingBlock = LandingParagraphBlock | LandingButtonBlock;

export interface LandingPageConfig {
  blocks: LandingBlock[];
}

export const fetchLandingPage = (project: ProjectConfig) =>
  api.get<LandingPageConfig>(`${project.apiBase}/landing-page/`);

export const fetchStats = (project: ProjectConfig) => api.get<StatsData>(`${project.apiBase}/stats/`);

export const fetchEntry = (project: ProjectConfig, id: number) =>
  api.get<Entry>(`${project.apiBase}/entries/${id}/`);

export const filterEntries = (project: ProjectConfig, params: FilterParams) =>
  api.get<{ total: number; dataset: Entry[]; allLoaded: boolean }>(`${project.apiBase}/resources/entries`, { params });

export const searchEntries = (project: ProjectConfig, q: string) => filterEntries(project, { fstring: q });

export const fetchGroups = (project: ProjectConfig, field: string) =>
  api.get<GroupCount[]>(`${project.apiBase}/resources/groups`, { params: { field } });

export const fetchTaxonomy = (project: ProjectConfig, field: string) =>
  api.get<TaxonomyItem[]>(`${project.apiBase}/taxonomy/${field}/`);

export interface FilterFieldOption {
  field: string;
  label: string;
  kind: 'scalar' | 'taxonomy';
}

export interface FilterConfigData {
  available: FilterFieldOption[];
  enabled: string[];
}

export const fetchFilterConfig = (project: ProjectConfig) =>
  api.get<FilterConfigData>(`${project.apiBase}/filter-config/`);

export type FontSize = 'sm' | 'md' | 'lg';

export interface ListDisplayFieldOption {
  field: string;
  label: string;
  kind: 'text' | 'taxonomy-single' | 'taxonomy-multi' | 'date';
}

export interface ListDisplaySelection {
  field: string;
  font_size: FontSize;
}

export interface ListDisplayConfigData {
  available: ListDisplayFieldOption[];
  selected: ListDisplaySelection[];
}

export const fetchListDisplayConfig = (project: ProjectConfig) =>
  api.get<ListDisplayConfigData>(`${project.apiBase}/list-display-config/`);
