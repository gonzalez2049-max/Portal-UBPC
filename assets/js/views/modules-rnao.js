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
    { key: "acciones", label: "Acciones de mejora" },
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
    ({ dashboard, evaluaciones, acciones: accionesTab, guias: guiasTab, champion: championTab, indice: indiceTab }[tab] || dashboard)(box);
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
      <td>${i.pct < meta ? `<button class="btn btn--ghost btn--sm" data-genacc="${u.esc(i.nombre)}">Generar acción de mejora</button>` : `<span class="badge badge--ok">En meta</span>`}</td>
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
          crearAccionDesde(e, ind, meta); u.closeModal(); if (onChange) onChange();
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

  /* ===================== ACCIONES DE MEJORA ===================== */
  function crearAccionDesde(e, ind, meta) {
    const brecha = meta - ind.pct;
    S().insert("accionesRNAO", {
      guia: e.guia, unidad: e.unidad, indicadorOrigen: ind.nombre,
      resultado: ind.pct, meta, brecha: brecha > 0 ? brecha + " pts" : "0",
      accion: "", responsable: e.referente || "", estado: "Pendiente",
      medioVerificacion: "", requiereReferente: "No", observaciones: ""
    });
    ui().toast("Acción de mejora generada", "ok");
  }
  function accionesTab(box) {
    U.components.resource.mount(box, {
      collection: "accionesRNAO", title: "Acción de mejora RNAO", icon: "🛠️",
      hint: "Una acción de mejora se genera cuando un indicador queda bajo la meta.",
      newLabel: "Nueva acción",
      emptyMsg: "Aún no hay acciones de mejora.", emptySub: "Genera acciones desde los indicadores bajo meta o crea una aquí.",
      columns: [
        { key: "guia", label: "Guía", render: (r, u) => `<span class="tag">${u.esc(r.guia || "—")}</span>` },
        { key: "unidad", label: "Unidad" },
        { key: "indicadorOrigen", label: "Indicador (brecha)" },
        { key: "resultado", label: "Resultado", render: (r, u) => r.resultado != null && r.resultado !== "" ? r.resultado + "%" : "—" },
        { key: "responsable", label: "Responsable" },
        { key: "fechaComprometida", label: "Comprometida", date: true },
        { key: "estado", label: "Estado", badge: true },
        { key: "requiereReferente", label: "Referente", render: (r, u) => r.requiereReferente === "Sí" ? `<span class="badge badge--warn">Requiere</span>` : "—" }
      ],
      fields: [
        { name: "guia", label: "Guía", type: "select", options: CAT().guiasArea },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "indicadorOrigen", label: "Indicador que origina la brecha", full: true },
        { name: "resultado", label: "Resultado (%)", type: "number" },
        { name: "meta", label: "Meta (%)", type: "number", value: 90 },
        { name: "brecha", label: "Brecha" },
        { name: "accion", label: "Acción propuesta", type: "textarea", full: true },
        { name: "responsable", label: "Responsable" },
        { name: "fechaComprometida", label: "Fecha comprometida", type: "date" },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] },
        { name: "medioVerificacion", label: "Medio de verificación", full: true },
        { name: "requiereReferente", label: "Requiere intervención del Referente", type: "select", options: ["No", "Sí"] },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true }
      ],
      defaults: () => ({ estado: "Pendiente", meta: 90, requiereReferente: "No" }),
      rowActions: [{ ico: "📨", title: "Solicitar intervención técnica", show: r => r.requiereReferente === "Sí",
        fn: (r) => U.solicitudes.crearDesde("Acción de mejora RNAO", { titulo: "Intervención: " + (r.indicadorOrigen || ""), unidad: r.unidad, prioridad: "alta", descripcion: r.accion || "" }, () => {}) }]
    });
  }

  /* ===================== GUÍAS BPSO ===================== */
  function guiasTab(box) {
    U.components.resource.mount(box, {
      collection: "guiasBPSO", title: "Guía BPSO", icon: "🧭",
      hint: "Gestión de las Guías de Buenas Prácticas (BPSO) en implementación.",
      newLabel: "Nueva guía",
      emptyMsg: "Aún no hay guías registradas.",
      columns: [
        { key: "nombre", label: "Guía" },
        { key: "area", label: "Área", render: (r, u) => `<span class="tag">${u.esc(r.area || "—")}</span>` },
        { key: "estado", label: "Estado", badge: true },
        { key: "unidadesImplementadoras", label: "Unidades implementadoras" }
      ],
      fields: [
        { name: "nombre", label: "Nombre de la guía", required: true, full: true },
        { name: "area", label: "Área", type: "select", options: CAT().guiasArea },
        { name: "estado", label: "Estado", type: "select", options: ["Activa", "En preparación", "Inactiva"] },
        { name: "unidadesImplementadoras", label: "Unidades implementadoras", full: true, hint: "Separadas por coma." }
      ],
      defaults: () => ({ estado: "Activa" })
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
