export interface ProjectConfig {
  slug: string;
  apiBase: string;
  name: string;
  nameKannada: string;
  // Whether this project has a real backend app wired up yet — inactive
  // projects still show on the picker (so the intended lineup is visible)
  // but aren't clickable.
  active: boolean;
}

export const PROJECTS: ProjectConfig[] = [
  { slug: 'mattukosha', apiBase: '/api/v1/mattukosha', name: 'Mattukosha', nameKannada: 'ಮಟ್ಟುಕೋಶ', active: true },
  { slug: 'pustakakosha', apiBase: '/api/v1/pustakakosha', name: 'Pustaka Kosha', nameKannada: 'ಪುಸ್ತಕಕೋಶ', active: false },
  { slug: 'sanghatanakosha', apiBase: '/api/v1/sanghatanakosha', name: 'Sanghatana Kosha', nameKannada: 'ಸಂಘಟನಾಕೋಶ', active: false },
];

export const getProject = (slug?: string): ProjectConfig | undefined =>
  PROJECTS.find((p) => p.slug === slug);
