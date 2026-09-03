/* ============================================================
   PORTAL REFERENTE TÉCNICO — Espacio de trabajo propio
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  const NAV = [
    { label: "Mi portal", items: [
      { key: "inicio", label: "Inicio", ico: "🏠" },
      { key: "gestion", label: "Mi gestión", ico: "🗂️" },
      { key: "seguimiento", label: "Mi seguimiento", ico: "📌" },
      { key: "funciones", label: "Funciones del rol", ico: "📋" }
    ]},
    { label: "Submódulos operativos", items: [
      { key: "biblioteca", label: "Bitácora Biblioteca", ico: "📚" },
      { key: "capacitacion", label: "Capacitación por turno", ico: "🎓" },
      { key: "evi", label: "EVI · Evidencia que transforma", ico: "🦉" },
      { key: "planesSeg", label: "Seguimiento de Planes RNAO", ico: "🧭" },
      { key: "apoyo", label: "Solicitud de apoyo", ico: "🆘" },
      { key: "reunion", label: "Reunión de seguimiento", ico: "📅" },
      { key: "monitoreo", label: "Monitoreo e implementación", ico: "📈" }
    ]},
    { label: "Cuenta", items: [
      { key: "solicitudesRecibidas", label: "Solicitudes recibidas", ico: "📨",
        badgeFn: () => S().all("solicitudes").filter(x => (x.direccion || "coord-a-ref") === "coord-a-ref" && (x.estado === "Enviada" || x.estado === "En curso")).length },
      { key: "config", label: "Configuración", ico: "⚙️" }
    ]}
  ];

  /* ---------- INICIO ---------- */
  function inicio() {
    const u = ui(); const me = U.auth.current();
    const noLeidas = U.notif.unread("referente").length;
    const sols = S().all("solicitudes").filter(x => (x.direccion || "coord-a-ref") === "coord-a-ref" && x.estado && x.estado !== "Cerrada por coordinación");
    const prioritarias = sols.filter(x => x.prioridad === "alta");
    const kanban = S().all("kanban").filter(c => c.owner === "referente");
    const pend = kanban.filter(c => c.columna !== "Completado");
    const reuniones = S().all("reuniones").filter(r => r.fecha && new Date(r.fecha) >= new Date().setHours(0,0,0,0))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(0, 4);

    const firstName = u.esc(me.nombre.split(" ")[0]);
    const prioHTML = prioritarias.length
      ? prioritarias.slice(0, 3).map(s => `<div class="rt-ps">
          <div><div class="rt-ps__code">${u.esc(s.codigo || "")}</div>
          <b>${u.esc(s.titulo || "Solicitud")}</b>
          <span>${u.esc(s.unidad || "")}${s.plazo ? " · vence " + u.fechaCL(s.plazo) : ""}</span></div>
          <span class="rt-ps__badge">Alta</span></div>`).join("")
      : u.empty("Sin solicitudes prioritarias.", "Las solicitudes urgentes de Coordinación aparecerán aquí.", "📨");

    const ultimaEvi = S().all("evidenciaSemana").sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

    // Próximas evaluaciones / auditorías que le tocan al referente
    const hoy0 = new Date(); hoy0.setHours(0, 0, 0, 0);
    const evalItems = [];
    S().all("monitoreoRef").forEach(m => { if (m.proximaFecha && new Date(m.proximaFecha) >= hoy0) evalItems.push({ fecha: m.proximaFecha, titulo: (m.tipoRegistro || "Auditoría") + (m.unidad ? " · " + m.unidad : ""), tipo: "Auditoría / monitoreo" }); });
    S().all("evaluacionesRNAO").forEach(e => { if (e.proximaMedicion && new Date(e.proximaMedicion) >= hoy0) evalItems.push({ fecha: e.proximaMedicion, titulo: (e.guia || "Medición RNAO") + (e.unidad ? " · " + e.unidad : ""), tipo: "Medición RNAO" }); });
    if (U.indicadoresUtil && U.indicadoresUtil.proximaMedicion) {
      S().all("indicadores").forEach(r => { const pm = U.indicadoresUtil.proximaMedicion(r); if (pm && new Date(pm) >= hoy0) evalItems.push({ fecha: pm, titulo: (r.nombre || r.indicador || "Indicador") + (r.unidad ? " · " + r.unidad : ""), tipo: "Indicador" }); });
    }
    evalItems.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    return `
    <section class="rt-band">
      <div class="rt-band__txt">
        <div class="hh-eb">Espacio de trabajo · Referente Técnico</div>
        <h1>Hola, ${firstName}</h1>
        <p>${u.esc(me.cargo)} — tus solicitudes, avances y evidencia clínica en un solo lugar.</p>
      </div>
      <div class="pillars-card">
        <span class="pilar"><span class="ic">🛡️</span>Seguridad</span>
        <span class="pilar-sep" aria-hidden="true"></span>
        <span class="pilar ev"><span class="ic">🔬</span>Evidencia</span>
        <span class="pilar-sep" aria-hidden="true"></span>
        <span class="pilar cu"><span class="ic">💙</span>Cuidado</span>
      </div>
    </section>

    <div class="grid grid--3 rt-cards">
      <div class="card rt-ind">
        <span class="hh-lbl">Indicadores personales</span>
        <div class="rt-row"><i style="background:#e0526f"></i><span class="nm">Solicitudes en gestión</span><b>${sols.length}</b></div>
        <div class="rt-row"><i style="background:#e0912f"></i><span class="nm">Pendientes</span><b>${pend.length}</b></div>
        <div class="rt-row"><i style="background:#12b5a5"></i><span class="nm">Reuniones programadas</span><b>${reuniones.length}</b></div>
        <div class="rt-row"><i style="background:#7a5cd0"></i><span class="nm">Notificaciones sin leer</span><b>${noLeidas}</b></div>
      </div>
      <div class="card rt-eval">
        <span class="hh-lbl">🗓️ Próxima evaluación / auditoría</span>
        ${evalItems.length
          ? `<ul class="feed" style="margin-top:.2rem">${evalItems.slice(0, 3).map(ev => {
              const venc = new Date(ev.fecha) < hoy0;
              return `<li><span class="feed__ico">${venc ? "🔴" : "🗓️"}</span><div><strong>${u.esc(ev.titulo)}</strong><div class="feed__meta">${u.fechaCL(ev.fecha)} · ${u.esc(ev.tipo)}</div></div></li>`;
            }).join("")}</ul>`
          : u.empty("Sin evaluaciones programadas.", "Agenda la próxima en Monitoreo.", "🗓️")}
      </div>
      <div class="card rt-reun">
        <span class="hh-lbl">📅 Próximas reuniones</span>
        ${reuniones.length ? `<ul class="feed" style="margin-top:.2rem">${reuniones.slice(0, 3).map(r => `<li><span class="feed__ico">📅</span><div><strong>${u.esc(r.tema || "Reunión")}</strong><div class="feed__meta">${u.fechaCL(r.fecha)}</div></div></li>`).join("")}</ul>`
          : u.empty("Sin reuniones programadas.", "", "📅")}
      </div>
    </div>

    <div class="grid grid--2 rt-cards">
      <div class="card rt-prio ${prioritarias.length ? "has-prio" : ""}">
        <div class="rt-prio__head"><span class="rt-live"></span><span class="hh-lbl">Solicitudes prioritarias</span>
          <span class="rt-count">${prioritarias.length}</span></div>
        <div class="rt-prio__list">${prioHTML}</div>
        <a class="rt-all" href="#/ref/solicitudesRecibidas">Ver todas las solicitudes →</a>
      </div>
      <div class="card rt-link">
        <span class="hh-lbl">🤝 Enlace directo con Coordinación</span>
        <p class="kpi__sub" style="margin:.35rem 0 .7rem">¿Necesitas apoyo, validación o una decisión? Escríbele directo al Coordinador/a UBPC y queda registrado.</p>
        <button class="btn btn--primary btn--sm btn--block" id="rtApoyo">🆘 Solicitar apoyo al Coordinador</button>
      </div>
    </div>

    <div class="section">
      <div class="section__head"><div><h2 class="section__title">Mi tablero Kanban</h2>
        <p class="section__hint">Avances, pendientes y resultados.</p></div></div>
      <div id="refKanban"></div>
    </div>

    <div class="grid grid--2 rt-row2">
      <div class="section" style="margin:0">
        <div class="section__head"><h2 class="section__title">Resultados recientes</h2></div>
        <div class="card rt-res">${resultadosRecientes()}</div>
      </div>
      <div class="section" style="margin:0">
        <div class="section__head"><div><h2 class="section__title">Evidencia y recomendación</h2>
          <p class="section__hint">Conectada con Coordinación.</p></div>
          <a class="btn btn--ghost btn--sm" href="#/ref/evi">Ver todo →</a></div>
        <div class="card rt-evi">
          <div>
            ${ultimaEvi
              ? `<div class="hh-lbl" style="color:#0d8175">Última evidencia</div>
                 <h3 style="margin:.15rem 0 .1rem">${u.esc(ultimaEvi.titulo)}</h3>
                 <div class="kpi__sub">${u.esc(ultimaEvi.fuente || "")}${ultimaEvi.fecha ? " · " + u.fechaCL(ultimaEvi.fecha) : ""}</div>
                 <p style="margin:.45rem 0 .55rem"><strong>Recomendación:</strong> ${u.esc((ultimaEvi.recomendacion || ultimaEvi.resumen || "—")).slice(0, 150)}</p>`
              : `<p class="narrativo" style="margin-top:0">Aquí verás la evidencia que registra Coordinación para apoyar decisiones clínicas. También puedes aportar la tuya.</p>`}
            <a class="btn btn--primary btn--sm" href="#/ref/evi">Abrir EVI · Evidencia que transforma</a>
          </div>
          <img class="evi-img" src="assets/img/evi-full.png" alt="EVI, mascota de la UBPC">
        </div>
      </div>
    </div>`;
  }

  function kpi(label, value, sub, kind) {
    return `<div class="card kpi ${kind ? "kpi--" + kind : ""}" style="border-left-color:var(--c-turquesa)">
      <div class="kpi__label">${ui().esc(label)}</div><div class="kpi__value">${value}</div>
      <div class="kpi__sub">${ui().esc(sub)}</div></div>`;
  }
  function solicitudesResumen(sols) {
    const u = ui();
    if (!sols.length) return u.empty("No hay solicitudes en gestión.", "Las solicitudes enviadas por Coordinación aparecerán aquí.", "📨");
    return `<ul class="feed">${sols.slice(0, 5).map(s => `<li>
      <span class="feed__ico">${s.prioridad === "alta" ? "🔴" : "📨"}</span>
      <div><strong>${u.esc(s.titulo || s.codigo)}</strong> <span class="mono">${u.esc(s.codigo || "")}</span>
      <div class="feed__meta">${u.esc(s.unidad || "")} · ${u.estadoBadge(s.estado)}</div></div></li>`).join("")}</ul>`;
  }
  function resultadosRecientes() {
    const u = ui();
    const done = S().all("kanban").filter(c => c.owner === "referente" && c.columna === "Completado").slice(0, 5);
    if (!done.length) return u.empty("Aún no hay resultados registrados.", "", "✅");
    return `<ul class="feed">${done.map(c => `<li><span class="feed__ico">✅</span><div><strong>${u.esc(c.titulo)}</strong><div class="feed__meta">${c.responsable ? u.esc(c.responsable) : ""}</div></div></li>`).join("")}</ul>`;
  }
  function inicioBind() {
    U.components.kanban.mount(document.getElementById("refKanban"), "referente");
    const apoyo = document.getElementById("rtApoyo");
    if (apoyo) apoyo.onclick = () => U.solicitudes.crearApoyo({}, () => U.router.render());
  }

  /* ---------- Funciones del rol ---------- */
  function funciones() {
    const u = ui();
    const GRUPOS = [
      { t: "Implementación basada en evidencia", ic: "🔬", c: "#12b5a5", items: [
        "Adaptar e implementar recomendaciones basadas en evidencia en cada unidad clínica.",
        "Trabajar las áreas de lesiones por presión, accesos vasculares y dolor.",
        "Desarrollar y actualizar protocolos, flujos clínicos y herramientas operativas."
      ]},
      { t: "Capacitación y acompañamiento", ic: "🎓", c: "#7a5cd0", items: [
        "Coordinar capacitaciones clínicas.",
        "Acompañar a las unidades clínicas.",
        "Colaborar en capacitación continua y feedback clínico."
      ]},
      { t: "Supervisión, monitoreo y auditoría", ic: "📊", c: "#1e9fe0", items: [
        "Supervisar escalas, criterios clínicos y prácticas estandarizadas.",
        "Monitorear indicadores.",
        "Realizar auditorías clínicas.",
        "Entregar retroalimentación a equipos asistenciales."
      ]},
      { t: "Análisis de brechas y mejora", ic: "🎯", c: "#e0912f", items: [
        "Analizar brechas y oportunidades de mejora.",
        "Proponer intervenciones técnicas focalizadas.",
        "Apoyar los planes de mejora."
      ]},
      { t: "Validación y reporte al Coordinador", ic: "🤝", c: "#e0526f", items: [
        "Validar técnicamente protocolos y procedimientos con el Coordinador UBPC.",
        "Reportar resultados, barreras y brechas al Coordinador UBPC."
      ]}
    ];
    let n = 0;
    const cards = GRUPOS.map(g => {
      const lis = g.items.map(it => { n++; return `<li><span class="func-num">${n}</span><span>${u.esc(it)}</span></li>`; }).join("");
      return `<div class="card func-cat" style="--fc:${g.c}">
        <div class="func-cat__h"><span class="func-cat__ic">${g.ic}</span><h3>${u.esc(g.t)}</h3><span class="func-cat__count">${g.items.length}</span></div>
        <ul class="func-list">${lis}</ul>
      </div>`;
    }).join("");
    const T = U.guiaToolkit;
    const toolkit = T ? `
      <div class="section tk-box" style="margin-top:1.6rem">
        <div class="tk-box__eyebrow">Caja de herramientas del Referente Técnico</div>
        <h2 class="tk-box__title">Cómo implementar, movilizar y sostener el Programa RNAO / BPSO</h2>
        <p class="tk-box__sub">Ruta práctica del programa RNAO traducida al contexto operativo de un hospital público. Toca cada guía para ver un ejemplo.</p>
        ${T.tkGrid(T.RNAO_TOOLKIT, "rnao")}
      </div>
      <div class="section tk-box tk-box--nt">
        <div class="tk-box__eyebrow">Caja de herramientas del Referente Técnico</div>
        <h2 class="tk-box__title">Cómo implementar y monitorear la Norma Técnica 234</h2>
        <p class="tk-box__sub">Ruta práctica para la prevención de lesiones por presión y el cumplimiento de la NT 234. Toca cada guía para ver un ejemplo.</p>
        ${T.tkGrid(T.NT_TOOLKIT, "nt")}
      </div>` : "";
    return `<div class="page-head"><h1>Funciones del rol</h1><p>Funciones del Referente Técnico de Buenas Prácticas Clínicas, agrupadas por ámbito de trabajo. Más abajo, la caja de herramientas para llevarlas a la práctica.</p></div>
      <div class="func-grid">${cards}</div>
      ${toolkit}`;
  }
  function funcionesBind() {
    const T = U.guiaToolkit; if (!T) return;
    document.querySelectorAll("[data-tkset]").forEach(b => b.onclick = () => {
      const data = b.dataset.tkset === "nt" ? T.NT_TOOLKIT : T.RNAO_TOOLKIT;
      T.openToolkit(data[+b.dataset.tki]);
    });
  }

  /* ---------- Configuración (perfil propio) ---------- */
  function config() {
    const u = ui(); const me = U.auth.current();
    return `<div class="page-head"><h1>Configuración</h1><p>Edita tu nombre, cargo y fotografía. Los cambios se reflejan en la pantalla de acceso y el encabezado.</p></div>
      <div class="card" style="max-width:560px">
        <div class="flex" style="margin-bottom:1rem">
          <div class="avatar avatar--lg" style="background:var(--c-turquesa)">${me.foto ? `<img src="${u.esc(me.foto)}">` : u.initials(me.nombre)}</div>
          <div><h2 style="margin:0">${u.esc(me.nombre)}</h2><div class="muted">${u.esc(me.cargo)}</div></div>
        </div>
        <button class="btn btn--primary" id="editMe">✏️ Editar mi perfil</button>
      </div>
      <div class="card" style="max-width:560px;margin-top:1rem">
        <h3 class="card__title">Respaldo de datos</h3>
        <p class="card__hint">Exporta o restaura todos los registros del portal (formato JSON). Úsalo para respaldar y para mover tus datos entre dispositivos.</p>
        <div class="btn-row">
          <button class="btn btn--primary" id="expJson">⬇️ Exportar respaldo</button>
          <button class="btn btn--ghost" id="impJson">⬆️ Importar respaldo</button>
        </div>
        <input type="file" id="impFile" accept="application/json" class="hidden">
      </div>`;
  }
  function configBind() {
    const u = ui(); const me = U.auth.current();
    document.getElementById("editMe").onclick = () => U.views.editPerfil(me.id, () => U.router.render());
    document.getElementById("expJson").onclick = () =>
      u.download("respaldo-ubpc-" + u.hoyISO() + ".json", S().exportJSON(), "application/json");
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
  }

  function solicitudesRecibidas() {
    return `<div class="page-head"><h1>Solicitudes recibidas</h1>
      <p>Solicitudes técnicas enviadas por Coordinación. Ábrelas para gestionar y registrar la respuesta técnica y el medio de verificación.</p></div>
      <div id="refsol-body"></div>`;
  }
  function solicitudesRecibidasBind() { U.solicitudes.refPanel(document.getElementById("refsol-body")); }

  function placeholder(titulo, desc) {
    return () => `<div class="page-head"><h1>${titulo}</h1><p>${desc}</p></div>
      ${ui().empty("Submódulo en implementación por etapas.", "La estructura de datos y trazabilidad ya está preparada para este submódulo.", "🛠️")}`;
  }

  // Módulo EVI compartido con el Coordinador (mismas ediciones y boletines).
  function eviRef() {
    return `<div class="page-head"><h1>EVI · Evidencia que transforma</h1>
      <p>Ediciones de evidencia científica y boletines de EVI Clínico para transferir la evidencia a la práctica. Compartido con la Coordinación.</p></div>
      <div id="evi-ref-body"></div>`;
  }
  function eviRefBind() {
    const box = document.getElementById("evi-ref-body");
    if (box && U.eviModule && U.eviModule.mount) U.eviModule.mount(box);
    else if (box) box.innerHTML = ui().empty("Módulo EVI no disponible.", "Recarga la página para cargar el módulo.", "🦉");
  }

  U.ref = {
    default: "inicio",
    nav: NAV,
    views: {
      inicio,
      gestion: placeholder("Mi gestión", "Registros y avances de tu trabajo técnico."),
      seguimiento: placeholder("Mi seguimiento", "Pendientes, resultados y estado de tus intervenciones."),
      funciones,
      biblioteca: placeholder("Bitácora de Biblioteca Digital", "Recursos incorporados, actualizados, reemplazados o retirados."),
      capacitacion: placeholder("Capacitación clínica por turno", "Registro de capacitaciones por turno y estamento."),
      evi: eviRef,
      apoyo: placeholder("Solicitud de apoyo técnico", "Solicita apoyo o intervención del Coordinador UBPC."),
      reunion: placeholder("Reunión de seguimiento", "Programación y registro de reuniones de seguimiento."),
      monitoreo: placeholder("Monitoreo e implementación", "Auditorías, indicadores, brechas e intervenciones."),
      solicitudesRecibidas,
      config
    },
    binders: { inicio: inicioBind, config: configBind, solicitudesRecibidas: solicitudesRecibidasBind, funciones: funcionesBind, evi: eviRefBind }
  };
})();
