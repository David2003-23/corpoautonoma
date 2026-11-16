# Inventario — APK para Android

Versión instalable (APK) de la app de `public/inventario`. Usa la misma interfaz web dentro de un WebView
y agrega acceso nativo a la cámara (escáner y fotos) y guardado del PDF en **Descargas**.

- APK listo: `release/Inventario.apk` (Android 7.0 o superior).
- Compilar de nuevo (Ubuntu/Debian): `./build.sh`. Las herramientas están indicadas al inicio del script.

`inventario.keystore` es la llave con la que se firma el APK (contraseña en `build.sh`). **No la borres**:
las actualizaciones de la app deben firmarse con la misma llave; si cambia, Android obliga a desinstalar
la versión anterior y se perderían los datos guardados en el teléfono.
