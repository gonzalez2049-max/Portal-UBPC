/* ============================================================
   MÓDULO 6 (NT 234) y MÓDULO 7 (Red de Colaboración) — Fase 5
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CAT = () => U.data.CAT, R = () => U.components.resource;

  /* ===================== MÓDULO 6 — NORMA TÉCNICA 234 ===================== */
  const M6_TABS = [
    { key: "seguimiento", label: "Seguimiento NT 234" },
    { key: "alertas", label: "Mapa de Alertas NT 234" },
    { key: "planes", label: "Plan de Mejora" },
    { key: "informe", label: "Informe A4" }
  ];
  const NT_IND = [
    { k: "riesgo", l: "Riesgo" }, { k: "piel", l: "Piel" },
    { k: "cambiosPosicion", l: "Cambios de posición" }, { k: "prominenciasOseas", l: "Prominencias óseas" },
    { k: "humedadHigiene", l: "Humedad / higiene" }, { k: "superficiesApoyo", l: "Superficies de apoyo" },
    { k: "nutricion", l: "Nutrición" }, { k: "registroResponsable", l: "Registro responsable" }
  ];
  const MESES6 = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function meta234() { return Number(S().getConfig("nt234.meta", 90)); }

  function promInd(r) {
    const vals = NT_IND.map(i => Number(r[i.k])).filter((v, idx) => r[NT_IND[idx].k] !== "" && r[NT_IND[idx].k] != null && !isNaN(v));
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }
  function globalNT(r) {
    if (r.porcentaje !== "" && r.porcentaje != null && !isNaN(r.porcentaje)) return Math.round(Number(r.porcentaje));
    return promInd(r);
  }
  function estadoNT(pct) {
    if (pct == null) return { k: "sd", label: "Sin datos", inter: "Sin datos", color: "var(--neutral)", badge: "neutral" };
    if (pct >= 80) return { k: "verde", label: "En cumplimiento", inter: "Sin intervención", color: "var(--verde)", badge: "ok" };
    if (pct >= 70) return { k: "amarillo", label: "En seguimiento", inter: "Seguimiento", color: "var(--naranjo)", badge: "warn" };
    return { k: "rojo", label: "Intervención", inter: "Prioridad alta", color: "var(--danger)", badge: "danger" };
  }
  function periodoNT(p) {
    const m = String(p || "").match(/^(\d{4})-(\d{2})/);
    return m ? MESES6[Number(m[2]) - 1] + " de " + m[1] : (p || "—");
  }
  function periodoNTshort(p) {
    const m = String(p || "").match(/^(\d{4})-(\d{2})/);
    return m ? m[2] + "/" + m[1].slice(2) : (p || "—");
  }
  function periodosNT(meds) { return [...new Set(meds.map(m => m.periodo).filter(Boolean))].sort(); }
  function medsUltimoPeriodo() {
    const meds = S().all("nt234"); const p = periodosNT(meds);
    const per = p[p.length - 1];
    return { per, list: meds.filter(m => m.periodo === per) };
  }

  function m6(params) {
    const tab = (params && params.tab) || "seguimiento";
    return `<div class="page-head"><h1>Norma Técnica 234</h1>
      <p>Seguimiento mensual del cumplimiento por unidad, mapa de alertas, planes de mejora e informe.</p></div>
      ${R().tabsBar("coord", "m6", M6_TABS, tab)}<div id="m6-body"></div>`;
  }
  function m6Bind(main, params) {
    const tab = (params && params.tab) || "seguimiento";
    const box = document.getElementById("m6-body");
    ({ seguimiento: seguimiento234, alertas: alertas234, planes: planes234, informe: informe234 }[tab] || seguimiento234)(box);
  }

  /* ---------- Tab 1: Seguimiento (tendencia + historial editable) ---------- */
  function seguimiento234(box) {
    const u = ui();
    let filtro = "Todas";
    const render = () => {
      const meds = S().all("nt234");
      const periodos = periodosNT(meds);
      const unidades = [...new Set(meds.map(m => m.unidad).filter(Boolean))];
      const serie = periodos.map(pr => {
        let l = meds.filter(m => m.periodo === pr);
        if (filtro !== "Todas") l = l.filter(m => m.unidad === filtro);
        const vals = l.map(globalNT).filter(v => v != null);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      });
      const labels = periodos.map(periodoNTshort);
      const trend = periodos.length
        ? U.charts.lineChart({ labels, series: [{ name: filtro === "Todas" ? "Cumplimiento institucional" : filtro, color: "var(--danger)", values: serie }], meta: meta234() })
        : `<p class="muted">Registra mediciones para ver la tendencia.</p>`;

      let rows = "";
      periodos.slice().reverse().forEach(pr => {
        rows += `<tr class="nt-h-group"><td colspan="${NT_IND.length + 4}"><span class="nt-h-plabel">Periodo evaluado</span> ${u.esc(periodoNT(pr))}</td></tr>`;
        meds.filter(m => m.periodo === pr).forEach(m => {
          const g = globalNT(m), e = estadoNT(g);
          rows += `<tr>
            <td><strong>${u.esc(m.unidad || "—")}</strong>${m.jefatura ? `<div class="kpi__sub">${u.esc(m.jefatura)}</div>` : ""}</td>
            ${NT_IND.map(i => `<td class="num">${m[i.k] !== "" && m[i.k] != null ? Number(m[i.k]) + "%" : "—"}</td>`).join("")}
            <td class="num"><span class="badge badge--${e.badge}">${g != null ? g + "%" : "—"}</span></td>
            <td>${m.enviadoUnidad === "Sí" ? `<span class="badge badge--ok">Sí</span>` : "—"}</td>
            <td class="nowrap">${m.fechaEnvio ? u.fechaCL(m.fechaEnvio) : "—"}</td>
            <td class="nowrap"><button class="btn btn--ghost btn--sm" data-edit="${m.id}">Editar</button> <button class="btn btn--ghost btn--sm" data-del="${m.id}">Eliminar</button></td></tr>`;
        });
      });
      const hist = meds.length
        ? `<div style="overflow-x:auto"><table class="tbl nt-hist"><thead><tr><th>Unidad</th>${NT_IND.map(i => `<th class="num">${u.esc(i.l)}</th>`).join("")}<th class="num">Cumpl. global</th><th>Enviado</th><th>Fecha envío</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : u.empty("Sin mediciones registradas.", "Agrega la primera evaluación de la unidad.", "📊");

      box.innerHTML = `
        <div class="card">
          <div class="section__head" style="margin-bottom:.4rem"><div><h3 class="card__title" style="margin:0">Tendencia de cumplimiento global</h3>
            <p class="card__hint" style="margin:0">Evolución mensual por unidad</p></div>
            <select class="select" id="nt-filtro" style="max-width:230px"><option>Todas</option>${unidades.map(x => `<option ${x === filtro ? "selected" : ""}>${u.esc(x)}</option>`).join("")}</select></div>
          ${trend}
        </div>
        <div class="section__head" style="margin-top:1.1rem"><div><h3 class="section__title" style="margin:0">${meds.length} registro(s)</h3><p class="section__hint">Historial editable del módulo</p></div>
          <button class="btn btn--primary btn--sm" id="nt-new">+ Agregar registro</button></div>
        ${hist}`;

      document.getElementById("nt-filtro").onchange = e => { filtro = e.target.value; render(); };
      document.getElementById("nt-new").onclick = () => formNT(null, render);
      box.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => formNT(S().get("nt234", b.dataset.edit), render));
      box.querySelectorAll("[data-del]").forEach(b => b.onclick = () => u.confirmDelete("¿Eliminar esta medición?", () => { S().remove("nt234", b.dataset.del); render(); }));
    };
    render();
  }

  function formNT(rec, done) {
    const u = ui();
    const fields = [
      { name: "periodo", label: "Periodo (mes)", type: "month", required: true, value: rec ? rec.periodo : "" },
      { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, required: true, placeholder: "Seleccionar…", value: rec ? rec.unidad : "" },
      { name: "jefatura", label: "Jefatura / EU responsable", value: rec ? rec.jefatura : "" }
    ].concat(NT_IND.map(i => ({ name: i.k, label: i.l + " (%)", type: "number", value: rec ? rec[i.k] : "" })))
      .concat([
        { name: "enviadoUnidad", label: "Enviado a la unidad", type: "select", options: ["No", "Sí"], value: rec ? rec.enviadoUnidad : "No" },
        { name: "fechaEnvio", label: "Fecha de envío", type: "date", value: rec && rec.fechaEnvio ? u.isoDay(rec.fechaEnvio) : "" },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true, value: rec ? rec.observaciones : "" }
      ]);
    u.modal({
      title: rec ? "Editar registro NT 234" : "Nuevo registro NT 234", wide: true,
      body: u.formHTML(fields, {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.periodo || !d.unidad) { u.toast("Completa periodo y unidad", "danger"); return; }
          d.porcentaje = promInd(d);
          if (rec) S().update("nt234", rec.id, d); else S().insert("nt234", d);
          u.closeModal(); u.toast("Registro guardado", "ok"); done();
        };
      }
    });
  }

  /* ---------- Tab 2: Mapa Inteligente de Alertas ---------- */
  function kpiA(label, value, kind, sub) {
    const u = ui();
    return `<div class="card kpi kpi--${kind}"><div class="kpi__label">${u.esc(label)}</div><div class="kpi__value">${value}</div>${sub ? `<div class="nt-kpichip">${u.esc(sub)}</div>` : ""}</div>`;
  }
  function alertas234(box) {
    const u = ui();
    const meds = S().all("nt234");
    const periodos = periodosNT(meds);
    const ultimo = periodos[periodos.length - 1];
    const unidades = [...new Set(meds.map(m => m.unidad).filter(Boolean))];
    const cards = unidades.map(un => {
      const recs = meds.filter(m => m.unidad === un).sort((a, b) => (a.periodo || "").localeCompare(b.periodo || ""));
      const last = recs[recs.length - 1], prev = recs[recs.length - 2];
      const g = globalNT(last), gp = prev ? globalNT(prev) : null, e = estadoNT(g);
      let vari;
      if (gp == null) vari = `<span class="nt-var">Sin comparación</span>`;
      else { const d = g - gp; vari = d > 0 ? `<span class="nt-var up">↗ Mejoró +${d}%</span>` : d < 0 ? `<span class="nt-var down">↘ Disminuyó ${d}%</span>` : `<span class="nt-var eq">→ Se mantiene</span>`; }
      return { un, g, e, vari, jef: last.jefatura };
    }).filter(c => c.g != null).sort((a, b) => a.g - b.g);
    const evaluadas = cards.length;
    const enCumpl = cards.filter(c => c.e.k === "verde").length;
    const seg = cards.filter(c => c.e.k === "amarillo"), inter = cards.filter(c => c.e.k === "rojo");
    const instit = cards.length ? (cards.reduce((a, c) => a + c.g, 0) / cards.length).toFixed(1) : "—";
    box.innerHTML = `
      <div class="nt-monitor">
        <div class="nt-monitor__eyebrow">Centro de Monitoreo Institucional</div>
        <h2 class="nt-monitor__title">Mapa Inteligente de Alertas NT 234</h2>
        <p class="nt-monitor__sub">Actualización automática desde las evaluaciones registradas · ${u.esc(periodoNT(ultimo))}</p>
      </div>
      <div class="grid grid--kpi" style="margin:1rem 0">
        ${kpiA("Cumplimiento institucional", instit + "%", "info")}
        ${kpiA("Unidades evaluadas", evaluadas, "info")}
        ${kpiA("En cumplimiento", enCumpl, "ok")}
        ${kpiA("Unidades en seguimiento", seg.length, "warn", seg.map(c => c.un).join(", "))}
        ${kpiA("Unidades con intervención", inter.length, "danger", inter.map(c => c.un).join(", "))}
      </div>
      ${cards.length ? `<div class="grid grid--3">${cards.map(c => `
        <div class="nt-alert nt-alert--${c.e.k}">
          <div class="nt-alert__status">${c.e.inter}</div>
          <div class="nt-alert__unit">${u.esc(c.un)}</div>
          <div class="nt-alert__pct">${c.g}%</div>
          <div class="nt-alert__var">${c.vari}</div>
          ${c.jef ? `<div class="nt-alert__jef">${u.esc(c.jef)}</div>` : ""}
        </div>`).join("")}</div>` : u.empty("Sin evaluaciones registradas.", "Agrega mediciones en Seguimiento NT 234.", "🗺️")}`;
  }

  /* ---------- Tab 3: Planes de mejora (control de plazos) ---------- */
  function plazoCol(label, arr, kind) {
    const u = ui();
    return `<div class="nt-plazo nt-plazo--${kind}"><div class="nt-plazo__v">${arr.length}</div><div class="nt-plazo__l">${label}</div>
      <div class="kpi__sub">${arr.length ? [...new Set(arr.map(p => p.unidad || "—"))].join(" · ") : "Sin unidades"}</div></div>`;
  }
  function planes234(box) {
    const u = ui();
    const planes = S().all("planesNT234");
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const entregado = p => /entreg|complet|cerr/i.test(p.estado || "");
    const enPlazo = planes.filter(p => !entregado(p) && p.plazo && new Date(p.plazo) >= hoy);
    const entregados = planes.filter(entregado);
    const alerta = planes.filter(p => !entregado(p) && p.plazo && new Date(p.plazo) < hoy);
    box.innerHTML = `<div class="card nt-plazos">
        <div class="nt-plazos__eyebrow">Control de plazos · NT 234</div>
        <h3 class="card__title" style="margin:.1rem 0 .8rem">Estado de los planes de mejora</h3>
        <div class="grid grid--3">
          ${plazoCol("En plazo", enPlazo, "info")}
          ${plazoCol("Entregados", entregados, "ok")}
          ${plazoCol("Alerta", alerta, "danger")}
        </div></div>
      <div id="nt-planes-body"></div>`;
    R().mount(document.getElementById("nt-planes-body"), {
      collection: "planesNT234", title: "Plan de mejora NT 234", icon: "🛠️",
      hint: "Seguimiento de solicitudes, indicadores y observaciones.",
      newLabel: "Nuevo plan",
      emptyMsg: "Aún no hay planes de mejora.",
      sort: (a, b) => new Date(b.fechaSolicitud || b.fechaCreacion) - new Date(a.fechaSolicitud || a.fechaCreacion),
      columns: [
        { key: "estado", label: "Estado", render: (r, u2) => `<span class="badge badge--${/entreg|complet|cerr/i.test(r.estado || "") ? "ok" : new Date(r.plazo) < new Date() ? "danger" : "warn"}">${u2.esc(r.estado || "—")}</span>${r.subestado ? `<div class="kpi__sub">${u2.esc(r.subestado)}</div>` : ""}` },
        { key: "fechaSolicitud", label: "Fecha solicitud", date: true },
        { key: "plazo", label: "Plazo", date: true },
        { key: "unidad", label: "Unidad" },
        { key: "indicadores", label: "Indicadores a trabajar", render: (r, u2) => (r.indicadores || "").split(/[,;]/).map(s => s.trim()).filter(Boolean).map(s => `<span class="tag nt-chip">${u2.esc(s)}</span>`).join(" ") || "—" },
        { key: "observaciones", label: "Observaciones", render: (r, u2) => `<div class="nt-obs">${u2.esc(r.observaciones || "—")}</div>` }
      ],
      fields: [
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Entregado", "Completado", "Vencido"] },
        { name: "subestado", label: "Subestado", hint: "Ej: Cerrado" },
        { name: "fechaSolicitud", label: "Fecha de solicitud", type: "date", required: true },
        { name: "plazo", label: "Plazo", type: "date" },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "indicadores", label: "Indicadores a trabajar", full: true, hint: "Separa con comas. Ej: Cambios de Posición 52%, Superficie de Apoyo 58%" },
        { name: "responsable", label: "Responsable" },
        { name: "requiereReferente", label: "Necesidad de intervención técnica", type: "select", options: ["No", "Sí"] },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true }
      ],
      defaults: () => ({ estado: "Pendiente", fechaSolicitud: ui().hoyISO(), requiereReferente: "No" }),
      rowActions: [{ ico: "📨", title: "Solicitar intervención técnica", show: r => r.requiereReferente === "Sí",
        fn: r => U.solicitudes.crearDesde("Norma Técnica 234", { titulo: "Plan de mejora NT 234 · " + (r.unidad || ""), unidad: r.unidad, prioridad: "alta", descripcion: r.observaciones || r.indicadores || "" }, () => {}) }]
    });
  }

  /* ---------- Tab 4: Informe A4 ---------- */
  function editDatos234(done) {
    const u = ui();
    u.modal({
      title: "Datos institucionales NT 234",
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
        u.closeModal(); done();
      }; }
    });
  }
  function informe234(box) {
    const u = ui();
    const { per, list } = medsUltimoPeriodo();
    if (!list.length) { box.innerHTML = u.empty("Sin datos para el informe.", "Registra cumplimiento por unidad primero.", "🖨️"); return; }
    const gl = list.map(globalNT).filter(v => v != null);
    const prom = gl.length ? Math.round(gl.reduce((a, b) => a + b, 0) / gl.length) : 0;
    const responsable = S().getConfig("nt234.responsable", "________________________");
    const by = k => list.filter(m => estadoNT(globalNT(m)).k === k).length;
    box.innerHTML = `<div class="section__head no-print"><p class="section__hint">Informe institucional en formato A4, listo para imprimir o exportar a PDF.</p>
        <div class="btn-row"><button class="btn btn--ghost btn--sm" id="nt-datos">✏️ Datos institucionales</button>
        <button class="btn btn--primary btn--sm" onclick="window.print()">🖨️ Imprimir / PDF</button></div></div>
      <div class="card informe-a4 reporte" id="informe">
        <div class="franja" style="border-radius:4px"></div>
        <div class="flex" style="justify-content:space-between;margin:.8rem 0">
          <div class="flex"><div class="brand-mini__logo" style="width:52px;height:52px"><img src="assets/img/huap-logo.png" alt="HUAP"></div>
            <div><strong style="font-size:1.1rem">Informe de Cumplimiento · Norma Técnica 234</strong>
            <div class="muted">Unidad de Buenas Prácticas Clínicas – UBPC · HUAP</div></div></div>
          <div class="right"><div class="kpi__sub">Periodo</div><strong>${u.esc(periodoNT(per))}</strong>
            <div class="kpi__sub" style="margin-top:.3rem">Emisión: ${u.fechaCL(new Date())}</div></div>
        </div>
        <div class="grid grid--kpi" style="margin:.6rem 0">
          <div class="card kpi ${prom >= meta234() ? "kpi--ok" : "kpi--danger"}"><div class="kpi__label">Cumplimiento global</div><div class="kpi__value">${prom}%</div><div class="kpi__sub">Meta ${meta234()}%</div></div>
          <div class="card kpi kpi--danger"><div class="kpi__label">Con intervención</div><div class="kpi__value">${by("rojo")}</div></div>
          <div class="card kpi kpi--warn"><div class="kpi__label">En seguimiento</div><div class="kpi__value">${by("amarillo")}</div></div>
          <div class="card kpi kpi--ok"><div class="kpi__label">En cumplimiento</div><div class="kpi__value">${by("verde")}</div></div>
        </div>
        <table class="tbl" style="margin:.5rem 0"><thead><tr><th>Unidad</th><th>Jefatura</th><th class="right">Cumplimiento</th><th>Estado</th></tr></thead><tbody>
          ${list.slice().sort((a, b) => globalNT(a) - globalNT(b)).map(m => { const g = globalNT(m), e = estadoNT(g); return `<tr><td><strong>${u.esc(m.unidad)}</strong></td><td>${u.esc(m.jefatura || "—")}</td><td class="num"><strong>${g}%</strong></td><td><span style="font-weight:800;color:${e.color}">● ${e.inter}</span></td></tr>`; }).join("")}
        </tbody></table>
        <div style="margin-top:2.5rem;display:flex;justify-content:flex-end">
          <div class="center" style="min-width:280px"><div style="border-top:1px solid var(--text);padding-top:.3rem">${u.esc(responsable)}</div>
            <div class="kpi__sub">Responsable institucional NT 234</div></div>
        </div>
      </div>`;
    const dbtn = document.getElementById("nt-datos");
    if (dbtn) dbtn.onclick = () => editDatos234(() => informe234(box));
  }

  /* ===================== MÓDULO 7 — RED DE COLABORACIÓN ===================== */
  const FORMATIVAS = ["Curso", "Capacitación", "Curso B-learning", "Taller", "Exposición"];
  const TIPO_COLOR = { "Asesoría Técnica": "var(--c-celeste)", "Colaboración interna": "var(--c-turquesa)", "Visita técnica": "var(--c-verde)", "Curso": "var(--c-morado)", "Capacitación": "var(--c-azul)", "Curso B-learning": "var(--c-morado)", "Taller": "var(--c-naranjo)", "Exposición": "var(--c-rosado)", "Otra colaboración": "var(--neutral)" };

  function m7() {
    return `<div class="page-head"><h1>Red de Colaboración UBPC</h1>
      <p>Asesorías, visitas técnicas, cursos y colaboraciones institucionales. Fechas en formato chileno.</p></div>
      <div id="m7-panel"></div>`;
  }
  function renderColabChart(el) {
    if (!el) return;
    const u = ui();
    const cols = S().all("colaboraciones");
    if (!cols.length) { el.innerHTML = ""; return; }
    const completadas = cols.filter(c => /completad/i.test(c.estado || "")).length;
    const formativos = cols.filter(c => FORMATIVAS.includes(c.tipo)).reduce((n, c) => n + (parseInt(c.nParticipantes) || 0), 0);
    const instituciones = new Set(cols.map(c => (c.institucion || "").trim()).filter(Boolean)).size;

    const cuenta = (campo) => {
      const m = {}; cols.forEach(c => { const k = c[campo] || "Sin dato"; m[k] = (m[k] || 0) + 1; });
      return Object.keys(m).map(k => ({ label: k, value: m[k] })).sort((a, b) => b.value - a.value);
    };
    const porTipo = cuenta("tipo"), porPilar = cuenta("pilar");
    const maxT = Math.max.apply(0, porTipo.map(i => i.value)) || 1;
    const maxP = Math.max.apply(0, porPilar.map(i => i.value)) || 1;
    const barList = (items, max, colorFn) => `<div class="bars">${items.map(i => `<div style="margin-bottom:.55rem">
      <div class="flex" style="justify-content:space-between;font-size:13px;font-weight:600"><span>${u.esc(i.label)}</span><span>${i.value}</span></div>
      <div style="background:var(--chart-track,#e9eff7);border-radius:6px;height:12px;overflow:hidden">
        <div style="width:${Math.round(i.value / max * 100)}%;height:100%;background:${colorFn ? colorFn(i.label) : "var(--celeste)"};border-radius:6px"></div></div></div>`).join("")}</div>`;

    const topTipo = porTipo[0], topPilar = porPilar[0];
    const lectura = `La UBPC mantiene <strong>${cols.length} colaboración(es)</strong> con ${instituciones} institución(es); ${completadas} completada(s).`;
    const accion = `Predomina <strong>${u.esc(topTipo.label)}</strong> (${topTipo.value})${topPilar ? ` y el pilar <strong>${u.esc(topPilar.label)}</strong>` : ""}. Equilibrar hacia los tipos y pilares con menor presencia para ampliar la red.`;

    el.innerHTML = `
      <div class="grid grid--kpi" style="margin-bottom:1rem">
        ${kpiMiniC("Colaboraciones", cols.length, "Registradas", "info", "🌐")}
        ${kpiMiniC("Instituciones", instituciones, "En la red", "ok", "🏥")}
        ${kpiMiniC("Completadas", completadas, "Cerradas con resultado", "ok", "✅")}
        ${kpiMiniC("Participantes formativos", formativos, "En actividades formativas", "info", "👥")}
      </div>
      <div class="grid grid--2" style="margin-bottom:1.1rem">
        <div class="card"><h3 class="card__title">Colaboraciones por tipo</h3>
          <p class="card__hint" style="margin:.1rem 0 .5rem">Naturaleza de la colaboración.</p>
          ${barList(porTipo, maxT, (l) => TIPO_COLOR[l] || "var(--celeste)")}</div>
        <div class="card"><h3 class="card__title">Colaboraciones por pilar estratégico</h3>
          <p class="card__hint" style="margin:.1rem 0 .5rem">Alineación con los pilares de la UBPC.</p>
          ${barList(porPilar, maxP)}
          <div class="nt-lectura"><span class="nt-lectura__ico">🧭</span>
            <div><div style="margin-bottom:.15rem">${lectura}</div><div style="color:var(--text-2)"><strong>Decisión sugerida:</strong> ${accion}</div></div></div>
        </div>
      </div>`;
  }
  function kpiMiniC(label, value, sub, kind, icon) {
    const u = ui();
    return `<div class="card kpi kpi--${kind || "info"}">
      <div class="kpi__top"><div class="kpi__label">${u.esc(label)}</div><div class="kpi__ico">${icon || ""}</div></div>
      <div class="kpi__value">${value}</div><div class="kpi__sub">${u.esc(sub || "")}</div></div>`;
  }
  function m7Bind() {
    colabPanel(document.getElementById("m7-panel"));
  }
  // Panel reutilizable de colaboraciones (gráfico + tabla). Se usa en el
  // módulo fusionado "Articulación y Respaldo Institucional".
  function colabPanel(box) {
    if (!box) return;
    box.innerHTML = `<div id="colab-chart"></div><div id="colab-body"></div>`;
    const draw = () => renderColabChart(document.getElementById("colab-chart"));
    draw();
    R().mount(document.getElementById("colab-body"), {
      afterChange: draw,
      collection: "colaboraciones", title: "Colaboración", icon: "🌐", withCode: true,
      hint: "Registro en tabla. Las observaciones se abren en un detalle desplegable. Código UBPC-COL-AAAA-000.",
      newLabel: "Nueva colaboración", wideForm: true,
      filters: [{ key: "tipo", label: "Tipo" }, { key: "estado", label: "Estado" }, { key: "rolUBPC", label: "Rol" }],
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
  U.coord.colabPanel = colabPanel;
})();
