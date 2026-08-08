// External (non-Yakshavahini-monorepo) apps cross-linked from the "other
// projects" footer — currently just the standalone Pratisangraha app. See
// lib/externalAppLink.ts for how `deepLinkHost` is used to open the
// Android app directly when it's installed.
export interface ExternalAppLink {
  key: string;
  name: string;
  nameKannada: string;
  webUrl: string;
  deepLinkHost: string;
  // Which field of the external stats API response (see fetchExternalStats
  // in services/api.ts) this card's count comes from.
  statsField: 'total' | 'unique_kosha_count';
  // Shown if the external stats call fails — a rough, hand-maintained
  // approximation rather than nothing.
  fallbackCount: string;
  cardDescription: (count: number | string) => string;
}

export const EXTERNAL_APPS: ExternalAppLink[] = [
  {
    key: 'prasanga-pratisangraha',
    name: 'Prasanga Pratisangraha',
    nameKannada: 'ಪ್ರಸಂಗಪ್ರತಿ ಸಂಗ್ರಹ',
    webUrl: 'https://prasangapustaka.web.app/',
    deepLinkHost: 'open',
    statsField: 'total',
    fallbackCount: '1500+',
    cardDescription: (n) => `${n} ಪ್ರಸಂಗ ಪುಸ್ತಕಗಳು`,
  },
  {
    key: 'prasanga-kosha',
    name: 'Prasanga Kosha',
    nameKannada: 'ಪ್ರಸಂಗಕೋಶ',
    webUrl: 'https://prasangapustaka.web.app/kosha',
    deepLinkHost: 'kosha',
    statsField: 'unique_kosha_count',
    fallbackCount: '250+',
    cardDescription: (n) => `${n} ಪರಿಷ್ಕೃತ ಪ್ರತಿಗಳು.`,
  },
];
