#!/usr/bin/env bash
# Compila el APK de Inventario sin Gradle, usando las herramientas de Android de Ubuntu:
#   sudo apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 openjdk-17-jdk
# Uso: ./build.sh   → genera release/Inventario.apk
set -euo pipefail
cd "$(dirname "$0")"

ANDROID_JAR=${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
KEYSTORE=inventario.keystore
KS_PASS=${KS_PASS:-inventario123}
WEB=../public/inventario

rm -rf build && mkdir -p build/gen build/obj build/assets/web release

# 1. App web (misma que /inventario)
cp -r "$WEB"/index.html "$WEB"/styles.css "$WEB"/app.js "$WEB"/manifest.webmanifest "$WEB"/icons "$WEB"/vendor build/assets/web/

# 2. Recursos → R.java
aapt package -f -m -J build/gen -M AndroidManifest.xml -S res -I "$ANDROID_JAR"

# 3. Java → .class → classes.dex
javac -nowarn -Xlint:-options -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -d build/obj \
  $(find src build/gen -name '*.java')
dalvik-exchange --dex --min-sdk-version=24 --output=build/classes.dex build/obj

# 4. Empaquetar, alinear y firmar
aapt package -f -M AndroidManifest.xml -S res -A build/assets -I "$ANDROID_JAR" -F build/unsigned.apk
(cd build && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f 4 build/unsigned.apk build/aligned.apk

if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -keystore "$KEYSTORE" -storetype PKCS12 -alias inventario -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass "$KS_PASS" -keypass "$KS_PASS" -dname "CN=Inventario, O=Corpoautonoma, C=CO"
fi
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$KS_PASS" --out release/Inventario.apk build/aligned.apk
apksigner verify --print-certs release/Inventario.apk | head -1
rm -f release/Inventario.apk.idsig
ls -lh release/Inventario.apk
