# App de Inventario (PWA móvil)

Aplicación web instalable en el celular para registrar productos por código de barras,
consultarlos y hacer inventarios. Todo se guarda **en el propio teléfono** (IndexedDB) y funciona sin internet
después de la primera carga.

- URL: `https://<tu-dominio>/inventario`
- Instalar: en Android/Chrome → menú ⋮ → "Instalar aplicación" / "Agregar a pantalla principal".
  En iPhone/Safari → Compartir → "Agregar a inicio".
- La cámara solo funciona en HTTPS (o `localhost`).

Módulos: Registrar (código, nombre, costo, venta, foto), Consultar (escanear, editar, eliminar, lista con buscador)
e Inventario (escanear, cantidad, total por producto, total general, limpiar todo, descargar PDF).

Librerías incluidas en `vendor/`: html5-qrcode 2.3.8, jsPDF 2.5.2, jspdf-autotable 3.8.4.
