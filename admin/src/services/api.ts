import axios from 'axios';
import { PROJECT } from '@/config/project';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export default api;

const base = PROJECT.apiBase;

// ── Entry types ──────────────────────────────────────────────────────────

export interface Entry {
  id: number;
  entry_id: string;
  name_of_the_mattu: string;
  link_to_pdf_document: string;
  date_kannada: string;
  date_english: string;
  notes: string;
  youtube_video_links: string[];
  status: string;
  review_notes: string;
  view_count: number;
  submitted_by: string;
  reviewed_at: string;
  has_pending_deletion: boolean;
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

export const fetchEntry = (id: number) => api.get<Entry>(`${base}/entries/${id}/`);

export const createEntry = (data: Record<string, unknown>) =>
  api.post<Entry>(`${base}/entries/`, data);

export const updateEntry = (id: number, data: Record<string, unknown>) =>
  api.patch<Entry & { proposed_edit?: boolean }>(`${base}/entries/${id}/`, data);

export const deleteEntry = (id: number, reason?: string) =>
  api.delete(`${base}/entries/${id}/`, { data: { reason } });

export const initUpload = (id: number, fileName?: string, driveAccountId?: number) =>
  api.post<{ upload_url: string; access_token: string; drive_account_id: number; file_name: string }>(
    `${base}/entries/${id}/upload/init/`, { file_name: fileName, drive_account_id: driveAccountId },
  );

export const verifyUpload = (id: number, fileName: string, driveAccountId: number, linkField: string) =>
  api.post<{ url: string; entry_id: string }>(
    `${base}/entries/${id}/upload/verify/`,
    { file_name: fileName, drive_account_id: driveAccountId, link_field: linkField },
  );

export const fetchMySubmissions = () => api.get<Entry[]>(`${base}/my-submissions/`);

export const fetchPendingEntries = () => api.get<Entry[]>(`${base}/pending-entries/`);

export const reviewEntry = (id: number, entryStatus: string, review_notes?: string) =>
  api.patch<Entry>(`${base}/entries/${id}/review/`, { status: entryStatus, review_notes });

export interface AdminSearchParams {
  fstring?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  pageno?: number;
}

export const searchAllEntries = (params: AdminSearchParams) =>
  api.get<{ total: number; dataset: Entry[]; allLoaded: boolean }>(`${base}/admin/entries/`, { params });

// ── Google Drive accounts ───────────────────────────────────────────────

export const fetchDriveAccounts = () => api.get<DriveAccount[]>('/api/v1/drive-accounts/');

export const startDriveOAuth = () =>
  api.get<{ authorization_url: string }>('/api/v1/drive-accounts/oauth/start/');

export const updateDriveAccount = (id: number, data: Record<string, unknown>) =>
  api.patch<DriveAccount>(`/api/v1/drive-accounts/${id}/`, data);

// ── Admin (users) ───────────────────────────────────────────────────────

export const fetchUsers = () => api.get<User[]>('/api/v1/admin/users/');

export const updateUser = (id: number, data: { role?: string; is_active?: boolean }) =>
  api.patch<User>(`/api/v1/admin/users/${id}/`, data);

export const createUser = (data: { email: string; role: string; name?: string }) =>
  api.post<User & { password: string }>('/api/v1/admin/users/', data);
