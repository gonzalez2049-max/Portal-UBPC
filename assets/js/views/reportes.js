/* ============================================================
   REPORTES INSTITUCIONALES — imprimibles y exportables (PDF/Word/Excel)
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CS = () => U.coordStats;
  const esc = s => ui().esc(s);
  const LOGO = "data:image/png;base64,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";

  /* ---------- Bloques comunes de marca ---------- */
  function hdrHTML(titulo, periodo, filtros) {
    const me = U.auth.current();
    return `<div class="rep-hd">
      <div class="rep-hd__brand"><div class="rep-logo"><img src="${LOGO}" alt="HUAP"></div>
        <div><strong>Unidad de Buenas Prácticas Clínicas – UBPC</strong>
        <div class="muted">Hospital de Urgencia Asistencia Pública</div></div></div>
      <div class="rep-hd__meta">
        <div class="rep-hd__title">${esc(titulo)}</div>
        <div>Periodo: <strong>${esc(periodo || "—")}</strong></div>
        <div>Emisión: ${ui().fechaCL(new Date())}</div>
        ${filtros ? `<div>Filtros: ${esc(filtros)}</div>` : ""}
        <div>Responsable: ${esc(me ? me.nombre : "—")}</div>
      </div></div>`;
  }
  function firmaHTML() {
    const me = U.auth.current();
    return `<div class="rep-firma"><div class="rep-firma__box">
      <div class="rep-firma__line">${esc(me ? me.nombre : "")}</div>
      <div class="muted">${esc(me ? me.cargo : "Coordinador/a UBPC")} · UBPC</div></div></div>`;
  }
  function kpiRow(items) {
    return `<div class="rep-kpis">${items.map(i => `<div class="rep-kpi">
      <div class="rep-kpi__v">${i.v}</div><div class="rep-kpi__l">${esc(i.l)}</div></div>`).join("")}</div>`;
  }
  function table(headers, rows) {
    if (!rows.length) return `<p class="muted">Sin datos para el período.</p>`;
    return `<table class="rep-tbl"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c == null ? "" : c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }
  function pctFmt(v) { return v == null ? "—" : v + "%"; }

  /* ---------- Generadores de reporte ---------- */
  function repConsolidado() {
    const evals = S().all("evaluacionesRNAO");
    const gl = evals.map(CS().globalCumplimiento).filter(v => v != null);
    const rnao = gl.length ? Math.round(gl.reduce((a, b) => a + b, 0) / gl.length) : null;
    const nt = S().all("nt234");
    const ntG = nt.length ? Math.round(nt.reduce((a, b) => a + (Number(b.porcentaje) || 0), 0) / nt.length) : null;
    const cap = S().all("actividades").reduce((n, a) => n + (parseInt(a.personasCapacitadas) || 0), 0);
    const cols = S().all("colaboraciones").length;
    const proc = S().all("apoyoMejora").filter(a => !/finaliz/i.test(a.estado || "")).length;
    const docs = S().all("documentos").filter(d => /vigente/i.test(d.estado || "")).length;
    const per = periodoActual();
    const rows = [
      ["Programa RNAO", "Cumplimiento institucional", pctFmt(rnao)],
      ["Norma Técnica 234", "Cumplimiento por unidad (promedio)", pctFmt(ntG)],
      ["Fortalecimiento", "Personas capacitadas", cap],
      ["Apoyo y mejora", "Procesos activos", proc],
      ["Gestión documental", "Documentos vigentes", docs],
      ["Red de colaboración", "Colaboraciones registradas", cols]
    ];
    return {
      titulo: "Reporte consolidado institucional", periodo: per,
      body: kpiRow([
        { v: pctFmt(rnao), l: "Cumplimiento RNAO" }, { v: pctFmt(ntG), l: "Cumplimiento NT 234" },
        { v: cap, l: "Personas capacitadas" }, { v: cols, l: "Colaboraciones" }
      ]) + `<h3>Indicadores por programa</h3>` + table(["Programa", "Indicador", "Valor"], rows),
      excel: { headers: ["Programa", "Indicador", "Valor"], rows: rows.map(r => ({ Programa: r[0], Indicador: r[1], Valor: r[2] })) }
    };
  }

  function repRNAO() {
    const evals = S().all("evaluacionesRNAO").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const gl = evals.map(CS().globalCumplimiento).filter(v => v != null);
    const inst = gl.length ? Math.round(gl.reduce((a, b) => a + b, 0) / gl.length) : null;
    const rows = evals.map(e => [
      esc(e.guia || ""), esc(e.unidad || ""), esc(e.tipo || ""), esc(e.periodo || ""),
      `<strong>${pctFmt(CS().globalCumplimiento(e))}</strong>`, (Number(e.meta) || 90) + "%"
    ]);
    const acc = S().all("accionesRNAO").filter(a => a.estado !== "Completado");
    const accRows = acc.map(a => [esc(a.guia || ""), esc(a.unidad || ""), esc(a.indicadorOrigen || ""),
      pctFmt(a.resultado), esc(a.responsable || ""), ui().fechaCL(a.fechaComprometida), esc(a.estado || "")]);
    return {
      titulo: "Reporte del Programa RNAO", periodo: periodoActual(),
      body: kpiRow([
        { v: pctFmt(inst), l: "Cumplimiento institucional" },
        { v: evals.length, l: "Evaluaciones" },
        { v: acc.length, l: "Acciones de mejora pendientes" }
      ]) + `<h3>Evaluaciones registradas</h3>` +
        table(["Guía", "Unidad", "Tipo", "Periodo", "Cumplimiento", "Meta"], rows) +
        `<h3>Acciones de mejora pendientes</h3>` +
        table(["Guía", "Unidad", "Indicador", "Resultado", "Responsable", "Comprometida", "Estado"], accRows),
      excel: {
        headers: ["Guía", "Unidad", "Tipo", "Periodo", "Cumplimiento", "Meta"],
        rows: evals.map(e => ({ "Guía": e.guia, Unidad: e.unidad, Tipo: e.tipo, Periodo: e.periodo,
          Cumplimiento: pctFmt(CS().globalCumplimiento(e)), Meta: (Number(e.meta) || 90) + "%" }))
      }
    };
  }

  function repCapacitacion() {
    const acts = S().all("actividades").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const total = acts.reduce((n, a) => n + (parseInt(a.personasCapacitadas) || 0), 0);
    const rows = acts.map(a => [ui().fechaCL(a.fecha), esc(a.actividad || ""), esc(a.tipo || ""),
      esc(a.estamento || ""), (parseInt(a.personasCapacitadas) || 0), esc(a.cobertura || ""), esc(a.estado || "")]);
    return {
      titulo: "Reporte de capacitación y cobertura", periodo: periodoActual(),
      body: kpiRow([{ v: acts.length, l: "Actividades" }, { v: total, l: "Personas capacitadas" }]) +
        `<h3>Actividades de capacitación</h3>` +
        table(["Fecha", "Actividad", "Tipo", "Estamento", "Capacitados", "Cobertura", "Estado"], rows),
      excel: { headers: ["Fecha", "Actividad", "Tipo", "Estamento", "Capacitados", "Cobertura", "Estado"],
        rows: acts.map(a => ({ Fecha: ui().fechaCL(a.fecha), Actividad: a.actividad, Tipo: a.tipo,
          Estamento: a.estamento, Capacitados: parseInt(a.personasCapacitadas) || 0, Cobertura: a.cobertura, Estado: a.estado })) }
    };
  }

  function repColaboracion() {
    const cols = S().all("colaboraciones").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const forms = cols.filter(c => c.nParticipantes).reduce((n, c) => n + (parseInt(c.nParticipantes) || 0), 0);
    const rows = cols.map(c => [ui().fechaCL(c.fecha), esc(c.institucion || ""), esc(c.tipo || ""),
      esc(c.rolUBPC || ""), esc(c.pilar || ""), (c.nParticipantes || "—"), esc(c.estado || "")]);
    return {
      titulo: "Reporte de la Red de Colaboración", periodo: periodoActual(),
      body: kpiRow([{ v: cols.length, l: "Colaboraciones" }, { v: forms, l: "Participantes formativos" }]) +
        `<h3>Colaboraciones registradas</h3>` +
        table(["Fecha", "Institución", "Tipo", "Rol UBPC", "Pilar", "Participantes", "Estado"], rows),
      excel: { headers: ["Fecha", "Institución", "Tipo", "Rol UBPC", "Pilar", "Participantes", "Estado"],
        rows: cols.map(c => ({ Fecha: ui().fechaCL(c.fecha), "Institución": c.institucion, Tipo: c.tipo,
          "Rol UBPC": c.rolUBPC, Pilar: c.pilar, Participantes: c.nParticipantes || "", Estado: c.estado })) }
    };
  }

  function repIndicadores() {
    const IC = U.indicadoresCalc || {};
    const list = S().all("indicadores");
    const semLabel = { verde: "En meta", amarillo: "En seguimiento", rojo: "Intervención", sd: "Sin datos" };
    const by = k => list.filter(i => (IC.semaforo ? IC.semaforo(i) : "sd") === k).length;
    const rows = list.map(i => {
      const cur = IC.currentValue ? IC.currentValue(i) : null;
      const sem = IC.semaforo ? IC.semaforo(i) : "sd";
      const tnd = IC.tendencia ? IC.tendencia(i) : { arrow: "→", txt: "" };
      return [
        esc(i.nombre || ""), esc(i.tipo || ""),
        (cur == null ? "—" : cur + (i.unidad ? " " + esc(i.unidad) : "")),
        (i.meta === "" || i.meta == null ? "—" : i.meta + "%"),
        pctFmt(IC.cumplimiento ? IC.cumplimiento(i) : null),
        `<strong>${esc(semLabel[sem])}</strong>`,
        esc(tnd.arrow + " " + (tnd.txt || "")),
        esc(i.responsable || ""), esc(i.periodicidad || "")
      ];
    });
    const alertas = list.filter(i => (IC.semaforo ? IC.semaforo(i) : "sd") === "rojo")
      .map(i => [esc(i.nombre || ""), esc(i.tipo || ""), pctFmt(IC.cumplimiento ? IC.cumplimiento(i) : null), esc(i.responsable || "")]);
    return {
      titulo: "Reporte de Indicadores UBPC", periodo: periodoActual(),
      body: kpiRow([
        { v: list.length, l: "Indicadores" }, { v: by("verde"), l: "En meta" },
        { v: by("amarillo"), l: "En seguimiento" }, { v: by("rojo"), l: "En intervención" }
      ]) + `<h3>Indicadores registrados</h3>` +
        table(["Indicador", "Tipo", "Resultado", "Meta", "Cumplimiento", "Semáforo", "Tendencia", "Responsable", "Periodicidad"], rows) +
        `<h3>Alertas — indicadores en intervención</h3>` +
        table(["Indicador", "Tipo", "Cumplimiento", "Responsable"], alertas),
      excel: {
        headers: ["Indicador", "Tipo", "Resultado", "Meta", "Cumplimiento", "Semáforo", "Tendencia", "Responsable", "Periodicidad"],
        rows: list.map(i => {
          const cur = IC.currentValue ? IC.currentValue(i) : null;
          const tnd = IC.tendencia ? IC.tendencia(i) : { arrow: "", txt: "" };
          return {
            Indicador: i.nombre, Tipo: i.tipo, Resultado: cur == null ? "" : cur,
            Meta: i.meta === "" || i.meta == null ? "" : i.meta + "%",
            Cumplimiento: pctFmt(IC.cumplimiento ? IC.cumplimiento(i) : null),
            "Semáforo": semLabel[IC.semaforo ? IC.semaforo(i) : "sd"],
            Tendencia: (tnd.arrow + " " + (tnd.txt || "")).trim(),
            Responsable: i.responsable || "", Periodicidad: i.periodicidad || ""
          };
        })
      }
    };
  }

  function repNT234() {
    const meds = S().all("nt234");
    const NT = U.ntUtil || {};
    const meta = Number(S().getConfig("nt234.meta", 90)) || 90;
    const inst = NT.institNT ? NT.institNT() : { pct: null, unidades: 0 };
    const rows = meds.slice()
      .sort((a, b) => (a.unidad || "").localeCompare(b.unidad || "") || (a.periodo || "").localeCompare(b.periodo || ""))
      .map(m => { const g = NT.globalNT ? NT.globalNT(m) : null;
        return [esc(m.unidad || ""), esc(m.jefatura || ""), esc(m.periodo || ""), `<strong>${pctFmt(g)}</strong>`, meta + "%", esc(m.enviadoUnidad || "—")]; });
    const planes = S().all("planesNT234");
    const planPend = planes.filter(p => !/entreg|complet|cerr/i.test((p.estado || "") + " " + (p.subestado || "")));
    const planRows = planes.map(p => [esc(p.unidad || ""), esc((p.estado || "") + (p.subestado ? " · " + p.subestado : "")),
      ui().fechaCL(p.plazo), esc(p.responsable || ""), esc(p.indicadores || "")]);
    const responsable = S().getConfig("nt234.responsable", "");
    const resolucion = S().getConfig("nt234.resolucion", "");
    return {
      titulo: "Reporte Norma Técnica 234 · Prevención de LPP", periodo: periodoActual(),
      filtros: resolucion ? "Resolución: " + resolucion : "",
      body: kpiRow([
        { v: pctFmt(inst.pct), l: "Cumplimiento institucional" }, { v: inst.unidades || 0, l: "Unidades medidas" },
        { v: meta + "%", l: "Meta institucional" }, { v: planPend.length, l: "Planes de mejora pendientes" }
      ]) + (responsable ? `<p class="muted" style="margin:.3rem 0">Responsable NT 234: <strong>${esc(responsable)}</strong></p>` : "")
        + `<h3>Cumplimiento por unidad y período</h3>` + table(["Unidad", "Jefatura", "Período", "Cumplimiento", "Meta", "Enviado a la unidad"], rows)
        + `<h3>Planes de mejora NT 234</h3>` + table(["Unidad", "Estado", "Plazo", "Responsable", "Indicadores"], planRows),
      excel: { headers: ["Unidad", "Jefatura", "Período", "Cumplimiento", "Meta", "Enviado"],
        rows: meds.map(m => ({ Unidad: m.unidad, Jefatura: m.jefatura, "Período": m.periodo,
          Cumplimiento: pctFmt(NT.globalNT ? NT.globalNT(m) : null), Meta: meta + "%", Enviado: m.enviadoUnidad })) }
    };
  }

  function repDocumental() {
    const docs = S().all("documentos").slice().sort((a, b) => (a.codigo || "").localeCompare(b.codigo || ""));
    const total = docs.length;
    const vigentes = docs.filter(d => /vigente/i.test(d.estado || "")).length;
    const revisados = docs.filter(d => /s[íi]/i.test(d.revisadoUBP || "")).length;
    const pctRev = total ? Math.round(revisados / total * 100) : 0;
    const enProceso = docs.filter(d => /borrador|revisi|enviado/i.test(d.estado || "")).length;
    const rows = docs.map(d => [`<span class="mono">${esc(d.codigo || "")}</span>`, esc(d.nombre || ""), esc(d.tipo || ""),
      "v" + (d.version || "1"), esc(d.estado || ""), /s[íi]/i.test(d.revisadoUBP || "") ? "✔ Sí" : "—", ui().fechaCL(d.fecha)]);
    return {
      titulo: "Reporte de Gestión Documental", periodo: periodoActual(),
      body: kpiRow([
        { v: total, l: "Documentos" }, { v: vigentes, l: "Vigentes" },
        { v: enProceso, l: "En proceso" }, { v: revisados + " · " + pctRev + "%", l: "Con V°B° UBPC" }
      ]) + `<h3>Inventario documental</h3>` + table(["Código", "Documento", "Tipo", "Versión", "Estado", "V°B° UBPC", "Fecha"], rows),
      excel: { headers: ["Código", "Documento", "Tipo", "Versión", "Estado", "V°B° UBPC", "Fecha"],
        rows: docs.map(d => ({ "Código": d.codigo, Documento: d.nombre, Tipo: d.tipo, "Versión": "v" + (d.version || "1"),
          Estado: d.estado, "V°B° UBPC": /s[íi]/i.test(d.revisadoUBP || "") ? "Sí" : "No", Fecha: ui().fechaCL(d.fecha) })) }
    };
  }

  function periodoActual() {
    const y = new Date().getFullYear();
    return y + (new Date().getMonth() < 6 ? "-S1" : "-S2");
  }

  const REPORTS = [
    { key: "consolidado", title: "Consolidado institucional", icon: "🏛️", desc: "Resumen ejecutivo de todos los programas de la UBPC.", build: repConsolidado },
    { key: "rnao", title: "Programa RNAO", icon: "🧭", desc: "Cumplimiento, evaluaciones y acciones de mejora.", build: repRNAO },
    { key: "nt234", title: "Norma Técnica 234", icon: "🛡️", desc: "Prevención de LPP: cumplimiento por unidad y planes de mejora.", build: repNT234 },
    { key: "capacitacion", title: "Capacitación y cobertura", icon: "🎓", desc: "Actividades, personas capacitadas y cobertura.", build: repCapacitacion },
    { key: "indicadores", title: "Indicadores UBPC", icon: "📏", desc: "Semáforo, cumplimiento, tendencias y alertas por indicador.", build: repIndicadores },
    { key: "documental", title: "Gestión Documental", icon: "🗂️", desc: "Inventario de documentos, versiones, estado y V°B° UBPC.", build: repDocumental },
    { key: "colaboracion", title: "Red de Colaboración", icon: "🌐", desc: "Colaboraciones institucionales y participación.", build: repColaboracion }
  ];

  /* ---------- Vista ---------- */
  function reportes() {
    return `<div class="page-head"><h1>Reportes institucionales</h1>
      <p>Genera reportes con la identidad HUAP/UBPC, listos para imprimir, exportar a PDF, Word o Excel.</p></div>
      <div class="grid grid--3 no-print" id="rep-cards">
        ${REPORTS.map(r => `<div class="card rep-card" data-rep="${r.key}">
          <div class="rep-card__ico">${r.icon}</div>
          <h3 class="card__title">${esc(r.title)}</h3>
          <p class="card__hint" style="margin:.2rem 0 .7rem">${esc(r.desc)}</p>
          <button class="btn btn--primary btn--sm" data-gen="${r.key}">Generar</button>
        </div>`).join("")}
      </div>
      <div id="rep-view"></div>`;
  }

  function renderReport(key) {
    const def = REPORTS.find(r => r.key === key); if (!def) return;
    const rep = def.build();
    const full = `${hdrHTML(rep.titulo, rep.periodo, rep.filtros)}${rep.body}${firmaHTML()}`;
    const box = document.getElementById("rep-view");
    box.innerHTML = `
      <div class="rep-actions no-print">
        <strong>${esc(rep.titulo)}</strong>
        <div class="btn-row">
          <button class="btn btn--ghost btn--sm" data-print>🖨️ Imprimir / PDF</button>
          <button class="btn btn--ghost btn--sm" data-word>📄 Word</button>
          <button class="btn btn--ghost btn--sm" data-excel>📊 Excel</button>
        </div>
      </div>
      <div class="reporte" id="rep-doc"><div class="franja" style="border-radius:3px"></div>${full}</div>`;
    // Impresión WYSIWYG: se imprime la misma vista en pantalla (idéntica al preview)
    box.querySelector("[data-print]").onclick = () => { try { window.print(); } catch (e) {} };
    box.querySelector("[data-word]").onclick = () => ui().exportWord("reporte-" + key + "-ubpc", rep.titulo, full);
    box.querySelector("[data-excel]").onclick = () => rep.excel
      ? ui().exportExcel("reporte-" + key + "-ubpc", rep.excel.rows, rep.excel.headers, rep.titulo)
      : ui().toast("Este reporte no tiene tabla exportable", "danger");
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reportesBind() {
    document.querySelectorAll("[data-gen]").forEach(b => b.onclick = () => renderReport(b.dataset.gen));
  }

  U.coord.views.reportes = reportes;
  U.coord.binders.reportes = reportesBind;
})();
