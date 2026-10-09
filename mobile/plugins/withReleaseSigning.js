// Signs the Android release build with the Arise key, if this computer has it.
// The key and its password never go in the repo: they live in ~/.gradle/gradle.properties
// (ARISE_UPLOAD_STORE_FILE, ARISE_UPLOAD_KEY_ALIAS, ARISE_UPLOAD_STORE_PASSWORD, ARISE_UPLOAD_KEY_PASSWORD).
// Without them, the release build falls back to Expo's default debug key.
const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes('ARISE_UPLOAD_STORE_FILE')) return cfg;
    gradle = gradle.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {
        release {
            if (project.hasProperty('ARISE_UPLOAD_STORE_FILE')) {
                storeFile file(ARISE_UPLOAD_STORE_FILE)
                storePassword ARISE_UPLOAD_STORE_PASSWORD
                keyAlias ARISE_UPLOAD_KEY_ALIAS
                keyPassword ARISE_UPLOAD_KEY_PASSWORD
            }
        }`
    );
    gradle = gradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      `$1signingConfig project.hasProperty('ARISE_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug`
    );
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
