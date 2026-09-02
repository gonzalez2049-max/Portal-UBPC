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
  // Chip con el tipo Donabedian del indicador (Estructura / Proceso / Resultado)
  function indTipoChip(nombre, tipoOverride) {
    const t = tipoOverride || U.data.indicadorTipo(nombre);
    const d = (U.data.TIPO_DONABEDIAN || {})[t] || {};
    const c = d.color || "#5f7d76";
    return `<span class="tag" style="background:${c}1f;color:${c};border:1px solid ${c}55" title="${(d.def || "").replace(/"/g, "&quot;")}">${d.ic || ""} ${t}</span>`;
  }
  function donabedianLeyenda() {
    const T = U.data.TIPO_DONABEDIAN || {};
    return `<div class="don-leg">${Object.keys(T).map(k => `<span class="don-leg__i" title="${(T[k].def || "").replace(/"/g, "&quot;")}"><span class="don-leg__dot" style="background:${T[k].color}"></span>${T[k].ic} <strong>${k}</strong>: ${U.ui.esc(T[k].def)}</span>`).join("")}</div>`;
  }

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
    // Filete superior verde para todas las guías (identidad común). El número
    // grande conserva su color de semáforo para leer el desempeño. La guía se
    // distingue por una etiqueta con su color propio.
    const gc = U.data.guiaColor(e.guia);
    return `<div class="card" style="border-top:4px solid var(--verde)">
      <div class="card__head"><div>
        <span class="tag" style="background:${gc}1f;color:${gc};border:1px solid ${gc}55"><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${gc};margin-right:5px;vertical-align:middle"></span>${u.esc(e.guia || "Guía")}</span>
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
      <td>${indTipoChip(i.nombre, (i.raw || {}).tipo)}</td>
      <td class="num"><strong style="color:${i.pct < meta ? "var(--danger)" : "var(--verde)"}">${i.pct}%</strong></td>
      <td>${i.pct < meta ? `<button class="btn btn--ghost btn--sm" data-genacc="${u.esc(i.nombre)}">Generar plan de intervención</button>` : `<span class="badge badge--ok">En meta</span>`}</td>
    </tr>`).join("");
    u.modal({
      title: "Indicadores · " + (e.guia || "") + " · " + (e.unidad || ""), wide: true,
      body: `<div class="dl"><div><span>Cumplimiento global</span><strong>${CS().globalCumplimiento(e) != null ? CS().globalCumplimiento(e) + "%" : "—"}</strong></div>
        <div><span>Meta</span><strong>${meta}%</strong></div><div><span>Tipo</span><strong>${u.esc(e.tipo || "")}</strong></div>
        <div><span>Periodo</span><strong>${u.esc(e.periodo || "")}</strong></div></div>
        ${inds.length ? donabedianLeyenda() + `<div class="table-wrap"><table class="tbl"><thead><tr><th>Indicador</th><th>Tipo</th><th class="right">Cumplimiento</th><th>Brecha</th></tr></thead><tbody>${rows}</tbody></table></div>`
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
      { name: "meta", label: "Meta de cumplimiento (%)", type: "number", value: rec.meta || CS().metaInstitucional() },
      { name: "proximaMedicion", label: "Próxima medición", type: "date", value: rec.proximaMedicion ? u.isoDay(rec.proximaMedicion) : "", hint: "Se calcula desde la frecuencia; puedes ajustarla." }
    ], {});

    const modoSel = `<div class="field"><label class="req">Modo de ingreso</label>
      <select class="select" id="ev-modo">${CAT().modoIngreso.map(o => `<option ${modo === o ? "selected" : ""}>${o}</option>`).join("")}</select>
      <div class="kpi__sub">A: ingresas porcentajes del informe. B: ingresas casos auditados y el portal calcula el % con denominadores reales.</div></div>`;

    u.modal({
      title: (rec.id ? "Editar" : "Nueva") + " evaluación RNAO", wide: true,
      body: `<div class="rnao-flow">🧭 <strong>Flujo RNAO:</strong> Guía → Unidad(es) → <strong>Indicadores</strong> (se definen una vez) → <strong>Línea base (T0)</strong> = primera medición → <strong>Seguimientos</strong> (T1, T2…) con el mismo método, para que sean comparables.</div>
        <h4>Datos de la evaluación</h4>${header}${modoSel}
        <h4 style="margin-top:.6rem">Indicadores de la guía <span class="kpi__sub" style="font-weight:400">— clasificados por tipo (Donabedian / NQuIRE)</span></h4>
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
          indsBox.innerHTML = `${donabedianLeyenda()}<div class="table-wrap"><table class="tbl"><thead><tr>
            <th>Indicador</th><th>Tipo</th>${esPct()
              ? `<th class="right">% cumplimiento</th>`
              : `<th class="right">Denominador</th><th class="right">Cumplen</th><th class="right">No cumplen</th><th class="right">No aplica</th><th class="right">%</th>`}
            </tr></thead><tbody>
            ${names.map((n, idx) => {
              const ex = existing[n] || {};
              if (esPct()) return `<tr><td>${u.esc(n)}</td><td>${indTipoChip(n)}</td>
                <td class="num"><input class="input" style="width:90px" type="number" min="0" max="100" data-ind="${idx}" data-f="porcentaje" value="${ex.porcentaje != null ? ex.porcentaje : ""}"></td></tr>`;
              return `<tr><td>${u.esc(n)}</td><td>${indTipoChip(n)}</td>
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

        // Próxima medición = fecha + frecuencia (medición periódica RNAO). Editable.
        const fechaEl = m.querySelector('input[name="fecha"]');
        const frecEl = m.querySelector('select[name="frecuencia"]');
        const proxEl = m.querySelector('input[name="proximaMedicion"]');
        const FREC_MESES = { "Mensual": 1, "Bimensual": 2, "Trimestral": 3, "Semestral": 6, "Anual": 12 };
        function calcProx() {
          const meses = FREC_MESES[frecEl.value];
          if (!meses || !fechaEl.value) return;
          const d = new Date(fechaEl.value + "T12:00:00"); d.setMonth(d.getMonth() + meses);
          proxEl.value = d.toISOString().slice(0, 10);
        }
        if (frecEl) frecEl.addEventListener("change", calcProx);
        if (fechaEl) fechaEl.addEventListener("change", () => { if (frecEl.value) calcProx(); });

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
            const tipo = U.data.indicadorTipo(n);
            if (esPct()) { const p = val(idx, "porcentaje"); return p === "" ? null : { nombre: n, tipo, porcentaje: Number(p) }; }
            const den = val(idx, "denominador");
            if (den === "") return null;
            return { nombre: n, tipo, denominador: Number(den), cumplen: Number(val(idx, "cumplen") || 0),
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
    const metaI = CS().metaInstitucional();

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
    // Unidades implementadoras = unidades con alguna evaluación (no solo seguimientos)
    const unidadesImpl = new Set(evals.map(e => e.unidad).filter(x => x && x !== "Todas las unidades"));
    const guiasEval = new Set(evals.map(e => e.guia).filter(Boolean));
    const acciones = S().all("accionesRNAO");
    const accPend = acciones.filter(a => a.estado !== "Completado");
    const accVenc = accPend.filter(a => a.fechaComprometida && new Date(a.fechaComprometida) < new Date());
    const prox = evals.filter(e => e.proximaMedicion && new Date(e.proximaMedicion) >= new Date()).sort((a, b) => new Date(a.proximaMedicion) - new Date(b.proximaMedicion))[0];
    const bajoMeta = allInds.filter(i => i.pct < i.meta);

    const sem = v => v == null ? "var(--neutral)" : (v >= metaI ? "var(--verde)" : v >= metaI - 15 ? "var(--naranjo)" : "var(--danger)");
    const R = "#/coord/m3?tab=evaluaciones";
    const kcard = (lab, val, sub, color) => `<div class="card kpi" style="border-left-color:${color}"><div class="kpi__label">${lab}</div><div class="kpi__value">${val}</div><div class="kpi__sub">${u.esc(sub)}</div></div>`;
    const focoItem = (ic, titulo, detalle, color, ref) => `<a class="foco-item" href="${ref}" style="--fc:${color}">
      <span class="foco-item__ic">${ic}</span>
      <div class="foco-item__body"><strong>${u.esc(titulo)}</strong><div class="kpi__sub">${detalle}</div></div>
      <span class="foco-item__go">Ir →</span></a>`;

    const focos = [];
    if (guiaAtencion) focos.push(focoItem("🎯", "Guía prioritaria", `${u.esc(guiaAtencion.label)} · <strong style="color:${sem(guiaAtencion.value)}">${guiaAtencion.value}%</strong>`, sem(guiaAtencion.value), R));
    if (unidadApoyo) focos.push(focoItem("🏥", "Unidad que necesita apoyo", `${u.esc(unidadApoyo.label)} · <strong style="color:${sem(unidadApoyo.value)}">${unidadApoyo.value}%</strong>`, sem(unidadApoyo.value), R));
    bajoMeta.slice(0, 2).forEach(i => focos.push(focoItem("📉", i.nombre, `${u.esc(i.guia || "")} · ${u.esc(i.unidad || "")} — <strong style="color:var(--danger)">${i.pct}%</strong>`, "var(--danger)", R)));
    if (accVenc.length) focos.push(focoItem("⏰", accVenc.length + " acción(es) de mejora vencida(s)", "Revisa y actualiza los plazos", "var(--danger)", "#/coord/m3?tab=planes"));
    if (!focos.length) focos.push(`<div class="badge badge--ok" style="margin:.4rem">✅ Todo dentro de meta · sin focos críticos.</div>`);

    const ok = instituc != null && instituc >= metaI;
    const hstat = (lab, val, sub, danger) => `<div class="rnao-hero__stat"><span class="rnao-hero__lab">${lab}</span><b${danger ? ' style="color:#ffd0d6"' : ""}>${val}</b><span class="rnao-hero__sub">${u.esc(sub || "")}</span></div>`;

    box.innerHTML = `
      <div class="rnao-hero">
        <div class="rnao-hero__main">
          <div class="rnao-hero__eyebrow">Cumplimiento institucional · Programa RNAO</div>
          <div class="rnao-hero__row"><span class="rnao-hero__big">${instituc != null ? instituc + "%" : "—"}</span>
            <span class="rnao-hero__verdict ${ok ? "is-ok" : "is-warn"}">${ok ? "✅ Dentro de la meta" : "⚠️ Bajo la meta"} (${metaI}%)</span></div>
          <div class="rnao-hero__note">Promedio de ${globals.length} evaluación(es)</div>
        </div>
        <div class="rnao-hero__stats">
          ${hstat("Guías", guiasEval.size, "evaluadas")}
          ${hstat("Unidades", unidadesImpl.size, "implementadoras")}
          ${hstat("Seguimientos", seguimientos.length, seguimientos.length ? "posteriores" : "solo T0")}
          ${hstat("Acciones", accPend.length, accVenc.length ? accVenc.length + " vencidas" : "pendientes", accVenc.length)}
          ${hstat("Próx. medición", prox ? u.fechaCL(prox.proximaMedicion) : "—", prox ? (prox.guia || "") : "sin programar")}
        </div>
      </div>

      <div class="grid grid--2" style="margin-top:1rem;align-items:start">
        <div class="card">
          <h3 class="card__title">🎯 Dónde enfocar ahora</h3>
          <p class="kpi__sub" style="margin:-.3rem 0 .6rem">Lo prioritario primero. Toca para ir a la evaluación o al plan.</p>
          <div class="foco-list">${focos.join("")}</div>
        </div>
        <div class="card">
          <h3 class="card__title">📊 Comparativa · meta ${metaI}%</h3>
          <p class="kpi__sub" style="margin:-.3rem 0 .5rem">De menor a mayor cumplimiento.</p>
          <div class="kpi__label" style="margin:.3rem 0 .2rem">Por guía</div>
          ${porGuia.length ? U.charts.bars(porGuia, { meta: metaI }) : u.empty("Sin datos por guía.")}
          <div class="kpi__label" style="margin:.9rem 0 .2rem">Por unidad</div>
          ${porUnidad.length ? U.charts.bars(porUnidad, { meta: metaI }) : u.empty("Sin datos por unidad.")}
        </div>
      </div>

      ${bajoMeta.length ? `<details class="rnao-det" style="margin-top:1rem">
        <summary>📉 Ver los ${bajoMeta.length} indicador(es) bajo meta</summary>
        <div class="table-wrap" style="margin-top:.6rem"><table class="tbl"><thead><tr><th>Indicador</th><th>Tipo</th><th>Guía · Unidad</th><th class="right">%</th></tr></thead><tbody>
          ${bajoMeta.map(c => `<tr><td>${u.esc(c.nombre)}</td><td>${indTipoChip(c.nombre)}</td><td class="kpi__sub">${u.esc(c.guia || "")} · ${u.esc(c.unidad || "")}</td><td class="num"><strong style="color:${sem(c.pct)}">${c.pct}%</strong></td></tr>`).join("")}
        </tbody></table></div></details>` : `<div class="card" style="margin-top:1rem"><span class="badge badge--ok">✅ Todos los indicadores están en meta.</span></div>`}`;
  }

  /* ===================== PLAN DE INTERVENCIÓN RNAO/BPSO ===================== */
  const EST_SEG = ["Pendiente", "En curso", "Completado", "Retrasado"];
  const FREC_ACC = ["—", "Diario", "Cada turno", "Semanal", "Quincenal", "Mensual", "Bimensual", "Trimestral", "Semestral", "Anual", "Según hallazgos"];
  // Medios de verificación sugeridos (se pueden elegir o escribir uno propio)
  const VERIF_OPTS = ["Auditoría clínica", "Registro en ficha clínica", "Hoja de enfermería", "Lista de verificación / checklist", "Registro de asistencia", "Supervisión en terreno", "Reporte de indicador", "Planilla de monitoreo", "Acta o documento", "Fotografía / registro visual", "Feedback al equipo"];
  const PIN_COLS = {
    seguimientos: [{ f: "fecha", label: "Fecha", type: "date" }, { f: "descripcion", label: "Descripción / avance" }, { f: "avance", label: "% avance", type: "number" }, { f: "estado", label: "Estado", type: "select", options: EST_SEG }],
    acciones: [{ f: "accion", label: "Acción / actividad de mejora" }, { f: "responsable", label: "Responsable" }, { f: "regularidad", label: "Regularidad", type: "select", options: FREC_ACC }, { f: "plazo", label: "Plazo", type: "date" }, { f: "estado", label: "Estado", type: "select", options: EST_SEG }, { f: "verificador", label: "Verificador", type: "datalist", options: VERIF_OPTS }]
  };
  const PIN_ADD = { seguimientos: "Agregar seguimiento", acciones: "Agregar acción / actividad" };
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
      else if (c.type === "datalist") { const dlId = "dl-" + rep + "-" + c.f; ctrl = `<input class="input input--sm" data-f="${c.f}" list="${dlId}" value="${u.esc(v)}" placeholder="Elige o escribe…"><datalist id="${dlId}">${(c.options || []).map(o => `<option value="${u.esc(o)}"></option>`).join("")}</datalist>`; }
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

  // Plazo estimado (duración) a partir de las fechas inicio → término
  function duracionPlan(ini, fin) {
    if (!ini || !fin) return null;
    const a = new Date(String(ini).slice(0, 10) + "T12:00:00");
    const b = new Date(String(fin).slice(0, 10) + "T12:00:00");
    if (isNaN(a) || isNaN(b)) return null;
    const days = Math.round((b - a) / 86400000);
    if (days < 0) return { days, txt: "revisar fechas (el término es anterior al inicio)" };
    if (days === 0) return { days, txt: "mismo día" };
    const sem = Math.round(days / 7), mes = Math.floor(days / 30);
    let txt;
    if (days <= 21) txt = days + (days === 1 ? " día" : " días") + (days >= 7 ? " (~" + sem + " sem)" : "");
    else if (days < 75) txt = sem + " semanas (" + days + " días)";
    else txt = mes + " meses aprox. (" + days + " días)";
    return { days, txt };
  }
  function duracionLbl(ini, fin) {
    const d = duracionPlan(ini, fin);
    return d ? "⏱️ Plazo estimado: <strong>" + d.txt + "</strong>" : "⏱️ Plazo estimado: define inicio y término para calcularlo.";
  }
  function planFormHTML(data) {
    return `<div class="plan-form">
      <p class="pf-help" style="margin:.1rem 0 .7rem">Estructura basada en las Orientaciones Técnicas del Programa BPSO (MINSAL) — ciclo <b>Conocimiento a la Acción</b> (RNAO).</p>
      <section class="pf-section">${pinSecH(1, "Identificación de la brecha")}
        <p class="pf-help" style="margin:.1rem 0 .6rem">Análisis de la situación local: dónde está la brecha entre la práctica y la recomendación.</p>
        <div class="pf-grid">
          ${pinFld("unidad", "Unidad", "Unidad con baja adherencia, brecha o incumplimiento.", { value: data.unidad, type: "select", options: ["—"].concat(CAT().unidades), req: true })}
          ${pinFld("guia", "Guía BPSO", "Guía de buenas prácticas de referencia.", { value: data.guia, type: "select", options: CAT().guiasArea, req: true })}
          ${pinFld("indicador", "Indicador / recomendación", "Indicador o recomendación que origina la brecha.", { value: data.indicador, full: true })}
          ${pinFld("lineaBase", "Línea base (%)", "Cumplimiento total de la guía (medición inicial).", { value: data.lineaBase, type: "number" })}
          ${pinFld("meta", "Meta (%)", "Meta de cumplimiento comprometida.", { value: data.meta, type: "number" })}
          ${pinFld("brecha", "Brecha a trabajar", "Nombre de la brecha o recomendación con menor cumplimiento.", { value: data.brecha, full: true })}
          ${pinFld("brechaPct", "% de la brecha", "Cumplimiento que tuvo esa brecha.", { value: data.brechaPct, type: "number" })}
        </div></section>
      <section class="pf-section">${pinSecH(2, "Recomendación a implementar")}
        <p class="pf-help" style="margin:.1rem 0 .6rem">Adaptación de la recomendación de la guía al contexto local y objetivo del plan.</p>
        <div class="pf-grid">
          ${pinFld("recomendacion", "Recomendación abordada", "Recomendación específica de la guía que se adapta al contexto local.", { value: data.recomendacion, type: "textarea", full: true })}
          ${pinFld("objetivo", "Objetivo del plan", "Qué se busca lograr con el plan.", { value: data.objetivo, type: "textarea", req: true, full: true })}
        </div></section>
      <section class="pf-section">${pinSecH(3, "Barreras y facilitadores")}
        <p class="pf-help" style="margin:.1rem 0 .6rem">Condiciones que dificultan o favorecen el uso de la recomendación, y recursos requeridos.</p>
        <div class="pf-grid">
          ${pinFld("barrerasFacilitadores", "Barreras y facilitadores", "Barreras y facilitadores para el uso del conocimiento.", { value: data.barrerasFacilitadores, type: "textarea", full: true })}
          ${pinFld("recursos", "Recursos (disponibles / necesarios)", "¿Hay recursos disponibles? ¿Se necesitan recursos?", { value: data.recursos, type: "textarea", full: true })}
        </div></section>
      <section class="pf-section">${pinSecH(4, "Plan de Implementación")}
        <p class="pf-help" style="margin:.1rem 0 .6rem">Selección de intervenciones: ¿Qué? · ¿Quién? · ¿Para cuándo?, más la cronología y el plan de comunicación.</p>
        <div class="pf-rep-lbl">Acciones a implementar <span class="pf-help">Cada tarea concreta para cerrar la brecha, con responsable, regularidad, plazo, estado y verificador.</span></div>
        ${pinRepTable("acciones", data.acciones)}
        <div class="pf-grid" style="margin-top:.6rem">
          ${pinFld("plazoInicio", "Cronología · inicio", "", { value: data.plazoInicio, type: "date" })}
          ${pinFld("plazoFin", "Cronología · término", "Fecha comprometida de término.", { value: data.plazoFin, type: "date" })}
        </div>
        <div class="pf-duracion" id="pf-duracion" style="grid-column:1/-1;margin:.2rem 0 .5rem;padding:.5rem .75rem;border-radius:10px;background:var(--surface-2);font-size:.9rem">${duracionLbl(data.plazoInicio, data.plazoFin)}</div>
        <div class="pf-grid">
          ${pinFld("comunicacionInvolucrados", "Plan de comunicación · ¿Quiénes?", "Personas o equipos involucrados en el cambio.", { value: data.comunicacionInvolucrados, type: "textarea", full: true })}
          ${pinFld("comunicacionForma", "Plan de comunicación · ¿Cómo y con qué frecuencia?", "Cómo se comunica el cambio y con qué frecuencia.", { value: data.comunicacionForma, type: "textarea", full: true })}
        </div></section>
      <section class="pf-section">${pinSecH(5, "Monitoreo del uso del conocimiento")}
        <p class="pf-help" style="margin:.1rem 0 .6rem">Seguimiento periódico de la adopción de la recomendación.</p>
        <div class="pf-grid">
          ${pinFld("frecuenciaSeg", "Frecuencia de seguimiento", "Cada cuánto se revisa el plan.", { value: data.frecuenciaSeg, type: "select", options: ["—", "Semanal", "Quincenal", "Mensual", "Bimensual", "Trimestral", "Semestral", "Anual"] })}
          ${pinFld("avance", "Avance global (%)", "Estimación del avance total del plan.", { value: data.avance, type: "number" })}
        </div>
        <div class="pf-rep-lbl">Seguimientos cronológicos <span class="pf-help">Registra cada revisión con fecha, avance y estado.</span></div>
        ${pinRepTable("seguimientos", data.seguimientos)}</section>
      <section class="pf-section">${pinSecH(6, "Evaluación de resultados y cierre")}
        <p class="pf-help" style="margin:.1rem 0 .6rem">Resultado del cierre de la brecha; el motivo se conserva al cerrar o reabrir el plan.</p>
        ${pinFld("motivoCierre", "Motivo de cierre / reapertura", "Se conserva al cerrar o reabrir el plan.", { value: data.motivoCierre, full: true })}</section>
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
    // Migración: las "actividades" antiguas se fusionan en "acciones" (sección unificada).
    if (plan && Array.isArray(plan.actividades) && plan.actividades.length) {
      const mig = plan.actividades.filter(a => a && (a.actividad || "").trim())
        .map(a => ({ accion: a.actividad, responsable: a.responsable || "", regularidad: "—", plazo: "", estado: "Pendiente", verificador: a.verificador || "" }));
      if (mig.length) { S().update("planesIntervencion", plan.id, { acciones: (plan.acciones || []).concat(mig), actividades: [] }); plan = S().get("planesIntervencion", plan.id); }
    }
    const data = plan || { seguimientos: [], acciones: [], estadoCierre: "Abierto", coordinador: (U.auth.current() || {}).nombre };
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
      <div class="doc-linked no-print" style="margin-bottom:1rem">📎 Al guardar, este plan genera y sincroniza su documento <strong>“Plan de Mejora”</strong> en Gestión Documental. La información se registra una sola vez y no se duplica.${cerrado && data.fechaCierre ? ` · <strong>Cerrado</strong> el ${u.fechaCL(data.fechaCierre)}.` : ""}</div>
      ${planFormHTML(data)}`;

    document.getElementById("pin-back").onclick = () => planList(box);
    const bindRm = () => box.querySelectorAll("[data-reprm]").forEach(b => b.onclick = () => b.closest("tr").remove());
    box.querySelectorAll("[data-repadd]").forEach(b => b.onclick = () => {
      const rep = b.dataset.repadd;
      box.querySelector(`[data-rep="${rep}"] tbody`).insertAdjacentHTML("beforeend", pinRepRow(rep, {}));
      bindRm();
    });
    bindRm();

    // Plazo estimado en vivo al cambiar las fechas
    const updDur = () => {
      const ini = (box.querySelector('[data-pf="plazoInicio"]') || {}).value;
      const fin = (box.querySelector('[data-pf="plazoFin"]') || {}).value;
      const el = box.querySelector("#pf-duracion");
      if (el) el.innerHTML = duracionLbl(ini, fin);
    };
    ["plazoInicio", "plazoFin"].forEach(n => { const el = box.querySelector(`[data-pf="${n}"]`); if (el) el.addEventListener("input", updDur); });

    document.getElementById("pin-save").onclick = () => { const s = savePlan(box, current); if (s) { current = s; openPlanEditor(box, s); } };
    document.getElementById("pin-doc").onclick = () => { const s = savePlan(box, current, { silent: true }); if (s && s.docId) U.router.go("#/coord/m2?tab=docs&doc=" + s.docId); };
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

  // Etiqueta de unidad con color propio (para reconocer planes por unidad)
  function uniTag(unidad) {
    const u = ui(); const c = (U.data.unidadColor ? U.data.unidadColor(unidad) : "#8a97a8");
    return `<span class="tag" style="background:${c}1f;color:${c};border:1px solid ${c}55">${u.esc(unidad || "—")}</span>`;
  }
  function planCard(pl) {
    const u = ui();
    const cerrado = pl.estadoCierre === "Cerrado";
    const av = pinNum(pl.avance);
    const color = cerrado ? "var(--verde)" : (av != null && av >= 70 ? "var(--verde)" : av != null && av >= 40 ? "var(--naranjo)" : "var(--danger)");
    return `<div class="card" style="border-top:4px solid ${color}">
      <div class="card__head"><div><span class="tag">${u.esc(pl.guia || "Guía")}</span> ${uniTag(pl.unidad)}</div>
        <span class="badge badge--${cerrado ? "ok" : "warn"}">${cerrado ? "Cerrado" : "Abierto"}</span></div>
      <h4 class="doc-card__title" style="margin:.4rem 0 .2rem">${u.esc(pl.indicador || pl.objetivo || "Plan de intervención")}</h4>
      <div class="kpi__sub">Línea base ${pinPct(pl.lineaBase)} · Meta ${pinPct(pl.meta)}${pl.brecha ? " · Brecha: " + u.esc(pl.brecha) + (pl.brechaPct !== "" && pl.brechaPct != null ? " (" + pinPct(pl.brechaPct) + ")" : "") : ""}</div>
      <div class="pin-prog"><div class="pin-prog__bar" style="width:${av != null ? Math.min(100, Math.max(0, av)) : 0}%;background:${color}"></div></div>
      <div class="kpi__sub">Avance ${av != null ? av + "%" : "—"} · ${(pl.acciones || []).length} acción(es) · ${(pl.seguimientos || []).length} seguimiento(s)${(pl.frecuenciaSeg && pl.frecuenciaSeg !== "—") ? " · Seguim. " + u.esc(pl.frecuenciaSeg).toLowerCase() : ""}</div>
      ${(() => { const d = duracionPlan(pl.plazoInicio, pl.plazoFin); return d ? `<div class="kpi__sub">⏱️ Plazo estimado: ${u.esc(d.txt)}${pl.plazoInicio && pl.plazoFin ? " · " + u.fechaCL(pl.plazoInicio) + " → " + u.fechaCL(pl.plazoFin) : ""}</div>` : ""; })()}
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
        <p class="section__hint">Planes de intervención para unidades con baja adherencia, brechas o incumplimiento de indicadores. Cada plan genera su documento “Plan de Mejora” asociado.</p>
        <button class="btn btn--primary btn--sm" id="newPlan">+ Nuevo plan</button>
      </div>
      ${planes.length ? `<div class="grid grid--3">${planes.map(planCard).join("")}</div>`
        : u.empty("Aún no hay planes de intervención.", "Crea uno aquí, o genéralo desde un indicador bajo la meta en “Línea base y seguimiento”.", "🧭")}`;
    document.getElementById("newPlan").onclick = () => openPlanEditor(box, null);
    box.querySelectorAll("[data-plopen]").forEach(b => b.onclick = () => openPlanEditor(box, S().get("planesIntervencion", b.dataset.plopen)));
    box.querySelectorAll("[data-pldoc]").forEach(b => b.onclick = () => {
      const pl = S().get("planesIntervencion", b.dataset.pldoc); const docId = U.docsEditor.syncLinkedPlanDoc(pl);
      S().update("planesIntervencion", pl.id, { docId }); U.router.go("#/coord/m2?tab=docs&doc=" + docId);
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
    const plan = S().insert("planesIntervencion", {
      unidad: e.unidad || "—", guia: e.guia || "", indicador: ind.nombre, recomendacion: "",
      lineaBase: ind.pct, meta: meta, brecha: ind.nombre, brechaPct: ind.pct,
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
      <td><input class="input input--sm" data-f="colider" value="${u.esc(r.colider || "")}" placeholder="Co-líder de guía"></td>
      <td class="pf-rep__x"><button type="button" class="btn-icon" data-urm title="Quitar unidad">🗑️</button></td></tr>`;
  }
  function guiaUnidadesHTML(rows) {
    rows = (rows && rows.length) ? rows : [{}];
    return `<div class="field" style="grid-column:1/-1">
      <label>Unidades implementadoras</label>
      <div class="kpi__sub" style="margin-bottom:.35rem">Agrega una o más unidades, cada una con su jefatura, su líder de Buenas Prácticas y su co-líder de guía.</div>
      <div class="pf-rep" id="guia-units"><div class="table-wrap"><table class="tbl pf-rep__t"><thead><tr>
        <th>Unidad</th><th>Jefatura</th><th>Líder de Buenas Prácticas</th><th>Co-líder de guía</th><th></th></tr></thead>
        <tbody>${rows.map(guiaUnitRow).join("")}</tbody></table></div>
        <button type="button" class="btn btn--ghost btn--sm" id="guia-addunit">+ Agregar unidad</button></div></div>`;
  }
  /* ---- Comité implementador: tabla separada (nombre, cargo, unidad, funciones) ---- */
  function guiaComite(rec) {
    return (rec && Array.isArray(rec.comite) && rec.comite.length) ? rec.comite : [];
  }
  function guiaComiteRow(r) {
    const u = ui(); r = r || {};
    const opts = CAT().unidades;
    return `<tr data-crow>
      <td><input class="input input--sm" data-cf="nombre" value="${u.esc(r.nombre || "")}" placeholder="Nombre"></td>
      <td><input class="input input--sm" data-cf="cargo" value="${u.esc(r.cargo || "")}" placeholder="Cargo"></td>
      <td><select class="input input--sm" data-cf="unidad"><option value="">—</option>${opts.map(o => `<option ${String(o) === String(r.unidad || "") ? "selected" : ""}>${u.esc(o)}</option>`).join("")}</select></td>
      <td class="pf-rep__x"><button type="button" class="btn-icon" data-crm title="Quitar integrante">🗑️</button></td></tr>`;
  }
  function guiaComiteHTML(rows) {
    rows = (rows && rows.length) ? rows : [{}];
    return `<div class="field" style="grid-column:1/-1">
      <label>Comité implementador</label>
      <div class="kpi__sub" style="margin-bottom:.35rem">Comité por el que pasa la elección de las guías de buenas prácticas. Integrantes: nombre, cargo y unidad.</div>
      <div class="pf-rep" id="guia-comite"><div class="table-wrap"><table class="tbl pf-rep__t"><thead><tr>
        <th>Nombre</th><th>Cargo</th><th>Unidad</th><th></th></tr></thead>
        <tbody>${rows.map(guiaComiteRow).join("")}</tbody></table></div>
        <button type="button" class="btn btn--ghost btn--sm" id="guia-addcom">+ Agregar integrante</button></div></div>`;
  }
  function guiaDetalle(rec) {
    const u = ui();
    const arr = guiaUnidades(rec);
    const com = guiaComite(rec);
    const liderUni = rec.liderUnidad && rec.liderUnidad !== "—" ? u.esc(rec.liderUnidad) : "";
    // Co-líderes de guía: se toman de cada unidad implementadora que tenga uno.
    const coliders = arr.filter(x => x.colider && String(x.colider).trim() && x.colider !== "—")
      .map(x => ({ name: x.colider, unit: x.unidad || "" }));
    const uColor = un => (U.data.unidadColor ? U.data.unidadColor(un || "") : "#12b5a5");
    const unitCards = arr.length ? arr.map(x => `
      <div class="gd-card gd-card--unit" style="border-top:3px solid ${uColor(x.unidad)}">
        <div class="gd-card__title">🏥 ${u.esc(x.unidad || "—")}</div>
        <div class="gd-row"><span>Jefatura</span><b>${u.esc(x.jefatura || "—")}</b></div>
        <div class="gd-row"><span>Líder de Buenas Prácticas</span><b>${u.esc(x.lider || "—")}</b></div>
      </div>`).join("") : `<div class="gd-empty">Sin unidades registradas.</div>`;
    const comiteBlock = com.length ? `
      <h4 class="gd-h">Comité implementador <span class="gd-h__hint">· por el comité pasa la elección de las guías de buenas prácticas</span></h4>
      <div class="gd-grid">${com.map(x => `
        <div class="gd-card gd-card--com">
          <div class="gd-card__title">👤 ${u.esc(x.nombre || "—")}</div>
          <div class="gd-row"><span>Cargo</span><b>${u.esc(x.cargo || "—")}</b></div>
          <div class="gd-row"><span>Unidad</span><b>${u.esc(x.unidad || "—")}</b></div>
        </div>`).join("")}</div>`
      : (rec.comiteImplementador ? `<h4 class="gd-h">Comité implementador</h4><p class="narrativo">${u.esc(rec.comiteImplementador).replace(/\r?\n/g, "<br>")}</p>` : "");
    const partBlock = rec.participantes ? `<h4 class="gd-h">Participantes</h4><p class="narrativo">${u.esc(rec.participantes).replace(/\r?\n/g, "<br>")}</p>` : "";
    const css = `<style>
      .gd{font-size:13.5px}
      .gd-head{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin-bottom:.9rem}
      .gd-chip{display:inline-flex;align-items:center;gap:.3rem;padding:.22rem .65rem;border-radius:999px;background:var(--surface-2);font-size:12.5px;font-weight:600;color:var(--text)}
      .gd-lead{padding:.85rem 1rem;border-radius:12px;background:linear-gradient(135deg,rgba(18,181,165,.12),rgba(30,159,224,.10));border:1px solid var(--border);margin-bottom:1rem}
      .gd-lead__lbl{font-size:10.5px;text-transform:uppercase;letter-spacing:.03em;color:var(--text-muted);font-weight:700}
      .gd-lead__val{font-size:16px;font-weight:700;color:var(--text);margin-top:.1rem}
      .gd-lead__sub{font-size:12.5px;color:var(--text-muted);margin-top:.05rem}
      .gd-lead__colbl{font-size:10.5px;text-transform:uppercase;letter-spacing:.03em;color:var(--text-muted);font-weight:700;margin-top:.7rem;padding-top:.6rem;border-top:1px dashed var(--border)}
      .gd-lead__co{display:flex;justify-content:space-between;gap:.7rem;font-size:13px;padding:.2rem 0}
      .gd-lead__co b{color:var(--text)}
      .gd-lead__co span{color:var(--text-muted)}
      .gd-h{margin:1.1rem 0 .55rem;font-size:14px;color:var(--text)}
      .gd-h__hint{font-weight:400;font-size:11.5px;color:var(--text-muted)}
      .gd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.7rem}
      .gd-card{border:1px solid var(--border);border-radius:11px;padding:.7rem .85rem;background:var(--surface)}
      .gd-card--unit{border-top:3px solid var(--verde,#12b5a5)}
      .gd-card--com{border-top:3px solid var(--morado,#7a5cd0)}
      .gd-card__title{font-weight:700;font-size:13.5px;margin-bottom:.5rem;color:var(--text)}
      .gd-row{display:flex;justify-content:space-between;gap:.7rem;padding:.28rem 0;border-top:1px dashed var(--border);font-size:12.5px}
      .gd-row:first-of-type{border-top:none}
      .gd-row span{color:var(--text-muted);white-space:nowrap}
      .gd-row b{text-align:right;color:var(--text)}
      .gd-empty{color:var(--text-muted);padding:.5rem}
    </style>`;
    u.modal({
      title: "Guía · " + (rec.nombre || ""), wide: true,
      body: `${css}<div class="gd">
        <div class="gd-head">
          ${rec.area ? `<span class="gd-chip">📚 ${u.esc(rec.area)}</span>` : ""}
          ${u.estadoBadge(rec.estado)}
          <span class="gd-chip">🏥 ${arr.length} unidad${arr.length === 1 ? "" : "es"}</span>
          ${rec.resolucion ? `<span class="gd-chip">📄 ${u.esc(rec.resolucion)}</span>` : ""}
        </div>
        <div class="gd-lead">
          <div class="gd-lead__lbl">⭐ Líder de guía</div>
          <div class="gd-lead__val">${u.esc(rec.liderGuia || "—")}</div>
          ${liderUni ? `<div class="gd-lead__sub">Unidad: ${liderUni}</div>` : ""}
          ${coliders.length ? `<div class="gd-lead__colbl">Co-líderes de guía</div>
            ${coliders.map(c => `<div class="gd-lead__co"><b>${u.esc(c.name)}</b>${c.unit ? `<span>${u.esc(c.unit)}</span>` : ""}</div>`).join("")}` : ""}
        </div>
        <h4 class="gd-h">Unidades implementadoras</h4>
        <div class="gd-grid">${unitCards}</div>
        ${comiteBlock}
        ${partBlock}
      </div>`,
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
        { key: "unidades", label: "Unidades implementadoras", exportVal: r => guiaUnidades(r).map(x => x.unidad + (x.jefatura ? " (jef: " + x.jefatura + ")" : "") + (x.lider ? " (líder: " + x.lider + ")" : "") + (x.colider ? " (co-líder: " + x.colider + ")" : "")).join(" · "),
          render: (r, u) => {
            const a = guiaUnidades(r);
            if (!a.length) return `<span class="muted">—</span>`;
            return `<div class="guia-units-cell">${a.map(x => {
              const tip = [x.jefatura ? "Jefatura: " + x.jefatura : "", x.lider ? "Líder BP: " + x.lider : "", x.colider ? "Co-líder: " + x.colider : ""].filter(Boolean).join(" · ");
              return `<span class="tag" ${tip ? `title="${u.esc(tip)}"` : ""}>${u.esc(x.unidad || "—")}</span>`;
            }).join("")}</div>`;
          } }
      ],
      fields: [
        { name: "nombre", label: "Nombre de la guía", required: true, full: true },
        { name: "area", label: "Área", type: "select", options: CAT().guiasArea },
        { name: "estado", label: "Estado", type: "select", options: ["Activa", "En preparación", "Inactiva"] },
        { name: "liderGuia", label: "Líder de guía" },
        { name: "liderUnidad", label: "Unidad del líder de guía", type: "select", options: ["—"].concat(CAT().unidades) },
        { name: "participantes", label: "Participantes", type: "textarea", full: true, hint: "Profesionales que participan en la implementación." },
        { name: "resolucion", label: "Resolución asignada (si hay)", full: true, hint: "N.º o referencia de la resolución, si existe." }
      ],
      defaults: () => ({ estado: "Activa" }),
      detail: guiaDetalle,
      onFormMount(m, rec) {
        const grid = m.querySelector(".form-grid");
        grid.insertAdjacentHTML("afterend", guiaUnidadesHTML(guiaUnidades(rec)) + guiaComiteHTML(guiaComite(rec)));
        const wrap = m.querySelector("#guia-units");
        const bindRm = () => wrap.querySelectorAll("[data-urm]").forEach(b => b.onclick = () => {
          if (wrap.querySelectorAll("[data-urow]").length > 1) b.closest("tr").remove();
          else ui().toast("Debe quedar al menos una unidad", "warn");
        });
        m.querySelector("#guia-addunit").onclick = () => { wrap.querySelector("tbody").insertAdjacentHTML("beforeend", guiaUnitRow({})); bindRm(); };
        bindRm();
        const cwrap = m.querySelector("#guia-comite");
        const bindCrm = () => cwrap.querySelectorAll("[data-crm]").forEach(b => b.onclick = () => b.closest("tr").remove());
        m.querySelector("#guia-addcom").onclick = () => { cwrap.querySelector("tbody").insertAdjacentHTML("beforeend", guiaComiteRow({})); bindCrm(); };
        bindCrm();
      },
      onBeforeSave(data, rec, m) {
        const rows = [...m.querySelectorAll("#guia-units [data-urow]")].map(tr => ({
          unidad: (tr.querySelector('[data-f="unidad"]').value || "").trim(),
          jefatura: (tr.querySelector('[data-f="jefatura"]').value || "").trim(),
          lider: (tr.querySelector('[data-f="lider"]').value || "").trim(),
          colider: (tr.querySelector('[data-f="colider"]').value || "").trim()
        })).filter(r => r.unidad || r.jefatura || r.lider || r.colider);
        data.unidades = rows;
        data.unidadesImplementadoras = rows.map(r => r.unidad).filter(Boolean).join(", ");
        const com = [...m.querySelectorAll("#guia-comite [data-crow]")].map(tr => ({
          nombre: (tr.querySelector('[data-cf="nombre"]').value || "").trim(),
          cargo: (tr.querySelector('[data-cf="cargo"]').value || "").trim(),
          unidad: (tr.querySelector('[data-cf="unidad"]').value || "").trim()
        })).filter(r => r.nombre || r.cargo || r.unidad);
        data.comite = com;
        return data;
      }
    });
  }

  /* ===================== RED CHAMPION ===================== */
  /* ===================== RED CHAMPION + PARTICIPACIÓN (híbrido) =====================
     1) Registro del champion (quién es).
     2) Bitácora de participación individual (qué hace).
     3) Convocatorias (reuniones/capacitaciones) con lista de asistencia → tasa real.
     Los indicadores (nivel de actividad, % activos, tasa de asistencia) se calculan
     a partir de (2) y (3). */
  const CH_TIPOS = ["Reunión de la red", "Capacitación dictada", "Capacitación recibida", "Auditoría / ronda", "Difusión / sensibilización", "Otra"];
  const CH_ROLES = ["Asistió", "Lideró"];
  const CH_CONV_TIPOS = ["Reunión de la red", "Capacitación", "Auditoría / ronda", "Difusión / sensibilización", "Otra"];

  // Eventos de participación de un champion (bitácora + convocatorias a las que asistió)
  function champEventos(champId) {
    const bit = S().all("participacionChampion").filter(p => p.championId === champId)
      .map(p => ({ fecha: p.fecha, horas: Number(p.horas) || 0, tipo: p.tipo, rol: p.rol, tema: p.tema, origen: "bitacora", id: p.id, evidencia: p.evidencia }));
    const conv = S().all("convocatoriaChampion").filter(c => (c.asistentes || []).includes(champId))
      .map(c => ({ fecha: c.fecha, horas: Number(c.horas) || 0, tipo: c.tipo, rol: "Asistió", tema: c.tema, origen: "convocatoria", id: c.id }));
    return bit.concat(conv).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }
  const NIVEL = {
    activo: { label: "Activo", color: "var(--verde)", ic: "🟢" },
    riesgo: { label: "En riesgo", color: "var(--naranjo)", ic: "🟡" },
    inactivo: { label: "Inactivo", color: "var(--danger)", ic: "🔴" }
  };
  function champStats(champId) {
    const evs = champEventos(champId);
    const horas = evs.reduce((a, e) => a + (e.horas || 0), 0);
    const ultima = evs.length ? new Date(evs[0].fecha) : null;
    const dias = ultima ? Math.floor((Date.now() - ultima.getTime()) / 86400000) : null;
    const lidera = evs.filter(e => /lider/i.test(e.rol || "")).length;
    const nivel = dias == null ? "inactivo" : (dias <= 60 ? "activo" : (dias <= 120 ? "riesgo" : "inactivo"));
    return { total: evs.length, horas, ultima, dias, lidera, nivel };
  }
  // Asistencia a convocatorias donde el champion fue convocado
  function champAsistencia(champId) {
    const conv = S().all("convocatoriaChampion").filter(c => (c.convocados || []).includes(champId));
    const asis = conv.filter(c => (c.asistentes || []).includes(champId)).length;
    return { convocado: conv.length, asistio: asis, tasa: conv.length ? Math.round(asis / conv.length * 100) : null };
  }

  function championTab(box) { renderChampion(box); }

  function renderChampion(box) {
    const u = ui();
    box.innerHTML = `
      <div id="ch-kpis" style="margin-bottom:1rem"></div>
      <div class="section">
        <div class="section__head"><div><h3 class="section__title">Red de Champions</h3>
          <p class="section__hint">Referentes clínicos por unidad y guía. Usa <strong>📋</strong> para ver y registrar su participación.</p></div></div>
        <div id="ch-registry"></div>
      </div>
      <div class="section">
        <div class="section__head"><div><h3 class="section__title">Convocatorias · reuniones y capacitaciones</h3>
          <p class="section__hint">Crea la instancia y marca la asistencia; el portal calcula la tasa de participación.</p></div></div>
        <div id="ch-convoc"></div>
      </div>`;
    renderChampKpis(document.getElementById("ch-kpis"));
    mountRegistry(document.getElementById("ch-registry"), box);
    mountConvoc(document.getElementById("ch-convoc"), box);
  }

  function renderChampKpis(el) {
    const u = ui();
    const champs = S().all("redChampion").filter(c => c.estado !== "Inactivo");
    const total = champs.length;
    const activos = champs.filter(c => champStats(c.id).nivel === "activo").length;
    const pctActivos = total ? Math.round(activos / total * 100) : null;
    // Tasa de asistencia global a convocatorias
    const conv = S().all("convocatoriaChampion");
    let cono = 0, asi = 0;
    conv.forEach(c => { cono += (c.convocados || []).length; asi += (c.asistentes || []).length; });
    const tasa = cono ? Math.round(asi / cono * 100) : null;
    // Participaciones del mes en curso
    const now = new Date(), mes = now.getMonth(), anio = now.getFullYear();
    const enMes = d => { const x = new Date(d); return x.getMonth() === mes && x.getFullYear() === anio; };
    const partMes = S().all("participacionChampion").filter(p => enMes(p.fecha)).length
      + conv.filter(c => enMes(c.fecha)).reduce((a, c) => a + (c.asistentes || []).length, 0);
    const card = (lab, val, sub, color) => `<div class="card kpi" style="border-left-color:${color || "var(--c-celeste)"}">
      <div class="kpi__label">${lab}</div><div class="kpi__value">${val}</div><div class="kpi__sub">${sub}</div></div>`;
    el.innerHTML = `<div class="grid grid--kpi">
      ${card("Champions activos", total, "Registrados en la red", "var(--c-celeste)")}
      ${card("% con actividad reciente", pctActivos == null ? "—" : pctActivos + "%", activos + " participaron ≤60 días", pctActivos != null && pctActivos >= 60 ? "var(--verde)" : "var(--naranjo)")}
      ${card("Tasa de asistencia", tasa == null ? "—" : tasa + "%", conv.length + " convocatoria(s)", tasa != null && tasa >= 70 ? "var(--verde)" : "var(--naranjo)")}
      ${card("Participaciones del mes", partMes, "Bitácora + asistencias", "var(--morado)")}
    </div>`;
  }

  function mountRegistry(el, box) {
    const u = ui();
    U.components.resource.mount(el, {
      collection: "redChampion", title: "Champion", icon: "⭐",
      hint: "", newLabel: "Nuevo champion",
      emptyMsg: "Aún no hay Champions registrados.",
      afterChange: () => renderChampion(box),
      columns: [
        { key: "nombre", label: "Nombre" },
        { key: "unidad", label: "Unidad" },
        { key: "guia", label: "Guía", render: (r, uu) => { const g = U.data.guiaColor(r.guia); return `<span class="tag" style="background:${g}1f;color:${g};border:1px solid ${g}55">${uu.esc(r.guia || "—")}</span>`; } },
        { key: "part", label: "Participaciones", center: true, render: r => { const s = champStats(r.id); return `<strong>${s.total}</strong> · ${s.horas}h`; }, exportVal: r => champStats(r.id).total },
        { key: "ultima", label: "Última", center: true, render: (r, uu) => { const s = champStats(r.id); return s.ultima ? `${uu.fechaCL(s.ultima)}<br><span class="kpi__sub">hace ${s.dias} d</span>` : "—"; }, exportVal: r => { const s = champStats(r.id); return s.ultima ? ui().fechaCL(s.ultima) : ""; } },
        { key: "nivel", label: "Actividad", center: true, render: r => { const n = NIVEL[champStats(r.id).nivel]; return `<span class="doc-estado" style="--ec:${n.color}">${n.ic} ${n.label}</span>`; }, exportVal: r => NIVEL[champStats(r.id).nivel].label },
        { key: "estado", label: "Estado", badge: true }
      ],
      fields: [
        { name: "nombre", label: "Nombre", required: true, full: true },
        { name: "estamento", label: "Estamento", type: "select", options: CAT().estamentos },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "turno", label: "Turno", type: "select", options: ["A", "B", "C", "D", "Diurno"], placeholder: "Seleccionar…" },
        { name: "calidadContractual", label: "Calidad contractual", type: "select", options: ["Titular", "Contrata", "Reemplazo", "Honorarios"], placeholder: "Seleccionar…" },
        { name: "guia", label: "Guía", type: "select", options: CAT().guiasArea },
        { name: "fechaNombramiento", label: "Fecha de nombramiento", type: "date" },
        { name: "correo", label: "Correo electrónico", type: "email", attrs: 'placeholder="nombre@correo.cl"' },
        { name: "contacto", label: "Contacto (teléfono u otro)" },
        { name: "compromiso", label: "¿Aceptó el compromiso?", type: "select", options: ["Sí", "No"], placeholder: "Seleccionar…" },
        { name: "estado", label: "Estado", type: "select", options: ["Activo", "Inactivo"] }
      ],
      defaults: () => ({ estado: "Activo" }),
      rowActions: [
        { ico: "📋", title: "Ver / registrar participación", fn: (rec) => bitacoraModal(rec, box) }
      ]
    });
  }

  // Modal de bitácora individual del champion
  function bitacoraModal(champ, box) {
    const u = ui();
    const render = () => {
      const evs = champEventos(champ.id);
      const s = champStats(champ.id), a = champAsistencia(champ.id);
      const n = NIVEL[s.nivel];
      const filas = evs.length ? evs.map(e => `<tr>
          <td>${u.fechaCL(e.fecha)}</td><td>${u.esc(e.tipo || "—")}</td>
          <td>${u.esc(e.tema || "—")}</td><td class="num">${e.horas || 0}h</td>
          <td>${/lider/i.test(e.rol || "") ? "⭐ Lideró" : "Asistió"}</td>
          <td class="right">${e.origen === "bitacora" ? `<button class="btn-icon" data-delp="${e.id}" title="Quitar">🗑️</button>` : `<span class="tag" title="Desde convocatoria">📅</span>`}</td>
        </tr>`).join("") : `<tr><td colspan="6" class="muted">Sin participaciones registradas todavía.</td></tr>`;
      return `<div class="dl" style="margin-bottom:.6rem">
          <div><span>Participaciones</span><strong>${s.total} · ${s.horas}h</strong></div>
          <div><span>Última</span><strong>${s.ultima ? u.fechaCL(s.ultima) + " (hace " + s.dias + " d)" : "—"}</strong></div>
          <div><span>Actividad</span><strong style="color:${n.color}">${n.ic} ${n.label}</strong></div>
          <div><span>Asistencia a convocatorias</span><strong>${a.tasa == null ? "—" : a.asistio + "/" + a.convocado + " (" + a.tasa + "%)"}</strong></div>
        </div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Fecha</th><th>Tipo</th><th>Tema</th><th class="right">Horas</th><th>Rol</th><th></th></tr></thead>
          <tbody>${filas}</tbody></table></div>
        <p class="kpi__sub" style="margin:.5rem 0 .2rem">Las entradas con 📅 provienen de convocatorias (se editan en esa sección).</p>`;
    };
    const refreshBehind = () => { if (box) renderChampion(box); };
    const openForm = () => bitacoraForm(champ, () => { u.closeModal(); refreshBehind(); bitacoraModal(champ, box); });
    u.modal({
      title: "Participación · " + (champ.nombre || "Champion"), wide: true,
      body: render(),
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button><button class="btn btn--primary" data-add>+ Registrar participación</button>`,
      onMount(m) {
        m.querySelector("[data-add]").onclick = openForm;
        m.querySelectorAll("[data-delp]").forEach(b => b.onclick = () =>
          u.confirmDelete("¿Quitar esta participación?", () => { S().remove("participacionChampion", b.dataset.delp); u.closeModal(); refreshBehind(); bitacoraModal(champ, box); }));
      }
    });
  }
  function bitacoraForm(champ, onDone) {
    const u = ui();
    u.modal({
      title: "Nueva participación · " + (champ.nombre || ""),
      body: u.formHTML([
        { name: "fecha", label: "Fecha", type: "date", value: u.hoyISO(), required: true },
        { name: "tipo", label: "Tipo", type: "select", options: CH_TIPOS, required: true },
        { name: "rol", label: "Rol", type: "select", options: CH_ROLES },
        { name: "horas", label: "Horas", type: "number" },
        { name: "tema", label: "Tema / actividad", full: true },
        { name: "evidencia", label: "Evidencia / enlace", full: true }
      ], { rol: "Asistió" }),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.fecha || !d.tipo) { u.toast("Fecha y tipo son obligatorios", "danger"); return; }
          S().insert("participacionChampion", Object.assign({ championId: champ.id }, d));
          u.toast("Participación registrada", "ok");
          if (onDone) onDone();
        };
      }
    });
  }

  // Convocatorias con lista de asistencia
  function mountConvoc(el, box) {
    const u = ui();
    U.components.resource.mount(el, {
      collection: "convocatoriaChampion", title: "Convocatoria", icon: "📅",
      hint: "", newLabel: "Nueva convocatoria", wideForm: true,
      emptyMsg: "Aún no hay convocatorias registradas.",
      emptySub: "Crea una reunión o capacitación y marca la asistencia de los Champions.",
      afterChange: () => renderChampion(box),
      columns: [
        { key: "fecha", label: "Fecha", date: true },
        { key: "tipo", label: "Tipo" },
        { key: "tema", label: "Tema" },
        { key: "guia", label: "Guía", render: (r, uu) => r.guia ? (() => { const g = U.data.guiaColor(r.guia); return `<span class="tag" style="background:${g}1f;color:${g};border:1px solid ${g}55">${uu.esc(r.guia)}</span>`; })() : "—" },
        { key: "asist", label: "Asistencia", center: true, render: r => { const co = (r.convocados || []).length, as = (r.asistentes || []).length; const t = co ? Math.round(as / co * 100) : null; const col = t == null ? "var(--neutral)" : (t >= 70 ? "var(--verde)" : "var(--naranjo)"); return `<strong style="color:${col}">${as}/${co}</strong>${t == null ? "" : " · " + t + "%"}`; }, exportVal: r => (r.asistentes || []).length + "/" + (r.convocados || []).length }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", value: u.hoyISO(), required: true },
        { name: "tipo", label: "Tipo", type: "select", options: CH_CONV_TIPOS, required: true },
        { name: "tema", label: "Tema / motivo", full: true },
        { name: "unidad", label: "Unidad", type: "select", options: ["—"].concat(CAT().unidades) },
        { name: "guia", label: "Guía", type: "select", options: ["—"].concat(CAT().guiasArea) },
        { name: "horas", label: "Horas", type: "number" }
      ],
      defaults: () => ({ fecha: u.hoyISO() }),
      onFormMount: (m, rec) => injectAsistencia(m, rec),
      onBeforeSave: (data, rec, m) => {
        const conv = [], asis = [];
        m.querySelectorAll("[data-champ]").forEach(row => {
          const id = row.dataset.champ;
          if (row.querySelector("[data-conv]").checked) conv.push(id);
          if (row.querySelector("[data-asis]").checked) asis.push(id);
        });
        data.convocados = conv; data.asistentes = asis;
        if (data.unidad === "—") data.unidad = "";
        if (data.guia === "—") data.guia = "";
        return data;
      }
    });
  }
  // Inyecta la lista de asistencia (Convocado / Asistió) en el formulario de convocatoria
  function injectAsistencia(m, rec) {
    const u = ui();
    const champs = S().all("redChampion").filter(c => c.estado !== "Inactivo").sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
    rec = rec || {};
    const conv = rec.convocados || [], asis = rec.asistentes || [];
    const rows = champs.length ? champs.map(c => {
      const g = U.data.guiaColor(c.guia);
      const isConv = rec.id ? conv.includes(c.id) : true; // por defecto, todos convocados en una nueva
      const isAsis = asis.includes(c.id);
      return `<tr data-champ="${c.id}">
        <td>${u.esc(c.nombre)}<br><span class="kpi__sub">${u.esc(c.unidad || "")}${c.guia ? ` · <span style="color:${g}">${u.esc(c.guia)}</span>` : ""}</span></td>
        <td class="res-center"><input type="checkbox" data-conv ${isConv ? "checked" : ""}></td>
        <td class="res-center"><input type="checkbox" data-asis ${isAsis ? "checked" : ""}></td></tr>`;
    }).join("") : `<tr><td colspan="3" class="muted">No hay Champions activos. Registra Champions primero.</td></tr>`;
    const html = `<div class="pf-rep" style="margin-top:.4rem">
      <div class="pf-rep-lbl">Lista de asistencia <span class="pf-help">Marca a quién se convocó y quién asistió. La tasa se calcula automáticamente.</span></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Champion</th><th class="res-center">Convocado</th><th class="res-center">Asistió</th></tr></thead>
        <tbody>${rows}</tbody></table></div></div>`;
    const grid = m.querySelector(".form-grid");
    if (grid) grid.insertAdjacentHTML("afterend", html); else m.querySelector(".modal__body").insertAdjacentHTML("beforeend", html);
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
      const champG = champions.filter(c => c.guia === g);
      const champ = champG.length;
      // Champions con actividad reciente (nivel "activo") → mide participación, no sólo presencia
      const activos = champG.filter(c => champStats(c.id).nivel === "activo").length;
      // índice compuesto (0-100): cumplimiento 60% + cobertura seguimiento 25% + participación Champion 15%.
      // El componente Champion premia a los ACTIVOS (participación), no la mera cantidad.
      const champScore = champ ? (activos / champ) * Math.min(champ, 3) / 3 : 0;
      const idx = prom == null ? 0 : Math.round(prom * 0.6 + Math.min(unidades.size, 5) / 5 * 25 + champScore * 15);
      return { g, unidades: unidades.size, seg: seg.length, prom, champ, activos, idx };
    });
    box.innerHTML = `<p class="section__hint">Índice compuesto por guía: cumplimiento (60%), cobertura de seguimiento (25%) y participación de la Red Champion (15%, según Champions activos).</p>
      <div class="table-wrap"><table class="tbl"><thead><tr>
        <th>Guía</th><th class="right">Unidades</th><th class="right">Seguimientos</th><th class="right">Cumplimiento prom.</th><th class="right">Champions (activos)</th><th class="right">Índice</th></tr></thead><tbody>
        ${filas.map(f => { const gc = U.data.guiaColor(f.g); return `<tr><td><span class="tag" style="background:${gc}1f;color:${gc};border:1px solid ${gc}55">${u.esc(f.g)}</span></td>
          <td class="num">${f.unidades}</td><td class="num">${f.seg}</td>
          <td class="num">${f.prom != null ? f.prom + "%" : "—"}</td><td class="num">${f.champ} <span class="kpi__sub">(${f.activos})</span></td>
          <td class="num"><strong style="color:${f.idx >= 75 ? "var(--verde)" : f.idx >= 50 ? "var(--naranjo)" : "var(--danger)"}">${f.idx}</strong></td></tr>`; }).join("")}
      </tbody></table></div>`;
  }

  /* ---------- Registro ---------- */
  Object.assign(U.coord.views, { m3 });
  Object.assign(U.coord.binders, { m3: m3Bind });
})();
