// Only one project is wired up in the admin app so far (Mattukosha). When
// Pustaka Sangraha / Sanghatana Kosha are added, this becomes a small
// registry keyed by slug (mirroring the backend's PROJECT_REGISTRY) with a
// project switcher reading from it, instead of a single constant.
export const PROJECT = {
  slug: 'mattukosha',
  apiBase: '/api/v1/mattukosha',
  name: 'Mattukosha',
};
