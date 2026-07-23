/* ============================================================
   MÓDULOS 1, 2 y 5 — Coordinador (Fase 2)
   Se registran sobre U.coord definido en coordinator.js
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CAT = () => U.data.CAT, R = () => U.components.resource;

  function kpiStrip(items) {
    return `<div class="grid grid--kpi" style="margin-bottom:1.1rem">${items.map(i =>
      `<div class="card kpi ${i.kind ? "kpi--" + i.kind : ""}"><div class="kpi__label">${ui().esc(i.label)}</div>
       <div class="kpi__value">${i.value}</div><div class="kpi__sub">${ui().esc(i.sub)}</div></div>`).join("")}</div>`;
  }
  function solicitarAction(modulo, mkPrefill) {
    return { ico: "📨", title: "Solicitar intervención técnica",
      fn: (rec, refresh) => U.solicitudes.crearDesde(modulo, mkPrefill(rec), refresh) };
  }

  /* ===================== MÓDULO 1 — APOYO Y MEJORA CONTINUA ===================== */
  const M1_TABS = [
    { key: "procesos", label: "Procesos de apoyo" },
    { key: "docs", label: "Documentos de trabajo" }
  ];
  function m1(params) {
    const tab = (params && params.tab) || "procesos";
    return `<div class="page-head"><h1>Apoyo y Mejora Continua</h1>
      <p>Apoyo técnico, asesorías, intervenciones y procesos de mejora del cuidado.</p></div>
      ${R().tabsBar("coord", "m1", M1_TABS, tab)}<div id="m1-tab"></div>`;
  }
  function m1Bind(main, params) {
    const tab = (params && params.tab) || "procesos";
    const box = document.getElementById("m1-tab");
    if (tab === "docs") { U.docsEditor.mount(box); return; }
    box.innerHTML = `<div id="m1-kpi"></div><div id="m1-body"></div>`;
    procesosApoyo();
  }
  function procesosApoyo() {
    const list = S().all("apoyoMejora");
    const fin = list.filter(a => /finaliz/i.test(a.estado || "")).length;
    const unidades = new Set(list.map(a => a.unidad).filter(Boolean)).size;
    document.getElementById("m1-kpi").innerHTML = kpiStrip([
      { label: "Procesos apoyados", value: list.length, sub: list.length ? "Registrados en total" : "Aún sin procesos", kind: "info" },
      { label: "Unidades apoyadas", value: unidades, sub: unidades ? "Con apoyo registrado" : "Sin unidades aún", kind: "ok" },
      { label: "En desarrollo", value: list.length - fin, sub: "Procesos activos", kind: "warn" },
      { label: "Finalizados", value: fin, sub: "Procesos concluidos", kind: "ok" }
    ]);
    R().mount(document.getElementById("m1-body"), {
      collection: "apoyoMejora", title: "Proceso de apoyo", icon: "🤝",
      hint: "Registra el apoyo técnico, la intervención y el resultado por unidad.",
      newLabel: "Nuevo proceso",
      filters: [{ key: "estado", label: "Estado" }, { key: "unidad", label: "Unidad" }],
      emptyMsg: "Aún no hay procesos de apoyo registrados.",
      columns: [
        { key: "unidad", label: "Unidad" },
        { key: "responsable", label: "Responsable" },
        { key: "problema", label: "Problema o necesidad" },
        { key: "resultado", label: "Resultado" },
        { key: "estado", label: "Estado", badge: true }
      ],
      fields: [
        { name: "responsable", label: "Responsable", required: true },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…", required: true },
        { name: "problema", label: "Problema o necesidad", type: "textarea", full: true },
        { name: "intervencion", label: "Intervención realizada", type: "textarea", full: true },
        { name: "resultado", label: "Resultado", type: "textarea", full: true },
        { name: "proximaAccion", label: "Próxima acción", full: true },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En desarrollo", "En curso", "Finalizado"] },
        { name: "respaldo", label: "Respaldo (documento/enlace)", full: true }
      ],
      defaults: () => ({ estado: "En desarrollo" }),
      detail: (rec) => detalleGenerico("Proceso de apoyo", rec, [
        ["Unidad", rec.unidad], ["Responsable", rec.responsable], ["Estado", ui().estadoBadge(rec.estado), true],
        ["Problema o necesidad", rec.problema], ["Intervención realizada", rec.intervencion],
        ["Resultado", rec.resultado], ["Próxima acción", rec.proximaAccion], ["Respaldo", rec.respaldo]
      ]),
      rowActions: [solicitarAction("Apoyo y Mejora Continua", r => ({
        titulo: "Apoyo en " + (r.unidad || "unidad"), unidad: r.unidad, descripcion: r.problema || "" }))],
      afterSave: () => procesosApoyo()
    });
  }

  /* ===================== MÓDULO 2 — GESTIÓN DOCUMENTAL ===================== */
  function m2() {
    return `<div class="page-head"><h1>Gestión Documental</h1>
      <p>Protocolos, normas, procedimientos, manuales y documentos institucionales. Códigos automáticos y permanentes.</p></div>
      <div id="m2-body"></div>`;
  }
  function m2Bind() {
    R().mount(document.getElementById("m2-body"), {
      collection: "documentos", title: "Documento", icon: "📄", withCode: true,
      hint: "Cada documento recibe un código automático permanente (UBPC-DOC-AAAA-000) y conserva su historial de versiones.",
      newLabel: "Nuevo documento",
      filters: [{ key: "estado", label: "Estado" }, { key: "tipo", label: "Tipo" }],
      emptyMsg: "Aún no hay documentos registrados.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "nombre", label: "Documento" },
        { key: "tipo", label: "Tipo", render: (r, u) => `<span class="tag">${u.esc(r.tipo || "—")}</span>` },
        { key: "version", label: "Versión", render: (r, u) => `v${u.esc(r.version || "1")}` },
        { key: "estado", label: "Estado", badge: true },
        { key: "fecha", label: "Fecha", date: true }
      ],
      fields: [
        { name: "nombre", label: "Nombre del documento", required: true, full: true },
        { name: "tipo", label: "Tipo documental", type: "select", options: CAT().tiposDocumento, required: true },
        { name: "version", label: "Versión", value: "1" },
        { name: "fecha", label: "Fecha", type: "date" },
        { name: "unidadResponsable", label: "Unidad responsable", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "responsable", label: "Responsable" },
        { name: "estado", label: "Estado actual", type: "select", options: CAT().estadosDoc },
        { name: "envioCalidad", label: "Envío a Calidad", type: "select", options: ["No", "Sí"] },
        { name: "fechaEnvio", label: "Fecha de envío", type: "date" },
        { name: "difusion", label: "Difusión", full: true },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true },
        { name: "respaldo", label: "Respaldo (enlace)", full: true }
      ],
      defaults: () => ({ version: "1", estado: "Borrador", envioCalidad: "No", fecha: ui().hoyISO() }),
      canDelete: () => true,
      detail: detalleDocumento,
      rowActions: [
        { ico: "🆕", title: "Registrar nueva versión", fn: nuevaVersion },
        solicitarAction("Gestión Documental", r => ({ titulo: "Validación técnica: " + (r.nombre || ""), descripcion: "Solicitud de validación técnica del documento " + (r.codigo || "") }))
      ]
    });
  }
  function nuevaVersion(rec, refresh) {
    const u = ui();
    const fields = [
      { name: "version", label: "Nueva versión", required: true, value: String((parseFloat(rec.version) || 1) + 1) },
      { name: "fecha", label: "Fecha", type: "date", value: u.hoyISO() },
      { name: "responsable", label: "Responsable del cambio", value: rec.responsable },
      { name: "cambio", label: "Descripción del cambio", type: "textarea", full: true, required: true }
    ];
    u.modal({ title: "Nueva versión · " + (rec.codigo || ""), body: u.formHTML(fields, {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar versión</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        if (!d.version || !d.cambio) { u.toast("Versión y descripción del cambio son obligatorios", "danger"); return; }
        const hist = (rec.historialVersiones || []).concat([{ version: rec.version, fecha: rec.fecha, responsable: rec.responsable, cambio: rec.__ultimoCambio || "Versión previa" }]);
        S().update("documentos", rec.id, { version: d.version, fecha: d.fecha, responsable: d.responsable, __ultimoCambio: d.cambio, historialVersiones: hist });
        u.closeModal(); u.toast("Versión registrada", "ok"); if (refresh) refresh();
      }; } });
  }
  function detalleDocumento(rec) {
    const u = ui();
    const hist = rec.historialVersiones || [];
    const histHTML = hist.length ? `<div class="traza"><strong>Historial de versiones</strong>
      <table class="tbl" style="margin-top:.3rem"><thead><tr><th>Versión</th><th>Fecha</th><th>Responsable</th><th>Cambio</th></tr></thead>
      <tbody>${hist.map(h => `<tr><td>v${u.esc(h.version)}</td><td>${u.fechaCL(h.fecha)}</td><td>${u.esc(h.responsable || "—")}</td><td>${u.esc(h.cambio || "—")}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="muted">Sin versiones anteriores registradas.</p>`;
    detalleGenerico("Documento", rec, [
      ["Código", `<span class="mono">${u.esc(rec.codigo)}</span>`, true],
      ["Nombre", rec.nombre], ["Tipo", rec.tipo], ["Versión actual", "v" + (rec.version || "1")],
      ["Unidad responsable", rec.unidadResponsable], ["Responsable", rec.responsable],
      ["Estado", u.estadoBadge(rec.estado), true], ["Envío a Calidad", rec.envioCalidad],
      ["Fecha de envío", u.fechaCL(rec.fechaEnvio)], ["Difusión", rec.difusion],
      ["Observaciones", rec.observaciones]
    ], histHTML);
  }

  /* ===================== MÓDULO 5 — GESTIÓN, ARTICULACIÓN Y RESPALDO ===================== */
  const M5_TABS = [
    { key: "reuniones", label: "Participaciones y reuniones" },
    { key: "respaldos", label: "Documentos y respaldos" },
    { key: "acuerdos", label: "Acuerdos y acciones" },
    { key: "articulacion", label: "Articulación y posicionamiento" },
    { key: "solicitudes", label: "Solicitudes de apoyo técnico" }
  ];
  function m5(params) {
    const tab = (params && params.tab) || "reuniones";
    return `<div class="page-head"><h1>Centro de Gestión, Articulación y Respaldo</h1>
      <p>Reuniones, documentos, acuerdos, articulación institucional y solicitudes de apoyo técnico.</p></div>
      ${R().tabsBar("coord", "m5", M5_TABS, tab)}
      <div id="m5-body"></div>`;
  }
  function m5Bind(main, params) {
    const tab = (params && params.tab) || "reuniones";
    const box = document.getElementById("m5-body");
    if (tab === "reuniones") return m5Reuniones(box);
    if (tab === "respaldos") return m5Respaldos(box);
    if (tab === "acuerdos") return m5Acuerdos(box);
    if (tab === "articulacion") return m5Articulacion(box);
    if (tab === "solicitudes") return U.solicitudes.coordPanel(box);
  }
  function m5Reuniones(box) {
    R().mount(box, {
      collection: "reuniones", title: "Reunión", icon: "📅", withCode: true,
      hint: "Participaciones y reuniones. Cada una recibe código UBPC-REU-AAAA-000.",
      newLabel: "Nueva reunión",
      emptyMsg: "Aún no hay reuniones registradas.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "fecha", label: "Fecha", date: true },
        { key: "tipo", label: "Tipo", render: (r, u) => `<span class="tag">${u.esc(r.tipo || "—")}</span>` },
        { key: "tema", label: "Tema o título" },
        { key: "unidad", label: "Unidad o institución" },
        { key: "responsable", label: "Responsable" },
        { key: "resultado", label: "Resultado / próxima acción" }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "tipo", label: "Tipo", type: "select", options: ["Reunión interna", "Reunión institucional", "Comité", "Mesa técnica", "Participación", "Otra"] },
        { name: "tema", label: "Tema o título", required: true, full: true },
        { name: "unidad", label: "Unidad o institución" },
        { name: "responsable", label: "Responsable" },
        { name: "resultado", label: "Resultado o próxima acción", type: "textarea", full: true }
      ],
      defaults: () => ({ fecha: ui().hoyISO() }),
      rowActions: [{ ico: "🤝", title: "Generar acuerdo desde la reunión", fn: (rec) => crearAcuerdoDesde(rec) }]
    });
  }
  function m5Respaldos(box) {
    R().mount(box, {
      collection: "respaldos", title: "Documento o respaldo", icon: "🗄️",
      hint: "Documentos, informes, actas, presentaciones, memorandos y resoluciones.",
      newLabel: "Nuevo respaldo",
      emptyMsg: "Aún no hay documentos de respaldo.",
      columns: [
        { key: "fecha", label: "Fecha", date: true },
        { key: "tipo", label: "Tipo", render: (r, u) => `<span class="tag">${u.esc(r.tipo || "—")}</span>` },
        { key: "titulo", label: "Título" },
        { key: "responsable", label: "Responsable" },
        { key: "enlace", label: "Respaldo", render: (r, u) => r.enlace ? `<a href="${u.esc(r.enlace)}" target="_blank" rel="noopener">Abrir ↗</a>` : "—" }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "tipo", label: "Tipo", type: "select", options: ["Documento", "Informe", "Acta", "Presentación", "Memorando", "Resolución", "Otro"] },
        { name: "titulo", label: "Título", required: true, full: true },
        { name: "responsable", label: "Responsable" },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true },
        { name: "enlace", label: "Enlace / ubicación del respaldo", full: true }
      ],
      defaults: () => ({ fecha: ui().hoyISO() })
    });
  }
  function m5Acuerdos(box) {
    R().mount(box, {
      collection: "acuerdos", title: "Acuerdo o acción", icon: "🤝", withCode: true,
      hint: "Compromisos derivados de reuniones. Código UBPC-ACU-AAAA-000.",
      newLabel: "Nuevo acuerdo",
      emptyMsg: "Aún no hay acuerdos registrados.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "compromiso", label: "Compromiso" },
        { key: "reunionOrigen", label: "Reunión de origen", mono: true },
        { key: "responsable", label: "Responsable" },
        { key: "plazo", label: "Plazo", date: true },
        { key: "estado", label: "Estado", badge: true }
      ],
      fields: () => ([
        { name: "compromiso", label: "Compromiso o acción", required: true, full: true, type: "textarea" },
        { name: "reunionOrigen", label: "Reunión de origen", type: "select", placeholder: "Sin reunión asociada",
          options: S().all("reuniones").map(r => ({ value: r.codigo, label: (r.codigo || "") + " · " + (r.tema || "") })) },
        { name: "responsable", label: "Responsable" },
        { name: "plazo", label: "Plazo", type: "date" },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] }
      ]),
      defaults: () => ({ estado: "Pendiente" })
    });
  }
  function crearAcuerdoDesde(reunion) {
    const u = ui();
    u.modal({ title: "Nuevo acuerdo desde " + (reunion.codigo || "reunión"),
      body: u.formHTML([
        { name: "compromiso", label: "Compromiso o acción", required: true, full: true, type: "textarea" },
        { name: "responsable", label: "Responsable", value: reunion.responsable },
        { name: "plazo", label: "Plazo", type: "date" },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] }
      ], { estado: "Pendiente" }),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Crear acuerdo</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        if (!d.compromiso) { u.toast("El compromiso es obligatorio", "danger"); return; }
        d.reunionOrigen = reunion.codigo;
        S().insert("acuerdos", d, { withCode: true });
        u.closeModal(); u.toast("Acuerdo creado", "ok");
      }; } });
  }
  function m5Articulacion(box) {
    R().mount(box, {
      collection: "articulaciones", title: "Articulación", icon: "🌐", withCode: true,
      hint: "Articulación y posicionamiento institucional de la UBPC.",
      newLabel: "Nueva articulación",
      emptyMsg: "Aún no hay articulaciones registradas.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "institucion", label: "Institución o espacio" },
        { key: "aporte", label: "Aporte técnico" },
        { key: "resultado", label: "Resultado" },
        { key: "continuidad", label: "Continuidad", render: (r, u) => `<span class="tag">${u.esc(r.continuidad || "—")}</span>` }
      ],
      fields: [
        { name: "institucion", label: "Institución o espacio", required: true, full: true },
        { name: "participacion", label: "Participación de la UBPC", type: "textarea", full: true },
        { name: "aporte", label: "Aporte técnico", type: "textarea", full: true },
        { name: "resultado", label: "Resultado", type: "textarea", full: true },
        { name: "continuidad", label: "Continuidad", type: "select", options: ["Sí", "No", "Por definir"] },
        { name: "proximaAccion", label: "Próxima acción", full: true }
      ],
      defaults: () => ({ continuidad: "Por definir" })
    });
  }

  /* ---------- Detalle genérico reutilizable ---------- */
  function detalleGenerico(titulo, rec, filas, extraHTML) {
    const u = ui();
    const body = `<div class="dl">${filas.map(f =>
      `<div style="${f[2] ? "grid-column:1/-1" : ""}"><span>${u.esc(f[0])}</span><strong>${f[1] != null && f[1] !== "" ? f[1] : "—"}</strong></div>`
    ).join("")}</div>${extraHTML || ""}${U.components.resource.trazabilidad(rec)}`;
    u.modal({ title: titulo + (rec.codigo ? " · " + rec.codigo : ""), wide: true, body,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>` });
  }

  /* ---------- Registro en el portal del Coordinador ---------- */
  Object.assign(U.coord.views, { m1, m2, m5, solicitudes: solicitudesCoord });
  Object.assign(U.coord.binders, { m1: m1Bind, m2: m2Bind, m5: m5Bind, solicitudes: solicitudesCoordBind });

  function solicitudesCoord() {
    return `<div class="page-head"><h1>Solicitudes de apoyo técnico</h1>
      <p>Consolidación automática y flujo de cierre de las solicitudes enviadas al Referente Técnico.</p></div>
      <div id="sol-body"></div>`;
  }
  function solicitudesCoordBind() { U.solicitudes.coordPanel(document.getElementById("sol-body")); }
})();
