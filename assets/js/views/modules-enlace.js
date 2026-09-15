/* ============================================================
   ENLACE COORDINACIÓN ⇄ REFERENTE TÉCNICO
   Hub del lado del Coordinador para conectarse con el Referente:
   identidad, actividad operativa, solicitudes en ambos sentidos,
   asignación directa de tareas y seguimiento.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, R = () => U.components.resource;

  const E = () => (U.solicitudes && U.solicitudes.E) || {};

  /* ---------- Asignar tarea directa al Referente ---------- */
  function asignarTarea(onDone) {
    const u = ui();
    const ref = U.auth.referente();
    const fields = [
      { name: "titulo", label: "Tarea para el Referente", required: true, full: true },
      { name: "prioridad", label: "Prioridad", type: "select", options: ["alta", "media", "baja"], value: "media" },
      { name: "fechaLimite", label: "Fecha límite", type: "date" },
      { name: "nota", label: "Instrucción o detalle", type: "textarea", full: true }
    ];
    u.modal({
      title: "Asignar tarea al Referente Técnico",
      body: `<p class="card__hint">La tarea aparecerá en el tablero del Referente y recibirá una notificación. Podrás seguir su avance desde aquí.</p>${u.formHTML(fields, { prioridad: "media" })}`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Asignar tarea</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.titulo) { u.toast("Escribe el título de la tarea", "danger"); return; }
          const me = U.auth.current();
          const max = Math.max(0, ...S().all("kanban").filter(c => c.owner === "referente").map(c => c.orden || 0));
          const nueva = S().insert("kanban", {
            owner: "referente", columna: "Pendiente", titulo: d.titulo,
            prioridad: d.prioridad || "media", fechaLimite: d.fechaLimite || "",
            responsable: ref ? ref.nombre : "Referente Técnico",
            asignadoPor: me ? me.nombre : "Coordinación",
            nota: d.nota || "", orden: max + 1
          }, { withCode: true });
          ensureTaskBank(nueva); // deja el código en el banco de códigos
          U.notif.push({
            titulo: "Nueva tarea asignada: " + d.titulo, modulo: "Enlace con Coordinación",
            prioridad: d.prioridad === "alta" ? "alta" : "normal",
            destinatario: "referente", ref: "#/ref/inicio"
          });
          u.closeModal(); u.toast("Tarea asignada al Referente", "ok");
          if (onDone) onDone();
        };
      }
    });
  }

  const TABS = [
    { key: "tareas", label: "Tareas asignadas", color: "#12b5a5" },
    { key: "solicitudes", label: "Solicitudes", color: "#1554b8" },
    { key: "actividad", label: "Actividad operativa", color: "#7a5cd0" }
  ];
  const tabActivo = params => {
    const t = params && params.tab;
    if (t && TABS.some(x => x.key === t)) return t;
    if (params && params.focus === "solicitudes") return "solicitudes";
    return "tareas";
  };

  /* ---------- Programar (agendar) una reunión con el Referente ---------- */
  function programarReunion(onDone) {
    const u = ui();
    const ref = U.auth.referente();
    const me = U.auth.current();
    const fields = [
      { name: "fecha", label: "Fecha de la reunión", type: "date", required: true, value: u.hoyISO() },
      { name: "hora", label: "Hora", type: "time" },
      { name: "tema", label: "Tema de la reunión", required: true, full: true },
      { name: "modalidad", label: "Modalidad", type: "select", options: ["Presencial", "Videollamada", "Teléfono"] },
      { name: "lugar", label: "Lugar o enlace (sala / link)", full: true },
      { name: "objetivo", label: "Objetivo / temas a tratar", type: "textarea", full: true }
    ];
    u.modal({
      title: "Programar reunión con el Referente",
      body: `<p class="card__hint">Se <strong>agenda una nueva reunión</strong> con ${u.esc(ref ? ref.nombre : "el Referente")}, aparece en la Agenda y se le notifica. (Para registrar una reunión ya realizada, usa el módulo Reuniones.)</p>${u.formHTML(fields, { modalidad: "Presencial" })}`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>📅 Agendar reunión</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.fecha || !d.tema) { u.toast("Indica fecha y tema de la reunión", "danger"); return; }
          const rec = S().insert("reuniones", {
            fecha: d.fecha, hora: d.hora || "", tema: d.tema, tipo: "Reunión con el Referente",
            modalidad: d.modalidad || "Presencial", lugar: d.lugar || "", objetivo: d.objetivo || "",
            responsable: me ? me.nombre : "Coordinación", referente: ref ? ref.nombre : "Referente Técnico",
            convocadoPor: me ? me.nombre : "Coordinación", estado: "Programada"
          }, { withCode: true });
          U.notif.push({
            titulo: "Reunión programada: " + d.tema, modulo: "Reunión de seguimiento",
            prioridad: "normal", destinatario: "referente", ref: "#/ref/gestion?tab=reunion"
          });
          u.closeModal();
          u.toast("Reunión agendada" + (rec.codigo ? " · " + rec.codigo : "") + " · " + u.fechaCL(d.fecha), "ok");
          if (onDone) onDone();
        };
      }
    });
  }

  /* ---------- Vista principal ---------- */
  function enlace(params) {
    const u = ui();
    const ref = U.auth.referente();

    if (!ref) {
      return `<div class="page-head"><h1>Enlace con el Referente Técnico</h1>
        <p>Aún no hay un Referente Técnico registrado. Créalo para habilitar el trabajo conjunto.</p></div>
        ${u.empty("Sin Referente Técnico", "Agrégalo desde Usuarios y perfiles con el rol “Referente Técnico”.", "🧑‍⚕️")}
        <div class="section"><a class="btn btn--primary" href="#/coord/usuarios">Ir a Usuarios y perfiles →</a></div>`;
    }

    const sols = S().all("solicitudes");
    const alRef = sols.filter(s => (s.direccion || "coord-a-ref") === "coord-a-ref");
    const delRef = sols.filter(s => s.direccion === "ref-a-coord");
    const abiertasRef = alRef.filter(s => !/cerrad/i.test(s.estado || ""));
    const esperanCoord = delRef.filter(s => !/cerrad/i.test(s.estado || ""));

    const tareas = S().all("kanban").filter(c => c.owner === "referente");
    const tareasPend = tareas.filter(c => c.columna !== "Completado");
    const tareasHechas = tareas.filter(c => c.columna === "Completado");

    const tab = tabActivo(params);

    return `<div class="page-head"><h1>Enlace con el Referente Técnico</h1>
      <p>Tu espacio de trabajo conjunto con el Referente: solicitudes, tareas asignadas y su actividad operativa, en tiempo real.</p></div>

    <div class="enl-grid">
      <div class="card enl-id">
        <div class="enl-id__row">
          <div class="avatar avatar--lg" style="background:var(--c-turquesa)">${ref.foto ? `<img src="${u.esc(ref.foto)}">` : u.initials(ref.nombre)}</div>
          <div class="enl-id__meta">
            <span class="tag tag--role">Referente Técnico</span>
            <h2>${u.esc(ref.nombre)}</h2>
            <div class="muted">${u.esc(ref.cargo || "")}</div>
            <div class="kpi__sub">🏥 ${u.esc(ref.unidad || "UBPC – HUAP")}</div>
          </div>
        </div>
        <div class="enl-actions">
          <button class="btn btn--primary btn--sm" id="enlSolicitud">📨 Enviar solicitud técnica</button>
          <button class="btn btn--sm" id="enlTarea" style="background:var(--c-turquesa);color:#fff">✅ Asignar tarea</button>
          <button class="btn btn--ghost btn--sm" id="enlReunion">📅 Programar reunión</button>
        </div>
      </div>

      <div class="card enl-stat">
        <div class="enl-stat__grid">
          <a class="enl-chip enl-chip--warn" href="#/coord/enlace?tab=solicitudes"><b>${esperanCoord.length}</b><span>Esperan tu respuesta</span></a>
          <a class="enl-chip enl-chip--info" href="#/coord/enlace?tab=solicitudes"><b>${abiertasRef.length}</b><span>Solicitudes activas al Referente</span></a>
          <a class="enl-chip enl-chip--tq" href="#/coord/enlace?tab=tareas"><b>${tareasPend.length}</b><span>Tareas en curso</span></a>
          <a class="enl-chip enl-chip--ok" href="#/coord/enlace?tab=tareas"><b>${tareasHechas.length}</b><span>Tareas completadas</span></a>
        </div>
      </div>
    </div>

    ${R().tabsBar("coord", "enlace", TABS, tab)}
    <div id="enl-tab"></div>`;
  }

  /* ---------- Tabla de tareas (mismo formato que las solicitudes) ---------- */
  const TAREA_ESTADOS = ["Pendiente", "En curso", "Completado"];
  function estadoTareaBadge(v, u) {
    const map = { "Pendiente": ["#8a94a6", "✏️"], "En curso": ["#e0912f", "🔄"], "Completado": ["#1f9d57", "✅"] };
    const m = map[v] || ["#8a94a6", ""];
    return `<span class="doc-estado doc-estado--sm" style="--ec:${m[0]}">${m[1]} ${u.esc(v || "—")}</span>`;
  }
  function prioridadBadge(v, u) {
    return v === "alta" ? `<span class="badge badge--danger">Alta</span>`
      : `<span class="tag" style="text-transform:capitalize">${u.esc(v || "media")}</span>`;
  }
  // Detalle de una tarea
  function tareaDetalle(rec, onChange) {
    const u = ui();
    const soyCoord = U.auth.isCoordinador && U.auth.isCoordinador();
    const idx = TAREA_ESTADOS.indexOf(rec.columna || "Pendiente");
    u.modal({
      title: "Tarea " + (rec.codigo || ""), wide: true,
      body: `<div class="dl">
          <div><span>Código</span><strong class="mono">${u.esc(rec.codigo || "—")}</strong></div>
          <div><span>Estado</span><strong>${estadoTareaBadge(rec.columna, u)}</strong></div>
          <div><span>Prioridad</span><strong>${prioridadBadge(rec.prioridad, u)}</strong></div>
          <div><span>Fecha límite</span><strong>${rec.fechaLimite ? u.fechaCL(rec.fechaLimite) : "—"}</strong></div>
          <div><span>Asignada por</span><strong>${u.esc(rec.asignadoPor || "Coordinación")}</strong></div>
          <div><span>Responsable</span><strong>${u.esc(rec.responsable || "Referente Técnico")}</strong></div>
        </div>
        <div style="grid-column:1/-1"><span class="muted" style="font-size:12px;font-weight:600">Instrucción / detalle</span>
          <p class="narrativo">${u.esc(rec.nota || "—")}</p></div>`,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>`
        + (idx >= 0 && idx < TAREA_ESTADOS.length - 1 ? `<button class="btn btn--primary" data-next>Marcar “${TAREA_ESTADOS[idx + 1]}”</button>` : ""),
      onMount(m) {
        const nb = m.querySelector("[data-next]");
        if (nb) nb.onclick = () => {
          const completada = TAREA_ESTADOS[idx + 1] === "Completado";
          S().update("kanban", rec.id, { columna: TAREA_ESTADOS[idx + 1], fechaCompletada: completada ? new Date().toISOString() : rec.fechaCompletada });
          u.closeModal(); u.toast("Estado actualizado", "ok"); if (onChange) onChange();
        };
      }
    });
  }
  // Asegura que la tarea tenga código y lo deja en el banco de códigos (codigosInternos),
  // para trazabilidad y control de producción — igual que el resto de registros.
  function ensureTaskBank(rec) {
    if (!rec || !rec.id) return;
    let codigo = rec.codigo;
    if (!codigo) { codigo = S().nextCode("kanban"); if (codigo) { S().update("kanban", rec.id, { codigo }); rec.codigo = codigo; } }
    if (codigo && !S().all("codigosInternos").some(c => c.codigo === codigo)) {
      const me = U.auth.current();
      S().insert("codigosInternos", {
        codigo, familia: "kanban", familiaLabel: "Tarea del Referente",
        tipo: "Tarea asignada", nombre: rec.titulo || "Tarea",
        responsable: rec.asignadoPor || (me ? me.nombre : "Coordinación"),
        fecha: rec.fechaCreacion || new Date().toISOString()
      });
    }
  }
  function syncTaskBank() {
    S().all("kanban").filter(t => (t.owner || "coordinador") === "referente").forEach(ensureTaskBank);
  }

  // Tabla de tareas — mode "coord" (crea/edita/borra) o "ref" (actualiza estado)
  function tareasTable(box, mode) {
    const u = ui();
    const manage = mode === "coord";
    syncTaskBank(); // asigna códigos faltantes y los deja en el banco de códigos
    R().mount(box, {
      collection: "kanban", title: "Tarea", icon: "✅", withCode: true, readOnly: !manage,
      hint: manage ? "Tareas asignadas al Referente, con código, prioridad, fecha límite y estado."
        : "Tareas que te asignó la Coordinación. Ábrelas para ver el detalle y actualizar su estado.",
      newLabel: "Asignar tarea",
      emptyMsg: "Aún no hay tareas asignadas.",
      emptySub: manage ? "Asigna la primera tarea con “+ Asignar tarea”." : "Cuando la Coordinación te asigne tareas, aparecerán aquí.",
      filter: r => (r.owner || "coordinador") === "referente",
      filters: [{ key: "columna", label: "Estado" }, { key: "prioridad", label: "Prioridad" }],
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "titulo", label: "Tarea" },
        { key: "prioridad", label: "Prioridad", render: (r) => prioridadBadge(r.prioridad, u) },
        { key: "fechaLimite", label: "Fecha límite", date: true },
        { key: "asignadoPor", label: "Asignada por" },
        { key: "columna", label: "Estado", render: (r) => estadoTareaBadge(r.columna, u) }
      ],
      fields: [
        { name: "titulo", label: "Tarea para el Referente", required: true, full: true },
        { name: "prioridad", label: "Prioridad", type: "select", options: ["alta", "media", "baja"] },
        { name: "fechaLimite", label: "Fecha límite", type: "date" },
        { name: "columna", label: "Estado", type: "select", options: TAREA_ESTADOS },
        { name: "nota", label: "Instrucción o detalle", type: "textarea", full: true }
      ],
      defaults: () => ({ owner: "referente", columna: "Pendiente", prioridad: "media" }),
      onBeforeSave: (d, rec) => {
        if (!rec) {
          const me = U.auth.current(); const ref = U.auth.referente();
          d.owner = "referente"; d.asignadoPor = me ? me.nombre : "Coordinación";
          d.responsable = ref ? ref.nombre : "Referente Técnico";
        }
        return d;
      },
      afterSave: () => { syncTaskBank(); if (manage) U.notif.push({ titulo: "Nueva tarea asignada", modulo: "Enlace con Coordinación", destinatario: "referente", ref: "#/ref/seguimiento?tab=tareas" }); },
      afterChange: () => syncTaskBank(),
      canDelete: () => manage,
      detail: (rec, refresh) => tareaDetalle(rec, () => { if (refresh) refresh(); }),
      rowActions: manage ? [] : [
        { ico: "🔄", title: "Actualizar estado", show: (r) => (r.columna || "Pendiente") !== "Completado",
          fn: (rec, refresh) => tareaDetalle(rec, () => { if (refresh) refresh(); }) }
      ]
    });
  }

  /* ---------- Contenido por pestaña ---------- */
  function renderTareas(box) {
    box.innerHTML = `<div class="section__head"><div><h2 class="section__title">Tareas asignadas</h2>
        <p class="section__hint">Lo que le encargas al Referente, con código y estado — igual que las solicitudes.</p></div></div>
      <div id="enl-tareas-tbl"></div>`;
    tareasTable(box.querySelector("#enl-tareas-tbl"), "coord");
  }

  function renderActividad(box) {
    const u = ui();
    const act = [
      ["🔬", "Evidencia y recomendación", S().all("evidenciaSemana").length, "#/ref/evidencia"],
      ["📈", "Monitoreo e implementación", S().all("monitoreoRef").length, "#/ref/monitoreo"],
      ["🎓", "Capacitación por turno", S().all("capacitacionRef").length, "#/ref/capacitacion"],
      ["📚", "Bitácora Biblioteca", S().all("bibliotecaBitacora").length, "#/ref/biblioteca"]
    ];
    box.innerHTML = `
      <div class="section__head"><div><h2 class="section__title">Actividad operativa del Referente</h2>
        <p class="section__hint">Registros que el Referente lleva en su portal (se actualizan al sincronizar).</p></div></div>
      <div class="grid grid--kpi">
        ${act.map(a => `<a class="card enl-act" href="${a[3]}">
          <div class="enl-act__ico">${a[0]}</div>
          <div class="enl-act__n">${a[2]}</div>
          <div class="enl-act__l">${a[1]}</div>
          <div class="kpi__sub">${a[2] ? "Ver registros →" : "Sin registros aún"}</div></a>`).join("")}
      </div>`;
  }

  function renderSolicitudes(box) {
    box.innerHTML = `
      <div class="section__head"><div><h2 class="section__title">Solicitudes con el Referente</h2>
        <p class="section__hint">Flujo de solicitudes en ambos sentidos, con código, estado y cierre.</p></div></div>
      <div id="enl-sol-body"></div>`;
    const panel = box.querySelector("#enl-sol-body");
    if (panel && U.solicitudes) U.solicitudes.coordPanel(panel);
    if (panel && /[?&]focus=solicitudes/.test(location.hash)) {
      setTimeout(() => {
        panel.classList.add("is-spotlight");
        try { panel.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
        setTimeout(() => panel.classList.remove("is-spotlight"), 5400);
      }, 140);
    }
  }

  function enlaceBind(main, params) {
    const rerender = () => U.router.render();
    const s = document.getElementById("enlSolicitud");
    if (s) s.onclick = () => U.solicitudes.crearDesde("Enlace con el Referente", {}, rerender);
    const t = document.getElementById("enlTarea");
    if (t) t.onclick = () => asignarTarea(rerender);
    const rm = document.getElementById("enlReunion");
    if (rm) rm.onclick = () => programarReunion(rerender);

    const box = document.getElementById("enl-tab");
    if (!box) return;
    const tab = tabActivo(params);
    if (tab === "solicitudes") renderSolicitudes(box);
    else if (tab === "actividad") renderActividad(box);
    else renderTareas(box);
  }

  // Registrar en el portal del Coordinador
  U.coord.views.enlace = enlace;
  U.coord.binders.enlace = enlaceBind;
  U.enlace = { asignarTarea, tareasTable };
})();
