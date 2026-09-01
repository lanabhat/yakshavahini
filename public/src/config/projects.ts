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
  // Additional field names to try, in order, when `linkField` is empty —
  // first non-empty one wins. For a project with more than one candidate
  // document link (e.g. Prasanga Yadi's Kosha link vs Pratisangraha link,
  // both Drive-hosted), rather than one primary link field.
  linkFieldFallbacks?: string[];
  // Which entry field holds a single primary video/broadcast link (as
  // opposed to `youtube_video_links`, an array of supplementary videos).
  // When set, EntryCard/EntryDetail read this field, embed it inline if
  // it's a YouTube URL, and otherwise render a plain "Open ↗" link.
  videoLinkField?: string;
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
  // Text shown on the root ProjectPicker card in place of the English name,
  // given the project's live approved-entry count (from /stats/).
  cardDescription?: (count: number) => string;
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
      { name: 'ragas', label: 'ಹೊಂದುವ ರಾಗಗಳು', kind: 'taxonomy-multi' },
      { name: 'situations', label: 'ಸಂದರ್ಭ ಸೂಕ್ತತೆ', kind: 'taxonomy-multi' },
    ],
    groupFacets: [
      { field: 'type', label: 'ಛಂದಸ್ಸಿನ ವಿಧ' },
    ],
    taxonomyFacets: [
      { field: 'ragas', label: 'ಹೊಂದುವ ರಾಗಗಳು' },
      { field: 'situations', label: 'ಸಂದರ್ಭ ಸೂಕ್ತತೆ' },
    ],
    cardDescription: (n) => `${n} ಮಟ್ಟುಗಳ ವಿವರಗಳು.`,
  },
  {
    slug: 'pustakakosha',
    apiBase: '/api/v1/pustakakosha',
    name: 'Pustaka Kosha',
    nameKannada: 'ಯಕ್ಷಪುಸ್ತಕಕೋಶ',
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
    groupFacets: [
      { field: 'year', label: 'ಪ್ರಕಾಶನ ಕಾಲ' },
    ],
    taxonomyFacets: [
      { field: 'category', label: 'ಪುಸ್ತಕದ ವಿಭಾಗ' },
      { field: 'publisher', label: 'ಪ್ರಕಾಶಕ' },
      { field: 'authors', label: 'ಲೇಖಕ/ಸಂಪಾದಕ' },
    ],
    cardDescription: (n) => `${n} ಯಕ್ಷಗಾನ ಪುಸ್ತಕಗಳ ವಿದ್ಯುನ್ಮಾನ ಪ್ರತಿಗಳು`,
  },
  {
    slug: 'sanghatanakosha',
    apiBase: '/api/v1/sanghatanakosha',
    name: 'Sanghatana Kosha',
    nameKannada: 'ಯಕ್ಷಸಂಘಟನಾ ಕೋಶ',
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
    cardDescription: (n) => `${n} ಸಂಘಟನೆಗಳ ವಿವರ`,
  },
  {
    slug: 'drishyashravyakosha',
    apiBase: '/api/v1/drishyashravyakosha',
    name: 'Drishya-Kavya Sanchaya',
    nameKannada: 'ದೃಶ್ಯ-ಕಾವ್ಯ ಸಂಚಯ',
    active: true,
    titleField: 'subject',
    videoLinkField: 'video_link',
    cardSubtitleField: 'event_type',
    dateKannadaField: 'date_kannada',
    dateEnglishField: 'date_english',
    displayFields: [
      { name: 'event_type', label: 'ಕಾರ್ಯಕ್ರಮ', kind: 'text' },
      { name: 'details', label: 'ವಿವರಗಳು', kind: 'text' },
      { name: 'presenters', label: 'ಉಪನ್ಯಾಸಕರು', kind: 'taxonomy-multi' },
    ],
    groupFacets: [
      { field: 'event_type', label: 'ಕಾರ್ಯಕ್ರಮ' },
    ],
    taxonomyFacets: [
      { field: 'presenters', label: 'ಉಪನ್ಯಾಸಕರು' },
    ],
    cardDescription: (n) => `${n} ಅಂತರ್ಜಾಲ ಪ್ರಸಾರ ಕಾರ್ಯಕ್ರಮಗಳ ವಿವರ`,
  },
  {
    slug: 'prasangayadi',
    apiBase: '/api/v1/prasangayadi',
    name: 'Prasanga Yadi',
    nameKannada: 'ಪ್ರಸಂಗಯಾದಿ',
    active: true,
    titleField: 'prasanga_name',
    linkField: 'prasanga_kosha_link',
    linkFieldFallbacks: ['pratisangraha_link'],
    displayFields: [
      { name: 'unique_number', label: 'ಅನನ್ಯ ಸಂಖ್ಯೆ', kind: 'text' },
      { name: 'type', label: 'ವಿಧ', kind: 'text' },
      { name: 'publish_status', label: 'ಪ್ರಕಟಿತವೇ?', kind: 'text' },
      { name: 'prasanga_type', label: 'ಪ್ರಸಂಗ ವಿಧ', kind: 'text' },
      { name: 'prasanga_language', label: 'ಪ್ರಸಂಗ ಭಾಷೆ', kind: 'text' },
      { name: 'story_source', label: 'ಆಧಾರ ಗ್ರಂಥ', kind: 'text' },
      { name: 'kavi', label: 'ಪ್ರಸಂಗ ಕವಿ', kind: 'taxonomy-multi' },
    ],
    groupFacets: [
      { field: 'type', label: 'ವಿಧ' },
      { field: 'publish_status', label: 'ಪ್ರಕಟಿತವೇ?' },
      { field: 'prasanga_type', label: 'ಪ್ರಸಂಗ ವಿಧ' },
      { field: 'prasanga_language', label: 'ಪ್ರಸಂಗ ಭಾಷೆ' },
      { field: 'story_source', label: 'ಆಧಾರ ಗ್ರಂಥ' },
    ],
    taxonomyFacets: [
      { field: 'kavi', label: 'ಪ್ರಸಂಗ ಕವಿ' },
    ],
    cardDescription: (n) => `${n} ಯಕ್ಷಗಾನ ಪ್ರಸಂಗಗಳ ಪಟ್ಟಿ`,
  },
];

export const getProject = (slug?: string): ProjectConfig | undefined =>
  PROJECTS.find((p) => p.slug === slug);
