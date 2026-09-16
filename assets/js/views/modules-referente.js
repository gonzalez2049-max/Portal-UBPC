/* ============================================================
   PORTAL REFERENTE — Submódulos operativos (Fase 6)
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CAT = () => U.data.CAT, R = () => U.components.resource;

  function page(titulo, desc, id) {
    return `<div class="page-head"><h1>${titulo}</h1><p>${desc}</p></div><div id="${id}"></div>`;
  }

  /* ---------- Bitácora de Biblioteca Digital ---------- */
  function biblioteca() { return page("Bitácora de Biblioteca Digital", "Recursos incorporados, actualizados, reemplazados, retirados o reordenados.", "ref-bib"); }
  function bibliotecaBind() {
    R().mount(document.getElementById("ref-bib"), {
      collection: "bibliotecaBitacora", title: "Registro de biblioteca", icon: "📚",
      hint: "Registra cada cambio en la Biblioteca Digital con su motivo y respaldo.",
      newLabel: "Nuevo registro", emptyMsg: "Aún no hay registros en la bitácora.",
      columns: [
        { key: "fecha", label: "Fecha", date: true },
        { key: "tipoAccion", label: "Acción", render: (r, u) => `<span class="tag">${u.esc(r.tipoAccion || "—")}</span>` },
        { key: "nombreRecurso", label: "Recurso" },
        { key: "tipo", label: "Tipo" },
        { key: "version", label: "Versión" },
        { key: "unidadGuia", label: "Unidad / Guía" }
      ],
      fields: [
        { name: "tipoAccion", label: "Acción realizada", type: "select", options: ["Recurso incorporado", "Recurso actualizado", "Recurso reemplazado", "Recurso retirado", "Clasificación u ordenamiento"] },
        { name: "nombreRecurso", label: "Nombre del recurso", required: true, full: true },
        { name: "tipo", label: "Tipo" },
        { name: "version", label: "Versión" },
        { name: "fuente", label: "Fuente" },
        { name: "cambioRealizado", label: "Cambio realizado", type: "textarea", full: true },
        { name: "motivo", label: "Motivo", type: "textarea", full: true },
        { name: "enlace", label: "Enlace", full: true },
        { name: "ubicacionRespaldo", label: "Ubicación del respaldo", full: true },
        { name: "fecha", label: "Fecha", type: "date" },
        { name: "unidadGuia", label: "Unidad o guía relacionada" }
      ],
      defaults: () => ({ fecha: ui().hoyISO(), tipoAccion: "Recurso incorporado" })
    });
  }

  /* ---------- Capacitación clínica por turno ---------- */
  function capacitacion() { return page("Capacitación clínica por turno", "Registro de capacitaciones clínicas por turno y estamento.", "ref-cap"); }
  function capacitacionBind() {
    R().mount(document.getElementById("ref-cap"), {
      collection: "capacitacionRef", title: "Capacitación por turno", icon: "🎓",
      hint: "Capacitaciones clínicas realizadas por turno.",
      newLabel: "Nueva capacitación", emptyMsg: "Aún no hay capacitaciones registradas.",
      columns: [
        { key: "fecha", label: "Fecha", date: true },
        { key: "turno", label: "Turno", render: (r, u) => `<span class="tag">${u.esc(r.turno || "—")}</span>` },
        { key: "tema", label: "Tema" },
        { key: "unidad", label: "Unidad" },
        { key: "estamento", label: "Estamento" },
        { key: "participantes", label: "Participantes", num: true }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "turno", label: "Turno", type: "select", options: ["Largo", "Día", "Noche", "Mañana", "Tarde", "Cuarto turno"] },
        { name: "tema", label: "Tema", required: true, full: true },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "estamento", label: "Estamento", type: "select", options: CAT().estamentos },
        { name: "participantes", label: "Participantes", type: "number" },
        { name: "guia", label: "Guía BPSO", type: "select", options: ["—"].concat(CAT().guiasArea) },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true }
      ],
      defaults: () => ({ fecha: ui().hoyISO() })
    });
  }

  /* ---------- Evidencia y recomendación ---------- */
  function evidencia() {
    return `<div class="page-head"><h1>Evidencia y recomendación</h1>
      <p>Buscar evidencia científica útil para apoyar decisiones clínicas y actualizar buenas prácticas.</p></div>
      <div class="card" style="border-left:4px solid var(--c-turquesa);margin-bottom:1rem">
        <strong>Frecuencia sugerida:</strong> revisión breve semanal · búsqueda estructurada al detectar una brecha · revisión adicional antes de actualizar un protocolo.
      </div><div id="ref-evi"></div>`;
  }
  function evidenciaBind() {
    R().mount(document.getElementById("ref-evi"), {
      collection: "evidenciaSemana", title: "Evidencia y recomendación", icon: "🔬",
      hint: "Evidencia compartida con Coordinación: lo que registra Coordinación aparece aquí y viceversa.",
      newLabel: "Nueva evidencia", emptyMsg: "Aún no hay evidencia registrada.",
      columns: [
        { key: "tema", label: "Tema / estudio", render: (r, u) => u.esc(r.tema || r.titulo || "—") },
        { key: "aplicabilidad", label: "Cómo se aplica (aplicabilidad)", render: (r, u) => { const t = r.aplicabilidad || r.resumen || "—"; return `<span title="${u.esc(t)}">${u.esc(t.length > 95 ? t.slice(0, 95) + "…" : t)}</span>`; } },
        { key: "recomendacion", label: "Recomendación para la práctica", render: (r, u) => { const t = r.recomendacion || "—"; return `<span title="${u.esc(t)}">${u.esc(t.length > 95 ? t.slice(0, 95) + "…" : t)}</span>`; } },
        { key: "guia", label: "Guía", render: (r, u) => u.esc(r.guia || "—") },
        { key: "nivelTipo", label: "Nivel / tipo", render: (r, u) => `<span class="tag">${u.esc(r.nivelTipo || "—")}</span>` }
      ],
      fields: [
        { name: "tema", label: "Tema", required: true, full: true },
        { name: "fuente", label: "Fuente" },
        { name: "autores", label: "Autores" },
        { name: "anio", label: "Año", type: "number" },
        { name: "nivelTipo", label: "Nivel o tipo de evidencia" },
        { name: "hallazgo", label: "Hallazgo", type: "textarea", full: true },
        { name: "aplicabilidad", label: "Aplicabilidad institucional", type: "textarea", full: true },
        { name: "recomendacion", label: "Recomendación técnica", type: "textarea", full: true },
        { name: "enlace", label: "Enlace", full: true },
        { name: "guia", label: "Guía clínica relacionada", type: "select", options: ["—"].concat(CAT().guiasArea) }
      ],
      detail: (rec) => {
        const u = ui();
        u.modal({ title: "Evidencia · " + (rec.tema || rec.titulo || ""), wide: true,
          body: `<div class="dl"><div><span>Fuente</span><strong>${u.esc(rec.fuente || "—")}</strong></div>
            <div><span>Autores</span><strong>${u.esc(rec.autores || "—")}</strong></div>
            <div><span>Año</span><strong>${u.esc(rec.anio || (rec.fecha ? new Date(rec.fecha).getFullYear() : "—"))}</strong></div>
            <div><span>Nivel / tipo</span><strong>${u.esc(rec.nivelTipo || "—")}</strong></div></div>
            <div><span class="muted" style="font-size:12px;font-weight:600">Hallazgo</span><p class="narrativo">${u.esc(rec.hallazgo || rec.resumen || "—")}</p></div>
            <div><span class="muted" style="font-size:12px;font-weight:600">Aplicabilidad institucional</span><p class="narrativo">${u.esc(rec.aplicabilidad || "—")}</p></div>
            <div><span class="muted" style="font-size:12px;font-weight:600">Recomendación técnica</span><p class="narrativo">${u.esc(rec.recomendacion || "—")}</p></div>
            ${rec.enlace ? `<a href="${u.esc(rec.enlace)}" target="_blank" rel="noopener">Ver fuente ↗</a>` : ""}`,
          footer: `<button class="btn btn--ghost" data-close>Cerrar</button>` });
      }
    });
  }

  /* ---------- Seguimiento de Planes de Mejora RNAO (Referente completa → Coordinador) ---------- */
  const EST_SEG_REF = ["Pendiente", "En curso", "Completado", "Retrasado"];
  function planesSeg() {
    return `<div class="page-head"><h1>Seguimiento de Planes de Mejora (RNAO)</h1>
      <p>Registra el <strong>avance y los seguimientos</strong> de los planes de intervención. Lo que completes aquí queda en el plan del Coordinador para el seguimiento (dato compartido).</p></div>
      <div id="ref-planes"></div>`;
  }
  function planesSegBind() {
    const box = document.getElementById("ref-planes");
    const u = ui();
    const render = () => {
      const planes = S().all("planesIntervencion").sort((a, b) => new Date(b.fechaModificacion || b.fechaCreacion || 0) - new Date(a.fechaModificacion || a.fechaCreacion || 0));
      if (!planes.length) { box.innerHTML = u.empty("Aún no hay planes de intervención.", "El Coordinador crea el plan en Programa RNAO; aquí registras su seguimiento.", "🧭"); return; }
      box.innerHTML = planes.map(p => {
        const av = (p.avance !== "" && p.avance != null && !isNaN(p.avance)) ? Number(p.avance) : null;
        const cerrado = (p.estadoCierre || "Abierto") === "Cerrado";
        const color = cerrado ? "var(--verde)" : (av != null && av >= 70 ? "var(--verde)" : av != null && av >= 40 ? "var(--naranjo)" : "var(--danger)");
        const segs = (p.seguimientos || []).filter(s => s && (s.fecha || s.descripcion));
        const segList = segs.length
          ? `<ul class="feed" style="margin:.4rem 0">${segs.slice(-3).reverse().map(s => `<li><span class="feed__ico">📌</span><div><strong>${u.esc(s.descripcion || "Seguimiento")}</strong><div class="feed__meta">${s.fecha ? u.fechaCL(s.fecha) : ""}${s.avance !== "" && s.avance != null ? " · " + u.esc(s.avance) + "%" : ""}${s.estado ? " · " + u.esc(s.estado) : ""}</div></div></li>`).join("")}</ul>`
          : `<p class="kpi__sub" style="margin:.3rem 0">Sin seguimientos registrados aún.</p>`;
        return `<div class="card" style="border-left:4px solid ${color};margin-bottom:1rem">
          <div class="flex" style="justify-content:space-between;align-items:flex-start">
            <div><span class="tag">${u.esc(p.guia || "Guía")}</span> ${(() => { const c = (U.data.unidadColor ? U.data.unidadColor(p.unidad) : "#8a97a8"); return `<span class="tag" style="background:${c}1f;color:${c};border:1px solid ${c}55">${u.esc(p.unidad || "—")}</span>`; })()}
              <h4 class="doc-card__title" style="margin:.4rem 0 .1rem">${u.esc(p.indicador || p.objetivo || "Plan de intervención")}</h4></div>
            <span class="badge badge--${cerrado ? "ok" : "warn"}">${cerrado ? "Cerrado" : "Abierto"}</span>
          </div>
          ${(() => {
            const nq = (U.data.nquireByName && p.indicador) ? U.data.nquireByName(p.indicador) : null;
            if (!nq) return "";
            const tc = { "Proceso": "#176ac0", "Resultado": "#2f9d57", "Estructura": "#7a5cd0" }[nq.tipo] || "#176ac0";
            return `<div class="kpi__sub" style="margin:.15rem 0" title="${u.esc(nq.formula || "")}"><b>Indicador NQuIRE:</b> ${u.esc(nq.nombre)}
              <span class="tag" style="background:${tc}1f;color:${tc};border:1px solid ${tc}55">${u.esc(nq.tipo)}</span>
              ${nq.codigo ? `<span class="mono" style="font-size:11px">${u.esc(nq.codigo)}</span>` : `<span class="muted" style="font-size:11px">código por confirmar</span>`}</div>`;
          })()}
          <div class="kpi__sub">Plazo: ${p.plazoInicio ? u.fechaCL(p.plazoInicio) : "—"} → ${p.plazoFin ? u.fechaCL(p.plazoFin) : "—"} · Frecuencia: ${u.esc(p.frecuenciaSeg && p.frecuenciaSeg !== "—" ? p.frecuenciaSeg : "—")} · Avance: ${av != null ? av + "%" : "—"}</div>
          <div class="pin-prog" style="margin:.4rem 0"><div class="pin-prog__bar" style="width:${av != null ? Math.min(100, Math.max(0, av)) : 0}%;background:${color}"></div></div>
          ${segList}
          <button class="btn btn--primary btn--sm" data-seg="${p.id}">+ Registrar seguimiento / avance</button>
        </div>`;
      }).join("");
      box.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => segForm(S().get("planesIntervencion", b.dataset.seg), render));
    };
    render();
  }
  function segForm(plan, done) {
    const u = ui(); if (!plan) return;
    const fields = [
      { name: "fecha", label: "Fecha del seguimiento", type: "date", value: u.hoyISO() },
      { name: "descripcion", label: "Descripción / avance realizado", type: "textarea", full: true },
      { name: "avance", label: "% de avance a la fecha", type: "number", value: plan.avance != null ? plan.avance : "" },
      { name: "estado", label: "Estado del seguimiento", type: "select", options: EST_SEG_REF, value: "En curso" },
      { name: "plazoInicio", label: "Plazo · inicio (del plan)", type: "date", value: plan.plazoInicio ? u.isoDay(plan.plazoInicio) : "" },
      { name: "plazoFin", label: "Plazo · término (del plan)", type: "date", value: plan.plazoFin ? u.isoDay(plan.plazoFin) : "" },
      { name: "frecuenciaSeg", label: "Frecuencia de seguimiento", type: "select", options: ["—", "Semanal", "Quincenal", "Mensual", "Bimensual", "Trimestral", "Semestral", "Anual"], value: plan.frecuenciaSeg || "—" }
    ];
    u.modal({
      title: "Registrar seguimiento del plan", wide: true,
      body: `<p class="card__hint" style="margin:0 0 .6rem">Se agrega un seguimiento y se actualizan el avance y los plazos del plan. Queda visible para el Coordinador.</p>` + u.formHTML(fields, {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar seguimiento</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          const patch = { plazoInicio: d.plazoInicio || plan.plazoInicio || "", plazoFin: d.plazoFin || plan.plazoFin || "", frecuenciaSeg: d.frecuenciaSeg || plan.frecuenciaSeg || "—" };
          if (d.avance !== "" && d.avance != null) patch.avance = d.avance;
          if ((d.fecha && String(d.fecha).trim()) || (d.descripcion && String(d.descripcion).trim())) {
            const seg = { fecha: d.fecha || "", descripcion: d.descripcion || "", avance: d.avance || "", estado: d.estado || "" };
            patch.seguimientos = (plan.seguimientos || []).concat([seg]);
          } else if (!d.avance && !d.plazoInicio && !d.plazoFin) {
            u.toast("Registra al menos una descripción, fecha o avance", "danger"); return;
          }
          S().update("planesIntervencion", plan.id, patch);
          u.closeModal(); u.toast("Seguimiento registrado y enviado al plan del Coordinador", "ok"); done();
        };
      }
    });
  }

  /* ---------- Solicitud de apoyo (Referente → Coordinador) ---------- */
  function apoyo() {
    return `<div class="page-head"><h1>Solicitud de apoyo técnico</h1>
      <p>Solicita apoyo o intervención del Coordinador/a UBPC.</p></div>
      <div class="section"><button class="btn btn--primary" id="newApoyo">+ Nueva solicitud al Coordinador</button></div>
      <div id="ref-apoyo"></div>`;
  }
  function apoyoBind() {
    const box = document.getElementById("ref-apoyo");
    U.solicitudes.apoyoRefPanel(box);
    document.getElementById("newApoyo").onclick = () => U.solicitudes.crearApoyo({}, () => U.solicitudes.apoyoRefPanel(box));
  }

  /* ---------- Reunión de seguimiento ---------- */
  function reunion() { return page("Reunión de seguimiento", "Programación y registro de reuniones de seguimiento.", "ref-reu"); }
  function reunionBind() {
    const H = U.reunionHelpers || {};
    R().mount(document.getElementById("ref-reu"), {
      collection: "reuniones", title: "Reunión de seguimiento", icon: "📅", withCode: true, wideForm: true,
      hint: "Reuniones de seguimiento. Ábrelas para ver los temas a tratar. Código UBPC-REU-AAAA-000.",
      newLabel: "Nueva reunión", emptyMsg: "Aún no hay reuniones registradas.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "fecha", label: "Fecha", date: true },
        { key: "tema", label: "Tema" },
        { key: "objetivo", label: "Temas a tratar", render: (r, u) => H.temasCol ? H.temasCol(r, u) : u.esc(r.objetivo || "—") },
        { key: "resultado", label: "Resultado / próxima acción" }
      ],
      fields: H.fields ? H.fields(["Reunión de seguimiento", "Reunión con Coordinación", "Comité", "Mesa técnica", "Otra"])
        : [
          { name: "fecha", label: "Fecha", type: "date", required: true },
          { name: "tema", label: "Tema o título", required: true, full: true },
          { name: "objetivo", label: "Temas a tratar / objetivo", type: "textarea", full: true },
          { name: "resultado", label: "Resultado o próxima acción", type: "textarea", full: true }
        ],
      detail: (rec) => H.detalle ? H.detalle(rec) : null,
      defaults: () => ({ fecha: ui().hoyISO(), tipo: "Reunión de seguimiento" })
    });
  }

  /* ---------- Monitoreo e implementación ---------- */
  function monitoreo() { return page("Monitoreo e implementación", "Auditorías clínicas, indicadores, brechas e intervenciones.", "ref-mon"); }
  function monitoreoBind() {
    R().mount(document.getElementById("ref-mon"), {
      collection: "monitoreoRef", title: "Registro de monitoreo", icon: "📈",
      hint: "Auditorías, indicadores, brechas e intervenciones técnicas.",
      newLabel: "Nuevo registro", emptyMsg: "Aún no hay registros de monitoreo.",
      columns: [
        { key: "fecha", label: "Fecha", date: true },
        { key: "tipoRegistro", label: "Tipo", render: (r, u) => `<span class="tag">${u.esc(r.tipoRegistro || "—")}</span>` },
        { key: "unidad", label: "Unidad" },
        { key: "guia", label: "Guía" },
        { key: "proximaFecha", label: "Próxima evaluación", date: true },
        { key: "estado", label: "Estado", badge: true }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "tipoRegistro", label: "Tipo de registro", type: "select", options: ["Auditoría clínica", "Indicador", "Brecha", "Intervención técnica"] },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "guia", label: "Guía BPSO", type: "select", options: ["—"].concat(CAT().guiasArea) },
        { name: "descripcion", label: "Descripción", type: "textarea", full: true },
        { name: "resultado", label: "Resultado", type: "textarea", full: true },
        { name: "brecha", label: "Brecha detectada", type: "textarea", full: true },
        { name: "intervencion", label: "Intervención propuesta", type: "textarea", full: true },
        { name: "medioVerificacion", label: "Medio de verificación", full: true },
        { name: "proximaFecha", label: "Próxima evaluación / auditoría", type: "date", hint: "Fecha en que toca volver a evaluar o auditar." },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] }
      ],
      defaults: () => ({ fecha: ui().hoyISO(), estado: "En curso" })
    });
  }

  /* ---------- Hubs agrupadores (menos módulos en el menú) ---------- */
  function hubTab(tabs, params) {
    const t = params && params.tab;
    return (t && tabs.some(x => x.key === t)) ? t : tabs[0].key;
  }
  function hubView(title, subtitle, moduleKey, tabs, params) {
    return `<div class="page-head"><h1>${title}</h1><p>${subtitle}</p></div>
      ${R().tabsBar("ref", moduleKey, tabs, hubTab(tabs, params))}
      <div id="ref-hub"></div>`;
  }
  // Monta un submódulo ya registrado (vista + binder) dentro del hub, sin su encabezado propio.
  function mountSub(box, subKey) {
    const view = U.ref.views[subKey], bind = U.ref.binders[subKey];
    if (!view) { box.innerHTML = ui().empty("Módulo no disponible.", "Recarga la página.", "🛠️"); return; }
    box.innerHTML = view();
    const ph = box.querySelector(".page-head"); if (ph) ph.remove();
    if (bind) { try { bind(box); } catch (e) {} }
  }

  /* ---------- Mi trabajo (registros operativos agrupados) ---------- */
  const TRB_TABS = [
    { key: "evidencia", label: "Evidencia", color: "#12b5a5" },
    { key: "evi", label: "EVI", color: "#7a5cd0" },
    { key: "biblioteca", label: "Biblioteca", color: "#1554b8" },
    { key: "capacitacion", label: "Capacitación", color: "#e0912f" },
    { key: "reunion", label: "Reuniones", color: "#0d6ea8" }
  ];
  function gestion(params) {
    return hubView("Mi trabajo", "Tus registros operativos en un solo lugar: evidencia, EVI, biblioteca, capacitación y reuniones.", "gestion", TRB_TABS, params);
  }
  function gestionBind(main, params) {
    const box = document.getElementById("ref-hub"); if (!box) return;
    mountSub(box, hubTab(TRB_TABS, params));
  }

  /* ---------- Mi seguimiento (todo lo que hay que seguir) ---------- */
  const SEG_TABS = [
    { key: "solicitudes", label: "Solicitudes del Coordinador", color: "#1554b8" },
    { key: "tareas", label: "Tareas asignadas", color: "#0f8f83" },
    { key: "planes", label: "Plan de Intervención", color: "#7a5cd0" },
    { key: "monitoreo", label: "Monitoreo", color: "#e0912f" }
  ];
  function seguimiento(params) {
    return hubView("Mi seguimiento", "Todo lo que debes seguir en un solo lugar: solicitudes recibidas del Coordinador, tus tareas asignadas, los planes RNAO y el monitoreo.", "seguimiento", SEG_TABS, params);
  }
  function segTareas(box) {
    const u = ui();
    box.innerHTML = `<div class="section__head"><div><h2 class="section__title">Tareas asignadas por Coordinación</h2>
      <p class="section__hint">Con código, prioridad, fecha límite y estado. Ábrelas para actualizar su estado.</p></div></div>
      <div id="seg-tareas-tbl"></div>`;
    const tbl = document.getElementById("seg-tareas-tbl");
    if (U.enlace && U.enlace.tareasTable) U.enlace.tareasTable(tbl, "ref");
    else U.components.kanban.mount(tbl, "referente");
  }
  function seguimientoBind(main, params) {
    const box = document.getElementById("ref-hub"); if (!box) return;
    const tab = hubTab(SEG_TABS, params);
    if (tab === "solicitudes") mountSub(box, "solicitudesRecibidas");
    else if (tab === "planes") { if (U.rnaoPlanes && U.rnaoPlanes.mount) U.rnaoPlanes.mount(box, params); else mountSub(box, "planesSeg"); }
    else if (tab === "monitoreo") mountSub(box, "monitoreo");
    else segTareas(box);
  }

  Object.assign(U.ref.views, { biblioteca, capacitacion, evidencia, apoyo, reunion, monitoreo, gestion, seguimiento, planesSeg });
  Object.assign(U.ref.binders, {
    biblioteca: bibliotecaBind, capacitacion: capacitacionBind, evidencia: evidenciaBind,
    apoyo: apoyoBind, reunion: reunionBind, monitoreo: monitoreoBind, planesSeg: planesSegBind,
    gestion: gestionBind, seguimiento: seguimientoBind
  });
})();
