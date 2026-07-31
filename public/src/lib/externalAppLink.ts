// Opens the standalone Pratisangraha Android app (package
// prasanga.prati.sangraha) when it's installed, falling back to its web
// site otherwise. Uses Android's `intent://` URI scheme with
// `S.browser_fallback_url` — Chrome resolves this against any installed app
// declaring a matching custom-scheme intent-filter (see that app's
// AndroidManifest.xml) without needing Android App Links / domain
// verification, and falls back to the given URL in the same navigation if
// no such app is installed.
const ANDROID_APP_PACKAGE = 'prasanga.prati.sangraha';
const ANDROID_APP_SCHEME = 'prasangapratisangraha';

export const isAndroid = () => /android/i.test(navigator.userAgent);

export function openExternalApp(deepLinkHost: string, fallbackUrl: string) {
  if (isAndroid()) {
    window.location.href =
      `intent://${deepLinkHost}#Intent;scheme=${ANDROID_APP_SCHEME};package=${ANDROID_APP_PACKAGE};` +
      `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
  } else {
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  }
}
