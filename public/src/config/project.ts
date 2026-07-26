// Only one project is wired up in the public app so far (Mattukosha). When
// Pustaka Sangraha / Sanghatana Kosha are added, this becomes a small
// registry keyed by slug (mirroring the backend's PROJECT_REGISTRY) instead
// of a single constant — the rest of the app already reads everything
// through this file rather than hardcoding field names, so that change
// stays contained to here.
export const PROJECT = {
  slug: 'mattukosha',
  apiBase: '/api/v1/mattukosha',
  name: 'Mattukosha',
  nameKannada: 'ಮಟ್ಟುಕೋಶ',
};
