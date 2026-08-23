# Yakshavahini — Android (Trusted Web Activity)

Wraps the public app (`../public`, live at https://yakshavahini.web.app) as a
Trusted Web Activity using [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).
A TWA is a thin Android shell around the PWA — no separate UI code to
maintain, it just opens the deployed site full-screen (no browser chrome,
once Digital Asset Links below is verified).

## ⚠️ Signing key — TEST KEY, not for Play Store release

`android.keystore` in this folder (gitignored, never committed) was generated
with a throwaway password (`yakshavahini123`) purely to get a working build.
**Before publishing to Play Store**, generate a real release key with a
password stored somewhere safe (password manager) — losing it means you can
never update the published app again:

```powershell
$env:JAVA_HOME = "E:\Java\jdk-17.0.10+7"
& "E:\Java\jdk-17.0.10+7\bin\keytool.exe" -genkeypair -v -keystore android-release.keystore `
  -alias android -keyalg RSA -keysize 2048 -validity 10000 `
  -dname "CN=Yakshavahini, OU=Yakshavahini, O=Yakshavahini, L=, ST=, C=IN"
```

(In practice, if you enroll in **Play App Signing** — the default Google
recommends — Google re-signs the app with its own key after upload, and only
your *upload* key needs this level of care. Either way, don't reuse the test
key above for anything real.)

## Requirements (already installed on this machine — do not reinstall)

- Android SDK at `E:\Android` (build-tools 36.1.0 was added on top of the
  existing 34.0.0/35.0.0 — Bubblewrap requires that exact version)
- JDK 17 at `E:\Java\jdk-17.0.10+7`
- A `E:\Android\tools` junction pointing at `cmdline-tools\latest` — Bubblewrap's
  SDK path validation only recognizes the legacy `tools/` or `bin/` layout;
  the junction satisfies that without moving/duplicating anything.
- `~/.bubblewrap/config.json` pointing at both of the above (see that file to
  confirm paths if this ever needs to run on another machine).

## Rebuilding

Interactive `bubblewrap build`/`bubblewrap init` don't work reliably from a
non-TTY shell (inquirer prompts break under piped stdin) — use the
non-interactive driver script instead, and run gradle steps from a real
PowerShell/cmd shell (Git Bash fails to invoke `gradlew.bat` — path
resolution issue with MSYS, not a project problem).

1. Regenerate `twa-manifest.json` if the web manifest changed (name, icons,
   colors, etc. — pulls from the live `https://yakshavahini.web.app/manifest.webmanifest`):
   ```
   node -e "require('@bubblewrap/core').TwaManifest.fromWebManifest('https://yakshavahini.web.app/manifest.webmanifest').then(m => { m.packageId = 'com.yakshavahini.app'; m.launcherName = 'Yakshavahini'; m.signingKey = { path: './android.keystore', alias: 'android' }; return m.saveToFile('./twa-manifest.json'); })"
   ```
2. Regenerate the Android project + build unsigned APK/bundle:
   ```powershell
   $env:BUBBLEWRAP_KEYSTORE_PASSWORD = "..."
   $env:BUBBLEWRAP_KEY_PASSWORD = "..."
   node do-build.js
   ```
   This calls Bubblewrap's own project generator + `gradlew.bat assembleRelease`/`bundleRelease`
   directly via its core API, skipping the interactive CLI wrapper entirely.
3. If gradle steps fail from Bash, fall back to running them manually in
   PowerShell with `JAVA_HOME`/`ANDROID_HOME`/`ANDROID_SDK_ROOT` set to the
   paths above, then zipalign + `apksigner sign` / `jarsigner` by hand (see
   git history of this README's commit for the exact commands used the first
   time).

## Digital Asset Links

`../public/public/.well-known/assetlinks.json` declares this app's signing
certificate to Chrome, so the TWA opens without a URL bar (otherwise it falls
back to a Custom Tab with visible browser chrome). **This currently has the
TEST key's fingerprint** — once you generate a real release key (or enroll in
Play App Signing, which issues its own), regenerate this file with the new
SHA-256 fingerprint:

```powershell
& "E:\Java\jdk-17.0.10+7\bin\keytool.exe" -list -v -keystore <your-keystore> -alias android
```

and redeploy the public app so the updated `assetlinks.json` goes live.

## Package name

`com.yakshavahini.app` — permanent once published to Play Store, don't change
it later without effectively shipping a new app.

## Next steps toward a Play Store listing

1. Generate the real release key (above) and update `assetlinks.json`.
2. Create an app in Google Play Console, enroll in Play App Signing.
3. Upload `app-release-bundle.aab` (App Bundle, not the APK — Play Store wants `.aab`).
4. Fill in store listing (screenshots, description, privacy policy URL, content rating).
5. Internal testing track first, then production rollout.
