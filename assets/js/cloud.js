/* ============================================================
   CLOUD — Sincronización con Supabase (opcional)
   Guarda TODO el portal en la nube para que los datos no se pierdan
   aunque el navegador borre el almacenamiento local o se cambie de equipo.
   Usa la API REST y de autenticación de Supabase mediante fetch
   (sin librerías externas). La conexión se configura desde el portal y
   se guarda localmente; nunca queda en el código público.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const CFG_KEY = "ubpc:cloud";        // { url, anonKey }
  const SESS_KEY = "ubpc:cloud:sess";  // { access_token, refresh_token, uid, email }
  // Tabla que ya existe en el proyecto (una fila por usuario). Se usa la que
  // la usuaria creó al inicio, para no depender de configuración adicional.
  const TABLE = "portal_data";

  let cfg = load(CFG_KEY);
  let sess = load(SESS_KEY);
  let pushTimer = null;
  let statusCb = null;
  let last = { state: "idle", msg: "", at: null };

  function load(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function save(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function configured() { return !!(cfg && cfg.url && cfg.anonKey); }
  function signedIn() { return !!(sess && sess.access_token && sess.uid); }
  function email() { return sess ? sess.email : ""; }
  function status() { return last; }
  function onStatus(cb) { statusCb = cb; }
  function setStatus(state, msg) {
    last = { state, msg: msg || "", at: new Date().toISOString() };
    if (statusCb) try { statusCb(last); } catch (e) {}
    updateBanner(state, msg);
  }
  // Aviso visible cuando la nube NO está guardando (para que no falle en silencio).
  let _bannerTimer = null;
  function updateBanner(state, msg) {
    try {
      if (!document.body) return;
      let el = document.getElementById("cloud-banner");
      if (state === "error") {
        // Pequeño margen: solo avisa si el error persiste unos segundos.
        clearTimeout(_bannerTimer);
        _bannerTimer = setTimeout(function () {
          if (last.state !== "error") return;
          if (!el) {
            el = document.createElement("div");
            el.id = "cloud-banner"; el.className = "cloud-banner no-print";
            document.body.appendChild(el);
          }
          const esc = s => String(s || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
          const motivo = /401|token|sesi/i.test(msg || "") ? "Tu sesión en la nube expiró: vuelve a iniciar sesión (correo y contraseña)."
            : /fetch|network|networkerror|failed to fetch/i.test(msg || "") ? "Sin conexión con la nube (revisa tu internet o la red del hospital)."
            : (msg ? "Detalle: " + msg : "");
          el.innerHTML = '<span>⚠️ No se está guardando en la nube. Tus cambios están en este equipo, pero no en el respaldo.' +
            (motivo ? ' <span style="opacity:.9;font-weight:400">' + esc(motivo) + '</span>' : '') + '</span>' +
            '<button type="button" id="cloud-banner-retry">Reintentar</button>';
          const rb = document.getElementById("cloud-banner-retry");
          if (rb) rb.onclick = function () { syncNow(); };
        }, 4000);
      } else {
        clearTimeout(_bannerTimer);
        if (el) el.remove();
      }
    } catch (e) {}
  }

  function setConfig(url, anonKey) {
    cfg = { url: String(url || "").trim().replace(/\/+$/, ""), anonKey: String(anonKey || "").trim() };
    save(CFG_KEY, cfg);
  }
  function clearAll() { cfg = null; sess = null; save(CFG_KEY, null); save(SESS_KEY, null); setStatus("idle"); }
  function signOut() { sess = null; save(SESS_KEY, null); setStatus("idle"); }

  async function api(path, opts, useAuth) {
    opts = opts || {};
    const headers = Object.assign({ apikey: cfg.anonKey, "Content-Type": "application/json" }, opts.headers || {});
    if (useAuth && sess && sess.access_token) headers.Authorization = "Bearer " + sess.access_token;
    return fetch(cfg.url + path, Object.assign({}, opts, { headers }));
  }

  async function signIn(mail, password) {
    if (!configured()) throw new Error("Falta configurar la conexión (URL y clave).");
    const res = await api("/auth/v1/token?grant_type=password", {
      method: "POST", body: JSON.stringify({ email: mail, password: password })
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error_description || j.msg || j.error || "No se pudo iniciar sesión en la nube.");
    sess = { access_token: j.access_token, refresh_token: j.refresh_token, uid: j.user && j.user.id, email: j.user && j.user.email };
    save(SESS_KEY, sess);
    return sess;
  }

  async function refresh() {
    if (!sess || !sess.refresh_token) return false;
    let res;
    try { res = await api("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: sess.refresh_token }) }); }
    catch (e) { return false; } // sin conexión: NO cerrar sesión, se reintenta luego
    const j = await res.json().catch(() => ({}));
    // Solo se cierra la sesión si el token de refresco es inválido (400/401).
    // Otros errores (500, red) no cierran la sesión para no desconectar sin motivo.
    if (res.status === 400 || res.status === 401) { sess = null; save(SESS_KEY, null); return false; }
    if (!res.ok || !j.access_token) return false;
    sess = { access_token: j.access_token, refresh_token: j.refresh_token, uid: (j.user && j.user.id) || sess.uid, email: (j.user && j.user.email) || sess.email };
    save(SESS_KEY, sess);
    return true;
  }
  // Mantener la conexión viva: renovar el token periódicamente y al volver a la
  // pestaña o recuperar internet, para no tener que iniciar sesión cada día.
  let _keepAliveOn = false;
  function startKeepAlive() {
    if (_keepAliveOn) return; _keepAliveOn = true;
    setInterval(() => { if (configured() && signedIn()) refresh(); }, 45 * 60 * 1000);
    const revive = () => { if (configured() && signedIn()) refresh().then(ok => { if (ok !== false) syncNow(); }).catch(() => {}); };
    try {
      document.addEventListener("visibilitychange", () => { if (!document.hidden) revive(); });
      window.addEventListener("online", revive);
    } catch (e) {}
  }

  async function remoteGet() {
    const q = "/rest/v1/" + TABLE + "?select=data,updated_at&limit=1";
    let res = await api(q, { method: "GET" }, true);
    if (res.status === 401 && await refresh()) res = await api(q, { method: "GET" }, true);
    if (!res.ok) throw new Error("No se pudo leer la nube (" + res.status + ").");
    const arr = await res.json().catch(() => []);
    return arr && arr[0] ? arr[0] : null;
  }

  async function remoteUpsert(dbObj) {
    const body = JSON.stringify({ user_id: sess.uid, data: dbObj, updated_at: new Date().toISOString() });
    const opts = { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body };
    let res = await api("/rest/v1/" + TABLE + "?on_conflict=user_id", opts, true);
    if (res.status === 401 && await refresh()) res = await api("/rest/v1/" + TABLE + "?on_conflict=user_id", opts, true);
    if (!res.ok) throw new Error("No se pudo guardar en la nube (" + res.status + ").");
    return true;
  }

  // ¿La nube ya tiene datos reales guardados? (evita que un equipo nuevo,
  // recién inicializado con valores por defecto, sobrescriba la nube).
  function remoteHasData(d) {
    return !!(d && Array.isArray(d.usuarios) && d.usuarios.length);
  }

  // ¿Lo local es solo la semilla por defecto (sin datos reales del usuario)?
  // (No se cuenta "hitos" porque la semilla ya crea uno de inicio.)
  function localSeedOnly() {
    const s = U.store;
    const cols = ["evaluacionesRNAO", "accionesRNAO", "indicadores", "capacidadOperativa", "planesIntervencion", "protocolosEnf", "documentos",
      "planesNT234", "kanban", "actividades", "reuniones", "acuerdos", "colaboraciones",
      "evidenciaSemana", "agendaEventos", "docsTrabajo", "recursosGuia",
      "participacionChampion", "convocatoriaChampion", "codigosInternos",
      "articulaciones", "reconocimientos", "nt234", "solicitudes"];
    const hasRecords = cols.some(c => (s.all(c) || []).length > 0);
    const editedProfile = (s.all("usuarios") || []).some(u => u.esPlaceholder === false);
    return !hasRecords && !editedProfile;
  }

  /* Sincronización inicial — REGLA SEGURA:
     - Si en este equipo NO hay datos reales (equipo nuevo o vacío), se
       adopta lo que haya en la nube (recuperación).
     - Si en este equipo SÍ hay datos reales, NUNCA se sobrescriben: se
       suben a la nube (así lo local nunca se pierde y respalda la nube). */
  async function initialSync() {
    if (!configured() || !signedIn()) return { skipped: true };
    startKeepAlive();
    setStatus("syncing");
    try {
      // Renueva el token al abrir (si expiró de un día para otro) para reconectar sin re-login.
      if (sess && sess.refresh_token) { try { await refresh(); } catch (e) {} }
      if (!signedIn()) { setStatus("error", "Tu sesión en la nube expiró: vuelve a iniciar sesión."); return { error: "session" }; }
      if (localSeedOnly()) {
        const remote = await remoteGet();
        if (remote && remoteHasData(remote.data)) {
          U.store.loadFromCloud(remote.data);
          setStatus("ok", "Datos cargados desde la nube.");
          return { adopted: true };
        }
      }
      await remoteUpsert(U.store.raw());
      setStatus("ok", "Datos respaldados en la nube.");
      return { pushed: true };
    } catch (e) {
      setStatus("error", e.message);
      return { error: e.message };
    }
  }

  /* Empujar cambios locales a la nube (con pequeño retardo para agrupar). */
  function schedulePush() {
    if (!configured() || !signedIn()) return;
    clearTimeout(pushTimer);
    setStatus("pending");
    pushTimer = setTimeout(async () => {
      setStatus("syncing");
      try { await remoteUpsert(U.store.raw()); setStatus("ok", "Cambios guardados en la nube."); }
      catch (e) { setStatus("error", e.message); }
    }, 1500);
  }

  async function syncNow() {
    if (!configured() || !signedIn()) return { skipped: true };
    setStatus("syncing");
    try { await remoteUpsert(U.store.raw()); setStatus("ok", "Sincronizado."); return { ok: true }; }
    catch (e) { setStatus("error", e.message); return { error: e.message }; }
  }

  // Se conecta al guardado local: cada cambio programa una subida.
  U.store.onPersist(schedulePush);

  U.cloud = {
    configured, signedIn, email, status, onStatus,
    setConfig, clearAll, signIn, signOut,
    initialSync, syncNow, schedulePush
  };
})();
