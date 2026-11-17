/* Inventario — registro, consulta e inventario por código de barras.
 * Todo se guarda en el propio teléfono (IndexedDB); no requiere servidor. */
(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2, minimumFractionDigits: 0 });
  const num = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
  const numQty = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 3 });
  const fmtMoney = (v) => money.format(Number(v) || 0);
  const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
  const round3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
  const fmtQty = (q, unit) => `${numQty.format(round3(q))} ${unit === "Kg" ? "Kg" : "U"}`;
  const qtyInputValue = (q) => numQty.format(round3(q)).replace(/\./g, "");
  const unitOf = (x) => (x && x.unit === "Kg" ? "Kg" : "U");
  const perUnit = (unit) => (unit === "Kg" ? "por Kg" : "por unidad");

  /** Convierte "12.500" o "12500" en 12500 (pesos enteros). */
  const parseMoney = (s) => Number(String(s ?? "").replace(/\D/g, "")) || 0;
  /** Convierte "2,5" o "2.5" en 2.5 */
  const parseQty = (s) => {
    const n = Number(String(s ?? "").trim().replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const cleanCode = (s) => String(s ?? "").trim();
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /** Minúsculas y sin tildes, para buscar "cafe" y encontrar "Café". */
  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const fmtBytes = (b) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 ** 2) return `${num.format(round2(b / 1024))} KB`;
    if (b < 1024 ** 3) return `${num.format(round2(b / 1024 ** 2))} MB`;
    return `${num.format(round2(b / 1024 ** 3))} GB`;
  };
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || "U";
  const setRadio = (name, value) => {
    const r = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (r) r.checked = true;
  };
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
  };

  let toastTimer;
  function toast(msg, kind = "") {
    const t = $("toast");
    t.textContent = msg;
    t.className = `toast show ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = "toast"), 2600);
  }

  function confirmDialog(text, yesLabel = "Sí, continuar") {
    return new Promise((resolve) => {
      const box = $("confirm");
      $("confirmText").textContent = text;
      $("confirmYes").textContent = yesLabel;
      box.hidden = false;
      const done = (v) => {
        box.hidden = true;
        $("confirmYes").onclick = $("confirmNo").onclick = box.onclick = null;
        resolve(v);
      };
      $("confirmYes").onclick = () => done(true);
      $("confirmNo").onclick = () => done(false);
      box.onclick = (e) => e.target === box && done(false);
    });
  }

  function feedback() {
    try { navigator.vibrate?.(60); } catch { /* sin vibración */ }
    try {
      const ctx = (feedback.ctx ||= new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 1150;
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.13);
    } catch { /* sin sonido */ }
  }

  // ---------------------------------------------------------------------------
  // Base de datos local (IndexedDB)
  // ---------------------------------------------------------------------------
  const DB_NAME = "inventario-db";
  let dbPromise;
  function db() {
    return (dbPromise ||= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains("products")) d.createObjectStore("products", { keyPath: "barcode" });
        if (!d.objectStoreNames.contains("inventory")) d.createObjectStore("inventory", { keyPath: "barcode" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }
  async function tx(store, mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      const s = t.objectStore(store);
      let result;
      const r = fn(s);
      if (r && "onsuccess" in r) r.onsuccess = () => (result = r.result);
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  const store = (name) => ({
    get: (k) => tx(name, "readonly", (s) => s.get(k)),
    all: () => tx(name, "readonly", (s) => s.getAll()),
    keys: () => tx(name, "readonly", (s) => s.getAllKeys()),
    count: () => tx(name, "readonly", (s) => s.count()),
    put: (v) => tx(name, "readwrite", (s) => s.put(v)),
    putMany: (list) => tx(name, "readwrite", (s) => { list.forEach((v) => s.put(v)); }),
    del: (k) => tx(name, "readwrite", (s) => s.delete(k)),
    clear: () => tx(name, "readwrite", (s) => s.clear()),
    replace: (oldKey, v) => tx(name, "readwrite", (s) => { if (oldKey !== v.barcode) s.delete(oldKey); return s.put(v); }),
  });
  const Products = store("products");
  const Inventory = store("inventory");

  // Pedir almacenamiento persistente para que el navegador no borre los datos.
  navigator.storage?.persist?.().catch(() => {});

  // Índice en memoria de productos (sin fotos) para búsquedas rápidas por nombre.
  let productIndex = null;
  async function getIndex() {
    if (productIndex) return productIndex;
    const all = await Products.all();
    productIndex = all
      .map((p) => ({ barcode: p.barcode, name: p.name, n: norm(p.name), cost: p.cost, price: p.price, unit: unitOf(p) }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    return productIndex;
  }
  const invalidateIndex = () => (productIndex = null);

  function searchIndex(index, q, limit = 8) {
    const nq = norm(q);
    if (!nq) return [];
    const words = nq.split(/\s+/);
    const out = [];
    for (const p of index) {
      if (p.barcode.includes(nq) || words.every((w) => p.n.includes(w))) {
        out.push(p);
        if (out.length >= limit) break;
      }
    }
    // Primero los que empiezan con lo escrito
    return out.sort((a, b) => (b.n.startsWith(nq) ? 1 : 0) - (a.n.startsWith(nq) ? 1 : 0));
  }

  // ---------------------------------------------------------------------------
  // Fotos: se guardan como imagen comprimida (Blob) y se muestran con URLs locales
  // ---------------------------------------------------------------------------
  const PHOTO_MAX_SIDE = 640;
  const PHOTO_QUALITY = 0.72;
  const photoUrls = new Map(); // barcode -> { key, url }

  function photoSrc(p) {
    if (!p?.photo) return "";
    if (typeof p.photo === "string") return p.photo; // foto antigua (texto)
    const key = `${p.updatedAt}|${p.photo.size}`;
    const cached = photoUrls.get(p.barcode);
    if (cached?.key === key) return cached.url;
    if (cached) URL.revokeObjectURL(cached.url);
    const url = URL.createObjectURL(p.photo);
    photoUrls.set(p.barcode, { key, url });
    return url;
  }
  const photoBytes = (photo) => (!photo ? 0 : typeof photo === "string" ? Math.round(photo.length * 0.75) : photo.size || 0);

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  const canvasToBlob = (c, type, q) => new Promise((r) => c.toBlob(r, type, q));

  /** Reduce la imagen a 640 px y la guarda en WebP (o JPEG si el equipo no soporta WebP). */
  async function compressImage(source) {
    const isBlob = source instanceof Blob;
    const url = isBlob ? URL.createObjectURL(source) : source;
    try {
      const img = await loadImage(url);
      const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      let blob = await canvasToBlob(c, "image/webp", PHOTO_QUALITY);
      if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(c, "image/jpeg", PHOTO_QUALITY);
      if (!blob) throw new Error("No se pudo comprimir");
      return blob;
    } finally {
      if (isBlob) URL.revokeObjectURL(url);
    }
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }
  function dataURLToBlob(dataUrl) {
    const [head, b64] = dataUrl.split(",");
    const type = (head.match(/data:([^;]+)/) || [])[1] || "image/jpeg";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type });
  }

  // ---------------------------------------------------------------------------
  // Guardar archivos (PDF y copias): descarga en el navegador o nativo en la app Android
  // ---------------------------------------------------------------------------
  const isAndroidApp = !!window.AndroidApp?.fileBegin;

  /** parts: textos o Blobs. action: "view" (abrir) o "share" (compartir) en Android. */
  async function saveFile(parts, fileName, mime, action, onProgress) {
    if (isAndroidApp) {
      const id = window.AndroidApp.fileBegin(fileName, mime);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (typeof part === "string") window.AndroidApp.fileAppendText(id, part);
        else window.AndroidApp.fileAppendBase64(id, (await blobToDataURL(part)).split(",")[1] || "");
        onProgress?.((i + 1) / parts.length);
        if (i % 20 === 0) await new Promise((r) => setTimeout(r)); // no congelar la pantalla
      }
      window.AndroidApp.fileEnd(id, action);
      return;
    }
    const blob = new Blob(parts, { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  // ---------------------------------------------------------------------------
  // Navegación
  // ---------------------------------------------------------------------------
  const TITLES = { registrar: "Registrar producto", consultar: "Consultar", inventario: "Inventario", datos: "Datos y respaldo" };
  let currentView = "registrar";
  function showView(name) {
    currentView = name;
    closeSuggest();
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
    $("viewTitle").textContent = name === "registrar" && $("editingId").value ? "Editar producto" : TITLES[name];
    window.scrollTo({ top: 0 });
    if (name === "consultar") renderProductList();
    if (name === "inventario") renderInventory();
    if (name === "datos") renderStorage();
  }
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));

  // ---------------------------------------------------------------------------
  // Escáner de código de barras (cámara)
  // ---------------------------------------------------------------------------
  let scanner = null;
  let scanCallback = null;
  let scanning = false;

  async function openScanner(onCode) {
    if (!window.Html5Qrcode) return toast("El escáner aún se está cargando, intenta de nuevo", "err");
    closeSuggest();
    scanCallback = onCode;
    $("scanner").hidden = false;
    $("scanMsg").textContent = "Iniciando cámara…";
    const F = window.Html5QrcodeSupportedFormats;
    scanner ||= new Html5Qrcode("reader", {
      verbose: false,
      useBarCodeDetectorIfSupported: true,
      formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.UPC_EAN_EXTENSION, F.CODE_128, F.CODE_39, F.CODE_93, F.CODABAR, F.ITF, F.QR_CODE],
    });
    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: (w, h) => ({ width: Math.floor(Math.min(w * 0.85, 360)), height: Math.floor(Math.min(h * 0.45, 170)) }),
          aspectRatio: 1.333,
        },
        (text) => {
          if (!scanning) return;
          scanning = false;
          feedback();
          const cb = scanCallback;
          closeScanner().then(() => cb?.(cleanCode(text)));
        },
        () => {}
      );
      scanning = true;
      $("scanMsg").textContent = "Centra el código dentro del recuadro";
    } catch (err) {
      console.error(err);
      $("scanMsg").textContent = "No se pudo abrir la cámara. Revisa los permisos o escribe el código a mano.";
    }
  }
  async function closeScanner() {
    scanning = false;
    $("scanner").hidden = true;
    try { if (scanner?.isScanning) await scanner.stop(); } catch { /* ya detenido */ }
  }
  $("closeScanner").addEventListener("click", closeScanner);
  $("scanner").addEventListener("click", (e) => e.target === $("scanner") && closeScanner());

  // Botones de escaneo junto a cada campo de código
  document.querySelectorAll("[data-scan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = $(btn.dataset.scan);
      openScanner((code) => {
        input.value = code;
        input.dispatchEvent(new CustomEvent("scanned"));
      });
    });
  });

  /** Ejecuta handler al escanear con la cámara o al presionar Enter (sirve también para lectores USB/Bluetooth). */
  function onCodeEntered(input, handler) {
    input.addEventListener("scanned", () => handler(cleanCode(input.value)));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); handler(cleanCode(input.value)); }
    });
  }

  // ---------------------------------------------------------------------------
  // Búsqueda por nombre con sugerencias (Consultar e Inventario)
  // ---------------------------------------------------------------------------
  let suggestBox = null;
  function closeSuggest() {
    suggestBox?.remove();
    suggestBox = null;
  }
  function highlight(name, q) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    const n = norm(name);
    const marks = new Array(name.length).fill(false);
    words.forEach((w) => {
      let i = n.indexOf(w);
      while (i >= 0) { for (let k = i; k < i + w.length; k++) marks[k] = true; i = n.indexOf(w, i + 1); }
    });
    let out = "";
    let open = false;
    for (let i = 0; i < name.length; i++) {
      if (marks[i] && !open) { out += "<mark>"; open = true; }
      if (!marks[i] && open) { out += "</mark>"; open = false; }
      out += esc(name[i]);
    }
    return open ? out + "</mark>" : out;
  }

  /** Muestra sugerencias mientras se escribe; al tocar una llama onPick(barcode). */
  function attachSearch(input, onPick) {
    let timer;
    // Al presionar Enter o escanear, cancelar sugerencias pendientes (evita que se abran después)
    const cancel = () => { clearTimeout(timer); closeSuggest(); };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") cancel(); });
    input.addEventListener("scanned", cancel);
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = input.value.trim();
        // Si son solo números, probablemente es un código: no molestar con sugerencias hasta 3 dígitos
        if (q.length < 2 || (/^\d+$/.test(q) && q.length < 3)) return closeSuggest();
        const results = searchIndex(await getIndex(), q);
        if (input.value.trim() !== q || document.activeElement !== input) return;
        closeSuggest();
        suggestBox = document.createElement("ul");
        suggestBox.className = "suggest";
        suggestBox.innerHTML = results.length
          ? results.map((p) => `<li><button type="button" data-pick="${esc(p.barcode)}">
              <span class="s-name">${highlight(p.name, q)}</span>
              <span class="muted">${esc(p.barcode)} · ${fmtMoney(p.cost)} ${perUnit(p.unit)}</span>
            </button></li>`).join("")
          : `<li class="s-empty">Ningún producto coincide con “${esc(q)}”</li>`;
        suggestBox.addEventListener("click", (e) => {
          const b = e.target.closest("[data-pick]");
          if (!b) return;
          closeSuggest();
          onPick(b.dataset.pick);
        });
        input.closest(".suggest-wrap").appendChild(suggestBox);
      }, 120);
    });
  }
  document.addEventListener("click", (e) => {
    if (suggestBox && !e.target.closest(".suggest-wrap")) closeSuggest();
  });

  /** Resuelve lo escrito: código exacto, o un único producto que coincida por nombre. */
  async function resolveTyped(text) {
    if (!text) return { status: "empty" };
    const exact = await Products.get(text);
    if (exact) return { status: "found", product: exact };
    const results = searchIndex(await getIndex(), text, 50);
    if (results.length === 1) return { status: "found", product: await Products.get(results[0].barcode) };
    if (results.length > 1) return { status: "many" };
    // Con espacios o sin números es un nombre; si no, se trata como código de barras
    return { status: /\s/.test(text) || !/\d/.test(text) ? "noname" : "nocode" };
  }

  // ---------------------------------------------------------------------------
  // Campos de dinero con separador de miles
  // ---------------------------------------------------------------------------
  document.querySelectorAll("input.money").forEach((inp) => {
    inp.addEventListener("input", () => {
      const v = parseMoney(inp.value);
      inp.value = inp.value.trim() === "" ? "" : num.format(v);
      updateMargin();
    });
  });
  const setMoneyInput = (inp, v) => (inp.value = v || v === 0 ? num.format(Math.round(v)) : "");

  function updateMargin() {
    const cost = parseMoney($("fCost").value);
    const price = parseMoney($("fPrice").value);
    if (!cost || !price) return ($("marginHint").textContent = "");
    const gain = price - cost;
    const pct = (gain / cost) * 100;
    const per = getRadio("fUnit") === "Kg" ? "kilogramo" : "unidad";
    $("marginHint").textContent = `Ganancia por ${per}: ${fmtMoney(gain)} (${num.format(round2(pct))} %)`;
  }

  function updateUnitLabels() {
    const kg = getRadio("fUnit") === "Kg";
    $("costLabel").textContent = kg ? "Valor de costo (por Kg)" : "Valor de costo";
    $("priceLabel").textContent = kg ? "Valor de venta (por Kg)" : "Valor de venta";
    updateMargin();
  }
  document.querySelectorAll('input[name="fUnit"]').forEach((r) => r.addEventListener("change", updateUnitLabels));

  // ---------------------------------------------------------------------------
  // Foto en el formulario
  // ---------------------------------------------------------------------------
  let currentPhoto = null;
  let previewUrl = null;

  function setPhoto(photo) {
    currentPhoto = photo || null;
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
    $("photoPreview").hidden = !currentPhoto;
    $("photoEmpty").hidden = !!currentPhoto;
    $("removePhoto").hidden = !currentPhoto;
    if (!currentPhoto) return $("photoPreview").removeAttribute("src");
    if (typeof currentPhoto === "string") $("photoPreview").src = currentPhoto;
    else $("photoPreview").src = previewUrl = URL.createObjectURL(currentPhoto);
  }

  $("fPhoto").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setPhoto(await compressImage(file)); }
    catch { toast("No se pudo cargar la foto", "err"); }
    e.target.value = "";
  });
  $("removePhoto").addEventListener("click", () => setPhoto(null));

  function openPhoto(src) {
    if (!src) return;
    $("photoBig").src = src;
    $("photoView").hidden = false;
  }
  $("photoView").addEventListener("click", () => ($("photoView").hidden = true));

  // ---------------------------------------------------------------------------
  // Registrar / editar producto
  // ---------------------------------------------------------------------------
  const form = $("productForm");

  function resetForm() {
    form.reset();
    $("editingId").value = "";
    $("editBanner").hidden = true;
    $("saveBtn").textContent = "Guardar producto";
    $("marginHint").textContent = "";
    form.querySelectorAll(".invalid").forEach((i) => i.classList.remove("invalid"));
    setPhoto(null);
    updateUnitLabels();
    if (currentView === "registrar") $("viewTitle").textContent = TITLES.registrar;
  }

  function loadIntoForm(p) {
    resetForm();
    $("editingId").value = p.barcode;
    $("fBarcode").value = p.barcode;
    $("fName").value = p.name;
    setRadio("fUnit", unitOf(p));
    setMoneyInput($("fCost"), p.cost);
    setMoneyInput($("fPrice"), p.price);
    setPhoto(p.photo);
    updateUnitLabels();
    $("editBanner").hidden = false;
    $("saveBtn").textContent = "Guardar cambios";
  }

  async function editProduct(barcode) {
    const p = await Products.get(barcode);
    if (!p) return toast("Producto no encontrado", "err");
    loadIntoForm(p);
    showView("registrar");
  }

  function goRegister(code) {
    resetForm();
    $("fBarcode").value = code;
    showView("registrar");
    $("fName").focus();
  }

  $("cancelEdit").addEventListener("click", () => { resetForm(); showView("consultar"); });

  onCodeEntered($("fBarcode"), async (code) => {
    if (!code) return;
    const editing = $("editingId").value;
    if (code === editing) return;
    const existing = await Products.get(code);
    if (existing) {
      const ok = await confirmDialog(`El código ${code} ya está registrado como "${existing.name}". ¿Quieres editarlo?`, "Editar");
      if (ok) loadIntoForm(existing);
      else $("fBarcode").value = editing || "";
      return;
    }
    $("fName").focus();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const barcode = cleanCode($("fBarcode").value);
    const name = $("fName").value.trim();
    const cost = parseMoney($("fCost").value);
    const price = parseMoney($("fPrice").value);
    const unit = getRadio("fUnit");
    const checks = [[$("fBarcode"), !!barcode], [$("fName"), !!name], [$("fCost"), $("fCost").value.trim() !== ""], [$("fPrice"), $("fPrice").value.trim() !== ""]];
    let firstBad = null;
    checks.forEach(([el, ok]) => { el.classList.toggle("invalid", !ok); if (!ok && !firstBad) firstBad = el; });
    if (firstBad) { firstBad.focus(); return toast("Completa los campos marcados", "err"); }

    const editing = $("editingId").value;
    if (barcode !== editing && (await Products.get(barcode))) {
      $("fBarcode").classList.add("invalid");
      return toast("Ya existe un producto con ese código", "err");
    }

    const prev = editing ? await Products.get(editing) : null;
    const product = {
      barcode, name, cost, price, unit,
      photo: currentPhoto,
      createdAt: prev?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    try {
      await Products.replace(editing || barcode, product);
      // Si el producto está en el inventario en curso, actualizar nombre/costo/código
      if (editing) {
        const row = await Inventory.get(editing);
        if (row) await Inventory.replace(editing, { ...row, barcode, name, cost });
      }
    } catch (err) {
      console.error(err);
      return toast("No se pudo guardar. ¿Memoria llena?", "err");
    }
    invalidateIndex();
    toast(editing ? "Cambios guardados" : "Producto guardado", "ok");
    resetForm();
    if (editing) showView("consultar");
    else $("fBarcode").focus();
  });

  form.querySelectorAll("input").forEach((i) => i.addEventListener("input", () => i.classList.remove("invalid")));

  async function deleteProduct(barcode) {
    const p = await Products.get(barcode);
    if (!p) return;
    const ok = await confirmDialog(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`, "Eliminar");
    if (!ok) return;
    await Products.del(barcode);
    invalidateIndex();
    const cached = photoUrls.get(barcode);
    if (cached) { URL.revokeObjectURL(cached.url); photoUrls.delete(barcode); }
    toast("Producto eliminado", "ok");
    if ($("queryResult").dataset.code === barcode) $("queryResult").innerHTML = "";
    renderProductList();
  }

  // ---------------------------------------------------------------------------
  // Consultar
  // ---------------------------------------------------------------------------
  const ICON_BOX = '<svg viewBox="0 0 24 24"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>';
  const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>';
  const ICON_DEL = '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
  const thumb = (p, cls = "") =>
    p.photo
      ? `<img class="thumb ${cls}" src="${photoSrc(p)}" alt="" loading="lazy" data-photo="${esc(p.barcode)}" />`
      : `<div class="thumb ${cls}">${ICON_BOX}</div>`;

  function showProduct(p) {
    const box = $("queryResult");
    box.dataset.code = p.barcode;
    const gain = p.price - p.cost;
    const unit = unitOf(p);
    box.innerHTML = `<div class="card result">
      ${thumb(p)}
      <div>
        <h3>${esc(p.name)}</h3>
        <span class="muted">${esc(p.barcode)} · se vende por ${unit === "Kg" ? "kilogramo" : "unidad"}</span>
        <dl class="kv">
          <dt>Costo</dt><dd>${fmtMoney(p.cost)}${unit === "Kg" ? " /Kg" : ""}</dd>
          <dt>Venta</dt><dd>${fmtMoney(p.price)}${unit === "Kg" ? " /Kg" : ""}</dd>
          <dt>Ganancia</dt><dd>${fmtMoney(gain)}${p.cost ? ` · ${num.format(round2((gain / p.cost) * 100))} %` : ""}</dd>
        </dl>
      </div>
      <div class="row-actions">
        <button class="btn ghost" data-edit="${esc(p.barcode)}">${ICON_EDIT} Editar</button>
        <button class="btn danger-soft" data-del="${esc(p.barcode)}">${ICON_DEL} Eliminar</button>
      </div>
    </div>`;
  }

  async function runQuery(text) {
    const box = $("queryResult");
    closeSuggest();
    const r = await resolveTyped(text);
    if (r.status === "empty") return;
    if (r.status === "found") return showProduct(r.product);
    if (r.status === "many") return toast("Hay varios productos con ese nombre, elige uno de la lista");
    box.dataset.code = "";
    if (r.status === "noname") {
      box.innerHTML = `<div class="card empty">No hay ningún producto con el nombre <strong>${esc(text)}</strong>.</div>`;
      return;
    }
    box.innerHTML = `<div class="card empty">
      <div>No hay ningún producto con el código <strong>${esc(text)}</strong>.</div>
      <button class="btn ghost" id="registerFromQuery">Registrarlo ahora</button>
    </div>`;
    $("registerFromQuery").onclick = () => goRegister(text);
  }

  onCodeEntered($("qBarcode"), runQuery);
  attachSearch($("qBarcode"), async (code) => {
    const p = await Products.get(code);
    if (p) { $("qBarcode").value = p.name; showProduct(p); }
  });
  $("scanQuery").addEventListener("click", () => openScanner((code) => { $("qBarcode").value = code; runQuery(code); }));

  // Lista de productos (por páginas, para que sea rápida aunque haya miles)
  const PAGE = 50;
  let listLimit = PAGE;
  async function renderProductList() {
    const index = await getIndex();
    $("productCount").textContent = num.format(index.length);
    const q = $("searchList").value.trim();
    const list = q ? searchIndex(index, q, Infinity) : index;
    const shown = list.slice(0, listLimit);
    const products = await Promise.all(shown.map((p) => Products.get(p.barcode)));
    $("productList").innerHTML = shown.length
      ? products.filter(Boolean).map((p) => `<li>
          ${thumb(p, "sm")}
          <div class="info">
            <div class="name">${esc(p.name)}</div>
            <div class="muted">${esc(p.barcode)}${unitOf(p) === "Kg" ? " · por Kg" : ""}</div>
            <div class="muted">Costo ${fmtMoney(p.cost)} · Venta ${fmtMoney(p.price)}</div>
          </div>
          <div class="mini-actions">
            <button data-edit="${esc(p.barcode)}" aria-label="Editar">${ICON_EDIT}</button>
            <button class="del" data-del="${esc(p.barcode)}" aria-label="Eliminar">${ICON_DEL}</button>
          </div>
        </li>`).join("") +
        (list.length > shown.length
          ? `<li class="empty" style="display:block"><button class="btn ghost more" id="moreProducts">Mostrar más (${num.format(list.length - shown.length)} restantes)</button></li>`
          : "")
      : `<li class="empty" style="display:block">${q ? "Sin resultados" : "Aún no hay productos registrados"}</li>`;
    const more = $("moreProducts");
    if (more) more.onclick = () => { listLimit += PAGE; renderProductList(); };
  }
  $("searchList").addEventListener("input", () => { listLimit = PAGE; renderProductList(); });

  // Delegación de eventos para editar / eliminar / ver foto
  document.addEventListener("click", async (e) => {
    const t = e.target.closest("[data-edit],[data-del],[data-photo]");
    if (!t) return;
    if (t.dataset.edit) editProduct(t.dataset.edit);
    else if (t.dataset.del) deleteProduct(t.dataset.del);
    else if (t.dataset.photo) openPhoto(t.getAttribute("src"));
  });

  // ---------------------------------------------------------------------------
  // Inventario
  // ---------------------------------------------------------------------------
  let invProduct = null;

  function updateCurrentTotal() {
    if (!invProduct) return;
    const qty = parseQty($("invQty").value);
    $("invTotal").value = fmtMoney(round2(invProduct.cost * qty));
  }
  function updateInvCostLabel() {
    $("invCostLabel").textContent = getRadio("invUnit") === "Kg" ? "Costo por Kg" : "Costo por unidad";
  }
  document.querySelectorAll('input[name="invUnit"]').forEach((r) => r.addEventListener("change", () => {
    updateInvCostLabel();
    $("invQty").focus();
  }));

  async function showForInventory(p) {
    closeSuggest();
    invProduct = p;
    $("invName").textContent = p.name;
    const existing = await Inventory.get(p.barcode);
    const unit = existing ? unitOf(existing) : unitOf(p);
    setRadio("invUnit", unit);
    updateInvCostLabel();
    $("invCode").textContent = existing ? `${p.barcode} · ya contado: ${fmtQty(existing.qty, unitOf(existing))}` : p.barcode;
    $("invCost").value = fmtMoney(p.cost);
    $("invQty").value = "";
    $("invQty").classList.remove("invalid");
    $("invTotal").value = fmtMoney(0);
    $("invCurrent").hidden = false;
    $("invQty").focus();
  }

  async function lookupForInventory(text) {
    const r = await resolveTyped(text);
    if (r.status === "empty") return;
    if (r.status === "found") return showForInventory(r.product);
    $("invCurrent").hidden = true;
    invProduct = null;
    if (r.status === "many") return toast("Hay varios productos con ese nombre, elige uno de la lista");
    if (r.status === "noname") return toast(`No hay ningún producto llamado “${text}”`, "err");
    closeSuggest();
    const ok = await confirmDialog(`El código ${text} no está registrado. ¿Quieres registrarlo ahora?`, "Registrar");
    if (ok) goRegister(text);
  }

  async function addCurrentToInventory() {
    if (!invProduct) return;
    const qty = parseQty($("invQty").value);
    if (!qty) { $("invQty").classList.add("invalid"); $("invQty").focus(); return toast("Escribe la cantidad", "err"); }
    const unit = getRadio("invUnit");
    const existing = await Inventory.get(invProduct.barcode);
    const row = existing
      ? { ...existing, name: invProduct.name, cost: invProduct.cost, qty: round3(existing.qty + qty), unit, updatedAt: Date.now() }
      : { barcode: invProduct.barcode, name: invProduct.name, cost: invProduct.cost, qty: round3(qty), unit, addedAt: Date.now(), updatedAt: Date.now() };
    await Inventory.put(row);
    // Recordar la unidad en el producto para la próxima vez
    if (unitOf(invProduct) !== unit) {
      await Products.put({ ...invProduct, unit });
      invalidateIndex();
    }
    toast(existing ? `Se sumaron ${fmtQty(qty, unit)} a ${row.name}` : `${row.name} agregado`, "ok");
    const code = invProduct.barcode;
    invProduct = null;
    $("invCurrent").hidden = true;
    $("iBarcode").value = "";
    await renderInventory(code);
    $("iBarcode").focus();
  }

  function summarize(rows) {
    let grand = 0;
    let u = 0;
    let kg = 0;
    rows.forEach((r) => {
      grand += r.cost * r.qty;
      if (unitOf(r) === "Kg") kg += r.qty; else u += r.qty;
    });
    const parts = [];
    if (u || !kg) parts.push(fmtQty(u, "U"));
    if (kg) parts.push(fmtQty(kg, "Kg"));
    return { grand: round2(grand), units: parts.join(" · ") };
  }
  function renderSummary(rows) {
    const s = summarize(rows);
    $("grandTotal").textContent = fmtMoney(s.grand);
    $("invItems").textContent = num.format(rows.length);
    $("invUnits").textContent = s.units;
  }

  async function renderInventory(flashCode) {
    const rows = (await Inventory.all()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    renderSummary(rows);
    $("invList").innerHTML = rows.length
      ? rows.map((r) => `<li data-row="${esc(r.barcode)}" class="${r.barcode === flashCode ? "flash" : ""}">
          <div class="inv-row-head">
            <div><div class="name">${esc(r.name)}</div><div class="muted">${esc(r.barcode)}</div></div>
            <div class="mini-actions"><button class="del" data-invdel="${esc(r.barcode)}" aria-label="Quitar">${ICON_DEL}</button></div>
          </div>
          <div class="inv-row-nums">
            <div class="field"><span>Costo${unitOf(r) === "Kg" ? " /Kg" : ""}</span><div>${fmtMoney(r.cost)}</div></div>
            <label class="field"><span>Cantidad</span>
              <span class="qty-wrap">
                <input data-invqty="${esc(r.barcode)}" inputmode="decimal" value="${qtyInputValue(r.qty)}" />
                <button type="button" class="unit-btn" data-invunit="${esc(r.barcode)}" aria-label="Cambiar unidad">${unitOf(r)}</button>
              </span>
            </label>
            <div class="total" data-invtotal="${esc(r.barcode)}">${fmtMoney(round2(r.cost * r.qty))}</div>
          </div>
        </li>`).join("")
      : `<li class="empty card">Escanea o busca un producto para comenzar el inventario</li>`;
    $("invPdf").disabled = $("invClear").disabled = rows.length === 0;
  }

  // Edición directa de cantidades en la lista
  $("invList").addEventListener("input", async (e) => {
    const code = e.target.dataset.invqty;
    if (!code) return;
    const row = await Inventory.get(code);
    if (!row) return;
    const qty = parseQty(e.target.value);
    e.target.classList.toggle("invalid", !qty);
    row.qty = round3(qty);
    await Inventory.put(row);
    document.querySelector(`[data-invtotal="${CSS.escape(code)}"]`).textContent = fmtMoney(round2(row.cost * row.qty));
    renderSummary(await Inventory.all());
  });
  $("invList").addEventListener("click", async (e) => {
    const unitBtn = e.target.closest("[data-invunit]");
    if (unitBtn) {
      e.preventDefault();
      const row = await Inventory.get(unitBtn.dataset.invunit);
      if (!row) return;
      row.unit = unitOf(row) === "Kg" ? "U" : "Kg";
      await Inventory.put(row);
      unitBtn.textContent = row.unit;
      unitBtn.closest("li").querySelector(".field > span").textContent = row.unit === "Kg" ? "Costo /Kg" : "Costo";
      renderSummary(await Inventory.all());
      return;
    }
    const b = e.target.closest("[data-invdel]");
    if (!b) return;
    const row = await Inventory.get(b.dataset.invdel);
    if (row && (await confirmDialog(`¿Quitar "${row.name}" del inventario?`, "Quitar"))) {
      await Inventory.del(row.barcode);
      renderInventory();
    }
  });

  onCodeEntered($("iBarcode"), lookupForInventory);
  attachSearch($("iBarcode"), async (code) => {
    const p = await Products.get(code);
    if (p) { $("iBarcode").value = ""; showForInventory(p); }
  });
  $("scanInventory").addEventListener("click", () => openScanner((code) => { $("iBarcode").value = code; lookupForInventory(code); }));
  $("invQty").addEventListener("input", () => { $("invQty").classList.remove("invalid"); updateCurrentTotal(); });
  $("invQty").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addCurrentToInventory(); } });
  $("invAdd").addEventListener("click", addCurrentToInventory);

  $("invClear").addEventListener("click", async () => {
    if (!(await confirmDialog("¿Limpiar todo el inventario? Se borrarán todos los productos contados (los productos registrados no se borran).", "Limpiar todo"))) return;
    await Inventory.clear();
    invProduct = null;
    $("invCurrent").hidden = true;
    $("iBarcode").value = "";
    renderInventory();
    toast("Inventario limpio", "ok");
  });

  // ---------------------------------------------------------------------------
  // PDF
  // ---------------------------------------------------------------------------
  $("invPdf").addEventListener("click", async () => {
    if (!window.jspdf) return toast("El generador de PDF aún se está cargando", "err");
    const rows = (await Inventory.all()).sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (!rows.length) return toast("No hay productos en el inventario", "err");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const now = new Date();
    const dateStr = now.toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });
    const green = [100, 162, 131];
    const s = summarize(rows);
    const body = rows.map((r, i) => [
      i + 1, r.barcode, r.name, fmtMoney(r.cost), numQty.format(round3(r.qty)), unitOf(r), fmtMoney(round2(r.cost * r.qty)),
    ]);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(47, 62, 55);
    doc.text("Inventario", 40, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(122, 140, 131);
    doc.text(`Generado: ${dateStr}`, 40, 68);
    doc.text(`${rows.length} productos · ${s.units}`, 40, 82);

    doc.autoTable({
      startY: 98,
      head: [["#", "Código", "Producto", "Costo", "Cantidad", "Unidad", "Total"]],
      body,
      foot: [[{ content: "TOTAL INVENTARIO", colSpan: 6, styles: { halign: "right" } }, { content: fmtMoney(s.grand), styles: { halign: "right" } }]],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5, lineColor: [225, 236, 230], textColor: [47, 62, 55] },
      headStyles: { fillColor: green, textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [237, 246, 241], textColor: [47, 62, 55], fontStyle: "bold", fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      columnStyles: {
        0: { halign: "center", cellWidth: 24 },
        1: { cellWidth: 88 },
        3: { halign: "right", cellWidth: 70 },
        4: { halign: "right", cellWidth: 54 },
        5: { halign: "center", cellWidth: 44 },
        6: { halign: "right", cellWidth: 80 },
      },
      showFoot: "lastPage",
      didDrawPage: () => {
        const h = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 40, h - 20, { align: "right" });
      },
    });

    const fileName = `inventario-${stamp(now)}.pdf`;
    await saveFile([doc.output("blob")], fileName, "application/pdf", "view");
    if (!isAndroidApp) toast("PDF descargado", "ok");
  });

  // ---------------------------------------------------------------------------
  // Datos: espacio usado
  // ---------------------------------------------------------------------------
  async function scanStorage() {
    let products = 0, withPhoto = 0, legacy = 0, photoSize = 0, dataSize = 0;
    await tx("products", "readonly", (s) => {
      const req = s.openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return;
        const p = c.value;
        products++;
        if (p.photo) { withPhoto++; photoSize += photoBytes(p.photo); if (typeof p.photo === "string") legacy++; }
        dataSize += 120 + (p.name?.length || 0) * 2 + (p.barcode?.length || 0) * 2;
        c.continue();
      };
    });
    const invRows = await Inventory.count();
    dataSize += invRows * 160;
    return { products, withPhoto, legacy, photoSize, dataSize, invRows };
  }

  async function renderStorage() {
    const s = await scanStorage();
    let est = null;
    try { est = await navigator.storage?.estimate?.(); } catch { /* no disponible */ }
    const total = s.photoSize + s.dataSize;
    const avgPhoto = s.withPhoto ? s.photoSize / s.withPhoto : 50 * 1024;
    const rows = [
      ["Productos registrados", num.format(s.products)],
      ["Productos con foto", num.format(s.withPhoto)],
      ["Fotos", fmtBytes(s.photoSize)],
      ["Datos (textos y precios)", fmtBytes(s.dataSize)],
      ["En el inventario actual", `${num.format(s.invRows)} productos`],
      ["Total de la app", fmtBytes(total)],
    ];
    if (est?.quota) rows.push(["Espacio disponible para la app", fmtBytes(Math.max(0, est.quota - (est.usage || 0)))]);
    $("storageInfo").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    const base = Math.max(total, 1);
    $("meterPhotos").style.width = `${(s.photoSize / base) * 100}%`;
    $("meterData").style.width = `${(s.dataSize / base) * 100}%`;
    $("storageHint").textContent = `Una foto ocupa en promedio ${fmtBytes(avgPhoto)}. Con 5.000 productos con foto serían unos ${fmtBytes(avgPhoto * 5000 + 5000 * 200)}.`;

    $("photoStatus").textContent = s.legacy
      ? `${num.format(s.legacy)} fotos anteriores todavía se pueden reducir.`
      : s.withPhoto ? "Todas las fotos están optimizadas." : "Aún no hay fotos guardadas.";
    $("optimizeBtn").hidden = !s.legacy || optimizing;
    renderBackupInfo(s.products);
  }

  // ---------------------------------------------------------------------------
  // Optimizar fotos antiguas (guardadas antes como texto a 900 px)
  // ---------------------------------------------------------------------------
  let optimizing = false;
  async function optimizePhotos(manual = false) {
    if (optimizing) return;
    optimizing = true;
    $("optimizeBtn").hidden = true;
    let done = 0, saved = 0;
    try {
      const keys = await Products.keys();
      for (const k of keys) {
        const p = await Products.get(k);
        if (!p || typeof p.photo !== "string") continue;
        try {
          const blob = await compressImage(p.photo);
          const before = photoBytes(p.photo);
          if (blob.size < before) {
            await Products.put({ ...p, photo: blob });
            saved += before - blob.size;
          } else {
            await Products.put({ ...p, photo: dataURLToBlob(p.photo) });
          }
          done++;
          if (currentView === "datos") $("photoStatus").textContent = `Optimizando fotos… ${num.format(done)}`;
        } catch (err) { console.warn("No se pudo optimizar", k, err); }
      }
    } finally {
      optimizing = false;
    }
    if (done && manual) toast(`Fotos optimizadas: se liberaron ${fmtBytes(saved)}`, "ok");
    if (currentView === "datos") renderStorage();
  }
  $("optimizeBtn").addEventListener("click", () => optimizePhotos(true));

  // ---------------------------------------------------------------------------
  // Copia de seguridad y restauración
  // Formato: un objeto JSON por línea (encabezado, productos, inventario)
  // ---------------------------------------------------------------------------
  const BACKUP_APP = "inventario-corpoautonoma";
  const LAST_BACKUP_KEY = "inventario:lastBackup";
  let busy = false;

  function setProgress(fraction, text) {
    $("backupProgress").hidden = fraction == null;
    $("backupProgress").firstElementChild.style.width = `${Math.round((fraction || 0) * 100)}%`;
    if (text != null) $("backupStatus").textContent = text;
  }

  function renderBackupInfo(productCount) {
    const last = Number(ls.get(LAST_BACKUP_KEY)) || 0;
    $("lastBackup").textContent = last
      ? `Última copia: ${new Date(last).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}`
      : "Aún no has creado ninguna copia en este celular.";
    const days = last ? (Date.now() - last) / 86400000 : Infinity;
    const alert = $("backupAlert");
    alert.hidden = !(productCount > 0 && days > 7);
    alert.textContent = last
      ? `Tu última copia tiene ${Math.floor(days)} días. Te recomendamos crear una nueva.`
      : "Te recomendamos crear una copia de seguridad para no perder tus productos.";
  }

  $("backupBtn").addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    $("backupBtn").disabled = $("restoreBtn").disabled = true;
    try {
      const keys = await Products.keys();
      const inv = await Inventory.all();
      const parts = [JSON.stringify({ type: "header", app: BACKUP_APP, version: 2, createdAt: new Date().toISOString(), products: keys.length, inventory: inv.length }) + "\n"];
      setProgress(0, "Preparando copia…");
      let i = 0;
      for (const k of keys) {
        const p = await Products.get(k);
        if (!p) continue;
        const photo = p.photo ? (typeof p.photo === "string" ? p.photo : await blobToDataURL(p.photo)) : null;
        parts.push(JSON.stringify({ type: "product", ...p, photo }) + "\n");
        i++;
        if (i % 25 === 0) setProgress((i / keys.length) * 0.5, `Preparando copia… ${num.format(i)} de ${num.format(keys.length)}`);
      }
      inv.forEach((r) => parts.push(JSON.stringify({ type: "inventory", ...r }) + "\n"));
      const fileName = `respaldo-inventario-${stamp()}.json`;
      setProgress(0.5, "Guardando archivo…");
      await saveFile(parts, fileName, "application/json", "share", (f) => setProgress(0.5 + f * 0.5));
      ls.set(LAST_BACKUP_KEY, String(Date.now()));
      setProgress(null, `Copia creada: ${fileName} (${num.format(keys.length)} productos).${isAndroidApp ? " Quedó en Descargas." : ""}`);
      toast("Copia de seguridad creada", "ok");
      renderBackupInfo(keys.length);
    } catch (err) {
      console.error(err);
      setProgress(null, "");
      toast("No se pudo crear la copia", "err");
    } finally {
      busy = false;
      $("backupBtn").disabled = $("restoreBtn").disabled = false;
    }
  });

  /** Lee un archivo línea por línea en bloques (no carga todo en memoria). */
  async function* readLines(file) {
    const CHUNK = 4 * 1024 * 1024;
    const decoder = new TextDecoder();
    let rest = "";
    for (let pos = 0; pos < file.size; pos += CHUNK) {
      const buf = await file.slice(pos, pos + CHUNK).arrayBuffer();
      rest += decoder.decode(buf, { stream: pos + CHUNK < file.size });
      const lines = rest.split("\n");
      rest = lines.pop();
      for (const l of lines) if (l.trim()) yield [l, Math.min(1, (pos + CHUNK) / file.size)];
    }
    if (rest.trim()) yield [rest, 1];
  }

  $("restoreBtn").addEventListener("click", () => { if (!busy) $("restoreFile").click(); });
  $("restoreFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    let header;
    try {
      const first = await file.slice(0, 4096).text();
      header = JSON.parse(first.split("\n")[0]);
    } catch { header = null; }
    if (!header || header.app !== BACKUP_APP || header.type !== "header") {
      return toast("Ese archivo no es una copia de seguridad de esta app", "err");
    }
    const when = new Date(header.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
    const ok = await confirmDialog(
      `La copia es del ${when} y tiene ${num.format(header.products)} productos y ${num.format(header.inventory)} en inventario. ` +
      "Se agregarán a este celular; los que tengan el mismo código se reemplazarán por los de la copia. ¿Restaurar?",
      "Restaurar"
    );
    if (!ok) return;

    busy = true;
    $("backupBtn").disabled = $("restoreBtn").disabled = true;
    let nProducts = 0, nInv = 0, bad = 0;
    let batch = [];
    const flush = async () => { if (batch.length) { await Products.putMany(batch); batch = []; } };
    try {
      setProgress(0, "Restaurando…");
      for await (const [line, progress] of readLines(file)) {
        let rec;
        try { rec = JSON.parse(line); } catch { bad++; continue; }
        const { type, ...data } = rec;
        if (type === "product" && data.barcode) {
          if (typeof data.photo === "string" && data.photo.startsWith("data:")) {
            try { data.photo = dataURLToBlob(data.photo); } catch { data.photo = null; }
          } else data.photo = null;
          batch.push(data);
          nProducts++;
          if (batch.length >= 40) {
            await flush();
            setProgress(progress, `Restaurando… ${num.format(nProducts)} productos`);
          }
        } else if (type === "inventory" && data.barcode) {
          await flush();
          await Inventory.put(data);
          nInv++;
        }
      }
      await flush();
      invalidateIndex();
      photoUrls.forEach((v) => URL.revokeObjectURL(v.url));
      photoUrls.clear();
      setProgress(null, `Restauración completa: ${num.format(nProducts)} productos y ${num.format(nInv)} en inventario.${bad ? ` (${bad} líneas dañadas omitidas)` : ""}`);
      toast("Copia restaurada", "ok");
      renderStorage();
    } catch (err) {
      console.error(err);
      await flush().catch(() => {});
      invalidateIndex();
      setProgress(null, `La restauración se detuvo después de ${num.format(nProducts)} productos.`);
      toast("No se pudo terminar la restauración", "err");
    } finally {
      busy = false;
      $("backupBtn").disabled = $("restoreBtn").disabled = false;
    }
  });

  // ---------------------------------------------------------------------------
  // Inicio
  // ---------------------------------------------------------------------------
  // Botón "atrás" de Android: cierra ventanas abiertas o vuelve a la primera pestaña
  window.__back = () => {
    if (suggestBox) { closeSuggest(); return true; }
    if (!$("scanner").hidden) { closeScanner(); return true; }
    if (!$("confirm").hidden) { $("confirmNo").click(); return true; }
    if (!$("photoView").hidden) { $("photoView").hidden = true; return true; }
    if (currentView !== "registrar") { showView("registrar"); return true; }
    return false;
  };
  window.__toast = toast;

  updateUnitLabels();
  updateInvCostLabel();
  renderInventory();
  // Optimizar en segundo plano las fotos guardadas con la versión anterior
  setTimeout(() => optimizePhotos(false), 2000);
  if (!isAndroidApp && "serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
