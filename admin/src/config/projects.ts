// Per-project config for the admin app. Mirrors the backend's PROJECT_REGISTRY
// and the public app's `src/config/projects.ts`. Adding a new project means
// adding one entry here (plus the matching backend registry entry) — no
// changes to the generic Library/PendingQueue/TaxonomyManager components.
export interface TaxonomyFieldConfig {
  name: string;        // attribute name on the entry (e.g. "authors", "category")
  label: string;       // Kannada display label
  multi: boolean;      // ManyToMany vs single ForeignKey
}

export interface ProjectConfig {
  slug: string;
  apiBase: string;
  name: string;
  titleField: string;          // which entry field is the display title
  taxonomyFields: TaxonomyFieldConfig[];
}

export const PROJECTS: ProjectConfig[] = [
  {
    slug: 'mattukosha',
    apiBase: '/api/v1/mattukosha',
    name: 'Mattukosha',
    titleField: 'name',
    taxonomyFields: [],
  },
  {
    slug: 'pustakakosha',
    apiBase: '/api/v1/pustakakosha',
    name: 'Pustaka Kosha',
    titleField: 'book_name',
    taxonomyFields: [
      { name: 'authors', label: 'ಲೇಖಕ/ಸಂಪಾದಕ', multi: true },
      { name: 'category', label: 'ಪುಸ್ತಕದ ವಿಭಾಗ', multi: false },
      { name: 'publisher', label: 'ಪ್ರಕಾಶಕ', multi: false },
      { name: 'contributors', label: 'ಕೋಶಕ್ಕೆ ಸೇರಿಸಲು ಸಹಕರಿದವರು', multi: true },
    ],
  },
  {
    slug: 'sanghatanakosha',
    apiBase: '/api/v1/sanghatanakosha',
    name: 'Sanghatana Kosha',
    titleField: 'name_of_the_org',
    taxonomyFields: [],
  },
];

export const getProject = (slug?: string): ProjectConfig =>
  PROJECTS.find((p) => p.slug === slug) || PROJECTS[0];

export const DEFAULT_PROJECT_SLUG = 'mattukosha';
