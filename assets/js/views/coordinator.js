/* ============================================================
   PORTAL COORDINADOR/A UBPC — Navegación y Home
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  /* ---------- Navegación ---------- */
  const NAV = [
    { label: "Principal", items: [
      { key: "home", label: "Inicio", ico: "🏠" },
      { key: "guia", label: "Guía del Coordinador", ico: "🧑‍🏫" },
      { key: "agenda", label: "Agenda", ico: "🗓️" }
    ]},
    { label: "Módulos de gestión", items: [
      { key: "m1", label: "Apoyo y Mejora Continua", ico: "🤝" },
      { key: "m2", label: "Gestión Documental", ico: "📄" },
      { key: "m3", label: "Programa RNAO", ico: "🧭" },
      { key: "m4", label: "Fortalecimiento", ico: "💪" },
      { key: "m5", label: "Articulación y Respaldo Institucional", ico: "🤝" },
      { key: "m6", label: "Norma Técnica 234", ico: "📊" },
      { key: "indicadores", label: "Indicadores UBPC", ico: "📏" }
    ]},
    { label: "Administración", items: [
      { key: "enlace", label: "Enlace con el Referente", ico: "🔗",
        badgeFn: () => S().all("solicitudes").filter(x => x.direccion === "ref-a-coord" && !/cerrad/i.test(x.estado || "")).length },
      { key: "reportes", label: "Reportes", ico: "📑" },
      { key: "usuarios", label: "Usuarios y perfiles", ico: "👥" },
      { key: "config", label: "Configuración", ico: "⚙️" }
    ]}
  ];

  /* ---------- Cálculo de indicadores (siempre con contexto) ---------- */
  function stats() {
    const s = S();
    const evals = s.all("evaluacionesRNAO");
    const cumplimientos = evals.map(e => globalCumplimiento(e)).filter(v => v != null);
    const global = cumplimientos.length ? Math.round(cumplimientos.reduce((a, b) => a + b, 0) / cumplimientos.length) : null;

    const acciones = s.all("accionesRNAO");
    const planes = s.all("planesNT234");
    const kanban = s.all("kanban");
    const hoy = new Date();

    const vencidas = [].concat(
      acciones.filter(a => a.estado !== "Completado" && venc(a.fechaComprometida)),
      kanban.filter(k => k.columna !== "Completado" && venc(k.fechaLimite))
    ).length;

    const solPend = s.all("solicitudes").filter(x =>
      x.estadoReferente && x.estadoReferente !== "Cerrada por coordinación").length;

    const alertas = [];
    if (solPend) alertas.push(`${solPend} solicitud(es) técnica(s) en gestión`);
    if (vencidas) alertas.push(`${vencidas} tarea(s)/acción(es) vencida(s)`);
    const critNoMeta = evals.reduce((n, e) => n + indicadoresBajoMeta(e).length, 0);
    if (critNoMeta) alertas.push(`${critNoMeta} indicador(es) bajo la meta`);

    return {
      global, metaInst: metaInstitucional(),
      guiasActivas: s.all("guiasBPSO").filter(g => g.estado === "Activa").length,
      procesosActivos: s.all("apoyoMejora").filter(a => (a.estado || "").toLowerCase() !== "finalizado").length,
      docPendientes: s.all("documentos").filter(d => /revisi|borrador|enviado/i.test(d.estado || "")).length,
      personasCapacitadas: s.all("actividades").reduce((n, a) => n + (parseInt(a.personasCapacitadas) || 0), 0),
      cobertura: coberturaUnidades(),
      vencidas, solPend, alertas,
      proxEval: proximaEvaluacion(evals)
    };
  }
  function venc(fecha) { if (!fecha) return false; return new Date(fecha) < new Date().setHours(0,0,0,0); }
  function coberturaUnidades() {
    const set = new Set();
    S().all("apoyoMejora").forEach(a => a.unidad && set.add(a.unidad));
    S().all("actividades").forEach(a => a.unidadResp && set.add(a.unidadResp));
    S().all("evaluacionesRNAO").forEach(e => e.unidad && e.unidad !== "Todas las unidades" && set.add(e.unidad));
    return set.size;
  }
  function proximaEvaluacion(evals) {
    const fut = evals.filter(e => e.proximaMedicion && new Date(e.proximaMedicion) >= new Date())
      .sort((a, b) => new Date(a.proximaMedicion) - new Date(b.proximaMedicion));
    return fut[0] || null;
  }

  // Cumplimiento global oficial: si hay resultado oficial informado, se usa; no se promedian %.
  function globalCumplimiento(e) {
    if (e.resultadoGlobalOficial != null && e.resultadoGlobalOficial !== "") return Number(e.resultadoGlobalOficial);
    const inds = (e.indicadores || []).map(pctIndicador).filter(v => v != null);
    if (!inds.length) return null;
    return Math.round(inds.reduce((a, b) => a + b, 0) / inds.length);
  }
  function pctIndicador(ind) {
    if (ind.porcentaje != null && ind.porcentaje !== "") return Number(ind.porcentaje);
    const den = Number(ind.denominador);
    if (den > 0) return Math.round((Number(ind.cumplen) / den) * 100);
    return null;
  }
  function indicadoresBajoMeta(e) {
    const meta = Number(e.meta) || 90;
    return (e.indicadores || []).map(i => ({ nombre: i.nombre, pct: pctIndicador(i) }))
      .filter(i => i.pct != null && i.pct < meta);
  }
  // Meta institucional: valor único configurado por el Coordinador. Si no se ha
  // configurado, se infiere de las evaluaciones (la más usada) y por defecto 90.
  function metaInstitucional() {
    const cfg = Number(S().getConfig("metaInstitucional", ""));
    if (cfg > 0) return cfg;
    const metas = S().all("evaluacionesRNAO").map(e => Number(e.meta) || 90).filter(m => m > 0);
    if (!metas.length) return 90;
    const f = {}; metas.forEach(m => f[m] = (f[m] || 0) + 1);
    return Number(Object.keys(f).sort((a, b) => f[b] - f[a] || b - a)[0]);
  }
  U.coordStats = { stats, globalCumplimiento, pctIndicador, indicadoresBajoMeta, metaInstitucional };

  // Cumplimiento promedio por guía BPSO (para el bloom del Home)
  function cumplPorGuia() {
    const evals = S().all("evaluacionesRNAO");
    return U.data.CAT.guiasArea.map(g => {
      const vals = evals.filter(e => e.guia === g).map(globalCumplimiento).filter(v => v != null);
      return { label: g, pct: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0, hasData: vals.length > 0 };
    });
  }

  /* ---------- KPI helper ---------- */
  function kpi(label, value, sub, kind, icon) {
    return `<div class="card kpi ${kind ? "kpi--" + kind : ""}">
      <div class="kpi__top">
        <div class="kpi__label">${ui().esc(label)}</div>
        ${icon ? `<span class="kpi__ico kpi__ico--${kind || "info"}">${icon}</span>` : ""}
      </div>
      <div class="kpi__value">${value}</div>
      <div class="kpi__sub">${ui().esc(sub)}</div>
    </div>`;
  }

  /* ---------- Panel "Requiere tu atención" (acciones pendientes) ---------- */
  function focusPanel() {
    const u = ui(), s = S();
    const docs = s.all("docsTrabajo");
    const borradores = docs.filter(d => !d.estado || d.estado === "borrador").length;
    const aprobados = docs.filter(d => d.estado === "aprobado").length;
    const st2 = stats();

    // Próximos eventos (7 días), excluyendo plazos ya cumplidos
    let prox7 = 0;
    if (U.agenda && U.agenda.buildEvents) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const lim = new Date(hoy); lim.setDate(lim.getDate() + 7);
      prox7 = U.agenda.buildEvents().filter(e => !e.done && e.d >= hoy && e.d <= lim).length;
    }

    const items = [];
    if (borradores) items.push({ ico: "✏️", n: borradores, txt: `documento(s) en borrador por revisar y aprobar`, href: "#/coord/m1?tab=docs&focus=borradores", cta: "Revisar", kind: "info" });
    if (aprobados) items.push({ ico: "✔️", n: aprobados, txt: `documento(s) aprobado(s) por finalizar y codificar`, href: "#/coord/m1?tab=docs&focus=aprobados", cta: "Finalizar", kind: "info" });
    if (st2.vencidas) items.push({ ico: "⏱️", n: st2.vencidas, txt: `tarea(s) o acción(es) vencida(s)`, href: "#/coord/agenda?focus=vencidos", cta: "Revisar", kind: "danger" });
    if (st2.solPend) items.push({ ico: "📨", n: st2.solPend, txt: `solicitud(es) técnica(s) en gestión`, href: "#/coord/enlace?focus=solicitudes", cta: "Ver", kind: "warn" });
    if (prox7) items.push({ ico: "🗓️", n: prox7, txt: `evento(s) programado(s) en los próximos 7 días`, href: "#/coord/agenda", cta: "Ver agenda", kind: "info" });

    // Chip NT 234 (informativo, siempre visible si hay datos)
    let ntChip = "";
    if (U.ntUtil && U.ntUtil.institNT) {
      const nt = U.ntUtil.institNT();
      if (nt.pct != null) {
        ntChip = `<a class="focus-nt focus-nt--${nt.estado.badge}" href="#/coord/m6">
          <span class="focus-nt__lbl">NT 234 institucional</span>
          <span class="focus-nt__pct">${nt.pct}%</span>
          <span class="focus-nt__st">${u.esc(nt.estado.label)}</span></a>`;
      }
    }

    const total = items.reduce((a, i) => a + i.n, 0);
    const head = `<div class="focus-panel__head">
        <div><span class="focus-panel__eb">Requiere tu atención</span>
          <h2 class="focus-panel__title">Próximos pasos</h2></div>
        <span class="focus-panel__count ${total ? "" : "is-ok"}">${total ? total + " pendiente" + (total > 1 ? "s" : "") : "Todo al día ✨"}</span>
      </div>`;

    const body = items.length
      ? `<div class="focus-list">${items.map(i => `
          <a class="focus-item focus-item--${i.kind}" href="${i.href}">
            <span class="focus-item__ico">${i.ico}</span>
            <span class="focus-item__n">${i.n}</span>
            <span class="focus-item__txt">${u.esc(i.txt)}</span>
            <span class="focus-item__cta">${i.cta} →</span>
          </a>`).join("")}</div>`
      : `<div class="focus-empty"><span class="focus-empty__ic">🎉</span>
          <div><strong>No hay acciones pendientes.</strong>
          <div class="kpi__sub">Documentos, tareas, solicitudes y eventos están al día.</div></div></div>`;

    return `<section class="focus-panel card">${head}${body}${ntChip}</section>`;
  }

  /* ---------- HOME ---------- */
  function home() {
    const u = ui();
    const st = stats();
    const globalTxt = st.global == null ? "—" : st.global + "%";
    const globalSub = st.global == null ? "Aún sin evaluaciones registradas"
      : (st.global >= st.metaInst ? "Dentro de la meta institucional" : "Bajo la meta institucional (" + st.metaInst + "%)");

    // HERO BENTO (Nivel 1 — prioridad)
    const me = U.auth.current();
    const guias = cumplPorGuia();
    const GC = [{ color: "#7fe0d0" }, { color: "#c9b6f5" }, { color: "#ffd98a" }];
    const bloomSegs = guias.map((g, i) => ({ pct: g.pct, color: GC[i].color }));
    const bloomLegend = guias.map((g, i) => `
      <div class="bloom-lg"><i style="background:${GC[i].color}"></i>
      <span class="nm">${u.esc(g.label)}</span><span class="pc">${g.hasData ? g.pct + "%" : "—"}</span></div>`).join("");
    const globalColor = st.global == null ? "#ffffff" : (st.global >= st.metaInst ? "#eafff7" : "#fff");
    const heroAlertas = st.alertas.length
      ? st.alertas.slice(0, 3).map((a, i) => `<div class="hh-al ${["d","w","i"][i] || "i"}"><span class="dot"></span>${u.esc(a)}</div>`).join("")
      : `<div class="hh-al ok"><span class="dot"></span>No existen alertas activas</div>`;

    const hero = `
    <section class="home-hero">
      <div class="hh-welcome">
        <div class="hh-eb">Resumen ejecutivo · UBPC</div>
        <h1>Buenos días${me ? ", " + u.esc(me.nombre.split(" ")[0]) : ""}</h1>
        <p>Estado general de la gestión y principales indicadores de la Unidad de Buenas Prácticas Clínicas.</p>
        <div class="hh-frase">"La evidencia cobra valor cuando transforma la práctica y mejora el cuidado."</div>
        <div class="pillars-card" style="margin-top:.75rem">
          <span class="pilar"><span class="ic">🛡️</span>Seguridad</span>
          <span class="pilar-sep" aria-hidden="true"></span>
          <span class="pilar ev"><span class="ic">🔬</span>Evidencia</span>
          <span class="pilar-sep" aria-hidden="true"></span>
          <span class="pilar cu"><span class="ic">💙</span>Cuidado</span>
        </div>
      </div>
      <div class="card hh-bloom">
        <div class="hh-bloom__top"><span class="hh-lbl">Cumplimiento por guía</span>
          ${st.global != null ? `<span class="hh-trend ${st.global >= st.metaInst ? "ok" : "warn"}">Meta ${st.metaInst}%</span>` : ""}</div>
        <div class="hh-bloom__mid">
          <div class="ringwrap">${U.charts.bloomRings(bloomSegs, { track: "rgba(255,255,255,.18)", disc: "rgba(9,70,63,.32)" })}
            <div class="ringwrap__ctr"><b style="color:${globalColor}">${globalTxt}</b><span>Global</span></div></div>
          <div class="bloom-legend">${bloomLegend}</div>
        </div>
        <div class="hh-bloom__foot">${st.global == null ? "Aún sin evaluaciones RNAO registradas." : globalSub + "."}</div>
      </div>
      <div class="hh-side">
        <div class="card hh-prox">
          <span class="hh-lbl">Próxima evaluación</span>
          <div class="hh-date">${st.proxEval ? u.fechaCL(st.proxEval.proximaMedicion) : "—"}</div>
          <div class="hh-prox__sub">${st.proxEval ? (u.esc(st.proxEval.guia || "") + " · " + u.esc(st.proxEval.unidad || "")) : "Sin evaluaciones programadas"}</div>
        </div>
        <div class="card hh-alerts">
          <span class="hh-lbl">Alertas activas ${st.alertas.length ? "· " + st.alertas.length : ""}</span>
          <div class="hh-al-list">${heroAlertas}</div>
          ${st.vencidas ? `<div class="hh-venc">⏱ ${st.vencidas} tarea(s) vencida(s)</div>` : ""}
        </div>
      </div>
    </section>`;
    // Compat: n1 ya no se usa (integrado en el hero)
    const n1 = "";

    // NIVEL 2
    const n2 = `<div class="grid grid--kpi">
      ${kpi("Procesos activos", st.procesosActivos, st.procesosActivos ? "En desarrollo actualmente" : "Aún sin procesos registrados", "info", "🤝")}
      ${kpi("Documentos pendientes", st.docPendientes, st.docPendientes ? st.docPendientes + " requieren validación" : "Sin documentos pendientes", st.docPendientes ? "warn" : "ok", "📄")}
      ${kpi("Guías BPSO activas", st.guiasActivas, st.guiasActivas ? st.guiasActivas + " guías en implementación" : "0 guías activas · Aún sin registros", st.guiasActivas ? "ok" : "neutral", "🧭")}
      ${kpi("Personas capacitadas", st.personasCapacitadas, st.personasCapacitadas ? "Total acumulado registrado" : "Aún sin capacitaciones", "info", "🎓")}
      ${kpi("Cobertura institucional", st.cobertura, st.cobertura ? st.cobertura + " unidades con actividad registrada" : "Sin cobertura registrada", "ok", "🏥")}
    </div>`;

    return `
    ${hero}

    ${focusPanel()}

    <div class="section">
      <div class="section__head"><h2 class="section__title">Indicadores de actividad</h2></div>
      ${n2}
    </div>

    <div class="section">
      <div class="section__head">
        <div><h2 class="section__title">Tendencia de cumplimiento</h2>
        <p class="section__hint">Evolución de los resultados durante los últimos períodos.</p></div>
      </div>
      <div class="card" id="tendencia">${tendenciaHTML()}</div>
    </div>

    <div class="section">
      <div class="section__head">
        <div><h2 class="section__title">Tablero de seguimiento</h2>
        <p class="section__hint">Tareas pendientes, en curso y completadas.</p></div>
      </div>
      <div id="homeKanban"></div>
    </div>

    <div class="grid grid--2" style="align-items:start">
      <div class="section" style="margin:0">
        <div class="section__head"><div><h2 class="section__title">Actividad reciente</h2>
          <p class="section__hint">Últimos movimientos registrados en el portal.</p></div></div>
        <div class="card home-scroll">${actividadHTML()}</div>
      </div>
      <div class="section" style="margin:0">
        <div class="section__head">
          <div><h2 class="section__title">Línea de tiempo de hitos</h2>
          <p class="section__hint">Principales avances de la UBPC.</p></div>
          <button class="btn btn--primary btn--sm" id="addHito">+ Nuevo hito</button>
        </div>
        <div class="card home-scroll" id="timelineBox">${timelineHTML()}</div>
      </div>
    </div>`;
  }

  /* ---------- Tendencia ---------- */
  // Color por guía (consistente con las etiquetas de las tarjetas). El morado
  // queda reservado para la línea de Meta, por eso no se usa aquí.
  const guiaCol = k => U.data.guiaColor((k || "").split(" · ")[0]);
  let _tendSel = "__all__"; // guía seleccionada en el gráfico ("__all__" = todas)

  function tendenciaGroups() {
    const groups = {};
    S().all("evaluacionesRNAO").forEach(e => {
      const key = (e.guia || "Guía") + " · " + (e.unidad || "Unidad");
      (groups[key] = groups[key] || []).push(e);
    });
    return groups;
  }

  function tendenciaHTML() {
    const u = ui();
    const evals = S().all("evaluacionesRNAO");
    if (!evals.length) return u.empty("Sin datos de tendencia todavía.", "Registra evaluaciones RNAO para visualizar la evolución del cumplimiento.", "📈");
    const groups = tendenciaGroups();
    const keys = Object.keys(groups);
    if (!keys.includes(_tendSel) && _tendSel !== "__all__") _tendSel = "__all__";

    // Selector de guía (Todas o una específica)
    const selector = `<div class="flex" style="justify-content:space-between;align-items:center;gap:.6rem;flex-wrap:wrap;margin:0 0 .6rem">
        <div style="display:flex;align-items:center;gap:.45rem">
          <label for="tendSel" class="kpi__sub" style="margin:0">Ver:</label>
          <select id="tendSel" class="doc-tb__sel" style="min-width:220px">
            <option value="__all__" ${_tendSel === "__all__" ? "selected" : ""}>Todas las guías</option>
            ${keys.map(k => `<option value="${u.esc(k)}" ${_tendSel === k ? "selected" : ""}>${u.esc(k)}</option>`).join("")}
          </select>
        </div>
      </div>`;

    const meta = Number((groups[keys[0]][0] || {}).meta) || 90;

    // ----- Modo "Todas": una línea por guía sobre un eje común de períodos -----
    if (_tendSel === "__all__") {
      // Eje común: unión de períodos ordenados por fecha
      const periodMap = {}; // label -> fecha representativa
      evals.forEach(e => { const lab = e.periodo || u.fechaCL(e.fecha); if (!(lab in periodMap)) periodMap[lab] = new Date(e.fecha); });
      const labels = Object.keys(periodMap).sort((a, b) => periodMap[a] - periodMap[b]);
      const series = keys.map((k) => {
        const byLabel = {};
        groups[k].forEach(e => { byLabel[e.periodo || u.fechaCL(e.fecha)] = globalCumplimiento(e); });
        return { name: k, color: guiaCol(k),
          values: labels.map(l => (l in byLabel && byLabel[l] != null) ? byLabel[l] : null) };
      });
      return `${selector}
        <div class="card__hint" style="margin-top:0"><strong>Todas las guías</strong> · Meta institucional ${meta}%</div>
        ${U.charts.lineChart({ labels, series, meta, hideValues: keys.length > 2 })}
        <p class="narrativo" style="margin:.6rem 0 0"><strong>Interpretación:</strong> Comparación del cumplimiento global de las ${keys.length} guía(s) frente a la meta ${meta}%. Elige una guía en el selector para ver su tendencia en detalle.</p>`;
    }

    // ----- Modo una guía: su serie temporal -----
    const key = _tendSel;
    const serieEvals = groups[key].slice().sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const labels = serieEvals.map(e => e.periodo || u.fechaCL(e.fecha));
    const values = serieEvals.map(e => globalCumplimiento(e) || 0);
    const metaG = Number(serieEvals[0].meta) || 90;
    const last = values[values.length - 1], base = values[0];
    const interp = values.length < 2 ? "Se requiere al menos un seguimiento para interpretar la tendencia de esta guía."
      : (last >= base ? `Tendencia al alza: de ${base}% (línea base) a ${last}% en el último seguimiento.`
        : `Tendencia a la baja: de ${base}% a ${last}%. Se recomienda reforzar acciones de mejora.`);
    return `${selector}
      <div class="card__hint" style="margin-top:0"><strong>${u.esc(key)}</strong> · Meta institucional ${metaG}%</div>
      ${U.charts.lineChart({ labels, series: [{ name: key, color: "var(--c-celeste)", values }], meta: metaG })}
      <p class="narrativo" style="margin:.6rem 0 0"><strong>Interpretación:</strong> ${u.esc(interp)}</p>`;
  }

  function bindTendencia() {
    const sel = document.getElementById("tendSel");
    if (!sel) return;
    sel.onchange = () => {
      _tendSel = sel.value;
      const box = document.getElementById("tendencia");
      if (box) { box.innerHTML = tendenciaHTML(); bindTendencia(); }
    };
  }

  /* ---------- Actividad reciente ---------- */
  function actividadHTML() {
    const acts = S().all("actividadReciente").slice(0, 8);
    if (!acts.length) return ui().empty("No hay actividad reciente.", "Los movimientos del portal aparecerán aquí.", "🕒");
    return `<ul class="feed">${acts.map(a => `
      <li><span class="feed__ico">📝</span>
        <div><div><strong>${ui().esc(a.usuario)}</strong> ${ui().esc(a.verbo)} en <strong>${ui().esc(a.modulo)}</strong>: ${ui().esc(a.titulo)}</div>
        <div class="feed__meta">${ui().fechaHoraCL(a.fecha)}</div></div></li>`).join("")}</ul>`;
  }

  /* ---------- Evidencia de la semana (mascota EVI) ---------- */
  function evidenciaHTML() {
    const list = S().all("evidenciaSemana").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const e = list[0];
    const cuerpo = !e ? ui().empty("Aún no hay evidencia de la semana.", "Agrega la primera evidencia para comenzar.", "🔬")
      : `<div class="evi">
          <div>
            <h3 style="margin:.1rem 0">${ui().esc(e.titulo || e.tema || "Evidencia")}</h3>
            <div class="kpi__sub">${ui().esc(e.fuente || "")}${e.fecha ? " · " + ui().fechaCL(e.fecha) : (e.anio ? " · " + ui().esc(e.anio) : "")}</div>
            <p class="narrativo" style="margin:.5rem 0 .3rem">${ui().esc(e.resumen || e.hallazgo || "")}</p>
            <p style="margin:.2rem 0"><strong>Recomendación para la práctica:</strong> ${ui().esc(e.recomendacion || "—")}</p>
            ${e.enlace ? `<a href="${ui().esc(e.enlace)}" target="_blank" rel="noopener">Ver fuente ↗</a>` : ""}
          </div>
          <div class="evi__mascot"><img class="evi-img" src="assets/img/evi-full.png" alt="EVI, mascota de la UBPC"></div>
        </div>`;
    return cuerpo + `<p class="evi__quote">"La evidencia cobra valor cuando transforma la práctica y mejora el cuidado."</p>`;
  }

  /* ---------- Línea de tiempo ---------- */
  function timelineHTML() {
    const hitos = S().all("hitos").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    if (!hitos.length) return ui().empty("Aún no hay hitos registrados.", "Agrega el primer hito para comenzar la línea de tiempo.", "📍");
    return `<div class="timeline">${hitos.map(h => `
      <div class="tl-item">
        <div class="tl-item__dot">${h.icono || "📌"}</div>
        <div class="tl-item__date">${ui().fechaCL(h.fecha)} · ${ui().esc(h.modulo || "")}</div>
        <div class="tl-item__title">${ui().esc(h.titulo)}</div>
        <div class="tl-item__desc narrativo">${ui().esc(h.descripcion || "")}</div>
        <div class="btn-row" style="margin-top:.3rem">
          <button class="btn-icon" data-hedit="${h.id}" title="Editar">✏️</button>
          <button class="btn-icon" data-hdel="${h.id}" title="Eliminar">🗑️</button>
        </div>
      </div>`).join("")}</div>`;
  }

  /* ---------- Binder del Home ---------- */
  function homeBind(root) {
    U.components.kanban.mount(document.getElementById("homeKanban"), "coordinador");
    bindTendencia();

    const addHito = document.getElementById("addHito");
    if (addHito) addHito.onclick = () => hitoForm();

    root.querySelectorAll("[data-hedit]").forEach(b => b.onclick = () => hitoForm(S().get("hitos", b.dataset.hedit)));
    root.querySelectorAll("[data-hdel]").forEach(b => b.onclick = () =>
      ui().confirmDelete("¿Eliminar este hito de la línea de tiempo?", () => { S().remove("hitos", b.dataset.hdel); U.router.render(); }));
  }

  function evidenciaForm() {
    const u = ui();
    const fields = [
      { name: "titulo", label: "Título", required: true, full: true },
      { name: "fuente", label: "Fuente" },
      { name: "fecha", label: "Fecha", type: "date", value: u.hoyISO() },
      { name: "resumen", label: "Resumen", type: "textarea", full: true },
      { name: "recomendacion", label: "Recomendación para la práctica", type: "textarea", full: true },
      { name: "enlace", label: "Enlace", full: true }
    ];
    u.modal({ title: "Nueva evidencia de la semana", body: u.formHTML(fields, {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        if (!d.titulo) { u.toast("El título es obligatorio", "danger"); return; }
        S().insert("evidenciaSemana", d); u.closeModal(); U.router.render();
      }; } });
  }

  function hitoForm(hito) {
    const u = ui();
    const fields = [
      { name: "fecha", label: "Fecha", type: "date", required: true, value: hito ? u.isoDay(hito.fecha) : u.hoyISO() },
      { name: "icono", label: "Emoji / icono", value: hito ? hito.icono : "📌", hint: "Ej: 🚀 📈 🏆 🩺" },
      { name: "modulo", label: "Módulo", value: hito ? hito.modulo : "" },
      { name: "titulo", label: "Título", required: true, full: true, value: hito ? hito.titulo : "" },
      { name: "descripcion", label: "Descripción breve", type: "textarea", full: true, value: hito ? hito.descripcion : "" }
    ];
    u.modal({ title: hito ? "Editar hito" : "Nuevo hito", body: u.formHTML(fields, {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        if (!d.titulo) { u.toast("El título es obligatorio", "danger"); return; }
        // Ancla al mediodía local para que no se corra un día por zona horaria (Chile UTC-3/-4).
        d.fecha = d.fecha ? new Date(d.fecha + "T12:00:00").toISOString() : "";
        if (hito) S().update("hitos", hito.id, d); else S().insert("hitos", d);
        u.closeModal(); U.router.render();
      }; } });
  }

  /* ---------- Vistas de administración ---------- */
  function usuarios() {
    const u = ui(); const list = U.auth.perfiles();
    return `<div class="page-head"><h1>Usuarios y perfiles</h1><p>Gestión de perfiles habilitados. Estructura preparada para agregar nuevos colaboradores.</p></div>
      <div class="section"><button class="btn btn--primary" id="addUser">+ Agregar colaborador</button></div>
      <div class="table-wrap"><table class="tbl"><thead><tr>
        <th>Nombre</th><th>Cargo</th><th>Unidad</th><th>Rol</th><th>Acciones</th></tr></thead><tbody>
        ${list.map(p => `<tr>
          <td><div class="flex"><div class="avatar" style="width:32px;height:32px;font-size:12px">${p.foto ? `<img src="${u.esc(p.foto)}">` : u.initials(p.nombre)}</div><strong>${u.esc(p.nombre)}</strong></div></td>
          <td>${u.esc(p.cargo)}</td><td>${u.esc(p.unidad)}</td>
          <td><span class="tag">${u.esc(p.rol)}</span></td>
          <td class="acciones"><div class="btn-row">
            <button class="btn-icon" data-uedit="${p.id}" title="Editar">✏️</button>
            ${p.rol === "coordinador" || p.rol === "referente" ? "" : `<button class="btn-icon" data-udel="${p.id}" title="Eliminar">🗑️</button>`}
          </div></td></tr>`).join("")}
      </tbody></table></div>`;
  }
  function usuariosBind() {
    document.getElementById("addUser").onclick = () => addColaborador();
    document.querySelectorAll("[data-uedit]").forEach(b => b.onclick = () => U.views.editPerfil(b.dataset.uedit, () => U.router.render()));
    document.querySelectorAll("[data-udel]").forEach(b => b.onclick = () =>
      ui().confirmDelete("¿Eliminar este colaborador? No se eliminan sus registros históricos.", () => { S().remove("usuarios", b.dataset.udel); U.router.render(); }));
  }
  function addColaborador() {
    const u = ui();
    const fields = [
      { name: "nombre", label: "Nombre completo", required: true, full: true },
      { name: "cargo", label: "Cargo", required: true, full: true },
      { name: "unidad", label: "Unidad", full: true },
      { name: "rol", label: "Rol", type: "select", options: [
        { value: "colaborador", label: "Colaborador/a" },
        { value: "referente", label: "Referente Técnico" },
        { value: "coordinador", label: "Coordinador/a" }
      ] },
      { name: "foto", label: "URL de fotografía (opcional)", full: true }
    ];
    u.modal({ title: "Agregar colaborador", body: u.formHTML(fields, { rol: "colaborador" }),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Agregar</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        if (!d.nombre || !d.cargo) { u.toast("Nombre y cargo son obligatorios", "danger"); return; }
        S().insert("usuarios", d); u.closeModal(); U.router.render();
      }; } });
  }

  function cloudStatusText(st) {
    const map = {
      pending: "Cambios pendientes de subir…",
      syncing: "Sincronizando con la nube…",
      ok: "✅ " + (st.msg || "Sincronizado"),
      error: "⚠️ " + (st.msg || "Error al sincronizar")
    };
    return map[st.state] || "Tus datos se guardan automáticamente en la nube.";
  }
  function cloudCardHTML() {
    const C = U.cloud, u = ui();
    if (!C) return "";
    let inner;
    if (!C.configured()) {
      inner = `<p class="card__hint">Conecta tu proyecto de Supabase para guardar todo en la nube. Copia los dos datos desde Supabase → <strong>Settings → API</strong>.</p>
        <div class="form-grid">
          <div class="field"><label>URL del proyecto</label><input class="input" id="cloudUrl" placeholder="https://xxxxx.supabase.co"></div>
          <div class="field"><label>Clave pública (anon key)</label><input class="input" id="cloudKey" placeholder="eyJhbGciOi…"></div>
        </div>
        <button class="btn btn--primary" id="cloudSaveCfg">Guardar conexión</button>`;
    } else if (!C.signedIn()) {
      inner = `<p class="card__hint">Conexión lista ✅. Ahora inicia sesión con el usuario (correo y contraseña) que creaste en Supabase.</p>
        <div class="form-grid">
          <div class="field"><label>Correo</label><input class="input" id="cloudEmail" type="email" placeholder="correo@ejemplo.cl"></div>
          <div class="field"><label>Contraseña</label><input class="input" id="cloudPass" type="password" placeholder="••••••••"></div>
        </div>
        <div class="btn-row"><button class="btn btn--primary" id="cloudSignIn">Iniciar sesión</button>
          <button class="btn btn--ghost btn--sm" id="cloudReset">Cambiar conexión</button></div>`;
    } else {
      inner = `<div style="margin-bottom:.5rem"><span class="storage-badge storage-badge--ok">☁️ Conectado como <strong>${u.esc(C.email())}</strong></span></div>
        <p class="card__hint" id="cloudStatus">${cloudStatusText(C.status())}</p>
        <div class="btn-row">
          <button class="btn btn--primary btn--sm" id="cloudSync">🔄 Sincronizar ahora</button>
          <button class="btn btn--ghost btn--sm" id="cloudSignOut">Cerrar sesión en la nube</button>
        </div>`;
    }
    return `<div class="card" style="margin-bottom:1rem;border-left:5px solid var(--c-morado)">
      <h3 class="card__title">☁️ Sincronización en la nube (recomendado)</h3>${inner}</div>`;
  }
  function bindCloud() {
    const C = U.cloud, u = ui();
    if (!C) return;
    C.onStatus(st => { const el = document.getElementById("cloudStatus"); if (el) el.textContent = cloudStatusText(st); });
    const saveCfg = document.getElementById("cloudSaveCfg");
    if (saveCfg) saveCfg.onclick = () => {
      const url = (document.getElementById("cloudUrl").value || "").trim();
      const key = (document.getElementById("cloudKey").value || "").trim();
      if (!/^https:\/\/.+\.supabase\.co/.test(url)) { u.toast("Revisa la URL del proyecto (https://…supabase.co)", "danger"); return; }
      if (key.length < 30) { u.toast("Revisa la clave pública (anon key)", "danger"); return; }
      C.setConfig(url, key); u.toast("Conexión guardada", "ok"); U.router.render();
    };
    const signIn = document.getElementById("cloudSignIn");
    if (signIn) signIn.onclick = async () => {
      const mail = (document.getElementById("cloudEmail").value || "").trim();
      const pass = document.getElementById("cloudPass").value || "";
      if (!mail || !pass) { u.toast("Ingresa correo y contraseña", "danger"); return; }
      signIn.disabled = true; signIn.textContent = "Ingresando…";
      try {
        await C.signIn(mail, pass);
        u.toast("Sesión iniciada en la nube", "ok");
        const r = await C.initialSync();
        if (r && r.error) u.toast(r.error, "danger");
        U.router.render();
      } catch (e) { u.toast(e.message || "No se pudo iniciar sesión", "danger"); signIn.disabled = false; signIn.textContent = "Iniciar sesión"; }
    };
    const reset = document.getElementById("cloudReset");
    if (reset) reset.onclick = () => { C.clearAll(); U.router.render(); };
    const sync = document.getElementById("cloudSync");
    if (sync) sync.onclick = async () => { const r = await C.syncNow(); u.toast(r && r.ok ? "Sincronizado" : (r && r.error) || "Sin cambios", r && r.ok ? "ok" : "warn"); };
    const signOut = document.getElementById("cloudSignOut");
    if (signOut) signOut.onclick = () => u.confirmDelete("¿Cerrar sesión en la nube en este equipo? Tus datos seguirán guardados en la nube y en este equipo.", () => { C.signOut(); U.router.render(); });
  }

  function config() {
    const u = ui(); const me = U.auth.current();
    const rolLabel = { coordinador: "Coordinador/a", referente: "Referente Técnico", colaborador: "Colaborador/a" }[me.rol] || me.rol || "";
    const lb = S().getConfig("__lastBackup", null);
    const lastBackup = lb ? u.fechaHoraCL(lb) : null;
    return `<div class="page-head"><h1>Configuración</h1><p>Tu perfil, respaldo, trazabilidad y mantenimiento de datos.</p></div>
      <div class="prof-hero prof-hero--solo" style="margin-bottom:1.1rem">
        <div class="prof-hero__banner"><span class="prof-hero__glow"></span></div>
        <div class="prof-hero__row">
          <div class="avatar avatar--lg prof-hero__avatar">${me.foto ? `<img src="${u.esc(me.foto)}">` : u.initials(me.nombre)}</div>
          <div class="prof-hero__id">
            <h2>${u.esc(me.nombre)}</h2>
            <div class="prof-hero__role">${rolLabel ? `<span class="tag tag--role">${u.esc(rolLabel)}</span>` : ""}<span class="muted">${u.esc(me.cargo || "")}</span></div>
            <div class="kpi__sub">🏥 ${u.esc(me.unidad || "Unidad de Buenas Prácticas Clínicas – UBPC")}</div>
          </div>
          <button class="btn btn--primary prof-hero__edit" id="editMe">✏️ Editar perfil</button>
        </div>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <h3 class="card__title">Apariencia · Tema del portal</h3>
        <p class="card__hint">Elige la paleta de color y el modo claro u oscuro. Se aplica en todo el portal y se recuerda en este dispositivo.</p>
        ${U.theme ? U.theme.pickerHTML() : ""}
      </div>
      <div class="card" style="margin-bottom:1rem;border-left:5px solid var(--morado)">
        <h3 class="card__title">🎯 Meta institucional de cumplimiento</h3>
        <p class="card__hint">Un único valor para todo el portal (panel del Home, gauge institucional y comparaciones). Las evaluaciones nuevas la toman como meta por defecto.</p>
        <div class="btn-row" style="align-items:center;gap:.6rem;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:.3rem">
            <input type="number" id="metaInstInput" class="input" style="max-width:110px" min="1" max="100" value="${u.esc(U.coordStats.metaInstitucional())}">
            <strong>%</strong>
          </div>
          <button class="btn btn--primary" id="metaInstSave">💾 Guardar meta</button>
          <button class="btn btn--ghost" id="metaInstApply" title="Iguala la meta de todas las evaluaciones ya registradas">↻ Aplicar a todas las evaluaciones</button>
        </div>
        <p class="kpi__sub" style="margin-top:.5rem">Meta actual en uso: <strong>${u.esc(U.coordStats.metaInstitucional())}%</strong>.</p>
      </div>
      <div class="card" style="margin-bottom:1rem;border-left:5px solid var(--ok)">
        <h3 class="card__title">Guardado en este equipo</h3>
        <p class="card__hint">Todo lo que ingresas (tu nombre, foto, registros y configuración) se guarda automáticamente en este dispositivo. Para que el navegador <strong>no borre</strong> tus datos con el tiempo, mantén activada la protección.</p>
        <div id="cfg-storage" class="storage-row"><span class="muted">Comprobando estado del almacenamiento…</span></div>
        <p class="card__hint" style="margin-top:.6rem">💡 Consejo: exporta un respaldo cada cierto tiempo (abajo). Es tu copia de seguridad si cambias de navegador o equipo, o si limpias el historial.</p>
      </div>
      ${cloudCardHTML()}
      <div class="card" style="margin-bottom:1rem">
        <h3 class="card__title">🔒 Ingreso al portal</h3>
        <p class="card__hint">Si lo activas, al abrir el portal se pedirá tu <strong>correo y contraseña</strong> (los de la nube) antes de entrar. Si lo dejas apagado, entras rápido eligiendo tu perfil.</p>
        <label class="switch-row">
          <input type="checkbox" id="askPass" ${S().getConfig("pedirClaveIngreso", false) ? "checked" : ""}>
          <span class="switch"></span>
          <span>Pedir contraseña al abrir el portal</span>
        </label>
      </div>
      <div class="card" style="margin-bottom:1rem;border-left:5px solid var(--c-turquesa)">
        <h3 class="card__title">Datos de demostración</h3>
        <p class="card__hint">Carga un conjunto de datos de ejemplo (evaluaciones RNAO, documentos, reuniones, colaboraciones, capacitaciones, solicitudes, tablero, hitos y más) para ver el portal con contenido. <strong>Tu nombre y foto de perfil se conservan.</strong></p>
        <button class="btn btn--primary" id="loadDemo">✨ Cargar datos de ejemplo</button>
      </div>
      <div class="grid grid--2">
        <div class="card"><h3 class="card__title">Respaldo de datos</h3>
          <p class="card__hint">Exporta o restaura todos los registros del portal (formato JSON). ${lastBackup ? `<br><span class="muted">Último respaldo exportado: <strong>${lastBackup}</strong>.</span>` : `<br><span class="muted">Aún no has exportado un respaldo.</span>`}</p>
          <div class="btn-row">
            <button class="btn btn--primary" id="expJson">⬇️ Exportar respaldo</button>
            <button class="btn btn--ghost" id="impJson">⬆️ Importar respaldo</button>
          </div>
          <input type="file" id="impFile" accept="application/json" class="hidden">
        </div>
        <div class="card"><h3 class="card__title">Información del sistema</h3>
          <p class="card__hint">Versión de esquema: ${U.store.SCHEMA_VERSION}. Los registros históricos se conservan al modificar formularios.</p>
          <button class="btn btn--danger" id="resetAll">Restablecer datos (con confirmación)</button>
        </div>
      </div>`;
  }
  async function renderStorage() {
    const box = document.getElementById("cfg-storage");
    if (!box || !U.storage) return;
    const supported = await U.storage.supported();
    if (!supported) {
      box.innerHTML = `<span class="storage-badge storage-badge--warn">ⓘ Este navegador guarda los datos localmente, pero no permite marcarlos como protegidos. Exporta un respaldo con frecuencia.</span>`;
      return;
    }
    const persisted = await U.storage.isPersisted();
    if (persisted) {
      box.innerHTML = `<span class="storage-badge storage-badge--ok">✅ Protegido · el navegador no borrará automáticamente tus datos en este equipo.</span>`;
    } else {
      box.innerHTML = `<span class="storage-badge storage-badge--warn">⚠️ Sin protección · el navegador podría borrar los datos tras un tiempo sin usar el portal.</span>
        <button class="btn btn--primary btn--sm" id="protectBtn">🔒 Proteger mis datos</button>`;
      const b = document.getElementById("protectBtn");
      if (b) b.onclick = async () => {
        const ok = await U.storage.ensurePersist();
        ui().toast(ok ? "Datos protegidos en este equipo" : "El navegador no concedió la protección. Exporta un respaldo por seguridad.", ok ? "ok" : "warn");
        renderStorage();
      };
    }
  }

  function configBind() {
    const u = ui(); const me = U.auth.current();
    if (U.theme) U.theme.bindPicker(document);
    renderStorage();
    bindCloud();
    const askPass = document.getElementById("askPass");
    if (askPass) askPass.onchange = () => {
      S().setConfig("pedirClaveIngreso", askPass.checked);
      u.toast(askPass.checked ? "Se pedirá contraseña al entrar" : "Ingreso rápido activado (sin contraseña)", "ok");
    };
    // Meta institucional (valor único)
    const metaSave = document.getElementById("metaInstSave");
    if (metaSave) metaSave.onclick = () => {
      const v = Math.round(Number(document.getElementById("metaInstInput").value));
      if (!(v > 0 && v <= 100)) { u.toast("Ingresa una meta entre 1 y 100", "danger"); return; }
      S().setConfig("metaInstitucional", v);
      u.toast("Meta institucional guardada: " + v + "%", "ok");
      U.router.render();
    };
    const metaApply = document.getElementById("metaInstApply");
    if (metaApply) metaApply.onclick = () => {
      const v = Math.round(Number(document.getElementById("metaInstInput").value));
      if (!(v > 0 && v <= 100)) { u.toast("Ingresa una meta entre 1 y 100", "danger"); return; }
      const evals = S().all("evaluacionesRNAO");
      u.modal({
        title: "Aplicar meta a todas las evaluaciones",
        body: `<p class="narrativo">Se igualará la meta de las <strong>${evals.length}</strong> evaluación(es) registrada(s) a <strong>${v}%</strong>, y quedará como meta institucional del portal. ¿Continuar?</p>`,
        footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-ok>Aplicar ${v}%</button>`,
        onMount(m) {
          m.querySelector("[data-ok]").onclick = () => {
            S().setConfig("metaInstitucional", v);
            evals.forEach(e => S().update("evaluacionesRNAO", e.id, { meta: v }));
            u.closeModal();
            u.toast("Meta aplicada a todas las evaluaciones", "ok");
            U.router.render();
          };
        }
      });
    };
    document.getElementById("editMe").onclick = () => U.views.editPerfil(me.id, () => U.router.render());
    document.getElementById("expJson").onclick = () => {
      u.download("respaldo-ubpc-" + u.hoyISO() + ".json", S().exportJSON(), "application/json");
      S().setConfig("__lastBackup", new Date().toISOString());
      u.toast("Respaldo descargado. Guárdalo en un lugar seguro.", "ok");
    };
    document.getElementById("impJson").onclick = () => document.getElementById("impFile").click();
    document.getElementById("impFile").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        let data; try { data = JSON.parse(r.result); } catch (err) { u.toast("Archivo inválido", "danger"); return; }
        u.confirmDelete("Esto reemplazará TODOS los datos actuales por el respaldo importado. ¿Continuar?", () => {
          try { S().importJSON(data); u.toast("Respaldo importado", "ok"); U.router.render(); }
          catch (err) { u.toast("No se pudo importar el respaldo", "danger"); }
        });
      };
      r.readAsText(f);
      e.target.value = "";
    };
    document.getElementById("resetAll").onclick = () =>
      u.confirmDelete("Esto eliminará TODOS los registros del portal. ¿Continuar?", () => { S().reset(); U.data.seedIfEmpty(); U.router.render(); });
    const demo = document.getElementById("loadDemo");
    if (demo) demo.onclick = () => u.confirmDelete("Esto reemplazará los datos actuales por un conjunto de ejemplo. ¿Continuar?", () => {
      U.demo.load(); u.toast("Datos de ejemplo cargados", "ok"); U.router.go("#/coord/home");
    });
  }

  /* ---------- Placeholder de módulos (se completan por etapas) ---------- */
  function moduloEnConstruccion(titulo, desc) {
    return () => `<div class="page-head"><h1>${titulo}</h1><p>${desc}</p></div>
      ${ui().empty("Módulo en implementación por etapas.", "Esta sección se está construyendo. La estructura de datos y trazabilidad ya está preparada.", "🛠️")}`;
  }

  U.coord = {
    default: "home",
    nav: NAV,
    views: {
      home,
      m1: moduloEnConstruccion("Apoyo y Mejora Continua", "Apoyo técnico, asesorías, intervenciones y procesos de mejora del cuidado."),
      m2: moduloEnConstruccion("Gestión Documental", "Protocolos, normas, procedimientos, manuales y documentos institucionales."),
      m3: moduloEnConstruccion("Programa RNAO", "Guías BPSO, línea base, seguimiento, Red Champion e índice de implementación."),
      m4: moduloEnConstruccion("Programa de Fortalecimiento", "Actividades, capacitación, EVI y reconocimientos."),
      m5: moduloEnConstruccion("Centro de Gestión, Articulación y Respaldo", "Reuniones, documentos, acuerdos, articulación y solicitudes de apoyo."),
      m6: moduloEnConstruccion("Norma Técnica 234", "Cumplimiento por unidad, semáforo, planes de mejora e informe A4."),
      m7: moduloEnConstruccion("Red de Colaboración UBPC", "Asesorías, visitas técnicas, cursos y colaboraciones institucionales."),
      solicitudes: moduloEnConstruccion("Solicitudes de apoyo técnico", "Consolidación y flujo de cierre de solicitudes al Referente Técnico."),
      usuarios, config
    },
    binders: {
      home: homeBind, usuarios: usuariosBind, config: configBind
    }
  };
})();
