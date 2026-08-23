const path = require('path');
const fs = require('fs');
const {
  TwaManifest, TwaGenerator, Config, JdkHelper, AndroidSdkTools,
  GradleWrapper, JarSigner, ConsoleLog, BufferedLog,
} = require('@bubblewrap/core');

const KEYSTORE_PASSWORD = process.env.BUBBLEWRAP_KEYSTORE_PASSWORD;
const KEY_PASSWORD = process.env.BUBBLEWRAP_KEY_PASSWORD;
if (!KEYSTORE_PASSWORD || !KEY_PASSWORD) {
  console.error('Set BUBBLEWRAP_KEYSTORE_PASSWORD / BUBBLEWRAP_KEY_PASSWORD env vars first.');
  process.exit(1);
}

(async () => {
  const targetDirectory = process.cwd();
  const log = new ConsoleLog('build');

  const config = await Config.loadConfig(path.join(require('os').homedir(), '.bubblewrap', 'config.json'));
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = await AndroidSdkTools.create(process, config, jdkHelper, log);
  const gradleWrapper = new GradleWrapper(process, androidSdkTools);
  const jarSigner = new JarSigner(jdkHelper);

  const twaManifest = await TwaManifest.fromFile(path.join(targetDirectory, 'twa-manifest.json'));

  console.log('Generating Android project...');
  const twaGenerator = new TwaGenerator();
  const bufLog = new BufferedLog(log);
  await twaGenerator.createTwaProject(targetDirectory, twaManifest, bufLog);
  bufLog.flush();

  console.log('Building APK (assembleRelease)...');
  await gradleWrapper.assembleRelease();

  const APK_BUILD_OUTPUT = './app/build/outputs/apk/release/app-release-unsigned.apk';
  const APK_ALIGNED = './app-release-unsigned-aligned.apk';
  const APK_SIGNED = './app-release-signed.apk';
  await androidSdkTools.zipalignOnlyVerification(APK_BUILD_OUTPUT);
  fs.copyFileSync(APK_BUILD_OUTPUT, APK_ALIGNED);

  console.log('Signing APK...');
  await androidSdkTools.apksigner(
    twaManifest.signingKey.path, `"${KEYSTORE_PASSWORD}"`, twaManifest.signingKey.alias,
    `"${KEY_PASSWORD}"`, APK_ALIGNED, APK_SIGNED,
  );

  console.log('Building App Bundle (bundleRelease)...');
  await gradleWrapper.bundleRelease();

  const AAB_BUILD_OUTPUT = './app/build/outputs/bundle/release/app-release.aab';
  const AAB_SIGNED = './app-release-bundle.aab';
  console.log('Signing App Bundle...');
  await jarSigner.sign(
    twaManifest.signingKey, `"${KEYSTORE_PASSWORD}"`, `"${KEY_PASSWORD}"`,
    AAB_BUILD_OUTPUT, AAB_SIGNED,
  );

  console.log('DONE');
  console.log('APK:', APK_SIGNED);
  console.log('AAB:', AAB_SIGNED);
})().catch((e) => { console.error('BUILD FAILED:', e); process.exit(1); });
