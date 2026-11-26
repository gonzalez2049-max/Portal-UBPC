/* ============================================================
   AGENDA UBPC — Calendario y próximos hitos (Coordinador)
   Reúne reuniones, plazos de planes, acciones comprometidas,
   evaluaciones, tareas del tablero, capacitaciones y colaboraciones.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  const TIPO = {
    reunion: { ic: "📅", c: "#12b5a5", lab: "Reunión" },
    planNT: { ic: "🛠️", c: "#e0912f", lab: "Plan NT 234" },
    accionRNAO: { ic: "🎯", c: "#7a5cd0", lab: "Acción RNAO" },
    evalRNAO: { ic: "🧭", c: "#1e9fe0", lab: "Evaluación RNAO" },
    tarea: { ic: "✅", c: "#37c6a0", lab: "Tarea del tablero" },
    capacitacion: { ic: "🎓", c: "#37a04a", lab: "Capacitación" },
    colaboracion: { ic: "🌐", c: "#1554b8", lab: "Colaboración" },
    medicion: { ic: "📏", c: "#0891b2", lab: "Medición de indicador" },
    protocolo: { ic: "📋", c: "#be185d", lab: "Revisión de protocolo" },
    champion: { ic: "⭐", c: "#ca8a04", lab: "Convocatoria Champions" },
    propio: { ic: "📌", c: "#e0526f", lab: "Evento propio" }
  };
  /* Categorías (configurables) y estados de las actividades.
     La CATEGORÍA dice qué es (reunión, capacitación…); el ESTADO dice en qué va. */
  const CAT_DEF = [
    { k: "reunion", lab: "Reunión", c: "#1e6fd9" }, { k: "capacitacion", lab: "Capacitación", c: "#7a5cd0" },
    { k: "jornada", lab: "Jornada", c: "#e0912f" }, { k: "presentacion", lab: "Presentación", c: "#e0528f" },
    { k: "auditoria", lab: "Auditoría", c: "#1f9d57" }, { k: "visita", lab: "Visita clínica", c: "#12b5a5" },
    { k: "documental", lab: "Gestión documental", c: "#7d8896" }, { k: "plazo", lab: "Plazo de entrega", c: "#d63a4a" },
    { k: "difusion", lab: "Difusión", c: "#e5b80b" }
  ];
  function cats() {
    const v = S().getConfig("agenda.categorias", null);
    return Array.isArray(v) && v.length ? v : CAT_DEF;
  }
  const catOf = k => cats().find(c => c.k === k) || { k: "", lab: "Sin categoría", c: "#b7c1cc" };
  const ESTADOS = [
    { k: "programada", lab: "Programada", c: "#1e6fd9" }, { k: "realizada", lab: "Realizada", c: "#1f9d57" },
    { k: "pendiente", lab: "Pendiente", c: "#e0912f" }, { k: "suspendida", lab: "Suspendida", c: "#8a94a6" },
    { k: "reprogramada", lab: "Reprogramada", c: "#7a5cd0" }
  ];
  const estOf = k => ESTADOS.find(e => e.k === k) || ESTADOS[0];
  // Categoría sugerida para lo que viene de otros módulos (sin modificar esos registros).
  function catDerivada(tipo, texto) {
    const t = String(texto || "").toLowerCase();
    if (tipo === "reunion" || tipo === "champion") return /capacit|curso|taller/.test(t) ? "capacitacion" : /difus|sensibil/.test(t) ? "difusion" : /audit|ronda/.test(t) ? "auditoria" : "reunion";
    if (tipo === "capacitacion") return "capacitacion";
    if (tipo === "evalRNAO" || tipo === "medicion") return "auditoria";
    if (tipo === "protocolo") return "documental";
    if (tipo === "colaboracion") return /visita/.test(t) ? "visita" : /capacit|curso|taller/.test(t) ? "capacitacion" : /difus|exposic/.test(t) ? "difusion" : "reunion";
    if (tipo === "planNT" || tipo === "accionRNAO" || tipo === "tarea") return "plazo";
    return "";
  }

  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  // Color propio por mes (para que el calendario no se vea plano y cada mes se distinga)
  const MES_COLOR = ["#1e9fe0", "#e0526f", "#37a04a", "#7a5cd0", "#12b5a5", "#e0912f", "#0891b2", "#be185d", "#0f8f83", "#ca8a04", "#5b34b0", "#1554b8"];
  const DOW = ["L", "M", "M", "J", "V", "S", "D"];
  const pad = n => String(n).padStart(2, "0");
  function isoDay(fecha) {
    const s = String(fecha); const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[1] + "-" + m[2] + "-" + m[3];
    const d = new Date(fecha); if (isNaN(d)) return null;
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  const dateFromIso = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };

  function buildEvents() {
    const s = S(), ev = [];
    const push = (fecha, titulo, tipo, ruta, opt) => {
      const iso = isoDay(fecha); if (!iso) return;
      ev.push(Object.assign({ iso, d: dateFromIso(iso), titulo, tipo, ruta }, opt || {}));
    };
    s.all("reuniones").forEach(r => push(r.fecha, r.tema || r.tipo || "Reunión", "reunion", "#/coord/m5"));
    s.all("planesNT234").forEach(r => push(r.plazo, "Plan de mejora NT 234 · " + (r.unidad || ""), "planNT", "#/coord/m1?tab=nt234&sub=planes", { deadline: true, done: /entreg|complet|cerr/i.test((r.estado || "") + " " + (r.subestado || "")), col: "planesNT234", rid: r.id, dateField: "plazo" }));
    s.all("accionesRNAO").forEach(r => push(r.fechaComprometida, "Acción de mejora · " + (r.guia || r.indicadorOrigen || ""), "accionRNAO", "#/coord/m3", { deadline: true, done: /complet/i.test(r.estado || ""), col: "accionesRNAO", rid: r.id, dateField: "fechaComprometida" }));
    s.all("evaluacionesRNAO").forEach(r => push(r.proximaMedicion, "Próxima evaluación · " + (r.guia || "") + (r.unidad ? " (" + r.unidad + ")" : ""), "evalRNAO", "#/coord/m3"));
    s.all("kanban").forEach(r => push(r.fechaLimite, r.titulo || r.tarea || "Tarea", "tarea", "#/coord/home", { deadline: true, done: /complet/i.test(r.columna || ""), col: "kanban", rid: r.id, dateField: "fechaLimite" }));
    s.all("actividades").forEach(r => push(r.fecha, "Capacitación · " + (r.actividad || ""), "capacitacion", "#/coord/m4", { estadoSrc: /complet|realiz/i.test(r.estado || "") ? "realizada" : /pendien/i.test(r.estado || "") ? "pendiente" : "" }));
    s.all("convocatoriaChampion").forEach(r => push(r.fecha, "Champions · " + (r.tipo || "Convocatoria") + (r.tema ? " · " + r.tema : ""), "champion", "#/coord/m3?tab=champion"));
    s.all("colaboraciones").forEach(r => push(r.fecha, "Colaboración · " + (r.institucion || ""), "colaboracion", "#/coord/m5?tab=colaboraciones", { extra: r.tipo || "" }));
    s.all("agendaEventos").forEach(r => {
      const startIso = isoDay(r.fecha); if (!startIso) return;
      const endIso = r.fechaFin ? isoDay(r.fechaFin) : startIso;
      const isRange = !!(endIso && endIso !== startIso);
      const base = { propio: true, id: r.id, hora: r.hora, nota: r.nota, rangeStart: startIso, rangeEnd: endIso, isRange };
      // Evento de un día → 1 entrada; evento con rango → una entrada por cada día (para verlo en todo el calendario).
      const cur = dateFromIso(startIso), end = dateFromIso(endIso);
      let guard = 0;
      while (cur <= end && guard < 400) {
        const iso = cur.getFullYear() + "-" + pad(cur.getMonth() + 1) + "-" + pad(cur.getDate());
        push(iso, r.titulo || "Evento", "propio", null, base);
        cur.setDate(cur.getDate() + 1); guard++;
      }
    });
    // Próxima medición de cada indicador según su periodicidad
    if (U.indicadoresUtil && U.indicadoresUtil.proximaMedicion) {
      s.all("indicadores").forEach(r => {
        const pm = U.indicadoresUtil.proximaMedicion(r);
        if (pm) push(pm.toISOString(), "Medición · " + (r.nombre || "Indicador"), "medicion", "#/coord/indicadores", { deadline: true });
      });
    }
    // Próxima revisión de protocolos de enfermería (según fecha + vigencia)
    if (U.protocolos && U.protocolos.proximaRevision) {
      s.all("protocolosEnf").forEach(r => {
        if (r.estadoFormato === "Obsoleto") return;
        const pr = U.protocolos.proximaRevision(r);
        if (pr) push(pr.toISOString(), "Revisión protocolo · " + (r.nombre || ""), "protocolo", "#/coord/m2?tab=protocolos", { deadline: true });
      });
    }
    const hoy0 = new Date(); hoy0.setHours(0, 0, 0, 0);
    ev.forEach(e => {
      if (e.propio) {
        const r = S().get("agendaEventos", e.id) || {};
        e.cat = r.categoria || ""; e.estado = r.estado || "programada";
      } else {
        e.cat = catDerivada(e.tipo, e.titulo + " " + (e.extra || ""));
        e.estado = e.estadoSrc || (e.done ? "realizada" : (e.deadline && e.d < hoy0) ? "pendiente" : "programada");
      }
    });
    return ev.sort((a, b) => a.d - b.d || String(a.hora || "").localeCompare(String(b.hora || "")));
  }

  function eventoForm(rec, done, preset) {
    const u = ui();
    u.modal({
      title: rec ? "Editar evento" : "Nuevo evento",
      body: u.formHTML([
        { name: "titulo", label: "Título del evento", required: true, full: true, value: rec ? rec.titulo : "" },
        { name: "fecha", label: "Fecha (desde)", type: "date", required: true, value: rec ? rec.fecha : (preset || u.hoyISO()) },
        { name: "fechaFin", label: "Fecha de término (opcional)", type: "date", value: rec && rec.fechaFin ? rec.fechaFin : "", hint: "Déjala vacía si el evento es de un solo día." },
        { name: "hora", label: "Hora (opcional)", type: "time", value: rec ? rec.hora : "" },
        { name: "categoria", label: "Categoría", type: "select", options: cats().map(c => ({ value: c.k, label: c.lab })), placeholder: "Sin categoría", value: rec ? (rec.categoria || "") : "" },
        { name: "estado", label: "Estado", type: "select", options: ESTADOS.map(e => ({ value: e.k, label: e.lab })), value: rec ? (rec.estado || "programada") : "programada" },
        { name: "nota", label: "Nota (opcional)", type: "textarea", full: true, value: rec ? rec.nota : "" }
      ], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.titulo || !d.fecha) { u.toast("Completa el título y la fecha", "danger"); return; }
          // Rango: si hay fecha de término y quedó antes del inicio, se intercambian.
          if (d.fechaFin) {
            if (d.fechaFin < d.fecha) { const t = d.fecha; d.fecha = d.fechaFin; d.fechaFin = t; }
            if (d.fechaFin === d.fecha) d.fechaFin = ""; // mismo día = un solo día
          }
          if (rec) S().update("agendaEventos", rec.id, d); else S().insert("agendaEventos", d);
          u.closeModal(); u.toast(rec ? "Evento actualizado" : "Evento agregado", "ok"); done();
        };
      }
    });
  }

  // Editar la fecha del plazo de un registro vencido (tarea, acción, plan)
  const LABEL_COL = { kanban: "tarea del tablero", accionesRNAO: "acción de mejora", planesNT234: "plan de mejora NT 234" };
  function editarFechaVencido(col, rid, field, done) {
    const u = ui();
    const rec = S().get(col, rid);
    if (!rec) { u.toast("El registro ya no existe", "warn"); if (done) done(); return; }
    const titulo = rec.titulo || rec.tarea || rec.accion || rec.unidad || "registro";
    u.modal({
      title: "Editar fecha del plazo",
      body: `<p class="card__hint">Nueva fecha para <strong>${u.esc(titulo)}</strong> (${LABEL_COL[col] || "registro"}).</p>`
        + u.formHTML([{ name: "fecha", label: "Fecha del plazo", type: "date", required: true, value: rec[field] ? u.isoDay(rec[field]) : u.hoyISO() }], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-ok>Guardar fecha</button>`,
      onMount(m) {
        m.querySelector("[data-ok]").onclick = () => {
          const d = u.readForm(m);
          if (!d.fecha) { u.toast("Indica la fecha", "danger"); return; }
          // Se ancla al mediodía local para evitar el desfase de un día
          S().update(col, rid, { [field]: new Date(d.fecha + "T12:00:00").toISOString() });
          u.closeModal(); u.toast("Fecha actualizada", "ok"); if (done) done();
        };
      }
    });
  }

  // Fila de un evento en las listas (día, próximos, vencidos). Reutilizable.
  function itemHTML(e, today, u) {
    const m = TIPO[e.tipo], over = e.deadline && !e.done && e.d < today;
    const dias = Math.round((e.d - today) / 86400000);
    const cuando = over ? `<span class="agc-when over">Vencido</span>`
      : dias === 0 ? `<span class="agc-when hoy">Hoy</span>`
      : dias === 1 ? `<span class="agc-when">Mañana</span>`
      : dias > 0 ? `<span class="agc-when">En ${dias} días</span>` : "";
    const meta = (e.isRange && e.rangeStart && e.rangeEnd)
      ? `Del ${u.fechaCL(dateFromIso(e.rangeStart))} al ${u.fechaCL(dateFromIso(e.rangeEnd))}${e.hora ? " · " + u.esc(e.hora) : ""} · ${m.lab}`
      : `${u.fechaCL(e.d)}${e.hora ? " · " + u.esc(e.hora) : ""} · ${m.lab}`;
    if (e.propio) {
      return `<div class="agc-item" style="--tc:${m.c}">
        <span class="agc-item__ic">${m.ic}</span>
        <div class="agc-item__body"><strong>${u.esc(e.titulo)}</strong>
          <span class="agc-item__meta">${meta}${e.nota ? " · " + u.esc(e.nota) : ""}</span></div>
        ${cuando}
        <span class="agc-item__acts"><button class="btn btn--ghost btn--sm" data-evedit="${e.id}" title="Editar">✏️</button>
        <button class="btn btn--ghost btn--sm" data-evdel="${e.id}" title="Eliminar">🗑️</button></span></div>`;
    }
    // Con origen editable (tarea, acción, plan): ofrece Editar fecha / Eliminar /
    // Ir al registro, en vez de navegar directamente al módulo.
    if (e.col && e.dateField) {
      const key = e.col + "|" + e.rid + "|" + e.dateField;
      return `<div class="agc-item${over ? " agc-item--venc" : ""}" style="--tc:${m.c}">
        <span class="agc-item__ic">${m.ic}</span>
        <div class="agc-item__body"><strong>${u.esc(e.titulo)}</strong>
          <span class="agc-item__meta">${meta}</span></div>
        ${cuando}
        <span class="agc-item__acts">
          <button class="btn btn--ghost btn--sm" data-vfecha="${key}" title="Editar fecha">📅 Fecha</button>
          <button class="btn btn--ghost btn--sm" data-vdel="${e.col}|${e.rid}" title="Eliminar">🗑️</button>
          ${e.ruta ? `<a class="btn btn--ghost btn--sm" href="${e.ruta}" title="Ir al registro">↗</a>` : ""}
        </span></div>`;
    }
    return `<a class="agc-item" href="${e.ruta}" style="--tc:${m.c}">
      <span class="agc-item__ic">${m.ic}</span>
      <div class="agc-item__body"><strong>${u.esc(e.titulo)}</strong>
        <span class="agc-item__meta">${meta}</span></div>
      ${cuando}</a>`;
  }

  // Próximos eventos en acordeón, agrupados por cercanía (más fácil de leer).
  function proxAccordion(list, today, u) {
    const dias = e => Math.round((e.d - today) / 86400000);
    const buckets = [
      { lab: "Hoy", ic: "📍", test: d => d === 0, open: true },
      { lab: "Mañana", ic: "🌅", test: d => d === 1, open: true },
      { lab: "Esta semana", ic: "🗓️", test: d => d >= 2 && d <= 7, open: true },
      { lab: "Próximas semanas", ic: "📆", test: d => d >= 8 && d <= 30, open: false },
      { lab: "Más adelante", ic: "⏳", test: d => d > 30, open: false }
    ];
    const groups = buckets.map(b => ({ b, items: list.filter(e => b.test(dias(e))) })).filter(g => g.items.length);
    if (!groups.length) return `<p class="muted" style="padding:.6rem">Sin eventos próximos.</p>`;
    return `<div class="agc-acc">` + groups.map(g =>
      `<details class="agc-acc__g"${g.b.open ? " open" : ""}>
        <summary class="agc-acc__sum">
          <span class="agc-acc__ic">${g.b.ic}</span>
          <span class="agc-acc__lab">${g.b.lab}</span>
          <span class="agc-acc__count">${g.items.length}</span>
          <span class="agc-acc__chev" aria-hidden="true">▸</span>
        </summary>
        <div class="agc-list agc-acc__body">${g.items.map(e => itemHTML(e, today, u)).join("")}</div>
      </details>`).join("") + `</div>`;
  }

  // Enlaza las acciones (editar/eliminar) de las filas de eventos dentro de un contenedor.
  function bindItemActions(root, done) {
    const u = ui();
    root.querySelectorAll("[data-evedit]").forEach(b => b.onclick = () => eventoForm(S().get("agendaEventos", b.dataset.evedit), done));
    root.querySelectorAll("[data-evdel]").forEach(b => b.onclick = () =>
      u.confirmDelete("¿Eliminar este evento?", () => { S().remove("agendaEventos", b.dataset.evdel); done(); }));
    root.querySelectorAll("[data-vfecha]").forEach(b => b.onclick = () => {
      const [col, rid, field] = b.dataset.vfecha.split("|");
      editarFechaVencido(col, rid, field, done);
    });
    root.querySelectorAll("[data-vdel]").forEach(b => b.onclick = () => {
      const [col, rid] = b.dataset.vdel.split("|");
      u.confirmDelete("¿Eliminar este registro vencido? Se quita de forma permanente.", () => { S().remove(col, rid); done(); });
    });
  }

  // Ventana emergente del día: muestra lo agendado y permite agregar AHÍ mismo,
  // sin usar el panel de abajo. `onChange` refresca el calendario tras cambios.
  function dayModal(iso, onChange) {
    const u = ui();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const evs = buildEvents().filter(e => e.iso === iso);
    const body = evs.length
      ? `<div class="agc-list">${evs.map(e => itemHTML(e, today, u)).join("")}</div>`
      : `<div class="agc-empty" style="padding:1rem .4rem"><span>📅</span>
          <p>No hay nada agendado este día. Agrégalo con el botón de abajo.</p></div>`;
    u.modal({
      title: "📅 " + u.fechaCL(dateFromIso(iso)),
      body,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>
        <button class="btn btn--primary" id="agc-modaladd">＋ Agregar evento este día</button>`,
      onMount(m) {
        m.querySelector("#agc-modaladd").onclick = () => eventoForm(null, onChange, iso);
        // Editar/eliminar cierran esta ventana (los modales no se apilan) y refrescan.
        bindItemActions(m, () => { u.closeModal(); onChange(); });
      }
    });
  }

  /* ===================== RECORDATORIOS (notificaciones del navegador) =====================
     Avisan de lo de hoy y lo vencido aunque el portal esté abierto en segundo plano.
     Se piden permiso una vez; luego se disparan al abrir y cada 30 min. */
  const REM_KEY = "ubpc:remindersOn", REM_LOG = "ubpc:remindersLog";
  function remSupported() { return typeof window !== "undefined" && "Notification" in window; }
  function remOn() { try { return localStorage.getItem(REM_KEY) === "1" && remSupported() && Notification.permission === "granted"; } catch (e) { return false; } }
  function remLog() { try { return JSON.parse(localStorage.getItem(REM_LOG) || "{}"); } catch (e) { return {}; } }
  function remSaveLog(o) { try { localStorage.setItem(REM_LOG, JSON.stringify(o)); } catch (e) {} }
  function enableReminders(cb) {
    if (!remSupported()) { ui().toast("Este dispositivo no admite recordatorios del navegador", "warn"); if (cb) cb(); return; }
    Notification.requestPermission().then(p => {
      if (p === "granted") { try { localStorage.setItem(REM_KEY, "1"); } catch (e) {} ui().toast("Recordatorios activados ✓", "ok"); checkReminders(); }
      else ui().toast("Permiso de notificaciones denegado por el navegador", "warn");
      if (cb) cb();
    }).catch(() => { if (cb) cb(); });
  }
  function disableReminders() { try { localStorage.setItem(REM_KEY, "0"); } catch (e) {} ui().toast("Recordatorios desactivados", "info"); }
  function checkReminders() {
    if (!remOn()) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayKey = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
    const log = remLog(); const dayLog = log[todayKey] || {};
    let fired = 0;
    buildEvents().forEach(e => {
      if (!e.d || e.done) return;
      const over = e.deadline && e.d < today;
      if (!(e.iso === todayKey || over)) return;
      const k = e.id || (e.tipo + "-" + e.iso + "-" + e.titulo);
      if (dayLog[k]) return;
      try {
        new Notification(over ? "⏰ Plazo vencido · UBPC" : "📅 Hoy en la agenda · UBPC", {
          body: (e.hora ? e.hora + " · " : "") + e.titulo + (over ? " (plazo vencido)" : ""),
          icon: "assets/img/huap-logo.png", tag: "ubpc-" + k
        });
        dayLog[k] = 1; fired++;
      } catch (err) {}
    });
    if (fired) { log[todayKey] = dayLog; remSaveLog(log); }
  }
  // Resumen breve al abrir el portal (toast), aunque no haya permiso de notificaciones.
  function resumenHoy() {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const in8 = new Date(today); in8.setDate(in8.getDate() + 8);
      const evs = buildEvents();
      const hoy = evs.filter(e => e.iso === (today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate())) && !e.done).length;
      const venc = evs.filter(e => e.deadline && !e.done && e.d < today).length;
      const prox = evs.filter(e => e.d >= today && e.d < in8 && !e.done).length;
      if (hoy || venc) {
        const partes = [];
        if (hoy) partes.push(hoy + " hoy");
        if (venc) partes.push(venc + " vencido" + (venc > 1 ? "s" : ""));
        if (prox && !hoy) partes.push(prox + " esta semana");
        ui().toast("📅 Agenda: " + partes.join(" · "), venc ? "danger" : "info");
      }
    } catch (e) {}
  }

  function agenda() {
    return `<div class="page-head"><h1>Agenda UBPC</h1>
      <p>Reuniones, plazos, acciones, evaluaciones y actividades de todos los módulos — más tus propios eventos y recordatorios.</p></div>
      <div id="agenda-body"></div>`;
  }

  /* ---------- Ficha de una actividad (abrir/editar desde el calendario) ---------- */
  function eventoDetalle(e, done) {
    const u = ui();
    if (e.propio) { eventoForm(S().get("agendaEventos", e.id), done); return; }
    const c = catOf(e.cat), st = estOf(e.estado), m = TIPO[e.tipo] || {};
    u.modal({
      title: "Actividad de la agenda",
      body: `<div class="agx-det">
        <div class="agx-det__t"><span class="agx-tag" style="--tc:${c.c}"></span>${u.esc(e.titulo)}</div>
        <div class="agx-det__m">${u.fechaCL(e.d)}${e.hora ? " · " + u.esc(e.hora) : ""}</div>
        <div class="agx-det__chips"><span class="agx-cat" style="--tc:${c.c}">${u.esc(c.lab)}</span>
          <span class="agx-est" style="--ec:${st.c}">${u.esc(st.lab)}</span><span class="agx-src">${m.ic || ""} Origen: ${u.esc(m.lab || "")}</span></div>
        <p class="kpi__sub" style="margin:.6rem 0 0">Esta actividad viene de otro módulo. Su fecha y su estado se editan en el registro de origen.</p></div>`,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>
        ${e.col && e.dateField ? `<button class="btn btn--ghost" id="agx-fecha">📅 Editar fecha</button>` : ""}
        ${e.ruta ? `<a class="btn btn--primary" href="${e.ruta}" id="agx-go">Abrir registro ↗</a>` : ""}`,
      onMount(m2) {
        const f = m2.querySelector("#agx-fecha"); if (f) f.onclick = () => editarFechaVencido(e.col, e.rid, e.dateField, () => { u.closeModal(); done(); });
        const g = m2.querySelector("#agx-go"); if (g) g.onclick = () => u.closeModal();
      }
    });
  }

  /* ---------- Gestión de categorías (seleccionar, agregar, editar) ---------- */
  function categoriasForm(done) {
    const u = ui();
    const row = c => `<div class="agx-crow" data-k="${u.esc(c.k)}"><input type="color" value="${c.c}" data-cc><input class="input input--sm" value="${u.esc(c.lab)}" data-cl placeholder="Nombre de la categoría"></div>`;
    u.modal({
      title: "Categorías de la agenda",
      body: `<p class="card__hint">Cambia el nombre o el color, o agrega nuevas. Las actividades conservan su categoría.</p>
        <div id="agx-cats" class="agx-cats">${cats().map(row).join("")}</div>
        <button type="button" class="btn btn--ghost btn--sm" id="agx-addcat">+ Agregar categoría</button>
        <button type="button" class="btn btn--ghost btn--sm" id="agx-defcat" style="margin-left:.3rem">↩️ Restaurar colores sugeridos</button>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar categorías</button>`,
      onMount(m) {
        const box = m.querySelector("#agx-cats");
        m.querySelector("#agx-addcat").onclick = () => box.insertAdjacentHTML("beforeend", row({ k: "c" + Date.now().toString(36), lab: "", c: "#0f8f83" }));
        m.querySelector("#agx-defcat").onclick = () => { box.innerHTML = CAT_DEF.concat(cats().filter(c => !CAT_DEF.some(d => d.k === c.k))).map(row).join(""); };
        m.querySelector("[data-save]").onclick = () => {
          const list = [...box.querySelectorAll(".agx-crow")].map(r => ({ k: r.dataset.k, lab: r.querySelector("[data-cl]").value.trim(), c: r.querySelector("[data-cc]").value })).filter(c => c.lab);
          if (!list.length) { u.toast("Debe quedar al menos una categoría", "danger"); return; }
          S().setConfig("agenda.categorias", list); u.closeModal(); u.toast("Categorías guardadas", "ok"); done();
        };
      }
    });
  }

  /* ===================== VISTA PRINCIPAL ===================== */
  function agendaBind() {
    const container = document.getElementById("agenda-body");
    const u = ui();
    const pref = k => { try { return localStorage.getItem("ubpc:agenda." + k); } catch (e) { return null; } };
    const savePref = (k, v) => { try { localStorage.setItem("ubpc:agenda." + k, v); } catch (e) {} };
    let vista = pref("vista") || "semana", finde = pref("finde") === "1";
    let cursor = new Date(); cursor.setHours(0, 0, 0, 0);
    const offCats = {}; let fEstado = "";
    const isoOf = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    const lunes = d => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
    const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const DOWL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    function rango() {
      if (vista === "dia") return { ini: new Date(cursor), fin: new Date(cursor) };
      if (vista === "semana") { const l = lunes(cursor); return { ini: l, fin: addD(l, finde ? 6 : 4) }; }
      const ini = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      return { ini, fin: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0) };
    }
    function mover(n) {
      if (vista === "dia") { cursor = addD(cursor, n); if (!finde) { while ([0, 6].includes(cursor.getDay())) cursor = addD(cursor, n || 1); } }
      else if (vista === "semana") cursor = addD(cursor, 7 * n);
      else cursor = new Date(cursor.getFullYear(), cursor.getMonth() + n, 1);
      draw();
    }
    function tituloRango(r) {
      if (vista === "dia") return DOWL[(r.ini.getDay() + 6) % 7] + " " + u.fechaCL(r.ini);
      if (vista === "semana") return "Semana del " + r.ini.getDate() + " " + MESES[r.ini.getMonth()].slice(0, 3) + " al " + r.fin.getDate() + " " + MESES[r.fin.getMonth()].slice(0, 3) + " " + r.fin.getFullYear();
      return MESES[r.ini.getMonth()][0].toUpperCase() + MESES[r.ini.getMonth()].slice(1) + " " + r.ini.getFullYear();
    }

    const draw = () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayIso = isoOf(today);
      const all = buildEvents();
      const events = all.filter(e => !offCats[e.cat || ""] && (!fEstado || e.estado === fEstado));
      const byIso = {}; events.forEach(e => { (byIso[e.iso] = byIso[e.iso] || []).push(e); });
      const uniq = arr => { const s = {}; return arr.filter(e => { if (e.propio && e.id) { if (s[e.id]) return false; s[e.id] = 1; } return true; }); };
      const in8 = addD(today, 8);
      const r = rango(), iniIso = isoOf(r.ini), finIso = isoOf(r.fin);
      const enRango = uniq(events.filter(e => e.iso >= iniIso && e.iso <= finIso));
      const vencidos = all.filter(e => e.deadline && !e.done && e.d < today);
      const ref = []; // eventos referenciados por índice (para abrirlos)
      const chip = (e, big) => { const c = catOf(e.cat), st = estOf(e.estado), i = ref.push(e) - 1;
        const over = e.deadline && !e.done && e.d < today;
        return `<button type="button" class="agx-ev${big ? " agx-ev--big" : ""}${over ? " is-over" : ""}${/suspend/.test(e.estado) ? " is-off" : ""}" data-ev="${i}" style="--tc:${c.c}" title="${u.esc(e.titulo)} · ${u.esc(c.lab)} · ${u.esc(st.lab)}">
          <span class="agx-tag"></span><span class="agx-ev__t">${e.hora ? `<b>${u.esc(e.hora)}</b> ` : ""}${u.esc(e.titulo)}</span>
          ${big ? `<span class="agx-ev__m"><span class="agx-cat" style="--tc:${c.c}">${u.esc(c.lab)}</span><span class="agx-est" style="--ec:${st.c}">${u.esc(st.lab)}</span>${e.nota ? `<span class="kpi__sub">${u.esc(e.nota)}</span>` : ""}</span>`
            : `<span class="agx-dot" style="--ec:${st.c}" title="${u.esc(st.lab)}"></span>`}</button>`; };

      let cuerpo = "";
      if (vista === "semana" || vista === "dia") {
        const ndays = vista === "dia" ? 1 : (finde ? 7 : 5);
        const cols = []; for (let i = 0; i < ndays; i++) cols.push(addD(r.ini, i));
        // Actividades de fin de semana ocultas: se avisa, no se pierden.
        const findeOcultos = vista === "semana" && !finde ? [5, 6].reduce((a, i) => a + (byIso[isoOf(addD(r.ini, i))] || []).length, 0) : 0;
        cuerpo = `<div class="agx-week" style="--nd:${ndays}">${cols.map(d => { const iso = isoOf(d), evs = byIso[iso] || [];
          return `<div class="agx-col${iso === todayIso ? " is-today" : ""}" data-iso="${iso}">
            <div class="agx-col__h"><span class="agx-col__dn">${DOWL[(d.getDay() + 6) % 7]}</span><b>${d.getDate()}</b><span class="agx-col__mn">${MESES[d.getMonth()]}</span><button type="button" class="agx-add" data-add="${iso}" title="Agregar actividad">＋</button></div>
            <div class="agx-col__b">${evs.length ? evs.map(e => chip(e, vista === "dia")).join("") : `<span class="agx-none">Sin actividades</span>`}</div></div>`; }).join("")}</div>
          ${findeOcultos ? `<p class="agx-note">ℹ️ Hay ${findeOcultos} actividad(es) el fin de semana. <button type="button" class="btn btn--ghost btn--sm" id="agx-verfinde">Mostrar fines de semana</button></p>` : ""}`;
      } else if (vista === "mes") {
        const y = r.ini.getFullYear(), mo = r.ini.getMonth(), days = r.fin.getDate();
        const ncol = finde ? 7 : 5;
        let cells = "", lead = (r.ini.getDay() + 6) % 7;
        if (!finde && lead > 4) lead = 0;
        for (let i = 0; i < lead; i++) cells += `<div class="agx-day agx-day--blank"></div>`;
        let findeOcultos = 0;
        for (let dn = 1; dn <= days; dn++) {
          const d = new Date(y, mo, dn), dow = (d.getDay() + 6) % 7, iso = isoOf(d), evs = byIso[iso] || [];
          if (!finde && dow > 4) { findeOcultos += evs.length; continue; }
          cells += `<div class="agx-day${iso === todayIso ? " is-today" : ""}" data-iso="${iso}"><div class="agx-day__h"><b>${dn}</b><button type="button" class="agx-add" data-add="${iso}" title="Agregar">＋</button></div>
            ${evs.slice(0, 4).map(e => chip(e)).join("")}${evs.length > 4 ? `<button type="button" class="agx-more" data-dia="${iso}">+${evs.length - 4} más</button>` : ""}</div>`;
        }
        cuerpo = `<div class="agx-mhead" style="--nc:${ncol}">${DOWL.slice(0, ncol).map(x => `<span>${x}</span>`).join("")}</div>
          <div class="agx-month" style="--nc:${ncol}">${cells}</div>
          ${findeOcultos ? `<p class="agx-note">ℹ️ Hay ${findeOcultos} actividad(es) en fines de semana. <button type="button" class="btn btn--ghost btn--sm" id="agx-verfinde">Mostrar fines de semana</button></p>` : ""}`;
      } else {
        // Listado del mes del cursor, agrupado por día
        const lista = enRango;
        const dias = [...new Set(lista.map(e => e.iso))];
        cuerpo = lista.length ? `<div class="agx-list">${dias.map(iso => { const d = dateFromIso(iso);
          return `<div class="agx-lday${iso === todayIso ? " is-today" : ""}"><div class="agx-lday__h"><b>${d.getDate()}</b><span>${DOWL[(d.getDay() + 6) % 7]}</span></div>
            <div class="agx-lday__b">${lista.filter(e => e.iso === iso).map(e => chip(e, true)).join("")}</div></div>`; }).join("")}</div>`
          : `<p class="agx-none" style="padding:1rem">Sin actividades en el período con los filtros elegidos.</p>`;
      }

      const legend = `<div class="agx-legend">${cats().concat([{ k: "", lab: "Sin categoría", c: "#b7c1cc" }]).map(c => `<button type="button" class="agx-leg${offCats[c.k] ? " is-off" : ""}" data-cat="${u.esc(c.k)}" style="--tc:${c.c}"><i></i>${u.esc(c.lab)}</button>`).join("")}
        <button type="button" class="agx-leg agx-leg--cfg" id="agx-cats">⚙️ Categorías</button></div>`;
      const remActivo = remOn();
      const SH = U.components.resource.secHead;
      container.innerHTML = `
        ${SH("📌", "Resumen", "Lo próximo, lo de esta semana y lo vencido")}
        <div class="grid grid--kpi agc-kpis">
          ${kpi("En el período", enRango.length, tituloRango(r), "info", "🗓️")}
          ${kpi("Próximos 7 días", uniq(events.filter(e => e.d >= today && e.d < in8)).length, "Desde hoy", "warn", "⏳")}
          ${kpi("Realizadas", enRango.filter(e => e.estado === "realizada").length, "En el período", "ok", "✅")}
          ${kpi("Vencidos", vencidos.length, "Plazos sin cerrar", vencidos.length ? "danger" : "ok", "⏰")}
        </div>
        ${SH("🗓️", "Calendario", "Haz clic en una actividad para abrirla o editarla · ＋ agrega una actividad ese día")}
        <div class="card agx-card agx-card--agua">
          <div class="agx-head">
            <div class="agx-nav"><button class="btn-icon" id="agx-prev" aria-label="Anterior">‹</button><button class="btn btn--ghost btn--sm" id="agx-hoy">Hoy</button><button class="btn-icon" id="agx-next" aria-label="Siguiente">›</button></div>
            <div class="agx-titlebox"><img class="agx-evi" src="assets/img/evi-agenda.webp" alt="" aria-hidden="true"><div><div class="agx-title">${tituloRango(r)}</div><div class="agx-sub">${{ dia: "Vista del día", semana: finde ? "Semana completa" : "Semana laboral · lunes a viernes", mes: "Vista mensual", lista: "Listado de actividades del mes" }[vista]}</div></div></div>
            <div class="agx-views" role="tablist">${[["dia", "Día"], ["semana", "Semana laboral"], ["mes", "Mes"], ["lista", "Listado"]].map(([k, l]) => `<button type="button" class="agx-vb${vista === k ? " is-on" : ""}" data-vista="${k}">${l}</button>`).join("")}</div>
          </div>
          <div class="agx-filters">
            ${legend}
            <div class="agx-tools">
              <select class="select input--sm" id="agx-est" aria-label="Estado"><option value="">Estado: todos</option>${ESTADOS.map(e => `<option value="${e.k}"${fEstado === e.k ? " selected" : ""}>${e.lab}</option>`).join("")}</select>
              <label class="agx-chk"><input type="checkbox" id="agx-finde"${finde ? " checked" : ""}> Fines de semana</label>
              <button class="btn btn--primary btn--sm" id="agc-newev">+ Nueva actividad</button></div>
          </div>
          <div class="agx-grid-wrap">${cuerpo}</div>
        </div>
        ${vencidos.length ? `${SH("⏰", "Vencidos (" + vencidos.length + ")", "Plazos sin cerrar · edita la fecha o abre el registro")}
          <div class="card agc-venc"><div class="agc-list" style="max-height:240px;overflow:auto">${vencidos.map(e => itemHTML(e, today, u)).join("")}</div></div>` : ""}
        <div class="agx-rem"><span class="kpi__sub">${remActivo ? "🔔 Recibirás avisos de lo de hoy y lo vencido." : "🔕 Activa los recordatorios para que el portal te avise."}</span>
          <button class="btn btn--${remActivo ? "ghost" : "primary"} btn--sm" id="agc-remind">${remActivo ? "🔔 Recordatorios activados" : "🔔 Activar recordatorios"}</button></div>`;

      const $ = id => document.getElementById(id);
      $("agx-prev").onclick = () => mover(-1); $("agx-next").onclick = () => mover(1);
      $("agx-hoy").onclick = () => { cursor = new Date(); cursor.setHours(0, 0, 0, 0); draw(); };
      container.querySelectorAll("[data-vista]").forEach(b => b.onclick = () => { vista = b.dataset.vista; savePref("vista", vista); draw(); });
      $("agx-est").onchange = e => { fEstado = e.target.value; draw(); };
      $("agx-finde").onchange = e => { finde = e.target.checked; savePref("finde", finde ? "1" : "0"); draw(); };
      const vf = $("agx-verfinde"); if (vf) vf.onclick = () => { finde = true; savePref("finde", "1"); draw(); };
      $("agc-newev").onclick = () => eventoForm(null, draw);
      $("agx-cats").onclick = () => categoriasForm(draw);
      container.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { const k = b.dataset.cat; offCats[k] = !offCats[k]; draw(); });
      container.querySelectorAll("[data-ev]").forEach(b => b.onclick = ev => { ev.stopPropagation(); eventoDetalle(ref[Number(b.dataset.ev)], draw); });
      container.querySelectorAll("[data-add]").forEach(b => b.onclick = ev => { ev.stopPropagation(); eventoForm(null, draw, b.dataset.add); });
      container.querySelectorAll("[data-dia]").forEach(b => b.onclick = ev => { ev.stopPropagation(); dayModal(b.dataset.dia, draw); });
      const rem = $("agc-remind"); if (rem) rem.onclick = () => { if (remOn()) { disableReminders(); draw(); } else { enableReminders(draw); } };
      bindItemActions(container, draw);
    };
    draw();

    if (/[?&]focus=vencidos/.test(location.hash)) {
      setTimeout(() => {
        const card = container.querySelector(".agc-venc") || container.querySelector(".kpi--danger");
        if (card) {
          card.classList.add("is-spotlight");
          try { card.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
          setTimeout(() => card.classList.remove("is-spotlight"), 5400);
        }
      }, 120);
    }
  }

  function kpi(label, value, sub, kind, icon) {
    const u = ui();
    return `<div class="card kpi kpi--${kind || "info"}">
      <div class="kpi__top"><div class="kpi__label">${u.esc(label)}</div><div class="kpi__ico">${icon || ""}</div></div>
      <div class="kpi__value">${value}</div><div class="kpi__sub">${u.esc(sub || "")}</div></div>`;
  }

  U.coord.views.agenda = agenda;
  U.coord.binders.agenda = agendaBind;
  U.agenda = U.agenda || {};
  U.agenda.buildEvents = buildEvents;   // reutilizable por el Home (próximos eventos)
  U.agenda.checkReminders = checkReminders;   // recordatorios (notificaciones del navegador)
  U.agenda.enableReminders = enableReminders;
  U.agenda.remOn = remOn;
  U.agenda.resumenHoy = resumenHoy;
})();
