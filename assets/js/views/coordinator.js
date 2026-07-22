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
      { key: "home", label: "Inicio", ico: "🏠" }
    ]},
    { label: "Módulos de gestión", items: [
      { key: "m1", label: "Apoyo y Mejora Continua", ico: "🤝" },
      { key: "m2", label: "Gestión Documental", ico: "📄" },
      { key: "m3", label: "Programa RNAO", ico: "🧭" },
      { key: "m4", label: "Fortalecimiento", ico: "💪" },
      { key: "m5", label: "Gestión y Respaldo", ico: "🗂️" },
      { key: "m6", label: "Norma Técnica 234", ico: "📊" },
      { key: "m7", label: "Red de Colaboración", ico: "🌐" }
    ]},
    { label: "Administración", items: [
      { key: "solicitudes", label: "Solicitudes técnicas", ico: "📨",
        badgeFn: () => S().all("solicitudes").filter(x => x.estado === "Completada por referente").length },
      { key: "usuarios", label: "Usuarios y perfiles", ico: "👥" },
      { key: "perfil", label: "Mi perfil", ico: "🪪" },
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
      global,
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
  U.coordStats = { stats, globalCumplimiento, pctIndicador, indicadoresBajoMeta };

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

  /* ---------- HOME ---------- */
  function home() {
    const u = ui();
    const st = stats();
    const globalTxt = st.global == null ? "—" : st.global + "%";
    const globalSub = st.global == null ? "Aún sin evaluaciones registradas"
      : (st.global >= 90 ? "Dentro de la meta institucional" : "Bajo la meta institucional (90%)");

    // HERO BENTO (Nivel 1 — prioridad)
    const me = U.auth.current();
    const guias = cumplPorGuia();
    const GC = [{ color: "#7fe0d0" }, { color: "#c9b6f5" }, { color: "#ffd98a" }];
    const bloomSegs = guias.map((g, i) => ({ pct: g.pct, color: GC[i].color }));
    const bloomLegend = guias.map((g, i) => `
      <div class="bloom-lg"><i style="background:${GC[i].color}"></i>
      <span class="nm">${u.esc(g.label)}</span><span class="pc">${g.hasData ? g.pct + "%" : "—"}</span></div>`).join("");
    const globalColor = st.global == null ? "#ffffff" : (st.global >= 90 ? "#eafff7" : "#fff");
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
        <div class="pillars" style="margin-top:.7rem">
          <span class="pillar"><span class="ic">🛡️</span>Seguridad</span>
          <span class="pillar ev"><span class="ic">🔬</span>Evidencia</span>
          <span class="pillar cu"><span class="ic">💙</span>Cuidado</span>
        </div>
      </div>
      <div class="card hh-bloom">
        <div class="hh-bloom__top"><span class="hh-lbl">Cumplimiento por guía</span>
          ${st.global != null ? `<span class="hh-trend ${st.global >= 90 ? "ok" : "warn"}">Meta 90%</span>` : ""}</div>
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

    <div class="grid grid--2">
      <div class="section">
        <div class="section__head"><div><h2 class="section__title">Actividad reciente</h2>
          <p class="section__hint">Últimos movimientos registrados en el portal.</p></div></div>
        <div class="card">${actividadHTML()}</div>
      </div>
      <div class="section">
        <div class="section__head">
          <div><h2 class="section__title">Evidencia de la semana</h2></div>
          <button class="btn btn--primary btn--sm" id="addEvidencia">+ Nueva evidencia</button>
        </div>
        <div class="card" id="evidenciaBox">${evidenciaHTML()}</div>
      </div>
    </div>

    <div class="section">
      <div class="section__head">
        <div><h2 class="section__title">Línea de tiempo de hitos</h2>
        <p class="section__hint">Principales avances institucionales de la UBPC.</p></div>
        <button class="btn btn--primary btn--sm" id="addHito">+ Nuevo hito</button>
      </div>
      <div class="card" id="timelineBox">${timelineHTML()}</div>
    </div>`;
  }

  /* ---------- Tendencia ---------- */
  function tendenciaHTML() {
    const evals = S().all("evaluacionesRNAO");
    if (!evals.length) return ui().empty("Sin datos de tendencia todavía.", "Registra evaluaciones RNAO para visualizar la evolución del cumplimiento.", "📈");
    // Agrupar por guía + unidad (no mezclar indicadores distintos en una misma línea)
    const groups = {};
    evals.forEach(e => {
      const key = (e.guia || "Guía") + " · " + (e.unidad || "Unidad");
      (groups[key] = groups[key] || []).push(e);
    });
    const key = Object.keys(groups)[0];
    const serieEvals = groups[key].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const labels = serieEvals.map(e => e.periodo || ui().fechaCL(e.fecha));
    const values = serieEvals.map(e => globalCumplimiento(e) || 0);
    const meta = Number(serieEvals[0].meta) || 90;
    const last = values[values.length - 1], base = values[0];
    const interp = values.length < 2 ? "Se requiere al menos un seguimiento para interpretar la tendencia."
      : (last >= base ? `Tendencia al alza: de ${base}% (línea base) a ${last}% en el último seguimiento.`
        : `Tendencia a la baja: de ${base}% a ${last}%. Se recomienda reforzar acciones de mejora.`);

    return `<div class="card__hint" style="margin-top:0">
        <strong>${ui().esc(key)}</strong> · Meta institucional ${meta}%
      </div>
      ${U.charts.lineChart({ labels, series: [{ name: key, color: "var(--c-celeste)", values }], meta })}
      <p class="narrativo" style="margin:.6rem 0 0"><strong>Interpretación:</strong> ${ui().esc(interp)}</p>
      ${Object.keys(groups).length > 1 ? `<p class="kpi__sub">Mostrando la primera serie. Cada indicador/guía se grafica por separado para no mezclar mediciones distintas.</p>` : ""}`;
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
            <h3 style="margin:.1rem 0">${ui().esc(e.titulo)}</h3>
            <div class="kpi__sub">${ui().esc(e.fuente || "")} · ${ui().fechaCL(e.fecha)}</div>
            <p class="narrativo" style="margin:.5rem 0 .3rem">${ui().esc(e.resumen || "")}</p>
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

    const addEv = document.getElementById("addEvidencia");
    if (addEv) addEv.onclick = () => evidenciaForm();
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
        d.fecha = new Date(d.fecha).toISOString();
        if (hito) S().update("hitos", hito.id, d); else S().insert("hitos", d);
        u.closeModal(); U.router.render();
      }; } });
  }

  /* ---------- Vistas de administración ---------- */
  function perfil() {
    const u = ui(); const me = U.auth.current();
    return `<div class="page-head"><h1>Mi perfil</h1><p>Datos visibles en la pantalla de acceso y el encabezado.</p></div>
      <div class="card" style="max-width:560px">
        <div class="flex" style="margin-bottom:1rem">
          <div class="avatar avatar--lg">${me.foto ? `<img src="${u.esc(me.foto)}">` : u.initials(me.nombre)}</div>
          <div><h2 style="margin:0">${u.esc(me.nombre)}</h2><div class="muted">${u.esc(me.cargo)}</div><div class="kpi__sub">${u.esc(me.unidad)}</div></div>
        </div>
        <button class="btn btn--primary" id="editMe">✏️ Editar mi perfil</button>
      </div>`;
  }
  function perfilBind() {
    const me = U.auth.current();
    document.getElementById("editMe").onclick = () => U.views.editPerfil(me.id, () => U.router.render());
  }

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

  function config() {
    return `<div class="page-head"><h1>Configuración</h1><p>Respaldo, trazabilidad y mantenimiento de datos.</p></div>
      <div class="card" style="margin-bottom:1rem;border-left:5px solid var(--c-turquesa)">
        <h3 class="card__title">Datos de demostración</h3>
        <p class="card__hint">Carga un conjunto de datos de ejemplo (evaluaciones RNAO, documentos, reuniones, colaboraciones, capacitaciones, solicitudes, tablero, hitos y más) para ver el portal con contenido. Reemplaza los datos actuales.</p>
        <button class="btn btn--primary" id="loadDemo">✨ Cargar datos de ejemplo</button>
      </div>
      <div class="grid grid--2">
        <div class="card"><h3 class="card__title">Respaldo de datos</h3>
          <p class="card__hint">Exporta o restaura todos los registros del portal (formato JSON).</p>
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
  function configBind() {
    const u = ui();
    document.getElementById("expJson").onclick = () =>
      u.download("respaldo-ubpc-" + u.hoyISO() + ".json", S().exportJSON(), "application/json");
    document.getElementById("impJson").onclick = () => document.getElementById("impFile").click();
    document.getElementById("impFile").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { S().importJSON(r.result); u.toast("Respaldo importado", "ok"); U.router.render(); } catch (err) { u.toast("Archivo inválido", "danger"); } };
      r.readAsText(f);
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
      perfil, usuarios, config
    },
    binders: {
      home: homeBind, perfil: perfilBind, usuarios: usuariosBind, config: configBind
    }
  };
})();
