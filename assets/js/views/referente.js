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
      { key: "evidencia", label: "Evidencia y recomendación", ico: "🔬" },
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

    return `
    <section class="home-hero rt-hero">
      <div class="hh-welcome">
        <div class="hh-eb">Espacio de trabajo · Referente Técnico</div>
        <h1>Hola, ${firstName}</h1>
        <p>${u.esc(me.cargo)} — tus solicitudes, avances y evidencia clínica en un solo lugar.</p>
        <div class="hh-frase">"Adaptar la evidencia a cada unidad: lesiones por presión, accesos vasculares y dolor."</div>
      </div>
      <div class="card rt-prio ${prioritarias.length ? "has-prio" : ""}">
        <div class="rt-prio__head"><span class="rt-live"></span><span class="hh-lbl">Solicitudes prioritarias</span>
          <span class="rt-count">${prioritarias.length}</span></div>
        <div class="rt-prio__list">${prioHTML}</div>
        <a class="rt-all" href="#/ref/solicitudesRecibidas">Ver todas las solicitudes →</a>
      </div>
      <div class="hh-side">
        <div class="card rt-ind">
          <span class="hh-lbl">Indicadores personales</span>
          <div class="rt-row"><i style="background:#e0526f"></i><span class="nm">Solicitudes en gestión</span><b>${sols.length}</b></div>
          <div class="rt-row"><i style="background:#e0912f"></i><span class="nm">Pendientes</span><b>${pend.length}</b></div>
          <div class="rt-row"><i style="background:#12b5a5"></i><span class="nm">Reuniones programadas</span><b>${reuniones.length}</b></div>
          <div class="rt-row"><i style="background:#7a5cd0"></i><span class="nm">Notificaciones sin leer</span><b>${noLeidas}</b></div>
        </div>
        <div class="card rt-reun">
          <span class="hh-lbl">Próximas reuniones</span>
          ${reuniones.length ? `<ul class="feed" style="margin-top:.2rem">${reuniones.slice(0, 2).map(r => `<li><span class="feed__ico">📅</span><div><strong>${u.esc(r.tema || "Reunión")}</strong><div class="feed__meta">${u.fechaCL(r.fecha)}</div></div></li>`).join("")}</ul>`
            : u.empty("Sin reuniones programadas.", "", "📅")}
        </div>
      </div>
    </section>

    <div class="section">
      <div class="section__head"><div><h2 class="section__title">Mi tablero Kanban</h2>
        <p class="section__hint">Avances, pendientes y resultados.</p></div></div>
      <div id="refKanban"></div>
    </div>

    <div class="grid grid--2">
      <div class="section">
        <div class="section__head"><h2 class="section__title">Resultados recientes</h2></div>
        <div class="card">${resultadosRecientes()}</div>
      </div>
      <div class="section">
        <div class="section__head"><h2 class="section__title">Evidencia y recomendación</h2></div>
        <div class="card rt-evi">
          <div><p class="narrativo" style="margin-top:0">Busca, analiza y registra evidencia científica para apoyar decisiones clínicas y actualizar buenas prácticas.</p>
          <a class="btn btn--primary btn--sm" href="#/ref/evidencia">Abrir evidencia y recomendación</a></div>
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
  }

  /* ---------- Funciones del rol ---------- */
  function funciones() {
    const funcs = [
      "Adaptar e implementar recomendaciones basadas en evidencia en cada unidad clínica.",
      "Trabajar las áreas de lesiones por presión, accesos vasculares y dolor.",
      "Desarrollar y actualizar protocolos, flujos clínicos y herramientas operativas.",
      "Coordinar capacitaciones clínicas.",
      "Supervisar escalas, criterios clínicos y prácticas estandarizadas.",
      "Monitorear indicadores.",
      "Realizar auditorías clínicas.",
      "Entregar retroalimentación a equipos asistenciales.",
      "Analizar brechas y oportunidades de mejora.",
      "Proponer intervenciones técnicas focalizadas.",
      "Acompañar a las unidades clínicas.",
      "Validar técnicamente protocolos y procedimientos con el Coordinador UBPC.",
      "Apoyar los planes de mejora.",
      "Colaborar en capacitación continua y feedback clínico.",
      "Reportar resultados, barreras y brechas al Coordinador UBPC."
    ];
    return `<div class="page-head"><h1>Funciones del rol</h1><p>Guía de las funciones del Referente Técnico de Buenas Prácticas Clínicas.</p></div>
      <div class="grid grid--3">${funcs.map((f, i) => `<div class="card" style="border-top:4px solid var(--c-turquesa)">
        <div class="flex" style="align-items:flex-start"><div class="avatar" style="width:30px;height:30px;font-size:13px;background:var(--c-turquesa)">${i + 1}</div>
        <p class="narrativo mb0">${ui().esc(f)}</p></div></div>`).join("")}</div>`;
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
      </div>`;
  }
  function configBind() {
    const me = U.auth.current();
    document.getElementById("editMe").onclick = () => U.views.editPerfil(me.id, () => U.router.render());
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
      evidencia: placeholder("Evidencia y recomendación", "Búsqueda y análisis de evidencia científica para la práctica."),
      apoyo: placeholder("Solicitud de apoyo técnico", "Solicita apoyo o intervención del Coordinador UBPC."),
      reunion: placeholder("Reunión de seguimiento", "Programación y registro de reuniones de seguimiento."),
      monitoreo: placeholder("Monitoreo e implementación", "Auditorías, indicadores, brechas e intervenciones."),
      solicitudesRecibidas,
      config
    },
    binders: { inicio: inicioBind, config: configBind, solicitudesRecibidas: solicitudesRecibidasBind }
  };
})();
