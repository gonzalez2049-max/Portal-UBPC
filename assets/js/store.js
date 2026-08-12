/* ============================================================
   STORE — Persistencia local, trazabilidad y códigos automáticos
   Portal UBPC / HUAP
   ============================================================ */
(function () {
  "use strict";

  const ROOT = "ubpc:db:v1";
  const SCHEMA_VERSION = 1;

  // Colecciones del portal. Agregar nuevas NO borra las existentes.
  const COLLECTIONS = [
    "usuarios", "apoyoMejora", "documentos", "guiasBPSO", "evaluacionesRNAO",
    "accionesRNAO", "redChampion", "actividades", "edicionesEVI", "reconocimientos",
    "reuniones", "acuerdos", "articulaciones", "respaldos", "solicitudes", "nt234",
    "planesNT234", "colaboraciones", "notificaciones", "hitos", "kanban",
    "bibliotecaBitacora", "evidenciaRef", "capacitacionRef", "monitoreoRef",
    "indicadores", "capacidadOperativa", "planesIntervencion", "protocolosEnf", "evidenciaSemana", "actividadReciente", "docsTrabajo", "agendaEventos", "recursosGuia",
    "participacionChampion", "convocatoriaChampion", "codigosInternos", "config"
  ];

  // Prefijos de códigos automáticos por colección
  const CODE_PREFIX = {
    solicitudes: "SOL", reuniones: "REU", acuerdos: "ACU",
    documentos: "DOC", edicionesEVI: "EVI", colaboraciones: "COL",
    actividades: "CAP", articulaciones: "ART", accionesRNAO: "ACC",
    evidenciaSemana: "EVA", docsTrabajo: "DOC", planesIntervencion: "PIN", protocolosEnf: "PRO"
  };

  function emptyDB() {
    const db = { __schema: SCHEMA_VERSION, __seq: {} };
    COLLECTIONS.forEach(c => { db[c] = []; });
    return db;
  }

  function load() {
    let db;
    try {
      const raw = localStorage.getItem(ROOT);
      db = raw ? JSON.parse(raw) : null;
    } catch (e) { db = null; }
    if (!db) db = emptyDB();
    // Migración tolerante: nunca elimina datos; solo agrega lo faltante.
    if (typeof db.__schema !== "number") db.__schema = SCHEMA_VERSION;
    if (!db.__seq) db.__seq = {};
    COLLECTIONS.forEach(c => { if (!Array.isArray(db[c])) db[c] = []; });
    return db;
  }

  let DB = load();
  let _onPersist = null;

  function persist() {
    DB.__updatedAt = new Date().toISOString();
    try { localStorage.setItem(ROOT, JSON.stringify(DB)); }
    catch (e) { console.error("No se pudo guardar:", e); }
    try { if (typeof _onPersist === "function") _onPersist(); } catch (e) {}
  }

  function uid() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function currentUserName() {
    const u = window.UBPC && UBPC.auth && UBPC.auth.current();
    return u ? u.nombre : "Sistema";
  }

  /* ---------- Códigos automáticos: UBPC-XXX-AAAA-000 ---------- */
  function nextCode(collection, year) {
    const prefix = CODE_PREFIX[collection];
    if (!prefix) return null;
    year = year || new Date().getFullYear();
    const key = prefix + "-" + year;
    DB.__seq[key] = (DB.__seq[key] || 0) + 1;
    const n = String(DB.__seq[key]).padStart(3, "0");
    return `UBPC-${prefix}-${year}-${n}`;
  }
  // Muestra el próximo código SIN avanzar el contador (para previsualizar)
  function peekCode(collection, year) {
    const prefix = CODE_PREFIX[collection];
    if (!prefix) return null;
    year = year || new Date().getFullYear();
    const key = prefix + "-" + year;
    const n = String((DB.__seq[key] || 0) + 1).padStart(3, "0");
    return `UBPC-${prefix}-${year}-${n}`;
  }

  /* ---------- API CRUD con trazabilidad ---------- */
  const Store = {
    SCHEMA_VERSION,
    collections: COLLECTIONS,

    all(collection) {
      return (DB[collection] || []).slice();
    },

    get(collection, id) {
      return (DB[collection] || []).find(r => r.id === id) || null;
    },

    // Inserta con metadatos de trazabilidad y (si corresponde) código automático.
    insert(collection, data, opts) {
      opts = opts || {};
      const now = new Date().toISOString();
      const user = currentUserName();
      const rec = Object.assign({}, data, {
        id: data.id || uid(),
        esquemaVersion: SCHEMA_VERSION,
        creadoPor: user,
        fechaCreacion: now,
        modificadoPor: user,
        fechaModificacion: now
      });
      if (opts.withCode && CODE_PREFIX[collection] && !rec.codigo) {
        rec.codigo = nextCode(collection, opts.year);
      }
      if (!DB[collection]) DB[collection] = [];
      DB[collection].push(rec);
      persist();
      if (opts.silent !== true) logActivity(collection, "creó", rec);
      return rec;
    },

    // Actualiza preservando campos antiguos (compatibilidad histórica).
    update(collection, id, patch) {
      const rec = Store.get(collection, id);
      if (!rec) return null;
      Object.assign(rec, patch, {
        modificadoPor: currentUserName(),
        fechaModificacion: new Date().toISOString()
      });
      persist();
      logActivity(collection, "editó", rec);
      return rec;
    },

    // Marca de revisión / cierre (trazabilidad de quién revisó/cerró).
    stamp(collection, id, field) {
      const rec = Store.get(collection, id);
      if (!rec) return null;
      rec[field + "Por"] = currentUserName();
      rec["fecha" + field.charAt(0).toUpperCase() + field.slice(1)] = new Date().toISOString();
      persist();
      return rec;
    },

    remove(collection, id) {
      const arr = DB[collection] || [];
      const i = arr.findIndex(r => r.id === id);
      if (i >= 0) {
        const rec = arr[i];
        arr.splice(i, 1);
        persist();
        logActivity(collection, "eliminó", rec);
        return true;
      }
      return false;
    },

    // Persistencia directa de reordenamientos (Kanban, etc.)
    replaceAll(collection, records) {
      DB[collection] = records;
      persist();
    },

    nextCode, peekCode,

    // Configuración simple clave/valor
    getConfig(key, def) {
      const c = (DB.config || []).find(x => x.key === key);
      return c ? c.value : def;
    },
    setConfig(key, value) {
      let c = (DB.config || []).find(x => x.key === key);
      if (c) { c.value = value; } else { DB.config.push({ id: uid(), key, value }); }
      persist();
    },

    /* ---------- Respaldo / trazabilidad global ---------- */
    exportJSON() { return JSON.stringify(DB, null, 2); },
    importJSON(json) {
      const incoming = typeof json === "string" ? JSON.parse(json) : json;
      COLLECTIONS.forEach(c => { if (!Array.isArray(incoming[c])) incoming[c] = []; });
      if (!incoming.__seq) incoming.__seq = {};
      incoming.__schema = SCHEMA_VERSION;
      DB = incoming;
      persist();
    },
    reset() { DB = emptyDB(); persist(); },
    raw() { return DB; },

    /* ---------- Sincronización en la nube ---------- */
    updatedAt() { return DB.__updatedAt || null; },
    // Registra un callback que se dispara tras cada guardado local (para subir a la nube).
    onPersist(fn) { _onPersist = fn; },
    // Carga datos traídos de la nube SIN volver a marcar cambios (evita re-subidas).
    loadFromCloud(obj) {
      if (!obj || typeof obj !== "object") return;
      COLLECTIONS.forEach(c => { if (!Array.isArray(obj[c])) obj[c] = []; });
      if (!obj.__seq) obj.__seq = {};
      obj.__schema = SCHEMA_VERSION;
      DB = obj;
      try { localStorage.setItem(ROOT, JSON.stringify(DB)); } catch (e) {}
    }
  };

  /* ---------- Registro de actividad reciente ---------- */
  const LABELS = {
    apoyoMejora: "Apoyo y Mejora", documentos: "Gestión Documental",
    evaluacionesRNAO: "Evaluación RNAO", accionesRNAO: "Acción de mejora RNAO",
    actividades: "Capacitación", edicionesEVI: "EVI", reconocimientos: "Reconocimiento",
    reuniones: "Reunión", acuerdos: "Acuerdo", articulaciones: "Articulación",
    solicitudes: "Solicitud de apoyo", colaboraciones: "Colaboración",
    guiasBPSO: "Guía BPSO", hitos: "Hito", kanban: "Tablero",
    bibliotecaBitacora: "Biblioteca Digital", evidenciaRef: "Evidencia",
    capacitacionRef: "Capacitación por turno", monitoreoRef: "Monitoreo",
    planesNT234: "Plan de mejora NT 234"
  };
  function logActivity(collection, verb, rec) {
    if (collection === "actividadReciente" || collection === "notificaciones" || collection === "config") return;
    const title = rec.titulo || rec.tema || rec.nombre || rec.actividad || rec.codigo || rec.recurso || "registro";
    DB.actividadReciente.unshift({
      id: uid(),
      modulo: LABELS[collection] || collection,
      verbo: verb,
      titulo: String(title).slice(0, 90),
      usuario: currentUserName(),
      fecha: new Date().toISOString()
    });
    DB.actividadReciente = DB.actividadReciente.slice(0, 60);
    persist();
  }

  window.UBPC = window.UBPC || {};
  window.UBPC.store = Store;
})();
