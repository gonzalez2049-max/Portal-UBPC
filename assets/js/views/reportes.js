/* ============================================================
   REPORTES INSTITUCIONALES — imprimibles y exportables (PDF/Word/Excel)
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CS = () => U.coordStats;
  const esc = s => ui().esc(s);

  /* ---------- Bloques comunes de marca ---------- */
  function hdrHTML(titulo, periodo, filtros) {
    const me = U.auth.current();
    return `<div class="rep-hd">
      <div class="rep-hd__brand"><div class="rep-logo">HUAP</div>
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

  function periodoActual() {
    const y = new Date().getFullYear();
    return y + (new Date().getMonth() < 6 ? "-S1" : "-S2");
  }

  const REPORTS = [
    { key: "consolidado", title: "Consolidado institucional", icon: "🏛️", desc: "Resumen ejecutivo de todos los programas de la UBPC.", build: repConsolidado },
    { key: "rnao", title: "Programa RNAO", icon: "🧭", desc: "Cumplimiento, evaluaciones y acciones de mejora.", build: repRNAO },
    { key: "capacitacion", title: "Capacitación y cobertura", icon: "🎓", desc: "Actividades, personas capacitadas y cobertura.", build: repCapacitacion },
    { key: "indicadores", title: "Indicadores UBPC", icon: "📏", desc: "Semáforo, cumplimiento, tendencias y alertas por indicador.", build: repIndicadores },
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
    box.querySelector("[data-print]").onclick = () => printDoc(rep.titulo, full);
    box.querySelector("[data-word]").onclick = () => ui().exportWord("reporte-" + key + "-ubpc", rep.titulo, full);
    box.querySelector("[data-excel]").onclick = () => rep.excel
      ? ui().exportExcel("reporte-" + key + "-ubpc", rep.excel.rows, rep.excel.headers, rep.titulo)
      : ui().toast("Este reporte no tiene tabla exportable", "danger");
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function printDoc(titulo, innerHTML) {
    const w = window.open("", "_blank");
    if (!w) { ui().toast("Permite las ventanas emergentes para imprimir", "danger"); return; }
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
      <style>
        @page{size:A4;margin:14mm} *{box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#17263d;margin:0;padding:6mm}
        h1,h2,h3{font-family:Georgia,serif;color:#0d5044;margin:.6em 0 .3em}
        .franja{height:6px;border-radius:3px;margin-bottom:10px;background:linear-gradient(90deg,#1554b8,#1e9fe0,#0fb5ad,#37a04a,#f2c53d,#f07f2e,#7d4bcf,#e0538a)}
        .rep-hd{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #dbe6f2;padding-bottom:10px;margin-bottom:14px}
        .rep-hd__brand{display:flex;gap:10px;align-items:center}
        .rep-logo{width:52px;height:52px;border-radius:10px;background:#0f4d90;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px}
        .rep-hd__title{font-family:Georgia,serif;font-size:16px;font-weight:700;color:#0d5044}
        .rep-hd__meta{text-align:right;font-size:12px} .muted{color:#5a6b84}
        .rep-kpis{display:flex;gap:10px;margin:12px 0}
        .rep-kpi{flex:1;border:1px solid #dbe6f2;border-radius:8px;padding:8px 10px;border-left:4px solid #12b5a5}
        .rep-kpi__v{font-family:Georgia,serif;font-size:20px;font-weight:700} .rep-kpi__l{font-size:11px;color:#5a6b84}
        table{border-collapse:collapse;width:100%;font-size:11px;margin:6px 0 12px}
        th{background:#0f8f83;color:#fff;text-align:left;padding:6px;border:1px solid #bbb}
        td{padding:5px;border:1px solid #ddd}
        .rep-firma{display:flex;justify-content:flex-end;margin-top:40px}
        .rep-firma__box{text-align:center;min-width:240px} .rep-firma__line{border-top:1px solid #17263d;padding-top:4px}
      </style></head><body><div class="franja"></div>${innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 350);
  }

  function reportesBind() {
    document.querySelectorAll("[data-gen]").forEach(b => b.onclick = () => renderReport(b.dataset.gen));
  }

  U.coord.views.reportes = reportes;
  U.coord.binders.reportes = reportesBind;
})();
