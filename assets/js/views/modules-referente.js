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
      collection: "evidenciaRef", title: "Evidencia y recomendación", icon: "🔬",
      hint: "Evidencia analizada con su aplicabilidad institucional y recomendación técnica.",
      newLabel: "Nueva evidencia", emptyMsg: "Aún no hay evidencia registrada.",
      columns: [
        { key: "tema", label: "Tema" },
        { key: "fuente", label: "Fuente" },
        { key: "anio", label: "Año" },
        { key: "nivelTipo", label: "Nivel / tipo", render: (r, u) => `<span class="tag">${u.esc(r.nivelTipo || "—")}</span>` },
        { key: "guia", label: "Guía" }
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
        u.modal({ title: "Evidencia · " + (rec.tema || ""), wide: true,
          body: `<div class="dl"><div><span>Fuente</span><strong>${u.esc(rec.fuente || "—")}</strong></div>
            <div><span>Autores</span><strong>${u.esc(rec.autores || "—")}</strong></div>
            <div><span>Año</span><strong>${u.esc(rec.anio || "—")}</strong></div>
            <div><span>Nivel / tipo</span><strong>${u.esc(rec.nivelTipo || "—")}</strong></div></div>
            <div><span class="muted" style="font-size:12px;font-weight:600">Hallazgo</span><p class="narrativo">${u.esc(rec.hallazgo || "—")}</p></div>
            <div><span class="muted" style="font-size:12px;font-weight:600">Aplicabilidad institucional</span><p class="narrativo">${u.esc(rec.aplicabilidad || "—")}</p></div>
            <div><span class="muted" style="font-size:12px;font-weight:600">Recomendación técnica</span><p class="narrativo">${u.esc(rec.recomendacion || "—")}</p></div>
            ${rec.enlace ? `<a href="${u.esc(rec.enlace)}" target="_blank" rel="noopener">Ver fuente ↗</a>` : ""}`,
          footer: `<button class="btn btn--ghost" data-close>Cerrar</button>` });
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
    R().mount(document.getElementById("ref-reu"), {
      collection: "reuniones", title: "Reunión de seguimiento", icon: "📅", withCode: true,
      hint: "Reuniones de seguimiento. Código UBPC-REU-AAAA-000.",
      newLabel: "Nueva reunión", emptyMsg: "Aún no hay reuniones registradas.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "fecha", label: "Fecha", date: true },
        { key: "tema", label: "Tema" },
        { key: "unidad", label: "Unidad" },
        { key: "resultado", label: "Resultado / próxima acción" }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "tipo", label: "Tipo", value: "Reunión de seguimiento" },
        { name: "tema", label: "Tema o título", required: true, full: true },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "responsable", label: "Responsable" },
        { name: "resultado", label: "Resultado o próxima acción", type: "textarea", full: true }
      ],
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
        { key: "resultado", label: "Resultado" },
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
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] }
      ],
      defaults: () => ({ fecha: ui().hoyISO(), estado: "En curso" })
    });
  }

  /* ---------- Mi gestión / Mi seguimiento ---------- */
  function gestion() {
    const u = ui();
    const counts = [
      ["📚", "Biblioteca Digital", S().all("bibliotecaBitacora").length, "biblioteca"],
      ["🎓", "Capacitación por turno", S().all("capacitacionRef").length, "capacitacion"],
      ["🔬", "Evidencia y recomendación", S().all("evidenciaRef").length, "evidencia"],
      ["📅", "Reuniones de seguimiento", S().all("reuniones").length, "reunion"],
      ["📈", "Monitoreo e implementación", S().all("monitoreoRef").length, "monitoreo"]
    ];
    return `<div class="page-head"><h1>Mi gestión</h1><p>Resumen de tus registros operativos.</p></div>
      <div class="grid grid--3">${counts.map(c => `<a class="card" href="#/ref/${c[3]}" style="text-decoration:none;color:inherit;border-top:4px solid var(--c-turquesa)">
        <div class="flex"><div class="avatar" style="background:var(--c-turquesa)">${c[0]}</div>
        <div><div class="kpi__value" style="font-size:1.6rem">${c[2]}</div><div class="kpi__label">${c[1]}</div></div></div>
        <div class="kpi__sub" style="margin-top:.4rem">${c[2] ? "Ver registros →" : "Sin registros aún · Comienza aquí →"}</div></a>`).join("")}</div>`;
  }
  function seguimiento() {
    const u = ui();
    const kanbanPend = S().all("kanban").filter(k => k.owner === "referente" && k.columna !== "Completado");
    const solEnCurso = S().all("solicitudes").filter(s => (s.direccion || "coord-a-ref") === "coord-a-ref" && /enviada|curso/i.test(s.estado || ""));
    const monPend = S().all("monitoreoRef").filter(m => m.estado !== "Completado");
    function lista(items, render, empty) {
      return items.length ? `<ul class="feed">${items.map(render).join("")}</ul>` : u.empty(empty, "", "✅");
    }
    return `<div class="page-head"><h1>Mi seguimiento</h1><p>Pendientes, solicitudes en gestión y monitoreo en curso.</p></div>
      <div class="grid grid--3">
        <div class="card"><h3 class="card__title">Tareas pendientes (${kanbanPend.length})</h3>
          ${lista(kanbanPend, k => `<li><span class="feed__ico">📌</span><div><strong>${u.esc(k.titulo)}</strong><div class="feed__meta">${u.esc(k.columna)} · ${k.fechaLimite ? u.fechaCL(k.fechaLimite) : "sin fecha"}</div></div></li>`, "Sin tareas pendientes.")}</div>
        <div class="card"><h3 class="card__title">Solicitudes en gestión (${solEnCurso.length})</h3>
          ${lista(solEnCurso, s => `<li><span class="feed__ico">📨</span><div><strong>${u.esc(s.titulo || s.codigo)}</strong><div class="feed__meta">${u.estadoBadge(s.estado)}</div></div></li>`, "Sin solicitudes en gestión.")}</div>
        <div class="card"><h3 class="card__title">Monitoreo en curso (${monPend.length})</h3>
          ${lista(monPend, m => `<li><span class="feed__ico">📈</span><div><strong>${u.esc(m.tipoRegistro || "Registro")}</strong> · ${u.esc(m.unidad || "")}<div class="feed__meta">${u.estadoBadge(m.estado)}</div></div></li>`, "Sin monitoreo en curso.")}</div>
      </div>`;
  }

  Object.assign(U.ref.views, { biblioteca, capacitacion, evidencia, apoyo, reunion, monitoreo, gestion, seguimiento });
  Object.assign(U.ref.binders, {
    biblioteca: bibliotecaBind, capacitacion: capacitacionBind, evidencia: evidenciaBind,
    apoyo: apoyoBind, reunion: reunionBind, monitoreo: monitoreoBind
  });
})();
