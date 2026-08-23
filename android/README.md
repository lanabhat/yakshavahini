# Yakshavahini — Android (Trusted Web Activity)

Wraps the public app (`../public`, live at https://yakshavahini.web.app) as a
Trusted Web Activity using [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap).
A TWA is a thin Android shell around the PWA — no separate UI code to
maintain, it just opens the deployed site full-screen (no browser chrome,
once Digital Asset Links below is verified).

## Signing key

`android-release.keystore` in this folder (gitignored, never committed) is
the real release key — generated once, alias `android`. **The password is
not stored anywhere in this repo or in chat history beyond the message it was
shared in** — make sure it's saved in a password manager now if it isn't
already. Losing it means the app can never be updated again after
publishing, only replaced under a new package name.

(If you later enroll in **Play App Signing** — the default Google
recommends — Google re-signs the app with its own key after your first
upload, and `assetlinks.json` would need updating again with that key's
fingerprint. Until then, this is the key of record.)

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
   node -e "require('@bubblewrap/core').TwaManifest.fromWebManifest('https://yakshavahini.web.app/manifest.webmanifest').then(m => { m.packageId = 'com.yakshavahini.app'; m.launcherName = 'Yakshavahini'; m.signingKey = { path: './android-release.keystore', alias: 'android' }; return m.saveToFile('./twa-manifest.json'); })"
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
back to a Custom Tab with visible browser chrome). Currently carries the
release key's fingerprint (`65:38:A4:0C:...:C8:7D:95`). If the signing key
ever changes (e.g. enrolling in Play App Signing later), regenerate this
file with the new SHA-256 fingerprint:

```powershell
& "E:\Java\jdk-17.0.10+7\bin\keytool.exe" -list -v -keystore <your-keystore> -alias android
```

and redeploy the public app so the updated `assetlinks.json` goes live.

## Package name

`com.yakshavahini.app` — permanent once published to Play Store, don't change
it later without effectively shipping a new app.

## Next steps toward a Play Store listing

1. ~~Generate the real release key and update `assetlinks.json`.~~ Done.
2. Create an app in Google Play Console, enroll in Play App Signing.
3. Upload `app-release-bundle.aab` (App Bundle, not the APK — Play Store wants `.aab`).
4. Fill in store listing (screenshots, description, privacy policy URL, content rating).
5. Internal testing track first, then production rollout.
