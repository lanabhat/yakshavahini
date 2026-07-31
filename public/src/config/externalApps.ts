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
}

export const EXTERNAL_APPS: ExternalAppLink[] = [
  {
    key: 'prasanga-pratisangraha',
    name: 'Prasanga Pratisangraha',
    nameKannada: 'ಪ್ರಸಂಗ ಪ್ರತಿಸಂಗ್ರಹ',
    webUrl: 'https://prasangapustaka.web.app/',
    deepLinkHost: 'open',
  },
  {
    key: 'prasanga-kosha',
    name: 'Prasanga Kosha',
    nameKannada: 'ಪ್ರಸಂಗ ಕೋಶ',
    webUrl: 'https://prasangapustaka.web.app/kosha',
    deepLinkHost: 'kosha',
  },
];
