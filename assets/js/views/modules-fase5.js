/* ============================================================
   MÓDULO 6 (NT 234) y MÓDULO 7 (Red de Colaboración) — Fase 5
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CAT = () => U.data.CAT, R = () => U.components.resource;

  /* ===================== MÓDULO 6 — NORMA TÉCNICA 234 ===================== */
  const M6_TABS = [
    { key: "panel", label: "Panel y semáforo" },
    { key: "unidades", label: "Cumplimiento por unidad" },
    { key: "planes", label: "Planes de mejora" },
    { key: "informe", label: "Informe A4" }
  ];
  function meta234() { return Number(S().getConfig("nt234.meta", 90)); }
  function categoria(pct) {
    const m = meta234();
    if (pct >= m) return "Verde";
    if (pct >= m - 15) return "Amarillo";
    return "Rojo";
  }
  const SEM = { Verde: { badge: "ok", label: "Dentro de meta", color: "var(--verde)" },
    Amarillo: { badge: "warn", label: "Seguimiento", color: "var(--naranjo)" },
    Rojo: { badge: "danger", label: "Intervención", color: "var(--danger)" } };

  function m6(params) {
    const tab = (params && params.tab) || "panel";
    return `<div class="page-head"><h1>Norma Técnica 234</h1>
      <p>Cumplimiento institucional por unidad, semáforo, planes de mejora e informe imprimible.</p></div>
      ${R().tabsBar("coord", "m6", M6_TABS, tab)}<div id="m6-body"></div>`;
  }
  function m6Bind(main, params) {
    const tab = (params && params.tab) || "panel";
    const box = document.getElementById("m6-body");
    ({ panel: panel234, unidades: unidades234, planes: planes234, informe: informe234 }[tab] || panel234)(box);
  }

  function ultimoPeriodo(meds) {
    const periodos = [...new Set(meds.map(m => m.periodo).filter(Boolean))].sort();
    return periodos[periodos.length - 1];
  }
  function medsUltimoPeriodo() {
    const meds = S().all("nt234");
    const per = ultimoPeriodo(meds);
    return { per, list: meds.filter(m => m.periodo === per) };
  }

  function panel234(box) {
    const u = ui();
    const meds = S().all("nt234");
    const responsable = S().getConfig("nt234.responsable", "");
    const resolucion = S().getConfig("nt234.resolucion", "");
    const subdireccion = S().getConfig("nt234.subdireccion", "");
    const datos = `<div class="card"><div class="card__head"><h3 class="card__title">Datos institucionales NT 234</h3>
        <button class="btn btn--ghost btn--sm" id="editNT">✏️ Editar</button></div>
      <div class="dl"><div><span>Responsable institucional</span><strong>${u.esc(responsable) || "—"}</strong></div>
        <div><span>Resolución</span><strong>${u.esc(resolucion) || "—"}</strong></div>
        <div><span>Subdirección</span><strong>${u.esc(subdireccion) || "—"}</strong></div>
        <div><span>Meta de cumplimiento</span><strong>${meta234()}%</strong></div></div></div>`;

    if (!meds.length) {
      box.innerHTML = datos + u.empty("Sin mediciones registradas.", "Agrega cumplimiento por unidad para activar el semáforo.", "📊");
      document.getElementById("editNT").onclick = editDatos234.bind(null, box);
      return;
    }
    const { per, list } = medsUltimoPeriodo();
    const prom = Math.round(list.reduce((a, b) => a + (Number(b.porcentaje) || 0), 0) / list.length);
    const grupos = { Verde: [], Amarillo: [], Rojo: [] };
    list.forEach(m => grupos[categoria(Number(m.porcentaje))].push(m));

    // Tendencia global por periodo
    const periodos = [...new Set(meds.map(m => m.periodo).filter(Boolean))].sort();
    const serie = periodos.map(pr => {
      const l = meds.filter(m => m.periodo === pr);
      return Math.round(l.reduce((a, b) => a + (Number(b.porcentaje) || 0), 0) / l.length);
    });

    const semaforoHTML = ["Rojo", "Amarillo", "Verde"].map(cat => {
      const s = SEM[cat], g = grupos[cat];
      return `<div style="margin-bottom:.7rem"><div class="flex" style="gap:.4rem;margin-bottom:.3rem">
        <span class="badge badge--${s.badge}">${cat} · ${s.label}</span><span class="kpi__sub">${g.length} unidad(es)</span></div>
        <div>${g.length ? g.map(m => `<span style="display:inline-block;font-weight:800;color:#fff;background:${s.color};padding:.2em .6em;border-radius:6px;margin:.15rem;font-size:12.5px">${u.esc(m.unidad)} · ${Number(m.porcentaje)}%</span>`).join("") : `<span class="muted">Sin unidades en esta categoría.</span>`}</div></div>`;
    }).join("");

    box.innerHTML = datos + `
      <div class="grid grid--kpi" style="margin-top:1rem">
        <div class="card kpi kpi--info"><div class="kpi__label">Periodo</div><div class="kpi__value" style="font-size:1.3rem">${u.esc(per || "—")}</div><div class="kpi__sub">Último registrado</div></div>
        <div class="card kpi ${prom >= meta234() ? "kpi--ok" : "kpi--danger"}"><div class="kpi__label">Cumplimiento global</div><div class="kpi__value">${prom}%</div><div class="kpi__sub">Promedio de ${list.length} unidad(es)</div></div>
        <div class="card kpi kpi--danger"><div class="kpi__label">En intervención</div><div class="kpi__value">${grupos.Rojo.length}</div><div class="kpi__sub">Unidades en rojo</div></div>
        <div class="card kpi kpi--warn"><div class="kpi__label">En seguimiento</div><div class="kpi__value">${grupos.Amarillo.length}</div><div class="kpi__sub">Unidades en amarillo</div></div>
      </div>
      <div class="grid grid--2" style="margin-top:1rem">
        <div class="card"><h3 class="card__title">Semáforo por unidad</h3>${semaforoHTML}</div>
        <div class="card"><h3 class="card__title">Tendencia global</h3>
          ${periodos.length > 1 ? U.charts.lineChart({ labels: periodos, series: [{ name: "Cumplimiento NT 234", color: "var(--c-celeste)", values: serie }], meta: meta234() })
            : U.charts.bars(list.map(m => ({ label: m.unidad, value: Number(m.porcentaje) })), { meta: meta234() })}</div>
      </div>`;
    document.getElementById("editNT").onclick = editDatos234.bind(null, box);
  }
  function editDatos234(box) {
    const u = ui();
    u.modal({ title: "Datos institucionales NT 234",
      body: u.formHTML([
        { name: "responsable", label: "Responsable institucional", full: true, value: S().getConfig("nt234.responsable", "") },
        { name: "resolucion", label: "Resolución", value: S().getConfig("nt234.resolucion", "") },
        { name: "subdireccion", label: "Subdirección", value: S().getConfig("nt234.subdireccion", "") },
        { name: "meta", label: "Meta de cumplimiento (%)", type: "number", value: meta234() }
      ], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        S().setConfig("nt234.responsable", d.responsable); S().setConfig("nt234.resolucion", d.resolucion);
        S().setConfig("nt234.subdireccion", d.subdireccion); S().setConfig("nt234.meta", Number(d.meta) || 90);
        u.closeModal(); panel234(box);
      }; } });
  }
  function unidades234(box) {
    R().mount(box, {
      collection: "nt234", title: "Cumplimiento por unidad", icon: "📊",
      hint: "Registra el cumplimiento por unidad y periodo. El semáforo se calcula automáticamente.",
      newLabel: "Nueva medición",
      emptyMsg: "Sin mediciones registradas.",
      sort: (a, b) => (b.periodo || "").localeCompare(a.periodo || ""),
      columns: [
        { key: "periodo", label: "Periodo" },
        { key: "unidad", label: "Unidad" },
        { key: "porcentaje", label: "Cumplimiento", render: (r, u) => `<strong>${Number(r.porcentaje)}%</strong>` },
        { key: "categoria", label: "Semáforo", render: (r, u) => { const c = categoria(Number(r.porcentaje)); return `<span class="badge badge--${SEM[c].badge}">${c} · ${SEM[c].label}</span>`; } },
        { key: "indicadores", label: "Indicadores" }
      ],
      fields: [
        { name: "periodo", label: "Periodo", required: true, hint: "Ej: 2026-S1" },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, required: true, placeholder: "Seleccionar…" },
        { name: "porcentaje", label: "Cumplimiento (%)", type: "number", required: true },
        { name: "indicadores", label: "Indicadores evaluados", full: true },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true }
      ]
    });
  }
  function planes234(box) {
    R().mount(box, {
      collection: "planesNT234", title: "Plan de mejora NT 234", icon: "🛠️",
      hint: "Planes de mejora ordenados desde el más reciente.",
      newLabel: "Nuevo plan",
      emptyMsg: "Aún no hay planes de mejora.",
      sort: (a, b) => new Date(b.fechaSolicitud || b.fechaCreacion) - new Date(a.fechaSolicitud || a.fechaCreacion),
      columns: [
        { key: "fechaSolicitud", label: "Solicitud", date: true },
        { key: "unidad", label: "Unidad" },
        { key: "indicadores", label: "Indicadores" },
        { key: "porcentaje", label: "%", render: (r) => r.porcentaje != null && r.porcentaje !== "" ? Number(r.porcentaje) + "%" : "—" },
        { key: "plazo", label: "Plazo", date: true },
        { key: "estado", label: "Estado", badge: true },
        { key: "requiereReferente", label: "Referente", render: (r) => r.requiereReferente === "Sí" ? `<span class="badge badge--warn">Requiere</span>` : "—" }
      ],
      fields: [
        { name: "fechaSolicitud", label: "Fecha de solicitud", type: "date", required: true },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "indicadores", label: "Indicadores", full: true },
        { name: "porcentaje", label: "Porcentaje (%)", type: "number" },
        { name: "plazo", label: "Plazo", type: "date" },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado", "Vencido"] },
        { name: "responsable", label: "Responsable" },
        { name: "requiereReferente", label: "Necesidad de intervención técnica", type: "select", options: ["No", "Sí"] },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true }
      ],
      defaults: () => ({ estado: "Pendiente", fechaSolicitud: ui().hoyISO(), requiereReferente: "No" }),
      rowActions: [{ ico: "📨", title: "Solicitar intervención técnica", show: r => r.requiereReferente === "Sí",
        fn: r => U.solicitudes.crearDesde("Norma Técnica 234", { titulo: "Plan de mejora NT 234 · " + (r.unidad || ""), unidad: r.unidad, prioridad: "alta", descripcion: r.observaciones || r.indicadores || "" }, () => {}) }]
    });
  }
  function informe234(box) {
    const u = ui();
    const { per, list } = medsUltimoPeriodo();
    if (!list.length) { box.innerHTML = u.empty("Sin datos para el informe.", "Registra cumplimiento por unidad primero.", "🖨️"); return; }
    const prom = Math.round(list.reduce((a, b) => a + (Number(b.porcentaje) || 0), 0) / list.length);
    const responsable = S().getConfig("nt234.responsable", "________________________");
    box.innerHTML = `<div class="section__head no-print"><p class="section__hint">Informe institucional en formato A4. Se genera una sola vez y permite impresión y PDF.</p>
        <button class="btn btn--primary btn--sm" onclick="window.print()">🖨️ Imprimir / PDF</button></div>
      <div class="card informe-a4" id="informe">
        <div class="franja" style="border-radius:4px"></div>
        <div class="flex" style="justify-content:space-between;margin:.8rem 0">
          <div class="flex"><div class="brand-mini__logo" style="width:52px;height:52px">HUAP</div>
            <div><strong style="font-size:1.1rem">Informe de Cumplimiento · Norma Técnica 234</strong>
            <div class="muted">Unidad de Buenas Prácticas Clínicas – UBPC · HUAP</div></div></div>
          <div class="right"><div class="kpi__sub">Periodo</div><strong>${u.esc(per || "—")}</strong>
            <div class="kpi__sub" style="margin-top:.3rem">Emisión: ${u.fechaCL(new Date())}</div></div>
        </div>
        <div class="grid grid--kpi" style="margin:.6rem 0">
          <div class="card kpi ${prom >= meta234() ? "kpi--ok" : "kpi--danger"}"><div class="kpi__label">Cumplimiento global</div><div class="kpi__value">${prom}%</div><div class="kpi__sub">Meta ${meta234()}%</div></div>
          <div class="card kpi kpi--danger"><div class="kpi__label">Intervención (rojo)</div><div class="kpi__value">${list.filter(m => categoria(Number(m.porcentaje)) === "Rojo").length}</div></div>
          <div class="card kpi kpi--warn"><div class="kpi__label">Seguimiento (amarillo)</div><div class="kpi__value">${list.filter(m => categoria(Number(m.porcentaje)) === "Amarillo").length}</div></div>
          <div class="card kpi kpi--ok"><div class="kpi__label">Dentro de meta (verde)</div><div class="kpi__value">${list.filter(m => categoria(Number(m.porcentaje)) === "Verde").length}</div></div>
        </div>
        <table class="tbl" style="margin:.5rem 0"><thead><tr><th>Unidad</th><th class="right">Cumplimiento</th><th>Semáforo</th></tr></thead><tbody>
          ${list.sort((a, b) => Number(a.porcentaje) - Number(b.porcentaje)).map(m => { const c = categoria(Number(m.porcentaje)); return `<tr><td><strong>${u.esc(m.unidad)}</strong></td><td class="num"><strong>${Number(m.porcentaje)}%</strong></td><td><span style="font-weight:800;color:${SEM[c].color}">● ${c} · ${SEM[c].label}</span></td></tr>`; }).join("")}
        </tbody></table>
        <div style="margin-top:2.5rem;display:flex;justify-content:flex-end">
          <div class="center" style="min-width:280px"><div style="border-top:1px solid var(--text);padding-top:.3rem">${u.esc(responsable)}</div>
            <div class="kpi__sub">Responsable institucional NT 234</div></div>
        </div>
      </div>`;
  }

  /* ===================== MÓDULO 7 — RED DE COLABORACIÓN ===================== */
  const FORMATIVAS = ["Curso", "Capacitación", "Curso B-learning", "Taller", "Exposición"];
  const TIPO_COLOR = { "Asesoría Técnica": "var(--c-celeste)", "Colaboración interna": "var(--c-turquesa)", "Visita técnica": "var(--c-verde)", "Curso": "var(--c-morado)", "Capacitación": "var(--c-azul)", "Curso B-learning": "var(--c-morado)", "Taller": "var(--c-naranjo)", "Exposición": "var(--c-rosado)", "Otra colaboración": "var(--neutral)" };

  function m7() {
    return `<div class="page-head"><h1>Red de Colaboración UBPC</h1>
      <p>Asesorías, visitas técnicas, cursos y colaboraciones institucionales. Fechas en formato chileno.</p></div>
      <div id="m7-body"></div>`;
  }
  function m7Bind() {
    const box = document.getElementById("m7-body");
    R().mount(box, {
      collection: "colaboraciones", title: "Colaboración", icon: "🌐", withCode: true,
      hint: "Registro en tabla. Las observaciones se abren en un detalle desplegable. Código UBPC-COL-AAAA-000.",
      newLabel: "Nueva colaboración", wideForm: true,
      emptyMsg: "Aún no hay colaboraciones registradas.",
      columns: [
        { key: "fecha", label: "Fecha", date: true },
        { key: "tipo", label: "Tipo", render: (r, u) => `<span style="display:inline-block;font-weight:700;color:#fff;background:${TIPO_COLOR[r.tipo] || "var(--neutral)"};padding:.15em .55em;border-radius:6px;font-size:12px">${u.esc(r.tipo || "—")}</span>` },
        { key: "institucion", label: "Institución / contacto", render: (r, u) => `${u.esc(r.institucion || "—")}${r.contacto ? `<div class="kpi__sub">${u.esc(r.contacto)}</div>` : ""}` },
        { key: "unidad", label: "Unidad beneficiaria" },
        { key: "rolUBPC", label: "Rol", render: (r, u) => `<span class="tag">${u.esc(r.rolUBPC || "—")}</span>` },
        { key: "pilar", label: "Pilar" },
        { key: "objetivo", label: "Objetivo" },
        { key: "estado", label: "Estado", badge: true },
        { key: "participantes", label: "Participantes", render: (r) => FORMATIVAS.includes(r.tipo) ? (r.nParticipantes || "—") : "—" },
        { key: "resultado", label: "Resultado" }
      ],
      fields: (rec) => {
        const base = [
          { name: "fecha", label: "Fecha", type: "date", required: true },
          { name: "institucion", label: "Institución", required: true },
          { name: "contacto", label: "Contacto institucional" },
          { name: "unidad", label: "Unidad solicitante o beneficiaria", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
          { name: "objetivo", label: "Objetivo", full: true },
          { name: "tipo", label: "Tipo de colaboración", type: "select", options: CAT().tiposColaboracion },
          { name: "rolUBPC", label: "Rol de la UBPC", type: "select", options: CAT().rolUBPC },
          { name: "pilar", label: "Pilar estratégico", type: "select", options: CAT().pilares },
          { name: "influencia", label: "Nivel de influencia", type: "select", options: ["Local", "Institucional", "Regional", "Nacional"] },
          { name: "coordCapacitacion", label: "Coordinación con Capacitación", type: "select", options: ["No", "Sí"] },
          { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] },
          { name: "resultado", label: "Resultado o aporte", type: "textarea", full: true },
          { name: "observaciones", label: "Observaciones", type: "textarea", full: true }
        ];
        // Solo para actividades formativas
        const formativas = [
          { name: "publicoObjetivo", label: "Público objetivo (formativas)", full: true },
          { name: "hayParticipantes", label: "¿Existen participantes?", type: "select", options: ["No", "Sí"] },
          { name: "nParticipantes", label: "N.º de participantes", type: "number" }
        ];
        return base.concat(formativas);
      },
      defaults: () => ({ estado: "Completado", fecha: ui().hoyISO(), rolUBPC: "Entregó apoyo", coordCapacitacion: "No" }),
      detail: (rec) => {
        const u = ui();
        const esForm = FORMATIVAS.includes(rec.tipo);
        u.modal({ title: "Colaboración · " + (rec.codigo || ""), wide: true,
          body: `<div class="dl">
            <div><span>Fecha</span><strong>${u.fechaCL(rec.fecha)}</strong></div>
            <div><span>Tipo</span><strong>${u.esc(rec.tipo || "—")}</strong></div>
            <div><span>Institución</span><strong>${u.esc(rec.institucion || "—")}</strong></div>
            <div><span>Contacto</span><strong>${u.esc(rec.contacto || "—")}</strong></div>
            <div><span>Unidad beneficiaria</span><strong>${u.esc(rec.unidad || "—")}</strong></div>
            <div><span>Rol de la UBPC</span><strong>${u.esc(rec.rolUBPC || "—")}</strong></div>
            <div><span>Pilar</span><strong>${u.esc(rec.pilar || "—")}</strong></div>
            <div><span>Nivel de influencia</span><strong>${u.esc(rec.influencia || "—")}</strong></div>
            <div><span>Coordinación con Capacitación</span><strong>${u.esc(rec.coordCapacitacion || "—")}</strong></div>
            ${esForm ? `<div><span>Público objetivo</span><strong>${u.esc(rec.publicoObjetivo || "—")}</strong></div>
              <div><span>Participantes</span><strong>${u.esc(rec.nParticipantes || "—")}</strong></div>` : ""}
          </div>
          <div><span class="muted" style="font-size:12px;font-weight:600">Objetivo</span><p class="narrativo">${u.esc(rec.objetivo || "—")}</p></div>
          <div><span class="muted" style="font-size:12px;font-weight:600">Resultado o aporte</span><p class="narrativo">${u.esc(rec.resultado || "—")}</p></div>
          <div><span class="muted" style="font-size:12px;font-weight:600">Observaciones</span><p class="narrativo">${u.esc(rec.observaciones || "—")}</p></div>
          ${U.components.resource.trazabilidad(rec)}`,
          footer: `<button class="btn btn--ghost" data-close>Cerrar</button>` });
      }
    });
  }

  Object.assign(U.coord.views, { m6, m7 });
  Object.assign(U.coord.binders, { m6: m6Bind, m7: m7Bind });
})();
