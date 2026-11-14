#!/usr/bin/env bash
# Builds the Android app from the web game with Capacitor 8 (target SDK 36, as Google Play requires from Aug 31, 2026).
#   tools/android/build.sh test     -> debug APK signed with the public test key (tools/android/test.keystore)
#   tools/android/build.sh release  -> Play Store app bundle (.aab) signed with the private upload key, levels locked
# Release needs these environment variables (GitHub Actions secrets):
#   ANDROID_KEYSTORE_B64  the upload keystore, base64     ANDROID_KEYSTORE_PASSWORD
#   ANDROID_KEY_ALIAS                                     ANDROID_KEY_PASSWORD
# BUILD_NUMBER sets the versionCode (must go up with every upload to Play).
set -euo pipefail
MODE=${1:-test}
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
B="$ROOT/build"
rm -rf "$B"; mkdir -p "$B/www"
cp -r "$ROOT"/index.html "$ROOT"/css "$ROOT"/js "$ROOT"/assets "$ROOT"/vendor "$ROOT"/icons "$B/www/"
if [ "$MODE" = release ]; then
  # store builds unlock levels in order
  sed -i 's/UNLOCK_ALL: true/UNLOCK_ALL: false/' "$B/www/js/config.js"
  grep -q 'UNLOCK_ALL: false' "$B/www/js/config.js"
fi
cd "$B"
npm init -y >/dev/null
npm install --no-audit --no-fund @capacitor/core@8 @capacitor/cli@8 @capacitor/android@8
npx cap init "Tide Tossers" com.swipefinch.tidetossers --web-dir www
npx cap add android
A=android/app/src/main
cp "$ROOT/tools/android/MainActivity.java" $A/java/com/swipefinch/tidetossers/MainActivity.java
# landscape only, vibration allowed
sed -i 's|<activity|<activity android:screenOrientation="sensorLandscape"|' $A/AndroidManifest.xml
sed -i 's|<application|<uses-permission android:name="android.permission.VIBRATE" />\n    <application|' $A/AndroidManifest.xml
# app icon: the game's icon at every density
rm -rf $A/res/mipmap-anydpi-v26
for d in $A/res/mipmap-*; do cp "$ROOT/icons/icon-192.png" $d/ic_launcher.png; cp "$ROOT/icons/icon-192.png" $d/ic_launcher_round.png; rm -f $d/ic_launcher_foreground.png; done
# version: name from the game, code from the build number
V=$(grep -o "TT.VERSION = '[^']*'" "$ROOT/js/config.js" | cut -d"'" -f2 | tr -d v)
N=${BUILD_NUMBER:-1}
sed -i -E "s/versionCode [0-9]+/versionCode ${N}/; s/versionName \"[^\"]*\"/versionName \"${V}.${N}\"/" android/app/build.gradle
grep -q "versionCode ${N}" android/app/build.gradle
npx cap sync android
if [ "$MODE" = release ]; then
  echo "$ANDROID_KEYSTORE_B64" | base64 -d > "$B/upload.keystore"
  cat >> android/app/build.gradle <<GRADLE

android {
    signingConfigs {
        release {
            storeFile file("$B/upload.keystore")
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes { release { signingConfig signingConfigs.release } }
}
GRADLE
  (cd android && ./gradlew --no-daemon bundleRelease)
  cp android/app/build/outputs/bundle/release/app-release.aab "$ROOT/TideTossers.aab"
  rm -f "$B/upload.keystore"
else
  # every test build uses the same public test key, so a new build installs over the last one
  cat >> android/app/build.gradle <<GRADLE

android {
    signingConfigs {
        debug {
            storeFile file("$ROOT/tools/android/test.keystore")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
    }
}
GRADLE
  (cd android && ./gradlew --no-daemon assembleDebug)
  cp android/app/build/outputs/apk/debug/app-debug.apk "$ROOT/TideTossers.apk"
fi
