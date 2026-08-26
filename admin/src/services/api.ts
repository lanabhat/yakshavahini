import axios from 'axios';
import type { ProjectConfig } from '@/config/projects';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export default api;

// ── Entry types ──────────────────────────────────────────────────────────
// Project-specific fields (Mattukosha's type/ragas/situations, Pustaka
// Kosha's authors/category/publisher/...) aren't enumerated here — they're
// read/written dynamically via the index signature, driven by each
// project's field schema instead of one hardcoded shape per project.
export interface Entry {
  id: number;
  entry_id: string;
  notes: string;
  status: string;
  review_notes: string;
  view_count: number;
  submitted_by: string;
  reviewed_at: string;
  has_pending_deletion: boolean;
  [key: string]: unknown;
}

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  role: 'admin' | 'editor' | 'volunteer' | null;
  is_active?: boolean;
}

export interface DriveAccount {
  id: number;
  label: string;
  google_email: string;
  is_active: boolean;
  is_default: boolean;
  drive_folder_id: string;
  notes: string;
  created_at: string;
  file_count: number;
}

// ── Auth ─────────────────────────────────────────────────────────────────

export const adminLogin = (username: string, password: string) =>
  api.post<{ token: string; email: string; name: string; picture: string; role: string }>(
    '/api/auth/admin-login/', { username, password },
  );

export const fetchMe = () =>
  api.get<{ id: number; username: string; email: string; name: string; picture: string; role: string }>(
    '/api/auth/me/',
  );

// ── Entry CRUD ───────────────────────────────────────────────────────────

export const fetchEntry = (project: ProjectConfig, id: number) =>
  api.get<Entry>(`${project.apiBase}/entries/${id}/`);

export const createEntry = (project: ProjectConfig, data: Record<string, unknown>) =>
  api.post<Entry>(`${project.apiBase}/entries/`, data);

export const updateEntry = (project: ProjectConfig, id: number, data: Record<string, unknown>) =>
  api.patch<Entry & { proposed_edit?: boolean }>(`${project.apiBase}/entries/${id}/`, data);

export const deleteEntry = (project: ProjectConfig, id: number, reason?: string) =>
  api.delete(`${project.apiBase}/entries/${id}/`, { data: { reason } });

export const initUpload = (project: ProjectConfig, id: number, fileName?: string, driveAccountId?: number) =>
  api.post<{ upload_url: string; access_token: string; drive_account_id: number; file_name: string }>(
    `${project.apiBase}/entries/${id}/upload/init/`, { file_name: fileName, drive_account_id: driveAccountId },
  );

export const verifyUpload = (project: ProjectConfig, id: number, fileName: string, driveAccountId: number, linkField: string) =>
  api.post<{ url: string; entry_id: string }>(
    `${project.apiBase}/entries/${id}/upload/verify/`,
    { file_name: fileName, drive_account_id: driveAccountId, link_field: linkField },
  );

export const fetchMySubmissions = (project: ProjectConfig) => api.get<Entry[]>(`${project.apiBase}/my-submissions/`);

export const fetchPendingEntries = (project: ProjectConfig) => api.get<Entry[]>(`${project.apiBase}/pending-entries/`);

export const reviewEntry = (project: ProjectConfig, id: number, entryStatus: string, review_notes?: string) =>
  api.patch<Entry>(`${project.apiBase}/entries/${id}/review/`, { status: entryStatus, review_notes });

export interface AdminSearchParams {
  fstring?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  pageno?: number;
}

export const searchAllEntries = (project: ProjectConfig, params: AdminSearchParams) =>
  api.get<{ total: number; dataset: Entry[]; allLoaded: boolean }>(`${project.apiBase}/admin/entries/`, { params });

export const exportEntries = (project: ProjectConfig) =>
  api.get(`${project.apiBase}/entries/export/`, { responseType: 'blob' });

// ── Taxonomy (Author/Publisher/Category/Contributor, etc.) ─────────────

export interface TaxonomyItem {
  id: number;
  name: string;
  entry_count: number;
}

export const fetchTaxonomy = (project: ProjectConfig, field: string, q?: string) =>
  api.get<TaxonomyItem[]>(`${project.apiBase}/taxonomy/${field}/`, { params: { q } });

export const createTaxonomyItem = (project: ProjectConfig, field: string, name: string) =>
  api.post<TaxonomyItem>(`${project.apiBase}/taxonomy/${field}/`, { name });

export const renameTaxonomyItem = (project: ProjectConfig, field: string, id: number, name: string) =>
  api.patch<TaxonomyItem>(`${project.apiBase}/taxonomy/${field}/${id}/`, { name });

export const deleteTaxonomyItem = (project: ProjectConfig, field: string, id: number) =>
  api.delete(`${project.apiBase}/taxonomy/${field}/${id}/`);

export const mergeTaxonomyItems = (project: ProjectConfig, field: string, keepId: number, mergeIds: number[]) =>
  api.post<TaxonomyItem & { merged_count: number }>(`${project.apiBase}/taxonomy/${field}/merge/`, {
    keep_id: keepId, merge_ids: mergeIds,
  });

export const autocomplete = (project: ProjectConfig, field: string, q: string) =>
  api.get<{ id: number; name: string }[]>(`${project.apiBase}/autocomplete/`, { params: { field, q } });

// ── Public filter sidebar config ─────────────────────────────────────────

export interface FilterFieldOption {
  field: string;
  label: string;
  kind: 'scalar' | 'taxonomy';
}

export interface FilterConfig {
  available: FilterFieldOption[];
  enabled: string[];
}

export const fetchFilterConfig = (project: ProjectConfig) =>
  api.get<FilterConfig>(`${project.apiBase}/filter-config/`);

export const updateFilterConfig = (project: ProjectConfig, enabled: string[]) =>
  api.put<FilterConfig>(`${project.apiBase}/filter-config/`, { enabled });

// ── Public list-view display fields config ──────────────────────────────

export interface ListDisplayFieldOption {
  field: string;
  label: string;
  kind: 'text' | 'taxonomy-single' | 'taxonomy-multi' | 'date';
}

export type FontSize = 'sm' | 'md' | 'lg';

export interface ListDisplaySelection {
  field: string;
  font_size: FontSize;
}

export interface ListDisplayConfig {
  available: ListDisplayFieldOption[];
  selected: ListDisplaySelection[];
}

export const fetchListDisplayConfig = (project: ProjectConfig) =>
  api.get<ListDisplayConfig>(`${project.apiBase}/list-display-config/`);

export const updateListDisplayConfig = (project: ProjectConfig, selected: ListDisplaySelection[]) =>
  api.put<ListDisplayConfig>(`${project.apiBase}/list-display-config/`, { selected });

// ── Public landing page content (paragraphs + buttons) ──────────────────

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

export const updateLandingPage = (project: ProjectConfig, blocks: LandingBlock[]) =>
  api.put<LandingPageConfig>(`${project.apiBase}/landing-page/`, { blocks });

// ── Site-wide root home page content + Updates (not project-scoped) ─────

export type SiteButtonTarget = 'external' | 'project';

export interface SiteButtonBlock {
  type: 'button';
  label: string;
  target_type: SiteButtonTarget;
  url?: string;
  project_slug?: string;
}

export type SiteLandingBlock = LandingParagraphBlock | SiteButtonBlock;

export interface SiteHomeConfig {
  blocks: SiteLandingBlock[];
  maintenance_mode: boolean;
  maintenance_message: string;
}

export const fetchSiteHomePage = () => api.get<SiteHomeConfig>('/api/v1/site/home-page/');

export const updateSiteHomePage = (data: SiteHomeConfig) =>
  api.put<SiteHomeConfig>('/api/v1/site/home-page/', data);

export interface SiteUpdateItem {
  id: number;
  title: string;
  text: string;
  created_at: string;
}

export const fetchSiteUpdates = () => api.get<SiteUpdateItem[]>('/api/v1/site/updates/');

export const createSiteUpdate = (title: string, text: string) =>
  api.post<SiteUpdateItem>('/api/v1/site/updates/', { title, text });

export const updateSiteUpdate = (id: number, data: { title?: string; text?: string }) =>
  api.patch<SiteUpdateItem>(`/api/v1/site/updates/${id}/`, data);

export const deleteSiteUpdate = (id: number) => api.delete(`/api/v1/site/updates/${id}/`);

// ── Google Drive accounts ───────────────────────────────────────────────

export const fetchDriveAccounts = () => api.get<DriveAccount[]>('/api/v1/drive-accounts/');

export const startDriveOAuth = () =>
  api.get<{ authorization_url: string }>('/api/v1/drive-accounts/oauth/start/');

export const updateDriveAccount = (id: number, data: Record<string, unknown>) =>
  api.patch<DriveAccount>(`/api/v1/drive-accounts/${id}/`, data);

export const deleteDriveAccount = (id: number) => api.delete(`/api/v1/drive-accounts/${id}/`);

// ── Deletion requests (editor/admin approval queue, shared across projects) ─

export interface DeletionRequestItem {
  id: number;
  project: string | null;
  project_label: string;
  entry_pk: number;
  entry_display_id: string;
  title: string;
  requested_by: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string;
  reviewed_at: string | null;
  created_at: string;
}

export const fetchDeletionRequests = (statusFilter: string = 'pending') =>
  api.get<DeletionRequestItem[]>('/api/v1/deletion-requests/', { params: { status: statusFilter } });

export const reviewDeletionRequest = (id: number, decision: 'approved' | 'rejected') =>
  api.patch<DeletionRequestItem>(`/api/v1/deletion-requests/${id}/review/`, { status: decision });

// ── Admin (users) ───────────────────────────────────────────────────────

export const fetchUsers = () => api.get<User[]>('/api/v1/admin/users/');

export const updateUser = (id: number, data: { role?: string; is_active?: boolean }) =>
  api.patch<User>(`/api/v1/admin/users/${id}/`, data);

export const createUser = (data: { email: string; role: string; name?: string }) =>
  api.post<User & { password: string }>('/api/v1/admin/users/', data);

// ── Drishya-Kavya Sanchaya CSV import ────────────────────────────────────
// Project-specific (not schema-driven) — see backend/drishyashravyakosha/
// csv_import.py. `clear` mirrors the management command's --yes /
// confirmed path: true wipes existing entries first, false only imports
// rows whose subject isn't already in the database.
export interface CsvImportSummary {
  total_rows: number;
  existing_before: number;
  deleted: number;
  created: number;
  skipped_existing: number;
  skipped_blank: number;
}

export const importDrishyaShravyaCsv = (project: ProjectConfig, file: File, clear: boolean) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('clear', String(clear));
  return api.post<CsvImportSummary>(`${project.apiBase}/import-csv/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
