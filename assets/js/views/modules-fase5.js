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
    { key: "epi", label: "Epidemiología LPP" },
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
    ({ seguimiento: seguimiento234, epi: epidemiologia234, alertas: alertas234, planes: planes234, informe: informe234 }[tab] || seguimiento234)(box);
  }

  /* ---------- Tab: Epidemiología LPP (incidencia / prevalencia / % libres) ---------- */
  // Cuenta PACIENTES (no lesiones) y diferencia LPP al ingreso de LPP intrahospitalaria.
  function epiNum(v) { return (v !== "" && v != null && !isNaN(v)) ? Number(v) : null; }
  function epiCalc(r) {
    const evaluados = epiNum(r.evaluados), lppIng = epiNum(r.lppIngreso), lppIntra = epiNum(r.lppIntra);
    const sinLPP = (evaluados != null && lppIng != null) ? Math.max(0, evaluados - lppIng) : null;      // ingresaron sin LPP
    const incidencia = (sinLPP != null && sinLPP > 0 && lppIntra != null) ? (lppIntra / sinLPP * 100) : null;
    const conLPP = (lppIng != null && lppIntra != null) ? (lppIng + lppIntra) : null;                   // al menos una LPP
    const prevalencia = (evaluados != null && evaluados > 0 && conLPP != null) ? (conLPP / evaluados * 100) : null;
    const libres = incidencia != null ? (100 - incidencia) : null;
    return { evaluados, lppIng, lppIntra, sinLPP, incidencia, conLPP, prevalencia, libres };
  }
  const pct1 = v => v == null ? "—" : (Math.round(v * 10) / 10) + "%";

  function epidemiologia234(box) {
    const u = ui();
    let filtro = "Todas";
    const render = () => {
      const recs = S().all("epiLPP");
      const periodos = [...new Set(recs.map(r => r.periodo).filter(Boolean))].sort();
      const unidades = [...new Set(recs.map(r => r.unidad).filter(Boolean))];
      const inFilter = r => filtro === "Todas" || r.unidad === filtro;

      // Serie de tendencia (a partir de conteos sumados del período → indicador correcto)
      const serieInc = [], seriePrev = [];
      periodos.forEach(pr => {
        const l = recs.filter(r => r.periodo === pr && inFilter(r));
        const t = l.reduce((a, r) => { const c = epiCalc(r); a.ev += c.evaluados || 0; a.sin += c.sinLPP || 0; a.intra += c.lppIntra || 0; a.con += c.conLPP || 0; return a; }, { ev: 0, sin: 0, intra: 0, con: 0 });
        serieInc.push(t.sin > 0 ? Math.round(t.intra / t.sin * 1000) / 10 : 0);
        seriePrev.push(t.ev > 0 ? Math.round(t.con / t.ev * 1000) / 10 : 0);
      });
      const labels = periodos.map(periodoNTshort);
      const trend = periodos.length
        ? U.charts.lineChart({ labels, series: [
            { name: "Incidencia intrahospitalaria", color: "var(--danger)", values: serieInc },
            { name: "Prevalencia", color: "#7a5cd0", values: seriePrev }
          ] })
        : `<p class="muted">Registra datos para ver la tendencia.</p>`;

      // Acumulado (institucional o de la unidad filtrada) con todos los períodos
      const acc = recs.filter(inFilter).reduce((a, r) => { const c = epiCalc(r); a.ev += c.evaluados || 0; a.ing += c.lppIng || 0; a.sin += c.sinLPP || 0; a.intra += c.lppIntra || 0; a.con += c.conLPP || 0; return a; }, { ev: 0, ing: 0, sin: 0, intra: 0, con: 0 });
      const accInc = acc.sin > 0 ? acc.intra / acc.sin * 100 : null;
      const accPrev = acc.ev > 0 ? acc.con / acc.ev * 100 : null;
      const accLibres = accInc != null ? 100 - accInc : null;

      // Historial por período y unidad
      let rows = "";
      periodos.slice().reverse().forEach(pr => {
        const l = recs.filter(r => r.periodo === pr && inFilter(r));
        if (!l.length) return;
        rows += `<tr class="nt-h-group"><td colspan="9"><span class="nt-h-plabel">Periodo evaluado</span> ${u.esc(periodoNT(pr))}</td></tr>`;
        l.forEach(r => {
          const c = epiCalc(r);
          const eInc = estadoNT(c.incidencia == null ? null : 100 - c.incidencia); // menos incidencia = mejor
          rows += `<tr>
            <td><strong>${u.esc(r.unidad || "—")}</strong></td>
            <td class="num">${c.evaluados != null ? c.evaluados : "—"}</td>
            <td class="num">${c.lppIng != null ? c.lppIng : "—"}</td>
            <td class="num">${c.sinLPP != null ? c.sinLPP : "—"}</td>
            <td class="num">${c.lppIntra != null ? c.lppIntra : "—"}</td>
            <td class="num"><span class="badge badge--${eInc.badge}">${pct1(c.incidencia)}</span></td>
            <td class="num">${pct1(c.prevalencia)}</td>
            <td class="num">${pct1(c.libres)}</td>
            <td class="nowrap"><button class="btn btn--ghost btn--sm" data-eedit="${r.id}">Editar</button> <button class="btn btn--ghost btn--sm" data-edel="${r.id}">Eliminar</button></td></tr>`;
        });
      });
      const hist = recs.length
        ? `<div style="overflow-x:auto"><table class="tbl nt-hist"><thead><tr>
            <th>Unidad</th><th class="num">Evaluados</th><th class="num">LPP ingreso</th><th class="num">Ingresan sin LPP</th>
            <th class="num">LPP intrahosp.</th><th class="num">Incidencia</th><th class="num">Prevalencia</th><th class="num">% libres</th><th>Acciones</th></tr></thead>
            <tbody>${rows}</tbody></table></div>`
        : u.empty("Sin datos epidemiológicos.", "Agrega el primer registro de pacientes por unidad y mes.", "🩹");

      box.innerHTML = `
        <div class="card" style="border-left:4px solid var(--danger)">
          <p class="card__hint" style="margin:0 0 .5rem">Cuenta <strong>pacientes</strong> (no lesiones). Se diferencia la LPP presente <strong>al ingreso</strong> de la <strong>intrahospitalaria</strong>. Los indicadores se calculan solos.</p>
          <div class="grid grid--kpi">
            ${kpiA("Incidencia intrahosp. (acumulada)", pct1(accInc), accInc != null && accInc <= 5 ? "ok" : accInc != null && accInc <= 10 ? "warn" : "danger", "LPP intra / ingresan sin LPP")}
            ${kpiA("Prevalencia (acumulada)", pct1(accPrev), "info", "con ≥1 LPP / evaluados")}
            ${kpiA("Pacientes libres de LPP intra", pct1(accLibres), "ok", "100 − incidencia")}
            ${kpiA("Pacientes evaluados (total)", acc.ev || 0, "info", filtro === "Todas" ? "Institucional" : u.esc(filtro))}
          </div>
        </div>
        <div class="card" style="margin-top:1rem">
          <div class="section__head" style="margin-bottom:.4rem"><div><h3 class="card__title" style="margin:0">Tendencia mensual</h3>
            <p class="card__hint" style="margin:0">Incidencia intrahospitalaria y prevalencia por mes</p></div>
            <select class="select" id="epi-filtro" style="max-width:230px"><option>Todas</option>${unidades.map(x => `<option ${x === filtro ? "selected" : ""}>${u.esc(x)}</option>`).join("")}</select></div>
          ${trend}
        </div>
        <div class="section__head" style="margin-top:1.1rem"><div><h3 class="section__title" style="margin:0">Resultado mensual por unidad</h3><p class="section__hint">Cálculo automático de incidencia, prevalencia y % libres</p></div>
          <button class="btn btn--primary btn--sm" id="epi-new">+ Agregar registro</button></div>
        ${hist}`;

      document.getElementById("epi-filtro").onchange = e => { filtro = e.target.value; render(); };
      document.getElementById("epi-new").onclick = () => formEpi(null, render);
      box.querySelectorAll("[data-eedit]").forEach(b => b.onclick = () => formEpi(S().get("epiLPP", b.dataset.eedit), render));
      box.querySelectorAll("[data-edel]").forEach(b => b.onclick = () => u.confirmDelete("¿Eliminar este registro epidemiológico?", () => { S().remove("epiLPP", b.dataset.edel); render(); }));
    };
    render();
  }

  function formEpi(rec, done) {
    const u = ui();
    const fields = [
      { name: "periodo", label: "Periodo (mes)", type: "month", required: true, value: rec ? rec.periodo : "" },
      { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, required: true, placeholder: "Seleccionar…", value: rec ? rec.unidad : "" },
      { name: "evaluados", label: "Pacientes evaluados (total)", type: "number", value: rec ? rec.evaluados : "" },
      { name: "lppIngreso", label: "Pacientes con LPP al ingreso", type: "number", value: rec ? rec.lppIngreso : "" },
      { name: "lppIntra", label: "Pacientes que desarrollaron LPP intrahospitalaria", type: "number", value: rec ? rec.lppIntra : "" },
      { name: "observaciones", label: "Observaciones", type: "textarea", full: true, value: rec ? rec.observaciones : "" }
    ];
    u.modal({
      title: rec ? "Editar registro epidemiológico LPP" : "Nuevo registro epidemiológico LPP", wide: true,
      body: `<p class="card__hint" style="margin:0 0 .6rem">Ingresa <strong>número de pacientes</strong>. La incidencia usa como base a quienes ingresaron sin LPP (evaluados − LPP al ingreso); la prevalencia usa a quienes tienen al menos una LPP.</p>`
        + u.formHTML(fields, {})
        + `<div class="card" style="margin-top:.5rem;background:var(--surface-2)"><div id="epi-preview" class="kpi__sub" style="font-size:13px">Completa los campos para ver el cálculo.</div></div>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) {
        const upd = () => {
          const d = u.readForm(m); const c = epiCalc(d);
          const pv = m.querySelector("#epi-preview");
          if (pv) pv.innerHTML = `Ingresan sin LPP: <strong>${c.sinLPP != null ? c.sinLPP : "—"}</strong> · Incidencia intrahosp.: <strong>${pct1(c.incidencia)}</strong> · Prevalencia: <strong>${pct1(c.prevalencia)}</strong> · Libres: <strong>${pct1(c.libres)}</strong>`;
        };
        m.addEventListener("input", upd); upd();
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.periodo || !d.unidad) { u.toast("Completa periodo y unidad", "danger"); return; }
          if (rec) S().update("epiLPP", rec.id, d); else S().insert("epiLPP", d);
          u.closeModal(); u.toast("Registro guardado", "ok"); done();
        };
      }
    });
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
  const NT_SUBESTADOS = ["En elaboración", "En ejecución", "En revisión", "Aprobado", "Cerrado", "Reabierto", "Suspendido"];
  // Color propio por subestado para diferenciarlos de un vistazo
  const NT_SUB_COLOR = {
    "En elaboración": "#8a94a6", "En ejecución": "#176ac0", "En revisión": "#7a5cd0",
    "Aprobado": "#1f9d57", "Cerrado": "#0e6b62", "Reabierto": "#e0912f", "Suspendido": "#e0526f"
  };
  const ntSubChip = s => { const c = NT_SUB_COLOR[s] || "var(--neutral)"; return `<span class="doc-estado" style="--ec:${c};font-size:.68rem;margin-top:.2rem">${U.ui.esc(s)}</span>`; };
  const NT_INDICADORES = [
    "Valoración del riesgo (EMINA/Braden)", "Cambios de posición", "Uso de superficie de apoyo",
    "Valoración de la piel", "Evaluación nutricional", "Prominencias óseas", "Registro responsable"
  ];
  function ntIndRow(r) {
    const u = ui(); r = r || {};
    return `<tr data-nirow>
      <td><select class="input input--sm" data-f="indicador"><option value="">Seleccionar…</option>${NT_INDICADORES.map(o => `<option ${o === (r.indicador || "") ? "selected" : ""}>${u.esc(o)}</option>`).join("")}</select></td>
      <td><input class="input input--sm" data-f="valor" type="number" value="${u.esc(r.valor != null ? r.valor : "")}" placeholder="%" style="max-width:90px"></td>
      <td class="pf-rep__x"><button type="button" class="btn-icon" data-nirm title="Quitar">🗑️</button></td></tr>`;
  }
  function ntIndHTML(rows) {
    rows = (rows && rows.length) ? rows : [{}];
    return `<div class="field" style="grid-column:1/-1">
      <label>Indicadores a trabajar</label>
      <div class="kpi__sub" style="margin-bottom:.35rem">Elige uno o más indicadores de la Norma Técnica 234 y, si quieres, su resultado (%).</div>
      <div class="pf-rep" id="nt-inds"><div class="table-wrap"><table class="tbl pf-rep__t"><thead><tr>
        <th>Indicador</th><th>Resultado %</th><th></th></tr></thead>
        <tbody>${rows.map(ntIndRow).join("")}</tbody></table></div>
        <button type="button" class="btn btn--ghost btn--sm" id="nt-addind">+ Agregar indicador</button></div></div>`;
  }
  function ntIndParse(rec) {
    if (rec && Array.isArray(rec.indicadoresLista) && rec.indicadoresLista.length) return rec.indicadoresLista;
    if (rec && rec.indicadores) return rec.indicadores.split(/[,;]/).map(s => {
      const m = s.trim().match(/^(.*?)\s*(\d+)\s*%?$/);
      return m ? { indicador: m[1].trim(), valor: m[2] } : { indicador: s.trim() };
    }).filter(x => x.indicador);
    return [];
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
        { key: "estado", label: "Estado", render: (r, u2) => `<span class="badge badge--${/entreg|complet|cerr/i.test(r.estado || "") ? "ok" : new Date(r.plazo) < new Date() ? "danger" : "warn"}">${u2.esc(r.estado || "—")}</span>${r.subestado ? `<div>${ntSubChip(r.subestado)}</div>` : ""}` },
        { key: "fechaSolicitud", label: "Fecha solicitud", date: true },
        { key: "plazo", label: "Plazo", date: true },
        { key: "unidad", label: "Unidad" },
        { key: "indicadores", label: "Indicadores a trabajar", render: (r, u2) => (r.indicadores || "").split(/[,;]/).map(s => s.trim()).filter(Boolean).map(s => `<span class="tag nt-chip">${u2.esc(s)}</span>`).join(" ") || "—" },
        { key: "observaciones", label: "Observaciones", render: (r, u2) => `<div class="nt-obs">${u2.esc(r.observaciones || "—")}</div>` }
      ],
      wideForm: true,
      fields: [
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Entregado", "Completado", "Vencido"] },
        { name: "subestado", label: "Subestado", type: "select", options: NT_SUBESTADOS, placeholder: "Sin subestado" },
        { name: "fechaSolicitud", label: "Fecha de solicitud", type: "date", required: true },
        { name: "plazo", label: "Plazo", type: "date" },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "responsable", label: "Responsable" },
        { name: "requiereReferente", label: "Necesidad de intervención técnica", type: "select", options: ["No", "Sí"] },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true }
      ],
      defaults: () => ({ estado: "Pendiente", fechaSolicitud: ui().hoyISO(), requiereReferente: "No" }),
      onFormMount(m, rec) {
        const grid = m.querySelector(".form-grid");
        grid.insertAdjacentHTML("afterend", ntIndHTML(ntIndParse(rec)));
        const wrap = m.querySelector("#nt-inds");
        const bindRm = () => wrap.querySelectorAll("[data-nirm]").forEach(b => b.onclick = () => {
          if (wrap.querySelectorAll("[data-nirow]").length > 1) b.closest("tr").remove();
          else ui().toast("Debe quedar al menos una fila", "warn");
        });
        m.querySelector("#nt-addind").onclick = () => { wrap.querySelector("tbody").insertAdjacentHTML("beforeend", ntIndRow({})); bindRm(); };
        bindRm();
      },
      onBeforeSave(data, rec, m) {
        const rows = [...m.querySelectorAll("#nt-inds [data-nirow]")].map(tr => ({
          indicador: (tr.querySelector('[data-f="indicador"]').value || "").trim(),
          valor: (tr.querySelector('[data-f="valor"]').value || "").trim()
        })).filter(r => r.indicador);
        data.indicadoresLista = rows;
        data.indicadores = rows.map(r => r.indicador + (r.valor !== "" ? " " + r.valor + "%" : "")).join(", ");
        return data;
      },
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
        { name: "responsable", label: "Coordinador/a UBPC (responsable de la estrategia NT 234)", full: true, value: S().getConfig("nt234.responsable", "") || (U.auth.current() ? U.auth.current().nombre : ""), hint: "Aparece en la primera firma del informe." },
        { name: "resolucion", label: "Resolución (opcional)", value: S().getConfig("nt234.resolucion", "") },
        { name: "meta", label: "Meta de cumplimiento (%)", type: "number", value: meta234() },
        { name: "observaciones", label: "Observaciones del informe", type: "textarea", full: true, value: S().getConfig("nt234.observaciones", ""), hint: "Se muestran en el recuadro de Observaciones. Déjalo vacío para escribir a mano." }
      ], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        S().setConfig("nt234.responsable", d.responsable); S().setConfig("nt234.resolucion", d.resolucion);
        S().setConfig("nt234.meta", Number(d.meta) || 90); S().setConfig("nt234.observaciones", d.observaciones || "");
        u.closeModal(); done();
      }; }
    });
  }
  // Estilos del informe NT 234 (compartidos por pantalla e impresión)
  const NT_INF_CSS = `
    .nt-inf{ text-align:center; max-width:720px; margin:0 auto; }
    .nt-inf__franja{ height:7px;border-radius:4px;margin-bottom:14px;
      background:linear-gradient(90deg,#1554b8,#1e9fe0,#0fb5ad,#37a04a,#f2c53d,#f07f2e,#7d4bcf,#e0538a); }
    .nt-inf__logo{ width:58px;height:58px;object-fit:contain;margin-bottom:6px; }
    .nt-inf__ttl{ font-family:'Fraunces',Georgia,serif;font-weight:700;font-size:1.35rem;color:#0d5044;line-height:1.15; }
    .nt-inf__sub{ color:#5a6b84;font-size:.82rem;margin-top:2px; }
    .nt-inf__meta{ color:#40536f;font-size:.82rem;margin-top:8px; }
    .nt-inf__kpis{ display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px auto 6px;max-width:640px; }
    .nt-inf__kpi{ border:1px solid #e2e9f0;border-radius:12px;padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:2px; }
    .nt-inf__kpi.is-ok{ background:#e4f6ec;border-color:#bfe6cd } .nt-inf__kpi.is-warn{ background:#fbf1de;border-color:#f0dcb4 } .nt-inf__kpi.is-danger{ background:#fbe6ea;border-color:#f2c9d1 }
    .nt-inf__k-lab{ font-size:.72rem;font-weight:700;color:#40536f;text-transform:uppercase;letter-spacing:.03em }
    .nt-inf__k-val{ font-family:'Fraunces',Georgia,serif;font-weight:800;font-size:1.55rem;color:#17263d;line-height:1 }
    .nt-inf__k-sub{ font-size:.72rem;color:#5a6b84 }
    .nt-inf__varline{ margin:6px auto 14px;font-size:.9rem;color:#40536f }
    .nt-inf__var{ font-weight:800 } .nt-inf__var--up{ color:#1f9d57 } .nt-inf__var--down{ color:#c62f3b } .nt-inf__var--eq{ color:#8a94a6 }
    .nt-inf__tbl{ border-collapse:collapse;width:100%;max-width:640px;margin:6px auto;font-size:.86rem }
    .nt-inf__tbl th{ background:#0f8f83;color:#fff;padding:7px 9px;border:1px solid #cdd8e2;text-align:center }
    .nt-inf__tbl td{ padding:6px 9px;border:1px solid #e2e9f0;text-align:center }
    .nt-inf__tbl .l{ text-align:left }
    .nt-inf__obs{ max-width:640px;margin:18px auto 0;text-align:left }
    .nt-inf__obs-t{ font-family:'Fraunces',Georgia,serif;font-weight:700;color:#0f8f83;font-size:1rem;margin-bottom:4px }
    .nt-inf__obs-box{ border:1px solid #dbe6f2;border-radius:8px;min-height:70px;padding:10px 12px;color:#22303a;font-size:.88rem;line-height:1.5 }
    .nt-inf__firmas{ display:flex;justify-content:center;gap:60px;margin-top:46px;flex-wrap:wrap }
    .nt-inf__firma{ text-align:center;min-width:240px }
    .nt-inf__line{ width:230px;border-top:1px solid #17263d;margin:26px auto 6px }
    .nt-inf__name{ font-weight:700;color:#17263d }
    .nt-inf__role{ color:#5a6b84;font-size:.8rem;margin-top:2px }`;

  // Variación del cumplimiento global respecto al mes anterior
  function variacionNT() {
    const meds = S().all("nt234"); const ps = periodosNT(meds);
    if (ps.length < 2) return null;
    const avg = per => { const l = meds.filter(m => m.periodo === per).map(globalNT).filter(v => v != null); return l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : null; };
    const a = avg(ps[ps.length - 1]), b = avg(ps[ps.length - 2]);
    if (a == null || b == null) return null;
    return { delta: a - b, prevPer: ps[ps.length - 2] };
  }

  // Bloque de Epidemiología LPP para el informe (mismo período)
  function informeEpiBlock(per) {
    const u = ui();
    const recs = S().all("epiLPP").filter(r => r.periodo === per);
    if (!recs.length) return "";
    const t = recs.reduce((a, r) => { const c = epiCalc(r); a.ev += c.evaluados || 0; a.sin += c.sinLPP || 0; a.intra += c.lppIntra || 0; a.con += c.conLPP || 0; return a; }, { ev: 0, sin: 0, intra: 0, con: 0 });
    const inc = t.sin > 0 ? t.intra / t.sin * 100 : null;
    const prev = t.ev > 0 ? t.con / t.ev * 100 : null;
    const libres = inc != null ? 100 - inc : null;
    const filas = recs.slice().sort((a, b) => String(a.unidad || "").localeCompare(String(b.unidad || ""))).map(r => {
      const c = epiCalc(r);
      return `<tr><td class="l"><strong>${u.esc(r.unidad)}</strong></td><td>${c.evaluados != null ? c.evaluados : "—"}</td><td>${c.lppIntra != null ? c.lppIntra : "—"}</td><td><strong>${pct1(c.incidencia)}</strong></td><td>${pct1(c.prevalencia)}</td><td>${pct1(c.libres)}</td></tr>`;
    }).join("");
    return `<div style="text-align:left;font-family:'Fraunces',Georgia,serif;font-weight:700;color:#0d6b62;font-size:1.05rem;margin:1.4rem 0 .5rem">Epidemiología de LPP · ${u.esc(periodoNT(per))}</div>
      <div class="nt-inf__kpis">
        <div class="nt-inf__kpi is-danger"><span class="nt-inf__k-lab">Incidencia intrahospitalaria</span><span class="nt-inf__k-val">${pct1(inc)}</span><span class="nt-inf__k-sub">LPP intra / ingresan sin LPP</span></div>
        <div class="nt-inf__kpi is-warn"><span class="nt-inf__k-lab">Prevalencia</span><span class="nt-inf__k-val">${pct1(prev)}</span><span class="nt-inf__k-sub">con ≥1 LPP / evaluados</span></div>
        <div class="nt-inf__kpi is-ok"><span class="nt-inf__k-lab">Pacientes libres de LPP intra</span><span class="nt-inf__k-val">${pct1(libres)}</span><span class="nt-inf__k-sub">100 − incidencia</span></div>
      </div>
      <table class="nt-inf__tbl"><thead><tr><th class="l">Unidad</th><th>Evaluados</th><th>LPP intrahosp.</th><th>Incidencia</th><th>Prevalencia</th><th>% libres</th></tr></thead>
        <tbody>${filas}</tbody></table>`;
  }

  function informeInner() {
    const u = ui();
    const { per, list } = medsUltimoPeriodo();
    if (!list.length) return null;
    const gl = list.map(globalNT).filter(v => v != null);
    const prom = gl.length ? Math.round(gl.reduce((a, b) => a + b, 0) / gl.length) : 0;
    const by = k => list.filter(m => estadoNT(globalNT(m)).k === k).length;
    const meta = meta234();
    const v = variacionNT();
    const varTxt = v ? `<span class="nt-inf__var nt-inf__var--${v.delta > 0 ? "up" : v.delta < 0 ? "down" : "eq"}">${v.delta > 0 ? "▲ +" + v.delta : v.delta < 0 ? "▼ " + v.delta : "= 0"} pts vs ${u.esc(periodoNTshort(v.prevPer))}</span>` : `<span class="nt-inf__var">Sin mes previo para comparar</span>`;
    const responsable = S().getConfig("nt234.responsable", "") || (U.auth.current() ? U.auth.current().nombre : "________________________");
    const resolucion = S().getConfig("nt234.resolucion", "");
    const obs = S().getConfig("nt234.observaciones", "");

    const filas = list.slice().sort((a, b) => globalNT(a) - globalNT(b)).map(m => {
      const g = globalNT(m), e = estadoNT(g);
      return `<tr><td class="l"><strong>${u.esc(m.unidad)}</strong></td><td>${u.esc(m.jefatura || "—")}</td>
        <td><strong>${g}%</strong></td><td><span style="font-weight:800;color:${e.color}">● ${u.esc(e.inter)}</span></td></tr>`;
    }).join("");

    return `<div class="nt-inf">
      <div class="nt-inf__franja"></div>
      <div class="nt-inf__head">
        <img class="nt-inf__logo" src="${ntLogo()}" alt="HUAP">
        <div class="nt-inf__ttl">Informe de Cumplimiento · Norma Técnica 234</div>
        <div class="nt-inf__sub">Unidad de Buenas Prácticas Clínicas – UBPC · Hospital de Urgencia Asistencia Pública</div>
        <div class="nt-inf__meta">Periodo <strong>${u.esc(periodoNT(per))}</strong> · Emisión ${u.fechaCL(new Date())}${resolucion ? " · Resolución " + u.esc(resolucion) : ""}</div>
      </div>
      <div class="nt-inf__kpis">
        <div class="nt-inf__kpi ${prom >= meta ? "is-ok" : "is-danger"}"><span class="nt-inf__k-lab">Cumplimiento global</span><span class="nt-inf__k-val">${prom}%</span><span class="nt-inf__k-sub">Meta ${meta}%</span></div>
        <div class="nt-inf__kpi is-danger"><span class="nt-inf__k-lab">Con intervención</span><span class="nt-inf__k-val">${by("rojo")}</span><span class="nt-inf__k-sub">unidad(es)</span></div>
        <div class="nt-inf__kpi is-warn"><span class="nt-inf__k-lab">En seguimiento</span><span class="nt-inf__k-val">${by("amarillo")}</span><span class="nt-inf__k-sub">unidad(es)</span></div>
        <div class="nt-inf__kpi is-ok"><span class="nt-inf__k-lab">En cumplimiento</span><span class="nt-inf__k-val">${by("verde")}</span><span class="nt-inf__k-sub">unidad(es)</span></div>
      </div>
      <div class="nt-inf__varline">Variación del cumplimiento global: ${varTxt}</div>
      <table class="nt-inf__tbl"><thead><tr><th class="l">Unidad</th><th>Jefatura</th><th>Cumplimiento</th><th>Estado</th></tr></thead>
        <tbody>${filas}</tbody></table>
      ${informeEpiBlock(per)}
      <div class="nt-inf__obs">
        <div class="nt-inf__obs-t">Observaciones <span class="no-print" style="font-weight:400;color:#8a94a6;font-size:.78rem">(escribe directamente aquí)</span></div>
        <div class="nt-inf__obs-box" id="nt-obs" contenteditable="true" data-ph="Escribe aquí las observaciones del periodo…">${obs ? u.esc(obs).replace(/\n/g, "<br>") : ""}</div>
      </div>
      <div class="nt-inf__firmas">
        <div class="nt-inf__firma">
          <div class="nt-inf__line"></div>
          <div class="nt-inf__name">${u.esc(responsable)}</div>
          <div class="nt-inf__role">Coordinador/a UBPC · Responsable de la estrategia NT 234</div>
        </div>
        <div class="nt-inf__firma">
          <div class="nt-inf__line"></div>
          <div class="nt-inf__name">Subdirección de Gestión del Cuidado</div>
          <div class="nt-inf__role">Firma y timbre</div>
        </div>
      </div>
    </div>`;
  }

  function informe234(box) {
    const u = ui();
    if (!document.getElementById("nt-inf-style")) {
      const st = document.createElement("style"); st.id = "nt-inf-style"; st.textContent = NT_INF_CSS; document.head.appendChild(st);
    }
    const inner = informeInner();
    if (!inner) { box.innerHTML = u.empty("Sin datos para el informe.", "Registra cumplimiento por unidad primero.", "🖨️"); return; }
    box.innerHTML = `<div class="section__head no-print"><p class="section__hint">Informe institucional centrado, listo para imprimir o exportar a PDF (impresión limpia, sin bordes del navegador).</p>
        <div class="btn-row"><button class="btn btn--ghost btn--sm" id="nt-datos">✏️ Datos y observaciones</button>
        <button class="btn btn--primary btn--sm" id="nt-print">🖨️ Imprimir / PDF</button></div></div>
      <div class="card informe-a4" id="informe">${inner}</div>`;
    const dbtn = document.getElementById("nt-datos");
    if (dbtn) dbtn.onclick = () => editDatos234(() => informe234(box));
    const pbtn = document.getElementById("nt-print");
    if (pbtn) pbtn.onclick = () => printInforme234();
    // Observaciones editables directamente en el informe (se guardan solas)
    const ob = document.getElementById("nt-obs");
    if (ob) ob.addEventListener("blur", () => S().setConfig("nt234.observaciones", ob.innerText.trim()));
  }

  // Logo embebido (data URL) para que se vea en la ventana de impresión
  let _ntLogo = null;
  function ntLogo() {
    if (_ntLogo) return _ntLogo;
    try {
      const img = document.querySelector(".nt-inf__logo") || document.querySelector(".brand-mini__logo img") || document.querySelector('img[src*="huap-logo"]');
      if (img && img.complete && img.naturalWidth) {
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0); _ntLogo = c.toDataURL("image/png"); return _ntLogo;
      }
    } catch (e) {}
    return new URL("assets/img/huap-logo.png", document.baseURI).href;
  }

  function printInforme234() {
    const u = ui();
    const inner = (document.getElementById("informe") ? document.getElementById("informe").innerHTML : informeInner());
    if (!inner) return;
    const w = window.open("", "_blank");
    if (!w) { u.toast("Permite las ventanas emergentes para imprimir", "danger"); return; }
    const fr = new URL("assets/fonts/fraunces.woff2", document.baseURI).href;
    const ns = new URL("assets/fonts/nunitosans.woff2", document.baseURI).href;
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe NT 234</title><style>
      @font-face{font-family:'Fraunces';src:url('${fr}') format('woff2');font-weight:100 900;font-display:swap}
      @font-face{font-family:'Nunito Sans';src:url('${ns}') format('woff2');font-weight:200 900;font-display:swap}
      @page{size:A4;margin:0}
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      html,body{margin:0}
      body{font-family:'Nunito Sans',system-ui,Arial,sans-serif;color:#22303a}
      .sheet{padding:16mm 16mm 18mm;text-align:center}
      ${NT_INF_CSS}
    </style></head><body><div class="sheet">${inner}</div></body></html>`);
    w.document.close();
    const go = () => { try { w.focus(); w.print(); } catch (e) {} };
    if (w.document.fonts && w.document.fonts.ready) { w.document.fonts.ready.then(() => setTimeout(go, 150)); setTimeout(go, 1400); }
    else setTimeout(go, 500);
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
        { key: "participantes", label: "Participantes", render: (r) => (r.nParticipantes != null && r.nParticipantes !== "") ? r.nParticipantes : "—" },
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

  // Utilidad reutilizable por el Home: cumplimiento institucional NT 234 (último período por unidad)
  function institNT() {
    const meds = S().all("nt234");
    const unidades = [...new Set(meds.map(m => m.unidad).filter(Boolean))];
    const gs = unidades.map(un => {
      const recs = meds.filter(m => m.unidad === un).sort((a, b) => (a.periodo || "").localeCompare(b.periodo || ""));
      return globalNT(recs[recs.length - 1]);
    }).filter(v => v != null);
    if (!gs.length) return { pct: null, estado: estadoNT(null) };
    const pct = Math.round(gs.reduce((a, b) => a + b, 0) / gs.length);
    return { pct, estado: estadoNT(pct), unidades: gs.length };
  }
  U.ntUtil = { globalNT, estadoNT, periodosNT, institNT };
})();
