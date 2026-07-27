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
          el.innerHTML = '<span>⚠️ No se está guardando en la nube. Tus cambios están en este equipo, pero no en el respaldo.</span>' +
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
    const res = await api("/auth/v1/token?grant_type=refresh_token", {
      method: "POST", body: JSON.stringify({ refresh_token: sess.refresh_token })
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.access_token) { sess = null; save(SESS_KEY, null); return false; }
    sess = { access_token: j.access_token, refresh_token: j.refresh_token, uid: (j.user && j.user.id) || sess.uid, email: (j.user && j.user.email) || sess.email };
    save(SESS_KEY, sess);
    return true;
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
  function localSeedOnly() {
    const s = U.store;
    const cols = ["evaluacionesRNAO", "accionesRNAO", "indicadores", "documentos",
      "planesNT234", "kanban", "actividades", "reuniones", "acuerdos", "colaboraciones",
      "evidenciaSemana", "agendaEventos", "docsTrabajo", "recursosGuia", "hitos",
      "articulaciones", "reconocimientos", "nt234", "solicitudes"];
    const hasRecords = cols.some(c => (s.all(c) || []).length > 0);
    const editedProfile = (s.all("usuarios") || []).some(u => u.esPlaceholder === false);
    return !hasRecords && !editedProfile;
  }

  /* Sincronización inicial. La nube es la fuente de verdad: si ya tiene
     datos guardados, se adoptan en este equipo; si está vacía, se sube lo local. */
  async function initialSync() {
    if (!configured() || !signedIn()) return { skipped: true };
    setStatus("syncing");
    try {
      const remote = await remoteGet();
      if (remote && remoteHasData(remote.data)) {
        const localTs = U.store.updatedAt();
        const remoteTs = remote.updated_at || remote.data.__updatedAt;
        const remoteNewer = !localTs || (remoteTs && new Date(remoteTs) >= new Date(localTs));
        // Adoptar la nube si aquí no hay datos reales (equipo nuevo o datos
        // perdidos) o si la nube es más reciente. Nunca pisar datos locales
        // más nuevos con una copia vieja de la nube.
        if (localSeedOnly() || remoteNewer) {
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
