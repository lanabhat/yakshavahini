export interface DisplayField {
  name: string;
  label: string;
  kind: 'text' | 'taxonomy-single' | 'taxonomy-multi' | 'link' | 'date';
}

export interface FacetDef {
  field: string;
  label: string;
}

export interface ProjectConfig {
  slug: string;
  apiBase: string;
  name: string;
  nameKannada: string;
  // Whether this project has a real backend app wired up yet — inactive
  // projects still show on the picker (so the intended lineup is visible)
  // but aren't clickable.
  active: boolean;
  titleField: string;
  // Which entry field holds the primary document link. Defaults to
  // "pdf_link" (Mattukosha/Pustaka Kosha's convention) when unset.
  linkField?: string;
  // A short scalar/taxonomy-single field shown under the title on
  // EntryCard (e.g. Mattukosha's "type", Pustaka Kosha's "category").
  cardSubtitleField?: string;
  dateKannadaField?: string;
  dateEnglishField?: string;
  // Fields EntryDetail renders generically for this project (beyond the
  // title/notes/link/video sections every project already gets).
  displayFields: DisplayField[];
  // Scalar facet browsing (EntryGroupsView) — plain text fields, e.g.
  // Mattukosha's type/ragas/situations.
  groupFacets: FacetDef[];
  // Taxonomy-table facet browsing (TaxonomyListCreateView) — FK/M2M fields,
  // e.g. Pustaka Kosha's category/publisher/authors.
  taxonomyFacets: FacetDef[];
}

export const PROJECTS: ProjectConfig[] = [
  {
    slug: 'mattukosha',
    apiBase: '/api/v1/mattukosha',
    name: 'Mattukosha',
    nameKannada: 'ಮಟ್ಟುಕೋಶ',
    active: true,
    titleField: 'name',
    cardSubtitleField: 'type',
    dateKannadaField: 'date_kannada',
    dateEnglishField: 'date_english',
    displayFields: [
      { name: 'type', label: 'ಛಂದಸ್ಸಿನ ವಿಧ', kind: 'text' },
      { name: 'ragas', label: 'ಹೊಂದುವ ರಾಗಗಳು', kind: 'text' },
      { name: 'situations', label: 'ಸಂದರ್ಭ ಸೂಕ್ತತೆ', kind: 'text' },
    ],
    groupFacets: [
      { field: 'type', label: 'ಛಂದಸ್ಸಿನ ವಿಧ' },
      { field: 'ragas', label: 'ಹೊಂದುವ ರಾಗಗಳು' },
      { field: 'situations', label: 'ಸಂದರ್ಭ ಸೂಕ್ತತೆ' },
    ],
    taxonomyFacets: [],
  },
  {
    slug: 'pustakakosha',
    apiBase: '/api/v1/pustakakosha',
    name: 'Pustaka Kosha',
    nameKannada: 'ಪುಸ್ತಕಕೋಶ',
    active: true,
    titleField: 'book_name',
    cardSubtitleField: 'category',
    dateKannadaField: 'date_added',
    dateEnglishField: 'date_added_english',
    displayFields: [
      { name: 'details', label: 'ವಿವರಗಳು', kind: 'text' },
      { name: 'authors', label: 'ಲೇಖಕ/ಸಂಪಾದಕ', kind: 'taxonomy-multi' },
      { name: 'category', label: 'ಪುಸ್ತಕದ ವಿಭಾಗ', kind: 'taxonomy-single' },
      { name: 'publisher', label: 'ಪ್ರಕಾಶಕ', kind: 'taxonomy-single' },
      { name: 'version', label: 'ಆವೃತ್ತಿ', kind: 'text' },
      { name: 'year', label: 'ಪ್ರಕಾಶನ ಕಾಲ', kind: 'text' },
      { name: 'isbn', label: 'ಪುಸ್ತಕದ ಐ.ಎಸ್.ಬಿ.ಎನ್', kind: 'text' },
      { name: 'contributors', label: 'ಕೋಶಕ್ಕೆ ಸೇರಿಸಲು ಸಹಕರಿದವರು', kind: 'taxonomy-multi' },
      { name: 'summary', label: 'ಸಾರಾಂಶ', kind: 'text' },
      { name: 'more_details', label: 'ಹೆಚ್ಚಿನ ವಿವರ', kind: 'text' },
    ],
    groupFacets: [],
    taxonomyFacets: [
      { field: 'category', label: 'ಪುಸ್ತಕದ ವಿಭಾಗ' },
      { field: 'publisher', label: 'ಪ್ರಕಾಶಕ' },
      { field: 'authors', label: 'ಲೇಖಕ/ಸಂಪಾದಕ' },
    ],
  },
  {
    slug: 'sanghatanakosha',
    apiBase: '/api/v1/sanghatanakosha',
    name: 'Sanghatana Kosha',
    nameKannada: 'ಸಂಘಟನಾಕೋಶ',
    active: true,
    titleField: 'name_of_the_org',
    linkField: 'details_pdf',
    cardSubtitleField: 'type_of_org',
    displayFields: [
      { name: 'type_of_org', label: 'ಸಂಘಟನೆಯ ವಿಧ', kind: 'text' },
      { name: 'yakshagana_category', label: 'ಯಕ್ಷಗಾನ ಪ್ರಬೇಧ', kind: 'text' },
      { name: 'yakshagana_sub_category', label: 'ಯಕ್ಷಗಾನ ಉಪ ಪ್ರಬೇಧ', kind: 'text' },
      { name: 'estabishment_date', label: 'ಸ್ಥಾಪನೆ ವರ್ಷ', kind: 'text' },
      { name: 'state_of_the_est', label: 'ಚೌಕಟ್ಟು / ಅಸ್ತಿತ್ವ', kind: 'text' },
      { name: 'head_quarter', label: 'ಪ್ರಧಾನ ಕಛೇರಿಯ ಸ್ಥಳ', kind: 'text' },
    ],
    groupFacets: [
      { field: 'type_of_org', label: 'ಸಂಘಟನೆಯ ವಿಧ' },
      { field: 'yakshagana_category', label: 'ಯಕ್ಷಗಾನ ಪ್ರಬೇಧ' },
      { field: 'yakshagana_sub_category', label: 'ಯಕ್ಷಗಾನ ಉಪ ಪ್ರಬೇಧ' },
    ],
    taxonomyFacets: [],
  },
];

export const getProject = (slug?: string): ProjectConfig | undefined =>
  PROJECTS.find((p) => p.slug === slug);
