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
  const fmtMoney = (v) => money.format(Number(v) || 0);
  const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

  /** Convierte "12.500" o "12500" en 12500 (pesos enteros). */
  const parseMoney = (s) => Number(String(s ?? "").replace(/\D/g, "")) || 0;
  /** Convierte "2,5" o "2.5" en 2.5 */
  const parseQty = (s) => {
    const n = Number(String(s ?? "").trim().replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const cleanCode = (s) => String(s ?? "").trim();
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let toastTimer;
  function toast(msg, kind = "") {
    const t = $("toast");
    t.textContent = msg;
    t.className = `toast show ${kind}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = "toast"), 2400);
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
    put: (v) => tx(name, "readwrite", (s) => s.put(v)),
    del: (k) => tx(name, "readwrite", (s) => s.delete(k)),
    clear: () => tx(name, "readwrite", (s) => s.clear()),
    replace: (oldKey, v) => tx(name, "readwrite", (s) => { if (oldKey !== v.barcode) s.delete(oldKey); return s.put(v); }),
  });
  const Products = store("products");
  const Inventory = store("inventory");

  // Pedir almacenamiento persistente para que el navegador no borre los datos.
  navigator.storage?.persist?.().catch(() => {});

  // ---------------------------------------------------------------------------
  // Navegación
  // ---------------------------------------------------------------------------
  const TITLES = { registrar: "Registrar producto", consultar: "Consultar", inventario: "Inventario" };
  let currentView = "registrar";
  function showView(name) {
    currentView = name;
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
    $("viewTitle").textContent = name === "registrar" && $("editingId").value ? "Editar producto" : TITLES[name];
    window.scrollTo({ top: 0 });
    if (name === "consultar") renderProductList();
    if (name === "inventario") renderInventory();
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
    $("marginHint").textContent = `Ganancia por unidad: ${fmtMoney(gain)} (${num.format(round2(pct))} %)`;
  }

  // ---------------------------------------------------------------------------
  // Foto (comprimida para no llenar la memoria)
  // ---------------------------------------------------------------------------
  let currentPhoto = null;

  function setPhoto(dataUrl) {
    currentPhoto = dataUrl || null;
    $("photoPreview").hidden = !currentPhoto;
    $("photoEmpty").hidden = !!currentPhoto;
    $("removePhoto").hidden = !currentPhoto;
    if (currentPhoto) $("photoPreview").src = currentPhoto;
    else $("photoPreview").removeAttribute("src");
  }

  function compressImage(file, maxSide = 900, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
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
    if (currentView === "registrar") $("viewTitle").textContent = TITLES.registrar;
  }

  function loadIntoForm(p) {
    resetForm();
    $("editingId").value = p.barcode;
    $("fBarcode").value = p.barcode;
    $("fName").value = p.name;
    setMoneyInput($("fCost"), p.cost);
    setMoneyInput($("fPrice"), p.price);
    setPhoto(p.photo);
    updateMargin();
    $("editBanner").hidden = false;
    $("saveBtn").textContent = "Guardar cambios";
  }

  async function editProduct(barcode) {
    const p = await Products.get(barcode);
    if (!p) return toast("Producto no encontrado", "err");
    loadIntoForm(p);
    showView("registrar");
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
      barcode, name, cost, price,
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
    toast("Producto eliminado", "ok");
    if (cleanCode($("qBarcode").value) === barcode) $("queryResult").innerHTML = "";
    renderProductList();
  }

  // ---------------------------------------------------------------------------
  // Consultar
  // ---------------------------------------------------------------------------
  const ICON_BOX = '<svg viewBox="0 0 24 24"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>';
  const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>';
  const ICON_DEL = '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
  const thumb = (p, cls = "") =>
    p.photo ? `<img class="thumb ${cls}" src="${p.photo}" alt="" data-photo="${esc(p.barcode)}" />` : `<div class="thumb ${cls}">${ICON_BOX}</div>`;

  async function runQuery(code) {
    const box = $("queryResult");
    if (!code) return;
    const p = await Products.get(code);
    if (!p) {
      box.innerHTML = `<div class="card empty">
        <div>No hay ningún producto con el código <strong>${esc(code)}</strong>.</div>
        <button class="btn ghost" id="registerFromQuery">Registrarlo ahora</button>
      </div>`;
      $("registerFromQuery").onclick = () => { resetForm(); $("fBarcode").value = code; showView("registrar"); $("fName").focus(); };
      return;
    }
    const gain = p.price - p.cost;
    box.innerHTML = `<div class="card result">
      ${thumb(p)}
      <div>
        <h3>${esc(p.name)}</h3>
        <span class="muted">${esc(p.barcode)}</span>
        <dl class="kv">
          <dt>Costo</dt><dd>${fmtMoney(p.cost)}</dd>
          <dt>Venta</dt><dd>${fmtMoney(p.price)}</dd>
          <dt>Ganancia</dt><dd>${fmtMoney(gain)}${p.cost ? ` · ${num.format(round2((gain / p.cost) * 100))} %` : ""}</dd>
        </dl>
      </div>
      <div class="row-actions">
        <button class="btn ghost" data-edit="${esc(p.barcode)}">${ICON_EDIT} Editar</button>
        <button class="btn danger-soft" data-del="${esc(p.barcode)}">${ICON_DEL} Eliminar</button>
      </div>
    </div>`;
  }

  onCodeEntered($("qBarcode"), runQuery);
  $("scanQuery").addEventListener("click", () => openScanner((code) => { $("qBarcode").value = code; runQuery(code); }));

  let allProducts = [];
  async function renderProductList() {
    allProducts = (await Products.all()).sort((a, b) => a.name.localeCompare(b.name, "es"));
    $("productCount").textContent = allProducts.length;
    const q = $("searchList").value.trim().toLowerCase();
    const list = q ? allProducts.filter((p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q)) : allProducts;
    $("productList").innerHTML = list.length
      ? list.map((p) => `<li>
          ${thumb(p, "sm")}
          <div class="info">
            <div class="name">${esc(p.name)}</div>
            <div class="muted">${esc(p.barcode)}</div>
            <div class="muted">Costo ${fmtMoney(p.cost)} · Venta ${fmtMoney(p.price)}</div>
          </div>
          <div class="mini-actions">
            <button data-edit="${esc(p.barcode)}" aria-label="Editar">${ICON_EDIT}</button>
            <button class="del" data-del="${esc(p.barcode)}" aria-label="Eliminar">${ICON_DEL}</button>
          </div>
        </li>`).join("")
      : `<li class="empty" style="display:block">${q ? "Sin resultados" : "Aún no hay productos registrados"}</li>`;
  }
  $("searchList").addEventListener("input", renderProductList);

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

  async function lookupForInventory(code) {
    if (!code) return;
    const p = await Products.get(code);
    if (!p) {
      $("invCurrent").hidden = true;
      invProduct = null;
      const ok = await confirmDialog(`El código ${code} no está registrado. ¿Quieres registrarlo ahora?`, "Registrar");
      if (ok) { resetForm(); $("fBarcode").value = code; showView("registrar"); $("fName").focus(); }
      return;
    }
    invProduct = p;
    $("invName").textContent = p.name;
    const existing = await Inventory.get(code);
    $("invCode").textContent = existing ? `${p.barcode} · ya contado: ${num.format(existing.qty)}` : p.barcode;
    $("invCost").value = fmtMoney(p.cost);
    $("invQty").value = "";
    $("invTotal").value = fmtMoney(0);
    $("invCurrent").hidden = false;
    $("invQty").focus();
  }

  async function addCurrentToInventory() {
    if (!invProduct) return;
    const qty = parseQty($("invQty").value);
    if (!qty) { $("invQty").classList.add("invalid"); $("invQty").focus(); return toast("Escribe la cantidad", "err"); }
    const existing = await Inventory.get(invProduct.barcode);
    const row = existing
      ? { ...existing, name: invProduct.name, cost: invProduct.cost, qty: round2(existing.qty + qty), updatedAt: Date.now() }
      : { barcode: invProduct.barcode, name: invProduct.name, cost: invProduct.cost, qty, addedAt: Date.now(), updatedAt: Date.now() };
    await Inventory.put(row);
    toast(existing ? `Se sumaron ${num.format(qty)} a ${row.name}` : `${row.name} agregado`, "ok");
    const code = invProduct.barcode;
    invProduct = null;
    $("invCurrent").hidden = true;
    $("iBarcode").value = "";
    await renderInventory(code);
    $("iBarcode").focus();
  }

  async function renderInventory(flashCode) {
    const rows = (await Inventory.all()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    let grand = 0;
    let units = 0;
    rows.forEach((r) => { grand += r.cost * r.qty; units += r.qty; });
    $("grandTotal").textContent = fmtMoney(round2(grand));
    $("invItems").textContent = rows.length;
    $("invUnits").textContent = num.format(round2(units));
    $("invList").innerHTML = rows.length
      ? rows.map((r) => `<li data-row="${esc(r.barcode)}" class="${r.barcode === flashCode ? "flash" : ""}">
          <div class="inv-row-head">
            <div><div class="name">${esc(r.name)}</div><div class="muted">${esc(r.barcode)}</div></div>
            <div class="mini-actions"><button class="del" data-invdel="${esc(r.barcode)}" aria-label="Quitar">${ICON_DEL}</button></div>
          </div>
          <div class="inv-row-nums">
            <div class="field"><span>Costo</span><div>${fmtMoney(r.cost)}</div></div>
            <label class="field"><span>Cantidad</span><input data-invqty="${esc(r.barcode)}" inputmode="decimal" value="${num.format(r.qty).replace(/\./g, "")}" /></label>
            <div class="total" data-invtotal="${esc(r.barcode)}">${fmtMoney(round2(r.cost * r.qty))}</div>
          </div>
        </li>`).join("")
      : `<li class="empty card">Escanea un producto para comenzar el inventario</li>`;
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
    row.qty = qty;
    await Inventory.put(row);
    document.querySelector(`[data-invtotal="${CSS.escape(code)}"]`).textContent = fmtMoney(round2(row.cost * qty));
    const rows = await Inventory.all();
    $("grandTotal").textContent = fmtMoney(round2(rows.reduce((s, r) => s + r.cost * r.qty, 0)));
    $("invUnits").textContent = num.format(round2(rows.reduce((s, r) => s + r.qty, 0)));
  });
  $("invList").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-invdel]");
    if (!b) return;
    const row = await Inventory.get(b.dataset.invdel);
    if (row && (await confirmDialog(`¿Quitar "${row.name}" del inventario?`, "Quitar"))) {
      await Inventory.del(row.barcode);
      renderInventory();
    }
  });

  onCodeEntered($("iBarcode"), lookupForInventory);
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
    let grand = 0;
    let units = 0;
    const body = rows.map((r, i) => {
      const total = round2(r.cost * r.qty);
      grand += total;
      units += r.qty;
      return [i + 1, r.barcode, r.name, fmtMoney(r.cost), num.format(r.qty), fmtMoney(total)];
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(47, 62, 55);
    doc.text("Inventario", 40, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(122, 140, 131);
    doc.text(`Generado: ${dateStr}`, 40, 68);
    doc.text(`${rows.length} productos · ${num.format(round2(units))} unidades`, 40, 82);

    doc.autoTable({
      startY: 98,
      head: [["#", "Código", "Producto", "Costo", "Cantidad", "Total"]],
      body,
      foot: [[{ content: "TOTAL INVENTARIO", colSpan: 5, styles: { halign: "right" } }, { content: fmtMoney(round2(grand)), styles: { halign: "right" } }]],
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5, lineColor: [225, 236, 230], textColor: [47, 62, 55] },
      headStyles: { fillColor: green, textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [237, 246, 241], textColor: [47, 62, 55], fontStyle: "bold", fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 252, 250] },
      columnStyles: {
        0: { halign: "center", cellWidth: 26 },
        1: { cellWidth: 95 },
        3: { halign: "right", cellWidth: 75 },
        4: { halign: "right", cellWidth: 58 },
        5: { halign: "right", cellWidth: 85 },
      },
      showFoot: "lastPage",
      didDrawPage: () => {
        const h = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 40, h - 20, { align: "right" });
      },
    });

    const pad = (n) => String(n).padStart(2, "0");
    const fileName = `inventario-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.pdf`;
    doc.save(fileName);
    toast("PDF descargado", "ok");
  });

  // ---------------------------------------------------------------------------
  // Inicio
  // ---------------------------------------------------------------------------
  renderInventory();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
