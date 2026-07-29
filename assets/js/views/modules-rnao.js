/* ============================================================
   MÓDULO 3 — PROGRAMA RNAO (Fase 3)
   Guías BPSO · Línea base y seguimiento · Dashboard ·
   Acciones de mejora · Red Champion · Índice de implementación
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CAT = () => U.data.CAT, IND = () => U.data.INDICADORES;
  const CS = () => U.coordStats;

  const TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "evaluaciones", label: "Línea base y seguimiento" },
    { key: "planes", label: "Plan de Intervención RNAO/BPSO" },
    { key: "guias", label: "Guías BPSO" },
    { key: "champion", label: "Red Champion" },
    { key: "indice", label: "Índice de implementación" }
  ];

  function m3(params) {
    const tab = (params && params.tab) || "dashboard";
    return `<div class="page-head"><h1>Programa RNAO</h1>
      <p>Implementación de Guías de Buenas Prácticas (BPSO): evaluación, seguimiento y mejora continua.</p></div>
      ${U.components.resource.tabsBar("coord", "m3", TABS, tab)}
      <div id="m3-body"></div>`;
  }
  function m3Bind(main, params) {
    const tab = (params && params.tab) || "dashboard";
    const box = document.getElementById("m3-body");
    const fns = { dashboard, evaluaciones, planes: b => planesTab(b, params), guias: guiasTab, champion: championTab, indice: indiceTab };
    (fns[tab] || dashboard)(box);
  }

  /* ---------- Utilidades de cálculo ---------- */
  function indicadoresPct(e) {
    return (e.indicadores || []).map(i => ({ nombre: i.nombre, pct: CS().pctIndicador(i), raw: i }))
      .filter(i => i.pct != null).sort((a, b) => a.pct - b.pct);
  }
  function metaDe(e) { return Number(e.meta) || 90; }

  /* ===================== EVALUACIONES (tarjetas consolidadas) ===================== */
  function evaluaciones(box) {
    const u = ui();
    const evals = S().all("evaluacionesRNAO").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    box.innerHTML = `<div class="section__head">
        <p class="section__hint">Cada evaluación se consolida en una sola tarjeta. Los indicadores se ordenan del menor al mayor cumplimiento.</p>
        <button class="btn btn--primary btn--sm" id="newEval">+ Nueva evaluación</button>
      </div>
      ${evals.length ? `<div class="grid grid--3" id="eval-cards">${evals.map(evalCard).join("")}</div>`
        : u.empty("Sin evaluaciones programadas.", "Registra la línea base institucional para comenzar.", "🧭")}`;
    document.getElementById("newEval").onclick = () => evalForm(null, () => evaluaciones(box));
    box.querySelectorAll("[data-everdetail]").forEach(b => b.onclick = () => verIndicadores(S().get("evaluacionesRNAO", b.dataset.everdetail), () => evaluaciones(box)));
    box.querySelectorAll("[data-eveedit]").forEach(b => b.onclick = () => evalForm(S().get("evaluacionesRNAO", b.dataset.eveedit), () => evaluaciones(box)));
    box.querySelectorAll("[data-evedel]").forEach(b => b.onclick = () => u.confirmDelete("¿Eliminar esta evaluación? Se conserva la trazabilidad de otros registros.", () => { S().remove("evaluacionesRNAO", b.dataset.evedel); evaluaciones(box); }));
    box.querySelectorAll("[data-evesol]").forEach(b => b.onclick = () => {
      const e = S().get("evaluacionesRNAO", b.dataset.evesol);
      U.solicitudes.crearDesde("Programa RNAO", { titulo: "Intervención técnica RNAO · " + (e.guia || ""), unidad: e.unidad, prioridad: "alta",
        descripcion: "Evaluación " + (e.periodo || "") + " · Cumplimiento " + (CS().globalCumplimiento(e) || 0) + "%. Requiere intervención técnica." }, () => {});
    });
  }

  function evalCard(e) {
    const u = ui();
    const inds = indicadoresPct(e);
    const meta = metaDe(e);
    const global = CS().globalCumplimiento(e);
    const globalTxt = global == null ? "—" : global + "%";
    const color = global == null ? "var(--neutral)" : (global >= meta ? "var(--verde)" : (global >= meta - 15 ? "var(--naranjo)" : "var(--danger)"));
    const bajos = inds.slice(0, 2);
    return `<div class="card" style="border-top:4px solid ${color}">
      <div class="card__head"><div>
        <span class="tag">${u.esc(e.guia || "Guía")}</span>
        <span class="tag" style="background:var(--surface-2);color:var(--text-2)">${u.esc(e.tipo || "")}</span>
      </div>${u.estadoBadge(e.estado || (global >= meta ? "Dentro de meta" : "En seguimiento"))}</div>
      <div class="kpi__sub">${u.esc(e.unidad || "—")} · ${u.esc(e.periodo || u.fechaCL(e.fecha))}</div>
      <div class="center" style="margin:.6rem 0">
        <div style="font-size:2.4rem;font-weight:800;color:${color};line-height:1">${globalTxt}</div>
        <div class="kpi__sub">Cumplimiento global ${global != null && e.resultadoGlobalOficial != null && e.resultadoGlobalOficial !== "" ? "(oficial)" : ""} · Meta ${meta}%</div>
      </div>
      <div class="kpi__sub" style="margin-bottom:.2rem">${inds.length} indicador(es) · Fuente: ${u.esc(e.fuente || "—")}</div>
      ${bajos.length ? `<div style="font-size:12.5px">Menor cumplimiento:
        ${bajos.map(b => `<div class="flex" style="justify-content:space-between"><span>${u.esc(b.nombre)}</span><strong style="color:${b.pct < meta ? "var(--danger)" : "var(--text)"}">${b.pct}%</strong></div>`).join("")}
      </div>` : `<div class="kpi__sub">Sin indicadores por porcentaje.</div>`}
      <div class="btn-row" style="margin-top:.7rem">
        <button class="btn btn--ghost btn--sm" data-everdetail="${e.id}">Ver indicadores</button>
        <button class="btn btn--ghost btn--sm" data-eveedit="${e.id}">✏️ Editar</button>
        <button class="btn btn--ghost btn--sm" data-evesol="${e.id}" title="Solicitar intervención técnica">📨</button>
        <button class="btn-icon" data-evedel="${e.id}" title="Eliminar">🗑️</button>
      </div>
    </div>`;
  }

  function verIndicadores(e, onChange) {
    const u = ui();
    const inds = indicadoresPct(e);
    const meta = metaDe(e);
    const rows = inds.map(i => `<tr>
      <td>${u.esc(i.nombre)}</td>
      <td class="num"><strong style="color:${i.pct < meta ? "var(--danger)" : "var(--verde)"}">${i.pct}%</strong></td>
      <td>${i.pct < meta ? `<button class="btn btn--ghost btn--sm" data-genacc="${u.esc(i.nombre)}">Generar plan de intervención</button>` : `<span class="badge badge--ok">En meta</span>`}</td>
    </tr>`).join("");
    u.modal({
      title: "Indicadores · " + (e.guia || "") + " · " + (e.unidad || ""), wide: true,
      body: `<div class="dl"><div><span>Cumplimiento global</span><strong>${CS().globalCumplimiento(e) != null ? CS().globalCumplimiento(e) + "%" : "—"}</strong></div>
        <div><span>Meta</span><strong>${meta}%</strong></div><div><span>Tipo</span><strong>${u.esc(e.tipo || "")}</strong></div>
        <div><span>Periodo</span><strong>${u.esc(e.periodo || "")}</strong></div></div>
        ${inds.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Indicador</th><th class="right">Cumplimiento</th><th>Brecha</th></tr></thead><tbody>${rows}</tbody></table></div>`
          : u.empty("Esta evaluación no tiene indicadores con porcentaje.", "", "📊")}
        ${e.brechas ? `<p style="margin-top:.6rem"><strong>Brechas:</strong> ${u.esc(e.brechas)}</p>` : ""}`,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>`,
      onMount(m) {
        m.querySelectorAll("[data-genacc]").forEach(b => b.onclick = () => {
          const ind = inds.find(x => x.nombre === b.dataset.genacc);
          u.closeModal(); crearPlanDesde(e, ind, meta);
        });
      }
    });
  }

  /* ---------- Editor de evaluación (2 modos de ingreso) ---------- */
  function evalForm(rec, onDone) {
    const u = ui();
    rec = rec || {};
    let guia = rec.guia || CAT().guiasArea[0];
    let modo = rec.modoIngreso || CAT().modoIngreso[0];
    const esPct = () => modo === CAT().modoIngreso[0];

    const header = u.formHTML([
      { name: "anio", label: "Año", value: rec.anio || new Date().getFullYear() },
      { name: "periodo", label: "Periodo de evaluación", value: rec.periodo || "", hint: "Ej: 2026-S1" },
      { name: "fecha", label: "Fecha", type: "date", value: rec.fecha ? u.isoDay(rec.fecha) : u.hoyISO() },
      { name: "tipo", label: "Tipo", type: "select", options: CAT().tipoEvaluacion, value: rec.tipo || "Línea base" },
      { name: "guia", label: "Guía BPSO", type: "select", options: CAT().guiasArea, value: guia },
      { name: "unidad", label: "Cobertura / unidad evaluada", type: "select", options: CAT().unidades, value: rec.unidad || "Todas las unidades" },
      { name: "frecuencia", label: "Frecuencia de medición", type: "select", options: CAT().frecuencias, value: rec.frecuencia || "" },
      { name: "fuente", label: "Fuente de verificación", value: rec.fuente || "" },
      { name: "responsable", label: "Responsable de la evaluación", value: rec.responsable || "" },
      { name: "referente", label: "Referente UBPC", value: rec.referente || (U.auth.referente() ? U.auth.referente().nombre : "") },
      { name: "meta", label: "Meta de cumplimiento (%)", type: "number", value: rec.meta || 90 },
      { name: "proximaMedicion", label: "Próxima medición", type: "date", value: rec.proximaMedicion ? u.isoDay(rec.proximaMedicion) : "" }
    ], {});

    const modoSel = `<div class="field"><label class="req">Modo de ingreso</label>
      <select class="select" id="ev-modo">${CAT().modoIngreso.map(o => `<option ${modo === o ? "selected" : ""}>${o}</option>`).join("")}</select>
      <div class="kpi__sub">A: ingresas porcentajes del informe. B: ingresas casos auditados y el portal calcula el % con denominadores reales.</div></div>`;

    u.modal({
      title: (rec.id ? "Editar" : "Nueva") + " evaluación RNAO", wide: true,
      body: `<h4>Datos de la evaluación</h4>${header}${modoSel}
        <h4 style="margin-top:.6rem">Indicadores de la guía</h4>
        <div id="ev-inds"></div>
        <div class="form-grid" style="margin-top:.6rem">
          <div class="field" style="grid-column:1/-1"><label>Resultado global oficial (%) <span class="muted">— si se informa, no se promedian los indicadores</span></label>
            <input class="input" type="number" name="resultadoGlobalOficial" min="0" max="100" value="${rec.resultadoGlobalOficial != null ? rec.resultadoGlobalOficial : ""}"></div>
          <div class="field" style="grid-column:1/-1"><label>Brechas</label><textarea class="textarea" name="brechas">${u.esc(rec.brechas || "")}</textarea></div>
        </div>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar evaluación</button>`,
      onMount(m) {
        const indsBox = m.querySelector("#ev-inds");
        const guiaSel = m.querySelector('select[name="guia"]');
        const tipoSel = m.querySelector('select[name="tipo"]');
        const unidadSel = m.querySelector('select[name="unidad"]');
        const modoDD = m.querySelector("#ev-modo");

        function renderRows() {
          guia = guiaSel.value; modo = modoDD.value;
          const names = IND()[guia] || [];
          const existing = {};
          (rec.indicadores || []).forEach(i => existing[i.nombre] = i);
          indsBox.innerHTML = `<div class="table-wrap"><table class="tbl"><thead><tr>
            <th>Indicador</th>${esPct()
              ? `<th class="right">% cumplimiento</th>`
              : `<th class="right">Denominador</th><th class="right">Cumplen</th><th class="right">No cumplen</th><th class="right">No aplica</th><th class="right">%</th>`}
            </tr></thead><tbody>
            ${names.map((n, idx) => {
              const ex = existing[n] || {};
              if (esPct()) return `<tr><td>${u.esc(n)}</td>
                <td class="num"><input class="input" style="width:90px" type="number" min="0" max="100" data-ind="${idx}" data-f="porcentaje" value="${ex.porcentaje != null ? ex.porcentaje : ""}"></td></tr>`;
              return `<tr><td>${u.esc(n)}</td>
                <td class="num"><input class="input" style="width:80px" type="number" min="0" data-ind="${idx}" data-f="denominador" value="${ex.denominador != null ? ex.denominador : ""}"></td>
                <td class="num"><input class="input" style="width:80px" type="number" min="0" data-ind="${idx}" data-f="cumplen" value="${ex.cumplen != null ? ex.cumplen : ""}"></td>
                <td class="num"><input class="input" style="width:80px" type="number" min="0" data-ind="${idx}" data-f="noCumplen" value="${ex.noCumplen != null ? ex.noCumplen : ""}"></td>
                <td class="num"><input class="input" style="width:80px" type="number" min="0" data-ind="${idx}" data-f="noAplica" value="${ex.noAplica != null ? ex.noAplica : ""}"></td>
                <td class="num" data-pct="${idx}">—</td></tr>`;
            }).join("")}
          </tbody></table></div>
          ${names.length ? "" : u.empty("Selecciona una guía para cargar sus indicadores.", "", "📊")}`;
          if (!esPct()) indsBox.querySelectorAll("input[data-f]").forEach(inp => inp.oninput = () => computePct(idx => idx));
          computeAll();
        }
        function computeAll() {
          if (esPct()) return;
          indsBox.querySelectorAll("td[data-pct]").forEach(td => {
            const idx = td.dataset.pct;
            const den = Number(val(idx, "denominador")), cum = Number(val(idx, "cumplen"));
            td.textContent = den > 0 ? Math.round(cum / den * 100) + "%" : "—";
          });
        }
        function computePct() { computeAll(); }
        function val(idx, f) { const el = indsBox.querySelector(`input[data-ind="${idx}"][data-f="${f}"]`); return el ? el.value : ""; }

        // tipo Línea base → cobertura "Todas las unidades"
        tipoSel.onchange = () => { if (tipoSel.value === "Línea base") unidadSel.value = "Todas las unidades"; };
        guiaSel.onchange = renderRows;
        modoDD.onchange = renderRows;
        indsBox.addEventListener("input", computeAll);
        renderRows();

        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m); // toma header + resultadoGlobalOficial + brechas
          d.modoIngreso = modoDD.value;
          const names = IND()[guiaSel.value] || [];
          d.indicadores = names.map((n, idx) => {
            if (esPct()) { const p = val(idx, "porcentaje"); return p === "" ? null : { nombre: n, porcentaje: Number(p) }; }
            const den = val(idx, "denominador");
            if (den === "") return null;
            return { nombre: n, denominador: Number(den), cumplen: Number(val(idx, "cumplen") || 0),
              noCumplen: Number(val(idx, "noCumplen") || 0), noAplica: Number(val(idx, "noAplica") || 0) };
          }).filter(Boolean);
          if (d.fecha) d.fecha = new Date(d.fecha).toISOString();
          if (d.proximaMedicion) d.proximaMedicion = new Date(d.proximaMedicion).toISOString();
          if (!d.periodo) { u.toast("Indica el periodo de evaluación", "danger"); return; }
          if (rec.id) S().update("evaluacionesRNAO", rec.id, d); else S().insert("evaluacionesRNAO", d);
          u.closeModal(); u.toast("Evaluación guardada", "ok"); if (onDone) onDone();
        };
      }
    });
  }

  /* ===================== DASHBOARD RNAO ===================== */
  function dashboard(box) {
    const u = ui();
    const evals = S().all("evaluacionesRNAO");
    if (!evals.length) { box.innerHTML = u.empty("Sin datos para el dashboard.", "Registra evaluaciones RNAO para ver el análisis institucional.", "📊"); return; }

    const globals = evals.map(e => ({ e, g: CS().globalCumplimiento(e) })).filter(x => x.g != null);
    const instituc = globals.length ? Math.round(globals.reduce((a, b) => a + b.g, 0) / globals.length) : null;

    const byKey = (keyFn) => {
      const m = {};
      globals.forEach(x => { const k = keyFn(x.e); if (!k) return; (m[k] = m[k] || []).push(x.g); });
      return Object.keys(m).map(k => ({ label: k, value: Math.round(m[k].reduce((a, b) => a + b, 0) / m[k].length) })).sort((a, b) => a.value - b.value);
    };
    const porGuia = byKey(e => e.guia);
    const porUnidad = byKey(e => e.unidad);
    const guiaAtencion = porGuia[0], unidadApoyo = porUnidad.find(x => x.label !== "Todas las unidades") || porUnidad[0];

    // indicadores críticos globales
    let allInds = [];
    evals.forEach(e => indicadoresPct(e).forEach(i => allInds.push({ nombre: i.nombre, pct: i.pct, guia: e.guia, unidad: e.unidad, meta: metaDe(e) })));
    allInds.sort((a, b) => a.pct - b.pct);
    const criticos = allInds.slice(0, 5);
    const dosMenores = allInds.slice(0, 2);

    const seguimientos = evals.filter(e => e.tipo === "Seguimiento");
    const unidadesImpl = new Set(seguimientos.map(e => e.unidad).filter(x => x && x !== "Todas las unidades"));
    const acciones = S().all("accionesRNAO");
    const accPend = acciones.filter(a => a.estado !== "Completado");
    const accVenc = accPend.filter(a => a.fechaComprometida && new Date(a.fechaComprometida) < new Date());
    const prox = evals.filter(e => e.proximaMedicion && new Date(e.proximaMedicion) >= new Date()).sort((a, b) => new Date(a.proximaMedicion) - new Date(b.proximaMedicion))[0];

    const alertas = [];
    if (accVenc.length) alertas.push(`${accVenc.length} acción(es) de mejora vencida(s)`);
    if (guiaAtencion && guiaAtencion.value < 90) alertas.push(`${guiaAtencion.label} bajo la meta (${guiaAtencion.value}%)`);
    criticos.filter(c => c.pct < c.meta).slice(0, 1).forEach(c => alertas.push(`Indicador crítico: ${c.nombre} (${c.pct}%)`));

    box.innerHTML = `
      <div class="grid grid--2">
        <div class="card center" style="border-top:4px solid var(--azul-700)">
          <h3 class="card__title">Cumplimiento institucional</h3>
          <div style="display:flex;justify-content:center">${U.charts.gauge(instituc || 0, { meta: 90, label: "Institucional", size: 170 })}</div>
          <p class="kpi__sub">Promedio de resultados oficiales de ${globals.length} evaluación(es).</p>
        </div>
        <div class="card">
          <h3 class="card__title">Panel de prioridades</h3>
          <ul class="feed">
            <li><span class="feed__ico">🎯</span><div><strong>Guía que necesita mayor atención</strong><div class="feed__meta">${guiaAtencion ? u.esc(guiaAtencion.label) + " · " + guiaAtencion.value + "%" : "—"}</div></div></li>
            <li><span class="feed__ico">🏥</span><div><strong>Unidad que necesita apoyo</strong><div class="feed__meta">${unidadApoyo ? u.esc(unidadApoyo.label) + " · " + unidadApoyo.value + "%" : "—"}</div></div></li>
            <li><span class="feed__ico">📉</span><div><strong>Dos indicadores con menor cumplimiento</strong><div class="feed__meta">${dosMenores.length ? dosMenores.map(d => u.esc(d.nombre) + " (" + d.pct + "%)").join(" · ") : "—"}</div></div></li>
            <li><span class="feed__ico">🔁</span><div><strong>Seguimiento posterior</strong><div class="feed__meta">${seguimientos.length ? "Sí · " + seguimientos.length + " seguimiento(s)" : "Aún sin seguimientos"}</div></div></li>
            <li><span class="feed__ico">🏫</span><div><strong>Unidades implementadoras activas</strong><div class="feed__meta">${unidadesImpl.size || "0"}</div></div></li>
            <li><span class="feed__ico">📅</span><div><strong>Próxima medición</strong><div class="feed__meta">${prox ? u.fechaCL(prox.proximaMedicion) + " · " + u.esc(prox.guia || "") : "Sin programar"}</div></div></li>
          </ul>
        </div>
      </div>
      <div class="grid grid--2" style="margin-top:1rem">
        <div class="card"><h3 class="card__title">Comparación por guía</h3>${porGuia.length ? U.charts.bars(porGuia, { meta: 90 }) : u.empty("Sin datos por guía.")}</div>
        <div class="card"><h3 class="card__title">Comparación por unidad</h3>${porUnidad.length ? U.charts.bars(porUnidad, { meta: 90 }) : u.empty("Sin datos por unidad.")}</div>
      </div>
      <div class="grid grid--2" style="margin-top:1rem">
        <div class="card"><h3 class="card__title">Indicadores críticos</h3>
          ${criticos.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Indicador</th><th>Guía · Unidad</th><th class="right">%</th></tr></thead><tbody>
            ${criticos.map(c => `<tr><td>${u.esc(c.nombre)}</td><td class="kpi__sub">${u.esc(c.guia || "")} · ${u.esc(c.unidad || "")}</td><td class="num"><strong style="color:${c.pct < c.meta ? "var(--danger)" : "var(--verde)"}">${c.pct}%</strong></td></tr>`).join("")}
          </tbody></table></div>` : u.empty("Sin indicadores registrados.")}
        </div>
        <div class="card"><h3 class="card__title">Estado de seguimiento y alertas</h3>
          <div class="dl"><div><span>Acciones pendientes</span><strong>${accPend.length}</strong></div>
          <div><span>Acciones vencidas</span><strong style="color:${accVenc.length ? "var(--danger)" : "inherit"}">${accVenc.length}</strong></div></div>
          <div style="margin-top:.5rem">${alertas.length ? alertas.map(a => `<div class="badge badge--danger" style="margin:.15rem .2rem .15rem 0">${u.esc(a)}</div>`).join("") : `<span class="badge badge--ok">Sin alertas activas</span>`}</div>
        </div>
      </div>`;
  }

  /* ===================== PLAN DE INTERVENCIÓN RNAO/BPSO ===================== */
  const EST_SEG = ["Pendiente", "En curso", "Completado", "Retrasado"];
  const PIN_COLS = {
    actividades: [{ f: "actividad", label: "Actividad" }, { f: "responsable", label: "Responsable" }, { f: "verificador", label: "Verificador" }],
    seguimientos: [{ f: "fecha", label: "Fecha", type: "date" }, { f: "descripcion", label: "Descripción / avance" }, { f: "avance", label: "% avance", type: "number" }, { f: "estado", label: "Estado", type: "select", options: EST_SEG }],
    acciones: [{ f: "accion", label: "Acción de mejora" }, { f: "responsable", label: "Responsable" }, { f: "plazo", label: "Plazo", type: "date" }, { f: "estado", label: "Estado", type: "select", options: EST_SEG }, { f: "verificador", label: "Verificador" }]
  };
  const PIN_ADD = { actividades: "Agregar actividad", seguimientos: "Agregar seguimiento", acciones: "Agregar acción" };
  const pinNum = v => (v === "" || v == null || isNaN(v)) ? null : Number(v);
  const pinPct = v => (v != null && String(v).trim() !== "" && !isNaN(v)) ? v + "%" : "—";

  function pinFld(name, label, help, opt) {
    opt = opt || {}; const u = ui(); const id = "pin-" + name;
    const req = opt.req ? ' <span class="pf-req">*</span>' : "";
    const val = opt.value == null ? "" : opt.value;
    let ctrl;
    if (opt.type === "textarea") ctrl = `<textarea class="input" id="${id}" data-pf="${name}" rows="${opt.rows || 2}" ${opt.req ? "data-req" : ""}>${u.esc(val)}</textarea>`;
    else if (opt.type === "select") ctrl = `<select class="input" id="${id}" data-pf="${name}">${(opt.options || []).map(o => `<option ${String(o) === String(val) ? "selected" : ""}>${u.esc(o)}</option>`).join("")}</select>`;
    else ctrl = `<input class="input" id="${id}" data-pf="${name}" type="${opt.type || "text"}" value="${u.esc(val)}" ${opt.req ? "data-req" : ""}>`;
    return `<div class="pf-field ${opt.full ? "pf-field--full" : ""}"><label for="${id}">${u.esc(label)}${req}</label>${ctrl}${help ? `<span class="pf-help">${u.esc(help)}</span>` : ""}</div>`;
  }
  function pinSecH(n, t) { return `<div class="pf-sec-h"><span class="pf-sec-n">${n}</span><h3>${ui().esc(t)}</h3></div>`; }
  function pinRepRow(rep, values) {
    const u = ui(); const cols = PIN_COLS[rep]; values = values || {};
    return `<tr data-reprow>${cols.map(c => {
      const v = values[c.f] == null ? "" : values[c.f];
      let ctrl;
      if (c.type === "select") ctrl = `<select class="input input--sm" data-f="${c.f}">${c.options.map(o => `<option ${String(o) === String(v) ? "selected" : ""}>${u.esc(o)}</option>`).join("")}</select>`;
      else ctrl = `<input class="input input--sm" data-f="${c.f}" type="${c.type || "text"}" value="${u.esc(v)}">`;
      return `<td>${ctrl}</td>`;
    }).join("")}<td class="pf-rep__x"><button type="button" class="btn-icon" data-reprm title="Quitar fila">🗑️</button></td></tr>`;
  }
  function pinRepTable(rep, rows) {
    const u = ui(); const cols = PIN_COLS[rep]; rows = (rows && rows.length) ? rows : [];
    return `<div class="pf-rep" data-rep="${rep}"><div class="table-wrap"><table class="tbl pf-rep__t"><thead><tr>${cols.map(c => `<th>${u.esc(c.label)}</th>`).join("")}<th></th></tr></thead>
      <tbody>${rows.map(r => pinRepRow(rep, r)).join("")}</tbody></table></div>
      <button type="button" class="btn btn--ghost btn--sm" data-repadd="${rep}">+ ${u.esc(PIN_ADD[rep])}</button></div>`;
  }

  function planFormHTML(data) {
    return `<div class="plan-form">
      <section class="pf-section">${pinSecH(1, "Guía, recomendación o brecha")}
        <div class="pf-grid">
          ${pinFld("unidad", "Unidad", "Unidad con baja adherencia, brecha o incumplimiento.", { value: data.unidad, type: "select", options: ["—"].concat(CAT().unidades), req: true })}
          ${pinFld("guia", "Guía BPSO", "Guía de buenas prácticas de referencia.", { value: data.guia, type: "select", options: CAT().guiasArea, req: true })}
          ${pinFld("indicador", "Indicador / recomendación", "Indicador o recomendación que origina la brecha.", { value: data.indicador, full: true })}
          ${pinFld("recomendacion", "Recomendación abordada", "Recomendación específica de la guía que se trabaja.", { value: data.recomendacion, type: "textarea", full: true })}
          ${pinFld("lineaBase", "Línea base (%)", "Cumplimiento inicial medido.", { value: data.lineaBase, type: "number" })}
          ${pinFld("meta", "Meta (%)", "Meta de cumplimiento comprometida.", { value: data.meta, type: "number" })}
          ${pinFld("brecha", "Brecha", "Diferencia respecto a la meta.", { value: data.brecha, full: true })}
        </div></section>
      <section class="pf-section">${pinSecH(2, "Objetivo, actividades y responsables")}
        ${pinFld("objetivo", "Objetivo de la intervención", "Qué se busca lograr con el plan.", { value: data.objetivo, type: "textarea", req: true, full: true })}
        <div class="pf-rep-lbl">Actividades y responsables <span class="pf-help">Agrega todas las actividades necesarias, con responsable y verificador.</span></div>
        ${pinRepTable("actividades", data.actividades)}</section>
      <section class="pf-section">${pinSecH(3, "Plazos, seguimiento y cierre")}
        <div class="pf-grid">
          ${pinFld("plazoInicio", "Plazo · inicio", "", { value: data.plazoInicio, type: "date" })}
          ${pinFld("plazoFin", "Plazo · término", "Fecha comprometida de término.", { value: data.plazoFin, type: "date" })}
          ${pinFld("avance", "Avance global (%)", "Estimación del avance total del plan.", { value: data.avance, type: "number" })}
          ${pinFld("motivoCierre", "Motivo de cierre / reapertura", "Se conserva al cerrar o reabrir el plan.", { value: data.motivoCierre, full: true })}
        </div>
        <div class="pf-rep-lbl">Seguimientos cronológicos <span class="pf-help">Registra cada revisión con fecha, avance y estado.</span></div>
        ${pinRepTable("seguimientos", data.seguimientos)}</section>
      <section class="pf-section">${pinSecH(4, "Acciones de mejora a implementar")}
        <div class="pf-rep-lbl">Acciones <span class="pf-help">Acciones concretas para cerrar la brecha, con responsable, plazo, estado y verificador.</span></div>
        ${pinRepTable("acciones", data.acciones)}</section>
    </div>`;
  }

  function readPlanForm(box) {
    const d = {};
    box.querySelectorAll("[data-pf]").forEach(el => { d[el.dataset.pf] = (el.value || "").trim(); });
    Object.keys(PIN_COLS).forEach(rep => {
      const cols = PIN_COLS[rep];
      d[rep] = [...box.querySelectorAll(`[data-rep="${rep}"] [data-reprow]`)].map(tr => {
        const o = {}; cols.forEach(c => { const el = tr.querySelector(`[data-f="${c.f}"]`); o[c.f] = el ? (el.value || "").trim() : ""; }); return o;
      }).filter(o => Object.keys(o).some(k => o[k] !== ""));
    });
    return d;
  }
  function savePlan(box, current, opts) {
    opts = opts || {}; const u = ui();
    const d = readPlanForm(box);
    box.querySelectorAll(".pf-field--err").forEach(x => x.classList.remove("pf-field--err"));
    const faltan = [];
    if (!d.unidad || d.unidad === "—") faltan.push("unidad");
    if (!d.guia) faltan.push("guia");
    if (!d.objetivo) faltan.push("objetivo");
    faltan.forEach(n => { const el = box.querySelector(`[data-pf="${n}"]`); if (el) el.closest(".pf-field").classList.add("pf-field--err"); });
    if (faltan.length) { u.toast("Completa los campos obligatorios: Unidad, Guía y Objetivo", "danger"); return null; }
    const base = current || {};
    const rec = Object.assign({}, base, d, { estadoCierre: base.estadoCierre || "Abierto", fechaModificacion: new Date().toISOString() });
    let saved;
    if (current) { S().update("planesIntervencion", current.id, rec); saved = S().get("planesIntervencion", current.id); }
    else { saved = S().insert("planesIntervencion", Object.assign({ estadoCierre: "Abierto", fechaCreacion: new Date().toISOString() }, rec)); }
    const docId = U.docsEditor.syncLinkedPlanDoc(saved);
    if (saved.docId !== docId) { S().update("planesIntervencion", saved.id, { docId }); saved.docId = docId; }
    if (!opts.silent) u.toast("Plan guardado y documento sincronizado", "ok");
    return saved;
  }

  function openPlanEditor(box, plan) {
    const u = ui();
    const data = plan || { actividades: [], seguimientos: [], acciones: [], estadoCierre: "Abierto", coordinador: (U.auth.current() || {}).nombre };
    let current = plan;
    const cerrado = data.estadoCierre === "Cerrado";
    box.innerHTML = `
      <div class="doc-bar no-print" style="margin-bottom:.8rem">
        <button class="btn btn--ghost btn--sm" id="pin-back">← Volver a planes</button>
        <div class="doc-bar__title"><span class="tag" style="background:#12b5a522;color:#0f8f83">🧭 Plan de Intervención RNAO/BPSO</span> <span class="badge badge--${cerrado ? "ok" : "warn"}">${cerrado ? "Cerrado" : "Abierto"}</span></div>
        <div class="btn-row">
          <button class="btn btn--ghost btn--sm" id="pin-doc">📄 Documento vinculado</button>
          <button class="btn btn--ghost btn--sm" id="pin-pdf">⬇️ PDF</button>
          <button class="btn btn--ghost btn--sm" id="pin-cierre">${cerrado ? "🔓 Reabrir plan" : "🔒 Cerrar plan"}</button>
          <button class="btn btn--primary btn--sm" id="pin-save">💾 Guardar</button>
        </div>
      </div>
      <div class="doc-linked no-print" style="margin-bottom:1rem">📎 Al guardar, este plan genera y sincroniza su documento <strong>“Plan de Mejora (breve)”</strong> en Gestión Documental. La información se registra una sola vez y no se duplica.${cerrado && data.fechaCierre ? ` · <strong>Cerrado</strong> el ${u.fechaCL(data.fechaCierre)}.` : ""}</div>
      ${planFormHTML(data)}`;

    document.getElementById("pin-back").onclick = () => planList(box);
    const bindRm = () => box.querySelectorAll("[data-reprm]").forEach(b => b.onclick = () => b.closest("tr").remove());
    box.querySelectorAll("[data-repadd]").forEach(b => b.onclick = () => {
      const rep = b.dataset.repadd;
      box.querySelector(`[data-rep="${rep}"] tbody`).insertAdjacentHTML("beforeend", pinRepRow(rep, {}));
      bindRm();
    });
    bindRm();

    document.getElementById("pin-save").onclick = () => { const s = savePlan(box, current); if (s) { current = s; openPlanEditor(box, s); } };
    document.getElementById("pin-doc").onclick = () => { const s = savePlan(box, current, { silent: true }); if (s && s.docId) U.router.go("#/coord/m1?tab=docs&doc=" + s.docId); };
    document.getElementById("pin-pdf").onclick = () => { const s = savePlan(box, current, { silent: true }); if (s && s.docId) U.docsEditor.printDocById(s.docId); };
    document.getElementById("pin-cierre").onclick = () => {
      const s = savePlan(box, current, { silent: true }); if (!s) return;
      const cerrar = s.estadoCierre !== "Cerrado";
      S().update("planesIntervencion", s.id, cerrar
        ? { estadoCierre: "Cerrado", fechaCierre: new Date().toISOString() }
        : { estadoCierre: "Abierto", fechaReapertura: new Date().toISOString() });
      u.toast(cerrar ? "Plan cerrado" : "Plan reabierto", "ok");
      openPlanEditor(box, S().get("planesIntervencion", s.id));
    };
  }

  function planCard(pl) {
    const u = ui();
    const cerrado = pl.estadoCierre === "Cerrado";
    const av = pinNum(pl.avance);
    const color = cerrado ? "var(--verde)" : (av != null && av >= 70 ? "var(--verde)" : av != null && av >= 40 ? "var(--naranjo)" : "var(--danger)");
    return `<div class="card" style="border-top:4px solid ${color}">
      <div class="card__head"><div><span class="tag">${u.esc(pl.guia || "Guía")}</span> <span class="tag" style="background:var(--surface-2);color:var(--text-2)">${u.esc(pl.unidad || "—")}</span></div>
        <span class="badge badge--${cerrado ? "ok" : "warn"}">${cerrado ? "Cerrado" : "Abierto"}</span></div>
      <h4 class="doc-card__title" style="margin:.4rem 0 .2rem">${u.esc(pl.indicador || pl.objetivo || "Plan de intervención")}</h4>
      <div class="kpi__sub">Línea base ${pinPct(pl.lineaBase)} · Meta ${pinPct(pl.meta)}${pl.brecha ? " · Brecha " + u.esc(pl.brecha) : ""}</div>
      <div class="pin-prog"><div class="pin-prog__bar" style="width:${av != null ? Math.min(100, Math.max(0, av)) : 0}%;background:${color}"></div></div>
      <div class="kpi__sub">Avance ${av != null ? av + "%" : "—"} · ${(pl.acciones || []).length} acción(es) · ${(pl.seguimientos || []).length} seguimiento(s)</div>
      <div class="btn-row" style="margin-top:.6rem;flex-wrap:wrap">
        <button class="btn btn--primary btn--sm" data-plopen="${pl.id}">Abrir</button>
        <button class="btn btn--ghost btn--sm" data-pldoc="${pl.id}" title="Documento Plan de Mejora vinculado">📄 Documento</button>
        <button class="btn btn--ghost btn--sm" data-plpdf="${pl.id}">⬇️ PDF</button>
        <button class="btn-icon" data-pldel="${pl.id}" title="Eliminar">🗑️</button>
      </div></div>`;
  }

  function planList(box) {
    const u = ui();
    const planes = S().all("planesIntervencion").sort((a, b) => new Date(b.fechaModificacion || b.fechaCreacion || 0) - new Date(a.fechaModificacion || a.fechaCreacion || 0));
    box.innerHTML = `<div class="section__head">
        <p class="section__hint">Planes de intervención para unidades con baja adherencia, brechas o incumplimiento de indicadores. Cada plan genera su documento “Plan de Mejora (breve)” asociado.</p>
        <button class="btn btn--primary btn--sm" id="newPlan">+ Nuevo plan</button>
      </div>
      ${planes.length ? `<div class="grid grid--3">${planes.map(planCard).join("")}</div>`
        : u.empty("Aún no hay planes de intervención.", "Crea uno aquí, o genéralo desde un indicador bajo la meta en “Línea base y seguimiento”.", "🧭")}`;
    document.getElementById("newPlan").onclick = () => openPlanEditor(box, null);
    box.querySelectorAll("[data-plopen]").forEach(b => b.onclick = () => openPlanEditor(box, S().get("planesIntervencion", b.dataset.plopen)));
    box.querySelectorAll("[data-pldoc]").forEach(b => b.onclick = () => {
      const pl = S().get("planesIntervencion", b.dataset.pldoc); const docId = U.docsEditor.syncLinkedPlanDoc(pl);
      S().update("planesIntervencion", pl.id, { docId }); U.router.go("#/coord/m1?tab=docs&doc=" + docId);
    });
    box.querySelectorAll("[data-plpdf]").forEach(b => b.onclick = () => {
      const pl = S().get("planesIntervencion", b.dataset.plpdf); const docId = U.docsEditor.syncLinkedPlanDoc(pl);
      S().update("planesIntervencion", pl.id, { docId }); U.docsEditor.printDocById(docId);
    });
    box.querySelectorAll("[data-pldel]").forEach(b => b.onclick = () =>
      u.confirmDelete("¿Eliminar este plan de intervención? El documento vinculado se conserva.", () => { S().remove("planesIntervencion", b.dataset.pldel); planList(box); }));
  }

  function planesTab(box, params) {
    if (params && params.plan) {
      const pl = S().get("planesIntervencion", params.plan);
      if (pl) { openPlanEditor(box, pl); return; }
    }
    planList(box);
  }

  // Generar un plan desde un indicador bajo meta (deja la brecha precargada)
  function crearPlanDesde(e, ind, meta) {
    const brecha = meta - ind.pct;
    const plan = S().insert("planesIntervencion", {
      unidad: e.unidad || "—", guia: e.guia || "", indicador: ind.nombre, recomendacion: "",
      lineaBase: ind.pct, meta: meta, brecha: brecha > 0 ? brecha + " pts" : "0",
      objetivo: "", actividades: [], seguimientos: [], acciones: [],
      plazoInicio: "", plazoFin: "", avance: "", estadoCierre: "Abierto",
      coordinador: (U.auth.current() || {}).nombre, fechaCreacion: new Date().toISOString()
    });
    const docId = U.docsEditor.syncLinkedPlanDoc(plan);
    S().update("planesIntervencion", plan.id, { docId });
    ui().toast("Plan de intervención creado", "ok");
    U.router.go("#/coord/m3?tab=planes&plan=" + plan.id);
  }

  /* ===================== GUÍAS BPSO ===================== */
  // Unidades implementadoras (múltiples) con jefatura y líder de Buenas Prácticas
  function guiaUnidades(rec) {
    if (rec && Array.isArray(rec.unidades) && rec.unidades.length) return rec.unidades;
    if (rec && rec.unidadesImplementadoras) return rec.unidadesImplementadoras.split(",").map(s => ({ unidad: s.trim() })).filter(x => x.unidad);
    return [];
  }
  function guiaUnitRow(r) {
    const u = ui(); r = r || {};
    const opts = CAT().unidades.filter(x => !/todas las unidades/i.test(x));
    return `<tr data-urow>
      <td><select class="input input--sm" data-f="unidad"><option value="">Seleccionar…</option>${opts.map(o => `<option ${String(o) === String(r.unidad || "") ? "selected" : ""}>${u.esc(o)}</option>`).join("")}</select></td>
      <td><input class="input input--sm" data-f="jefatura" value="${u.esc(r.jefatura || "")}" placeholder="Jefatura de la unidad"></td>
      <td><input class="input input--sm" data-f="lider" value="${u.esc(r.lider || "")}" placeholder="Líder de Buenas Prácticas"></td>
      <td class="pf-rep__x"><button type="button" class="btn-icon" data-urm title="Quitar unidad">🗑️</button></td></tr>`;
  }
  function guiaUnidadesHTML(rows) {
    rows = (rows && rows.length) ? rows : [{}];
    return `<div class="field" style="grid-column:1/-1">
      <label>Unidades implementadoras</label>
      <div class="kpi__sub" style="margin-bottom:.35rem">Agrega una o más unidades, cada una con su jefatura y su líder de Buenas Prácticas.</div>
      <div class="pf-rep" id="guia-units"><div class="table-wrap"><table class="tbl pf-rep__t"><thead><tr>
        <th>Unidad</th><th>Jefatura</th><th>Líder de Buenas Prácticas</th><th></th></tr></thead>
        <tbody>${rows.map(guiaUnitRow).join("")}</tbody></table></div>
        <button type="button" class="btn btn--ghost btn--sm" id="guia-addunit">+ Agregar unidad</button></div></div>`;
  }
  function guiaDetalle(rec) {
    const u = ui();
    const arr = guiaUnidades(rec);
    const rows = arr.length
      ? arr.map(x => `<tr><td>${u.esc(x.unidad || "—")}</td><td>${u.esc(x.jefatura || "—")}</td><td>${u.esc(x.lider || "—")}</td></tr>`).join("")
      : `<tr><td colspan="3" class="muted">Sin unidades registradas.</td></tr>`;
    u.modal({
      title: "Guía · " + (rec.nombre || ""), wide: true,
      body: `<div class="dl"><div><span>Área</span><strong>${u.esc(rec.area || "—")}</strong></div>
          <div><span>Estado</span><strong>${u.esc(rec.estado || "—")}</strong></div>
          <div><span>Unidades</span><strong>${arr.length}</strong></div></div>
        <h4 style="margin:.7rem 0 .3rem">Unidades implementadoras</h4>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Unidad</th><th>Jefatura</th><th>Líder de Buenas Prácticas</th></tr></thead><tbody>${rows}</tbody></table></div>`,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>`
    });
  }
  function guiasTab(box) {
    U.components.resource.mount(box, {
      collection: "guiasBPSO", title: "Guía BPSO", icon: "🧭", wideForm: true,
      hint: "Gestión de las Guías de Buenas Prácticas (BPSO) en implementación.",
      newLabel: "Nueva guía",
      emptyMsg: "Aún no hay guías registradas.",
      columns: [
        { key: "nombre", label: "Guía" },
        { key: "area", label: "Área", render: (r, u) => `<span class="tag">${u.esc(r.area || "—")}</span>` },
        { key: "estado", label: "Estado", badge: true },
        { key: "unidades", label: "Unidades", exportVal: r => guiaUnidades(r).map(x => x.unidad + (x.lider ? " (líder: " + x.lider + ")" : "")).join(" · "),
          render: (r, u) => { const a = guiaUnidades(r); return a.length ? `<span class="tag">${a.length}</span> ${u.esc(a.slice(0, 2).map(x => x.unidad).join(", "))}${a.length > 2 ? "…" : ""}` : `<span class="muted">—</span>`; } }
      ],
      fields: [
        { name: "nombre", label: "Nombre de la guía", required: true, full: true },
        { name: "area", label: "Área", type: "select", options: CAT().guiasArea },
        { name: "estado", label: "Estado", type: "select", options: ["Activa", "En preparación", "Inactiva"] }
      ],
      defaults: () => ({ estado: "Activa" }),
      detail: guiaDetalle,
      onFormMount(m, rec) {
        const grid = m.querySelector(".form-grid");
        grid.insertAdjacentHTML("afterend", guiaUnidadesHTML(guiaUnidades(rec)));
        const wrap = m.querySelector("#guia-units");
        const bindRm = () => wrap.querySelectorAll("[data-urm]").forEach(b => b.onclick = () => {
          if (wrap.querySelectorAll("[data-urow]").length > 1) b.closest("tr").remove();
          else ui().toast("Debe quedar al menos una unidad", "warn");
        });
        m.querySelector("#guia-addunit").onclick = () => { wrap.querySelector("tbody").insertAdjacentHTML("beforeend", guiaUnitRow({})); bindRm(); };
        bindRm();
      },
      onBeforeSave(data, rec, m) {
        const rows = [...m.querySelectorAll("#guia-units [data-urow]")].map(tr => ({
          unidad: (tr.querySelector('[data-f="unidad"]').value || "").trim(),
          jefatura: (tr.querySelector('[data-f="jefatura"]').value || "").trim(),
          lider: (tr.querySelector('[data-f="lider"]').value || "").trim()
        })).filter(r => r.unidad || r.jefatura || r.lider);
        data.unidades = rows;
        data.unidadesImplementadoras = rows.map(r => r.unidad).filter(Boolean).join(", ");
        return data;
      }
    });
  }

  /* ===================== RED CHAMPION ===================== */
  function championTab(box) {
    U.components.resource.mount(box, {
      collection: "redChampion", title: "Champion", icon: "⭐",
      hint: "Red de Champions (referentes clínicos) por unidad y guía.",
      newLabel: "Nuevo champion",
      emptyMsg: "Aún no hay Champions registrados.",
      columns: [
        { key: "nombre", label: "Nombre" },
        { key: "estamento", label: "Estamento", render: (r, u) => `<span class="tag">${u.esc(r.estamento || "—")}</span>` },
        { key: "unidad", label: "Unidad" },
        { key: "guia", label: "Guía" },
        { key: "estado", label: "Estado", badge: true }
      ],
      fields: [
        { name: "nombre", label: "Nombre", required: true, full: true },
        { name: "estamento", label: "Estamento", type: "select", options: CAT().estamentos },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "guia", label: "Guía", type: "select", options: CAT().guiasArea },
        { name: "contacto", label: "Contacto" },
        { name: "estado", label: "Estado", type: "select", options: ["Activo", "Inactivo"] }
      ],
      defaults: () => ({ estado: "Activo" })
    });
  }

  /* ===================== ÍNDICE DE IMPLEMENTACIÓN ===================== */
  function indiceTab(box) {
    const u = ui();
    const evals = S().all("evaluacionesRNAO");
    if (!evals.length) { box.innerHTML = u.empty("Sin datos para el índice de implementación.", "Registra evaluaciones y unidades implementadoras.", "📈"); return; }
    const champions = S().all("redChampion").filter(c => c.estado === "Activo");
    const filas = CAT().guiasArea.map(g => {
      const eg = evals.filter(e => e.guia === g);
      const seg = eg.filter(e => e.tipo === "Seguimiento");
      const unidades = new Set(eg.map(e => e.unidad).filter(x => x && x !== "Todas las unidades"));
      const globals = eg.map(e => CS().globalCumplimiento(e)).filter(x => x != null);
      const prom = globals.length ? Math.round(globals.reduce((a, b) => a + b, 0) / globals.length) : null;
      const champ = champions.filter(c => c.guia === g).length;
      // índice compuesto simple (0-100): cumplimiento (60%) + cobertura de seguimiento (25%) + champions (15%)
      const idx = prom == null ? 0 : Math.round(prom * 0.6 + Math.min(unidades.size, 5) / 5 * 25 + Math.min(champ, 5) / 5 * 15);
      return { g, unidades: unidades.size, seg: seg.length, prom, champ, idx };
    });
    box.innerHTML = `<p class="section__hint">Índice compuesto por guía: cumplimiento (60%), cobertura de seguimiento (25%) y Red Champion (15%).</p>
      <div class="table-wrap"><table class="tbl"><thead><tr>
        <th>Guía</th><th class="right">Unidades</th><th class="right">Seguimientos</th><th class="right">Cumplimiento prom.</th><th class="right">Champions</th><th class="right">Índice</th></tr></thead><tbody>
        ${filas.map(f => `<tr><td><span class="tag">${u.esc(f.g)}</span></td>
          <td class="num">${f.unidades}</td><td class="num">${f.seg}</td>
          <td class="num">${f.prom != null ? f.prom + "%" : "—"}</td><td class="num">${f.champ}</td>
          <td class="num"><strong style="color:${f.idx >= 75 ? "var(--verde)" : f.idx >= 50 ? "var(--naranjo)" : "var(--danger)"}">${f.idx}</strong></td></tr>`).join("")}
      </tbody></table></div>`;
  }

  /* ---------- Registro ---------- */
  Object.assign(U.coord.views, { m3 });
  Object.assign(U.coord.binders, { m3: m3Bind });
})();
