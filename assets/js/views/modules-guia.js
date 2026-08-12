/* ============================================================
   MÓDULO — GUÍA PARA EL COORDINADOR
   Orientaciones prácticas + "Evidencia para la acción" (EVI, movida del
   Home) + priorización de acciones según brechas detectadas en el portal.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CS = () => U.coordStats;

  const ORIENTACIONES = [
    { ic: "🏛️", c: "#7a5cd0", t: "Posicionar la UBPC en el hospital público", p: [
      "Vincula cada acción de la UBPC con los objetivos de calidad y seguridad del paciente de la dirección.",
      "Haz visible el aporte con datos: usa el Dashboard RNAO, la NT 234 y los Indicadores UBPC en comités.",
      "Formaliza la unidad con actas, resoluciones y respaldos (Módulo de Gestión y Respaldo)." ],
      ej: "En el comité de calidad, presenta un panel con el cumplimiento RNAO y NT 234 del trimestre y propón 2 metas priorizadas por brecha.",
      link: { label: "Ir a Indicadores UBPC", route: "#/coord/indicadores" } },
    { ic: "🧭", c: "#1e9fe0", t: "Fortalecer el liderazgo del coordinador", p: [
      "Lidera con evidencia y ejemplo: prioriza pocas metas claras y hazles seguimiento visible.",
      "Delega con responsables y fechas (usa el tablero Kanban y las solicitudes técnicas).",
      "Comunica avances y reconoce logros; cierra los ciclos de mejora que inicias." ],
      ej: "Cada lunes revisa el tablero de seguimiento: mueve 3 tareas y define responsable y fecha para las nuevas prioridades de la semana.",
      link: { label: "Ir a la Agenda", route: "#/coord/agenda" } },
    { ic: "🤝", c: "#12b5a5", t: "Trabajar con referentes, líderes de guía y Champions", p: [
      "Define roles: el Referente Técnico ejecuta y responde solicitudes; los Champions dan sostén en cada unidad.",
      "Reúnete periódicamente (Reuniones de seguimiento) y deja acuerdos con plazos.",
      "Mantén la Red Champion activa por guía y unidad (Módulo RNAO)." ],
      ej: "Agenda una reunión mensual de 30 min con los Champions de LPP; registra 2 acuerdos con responsable y plazo en Gestión y Respaldo.",
      link: { label: "Ir a Programa RNAO", route: "#/coord/m3" } },
    { ic: "💪", c: "#e0526f", t: "Motivación, adherencia y participación de los equipos", p: [
      "Muestra el impacto clínico de las buenas prácticas, no solo el cumplimiento administrativo.",
      "Reduce la carga: integra los registros al flujo de trabajo del turno.",
      "Retroalimenta con datos por unidad y celebra avances (Reconocimientos)." ],
      ej: "Cuando una unidad mejora su cumplimiento, reconócela como \"Buena práctica del mes\" y comunícalo en el cambio de turno.",
      link: { label: "Ir a Reconocimientos", route: "#/coord/m4?tab=reconocimientos" } },
    { ic: "🎓", c: "#37a04a", t: "Aula virtual para refuerzos educativos (no certificados)", p: [
      "Usa cápsulas breves de refuerzo por turno para reforzar escalas, criterios y prácticas.",
      "Vincula cada refuerzo a una brecha detectada; registra la capacitación por turno.",
      "Estos refuerzos no reemplazan la capacitación certificada: son apoyo continuo." ],
      ej: "Ante baja adherencia a la escala de Braden, difunde una cápsula de 5 min por turno y registra la actividad en Fortalecimiento.",
      link: { label: "Ir a Fortalecimiento", route: "#/coord/m4" } },
    { ic: "🔬", c: "#0f8f83", t: "Avanzar desde la evidencia hacia la acción", p: [
      "Convierte cada hallazgo de evidencia en una recomendación aplicable y un responsable.",
      "Usa 'Evidencia para la acción' (arriba) y EVI para traducir evidencia en práctica.",
      "Cierra el ciclo: evidencia → protocolo/flujo → capacitación → auditoría → mejora." ],
      ej: "De una revisión sobre reposicionamiento cada 2 h, genera un flujo, capacita al turno y programa una auditoría a 30 días.",
      link: { label: "Ir a Gestión Documental", route: "#/coord/m2" } },
    { ic: "♾️", c: "#1554b8", t: "Sostener las buenas prácticas en el tiempo", p: [
      "Estandariza en protocolos y flujos vigentes (Gestión Documental) y mantenlos actualizados.",
      "Monitorea con indicadores y auditorías periódicas; actúa ante cada semáforo amarillo/rojo.",
      "Institucionaliza: acuerdos, responsables y periodicidad definida." ],
      ej: "Define una revisión semestral de cada protocolo y una auditoría trimestral; ante un semáforo rojo, abre un plan de mejora.",
      link: { label: "Ir a Norma Técnica 234", route: "#/coord/m6" } },
    { ic: "🎯", c: "#e0912f", t: "Priorizar según las brechas del portal", p: [
      "El portal detecta automáticamente indicadores bajo meta, acciones vencidas y planes pendientes.",
      "Concentra el esfuerzo en la guía y la unidad con mayor brecha (ver panel de prioridades arriba).",
      "Traduce cada brecha en una acción de mejora con responsable y plazo." ],
      ej: "Toma la unidad con menor cumplimiento del mapa de alertas y crea un plan de mejora con 3 acciones y plazo a 45 días.",
      link: { label: "Ver mapa de alertas", route: "#/coord/m6?tab=alertas" } },
    { ic: "🌐", c: "#7d4bcf", t: "Trabajar en red con otras unidades e instituciones", p: [
      "Comparte y recibe buenas prácticas con otras unidades y hospitales de la red.",
      "Registra asesorías, visitas técnicas y cursos en el Módulo de Red de Colaboración.",
      "Alinea cada colaboración con un pilar estratégico de la Unidad." ],
      ej: "Coordina una visita técnica con otra UCI para conocer su bundle de prevención de LPP y registra el aprendizaje.",
      link: { label: "Ir a Red de Colaboración", route: "#/coord/m5?tab=colaboraciones" } },
    { ic: "🗂️", c: "#5f7d76", t: "Respaldar y dar trazabilidad a todo", p: [
      "Deja evidencia de cada decisión: actas, acuerdos, respaldos y códigos internos permanentes.",
      "Usa los códigos automáticos (UBPC-DOC, UBPC-REU, etc.) como referencia oficial.",
      "Exporta respaldos periódicos de los datos del portal (Configuración)." ],
      ej: "Antes de un comité, exporta un respaldo del portal y adjunta los códigos de los documentos y reuniones que citarás.",
      link: { label: "Ir a Gestión y Respaldo", route: "#/coord/m5" } }
  ];

  // Caja de herramientas para implementar el Programa RNAO / BPSO
  const RNAO_TOOLKIT = [
    { ic: "🎯", t: "Seleccionar y priorizar la guía BPSO", c: "#12b5a5",
      d: "Elige guías de buenas prácticas con impacto clínico y factibilidad en tu realidad; parte con pocas y prioriza según las brechas.",
      b: ["Vincula la guía a un problema real (LPP, accesos, dolor).", "Evalúa factibilidad: recursos, equipo y datos disponibles.", "Formaliza el compromiso institucional."],
      ej: "Ante alta incidencia de LPP en UTI, prioriza la guía de prevención de LPP y formaliza el compromiso con la jefatura de la unidad.",
      src: "RNAO · BPSO Designation" },
    { ic: "📊", t: "Establecer la línea base", c: "#1e9fe0",
      d: "Mide el cumplimiento inicial antes de intervenir; es tu punto de comparación para demostrar mejora.",
      b: ["Define indicadores y método de medición.", "Audita una muestra representativa.", "Registra la línea base en el portal."],
      ej: "Antes de intervenir, audita 20 fichas de UTI y registra que solo el 55% aplicó la escala de riesgo en las primeras 6 horas.",
      src: "RNAO · evaluación diagnóstica" },
    { ic: "🤝", t: "Conformar la Red Champion", c: "#7a5cd0",
      d: "Los Champions acercan la guía al trabajo diario de cada unidad; elige referentes con liderazgo clínico.",
      b: ["Un Champion por guía y por unidad.", "Roles claros y complementarios.", "Reconocimiento y red de intercambio."],
      ej: "Nombra un Champion de LPP por unidad y agenda una reunión mensual de 30 min para revisar avances y barreras.",
      src: "RNAO · Best Practice Champions" },
    { ic: "🗺️", t: "Plan de implementación", c: "#37a04a",
      d: "Traduce la guía en acciones con responsables y plazos, abordando las barreras reales del contexto.",
      b: ["Identifica barreras y facilitadores.", "Define actividades, responsables y fechas.", "Integra la práctica al flujo del turno."],
      ej: "Detecta que la barrera es el registro; crea un flujo simple en la ficha, capacita al turno y fija una auditoría a 30 días.",
      src: "RNAO · Knowledge-to-Action" },
    { ic: "🎓", t: "Capacitación y difusión", c: "#0f8f83",
      d: "Refuerza la práctica con cápsulas breves por turno, no solo con jornadas puntuales.",
      b: ["Contenidos aplicados a la conducta clínica.", "Registra la cobertura por estamento.", "Combina difusión visual y práctica."],
      ej: "Ante baja adherencia a la escala de Braden, difunde una cápsula de 5 min por turno y registra la cobertura por estamento.",
      src: "RNAO · transferencia del conocimiento" },
    { ic: "📈", t: "Seguimiento con indicadores", c: "#1554b8",
      d: "Monitorea el cumplimiento con auditorías periódicas y actúa ante cada semáforo amarillo o rojo.",
      b: ["Usa metodología comparable en el tiempo.", "Retroalimenta rápido a la unidad.", "Documenta avances y estancamientos."],
      ej: "Cada mes mide el cumplimiento por unidad y, ante un semáforo rojo, retroalimenta a la unidad esa misma semana.",
      src: "RNAO / NQuIRE · indicadores" },
    { ic: "🔧", t: "Acciones de mejora ante brechas", c: "#e0912f",
      d: "Cada brecha detectada se traduce en una acción concreta con responsable y plazo, no en un informe.",
      b: ["Prioriza la unidad o indicador con mayor brecha.", "Acuerda 2-3 acciones alcanzables.", "Cierra el ciclo y verifica el resultado."],
      ej: "Toma la unidad con menor cumplimiento y acuerda 3 acciones con responsable y plazo a 45 días, y verifica el cierre.",
      src: "RNAO · mejora continua" },
    { ic: "♾️", t: "Sostenibilidad e institucionalización", c: "#5f7d76",
      d: "Asegura que la práctica se mantenga: protocolos vigentes, auditorías y respaldo institucional.",
      b: ["Estandariza en protocolos y flujos.", "Define la periodicidad de auditoría.", "Institucionaliza con acuerdos y responsables."],
      ej: "Define una revisión semestral del protocolo y una auditoría trimestral, y deja un acuerdo firmado con la jefatura.",
      src: "RNAO · sustainability" }
  ];

  // Caja de herramientas para implementar y monitorear la Norma Técnica 234
  const NT_TOOLKIT = [
    { ic: "📋", t: "Conocer la norma y sus indicadores", c: "#12b5a5",
      d: "Familiarízate con los indicadores de la NT 234 y sus metas; son la base de la medición y del informe.",
      b: ["Identifica los indicadores obligatorios.", "Define la meta institucional (ej. 90%).", "Ubica dónde se registra cada dato."],
      ej: "Arma una ficha con los indicadores de la NT 234 y su meta, y compártela con las jefaturas de cada unidad.",
      src: "MINSAL · Norma Técnica 234" },
    { ic: "📏", t: "Valoración del riesgo (escala)", c: "#1e9fe0",
      d: "Aplica la escala de valoración de riesgo de LPP de forma temprana y sistemática en cada paciente.",
      b: ["Escala aplicada en las primeras horas.", "Reevaluación según condición clínica.", "Registro claro en la ficha."],
      ej: "Verifica que en UTI la escala de Braden se aplique antes de 6 horas del ingreso y se reevalúe cada 24 horas.",
      src: "NT 234 · valoración de riesgo" },
    { ic: "🛡️", t: "Plan preventivo según riesgo", c: "#7a5cd0",
      d: "Cada nivel de riesgo debe traducirse en medidas preventivas concretas y registradas.",
      b: ["Medidas acordes al nivel de riesgo.", "Superficies de apoyo cuando corresponde.", "Educación al paciente y su familia."],
      ej: "Para un paciente de alto riesgo, indica colchón de redistribución de presión y cambios de posición cada 2 horas.",
      src: "NT 234 · plan preventivo" },
    { ic: "🔄", t: "Cambios de posición y cuidado de la piel", c: "#37a04a",
      d: "El reposicionamiento y el cuidado de la piel son el corazón de la prevención; deben ser sistemáticos.",
      b: ["Frecuencia según riesgo (ej. cada 2 h).", "Protección de prominencias óseas.", "Higiene y manejo de la humedad."],
      ej: "Instala un reloj de cambios de posición visible en la unidad y registra cada cambio en la ficha del paciente.",
      src: "NT 234 · reposicionamiento" },
    { ic: "🗂️", t: "Registro y trazabilidad", c: "#0f8f83",
      d: "Lo que no se registra, no se puede auditar; asegura un registro claro y con responsable.",
      b: ["Registro por responsable y turno.", "Datos completos y oportunos.", "Trazabilidad para la auditoría."],
      ej: "Define un responsable por turno del registro de prevención de LPP y revisa su completitud cada semana.",
      src: "NT 234 · registro clínico" },
    { ic: "🔍", t: "Auditoría mensual del cumplimiento", c: "#1554b8",
      d: "Mide el cumplimiento por unidad cada mes con una metodología comparable.",
      b: ["Muestra representativa por unidad.", "Mismos criterios cada mes.", "Resultados al módulo NT 234."],
      ej: "Cada mes audita 15 fichas por unidad y carga el cumplimiento por indicador en Seguimiento NT 234.",
      src: "NT 234 · auditoría" },
    { ic: "🔧", t: "Planes de mejora por unidad", c: "#e0912f",
      d: "Ante brechas, cada unidad debe tener un plan de mejora con acciones, responsable y plazo.",
      b: ["Prioriza la unidad con mayor brecha.", "Acciones concretas y medibles.", "Control de plazos y cierre."],
      ej: "Para la unidad con 65% de cumplimiento, crea un plan con 3 acciones y plazo a 45 días en el módulo NT 234.",
      src: "NT 234 · mejora continua" },
    { ic: "🖨️", t: "Reporte y firma institucional", c: "#5f7d76",
      d: "Consolida el cumplimiento en el informe mensual, con observaciones y firmas institucionales.",
      b: ["Informe centrado y comparable.", "Observaciones del periodo.", "Firma del Coordinador/a y la Subdirección."],
      ej: "Al cierre del mes genera el Informe de Cumplimiento NT 234, agrega observaciones y fírmalo para el comité.",
      src: "NT 234 · informe institucional" }
  ];

  function tkGrid(data, set) {
    const u = ui();
    return `<div class="tk-grid">${data.map((g, i) => `<button class="tk-card" data-tkset="${set}" data-tki="${i}" style="--tc:${g.c}">
      <div class="tk-card__top"><span class="tk-card__ic">${g.ic}</span>
        <div class="tk-card__head"><span class="tk-card__num">GUÍA ${String(i + 1).padStart(2, "0")}</span>
          <h4 class="tk-card__t">${u.esc(g.t)}</h4></div></div>
      <p class="tk-card__d">${u.esc(g.d)}</p>
      <ul class="tk-card__b">${g.b.map(x => `<li>${u.esc(x)}</li>`).join("")}</ul>
      <div class="tk-card__foot"><span class="tk-card__src">${u.esc(g.src)}</span><span class="tk-card__go">Ver ejemplo →</span></div>
    </button>`).join("")}</div>`;
  }
  function openToolkit(g) {
    const u = ui();
    u.modal({
      title: `${g.ic}  ${g.t}`,
      body: `<div class="orient-detail" style="--tc:${g.c}">
          <p style="margin:.1rem 0 .7rem;color:var(--text-2);line-height:1.55">${u.esc(g.d)}</p>
          <ul class="orient-list">${g.b.map(x => `<li>${u.esc(x)}</li>`).join("")}</ul>
          <div class="orient-ej"><span class="orient-ej__lbl">💡 Ejemplo práctico</span><p>${u.esc(g.ej)}</p></div>
          <div class="tk-modal__src">Fuente: ${u.esc(g.src)}</div>
        </div>`,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>`
    });
  }

  function guia() {
    return `<div class="page-head"><h1>Guía para el Coordinador/a</h1>
      <p>Orientaciones prácticas para conducir la UBPC, con la evidencia y las brechas del portal como apoyo.</p></div>
      <div class="section">
        <div class="section__head"><h2 class="section__title">Prioriza según las brechas detectadas</h2>
          <p class="section__hint">Generado automáticamente con los datos del portal.</p></div>
        <div class="card" id="guia-brechas"></div>
      </div>
      <div class="section">
        <div class="section__head"><div><h2 class="section__title">Evidencia para la acción</h2>
          <p class="section__hint">Evidencia que orienta decisiones y buenas prácticas.</p></div>
          <button class="btn btn--primary btn--sm" id="guia-addevi">+ Nueva evidencia</button></div>
        <div class="card" id="guia-evi"></div>
      </div>
      <div class="section">
        <div class="section__head"><div><h2 class="section__title">Orientaciones prácticas</h2>
          <p class="section__hint">Toca cada tarjeta para ver las claves, un ejemplo práctico y el módulo donde aplicarla.</p></div></div>
        <div class="orient-grid">${ORIENTACIONES.map((o, i) => `<button class="orient-card" data-orient="${i}" style="--tc:${o.c}">
          <span class="orient-card__ic">${o.ic}</span>
          <span class="orient-card__body">
            <span class="orient-card__title">${ui().esc(o.t)}</span>
            <span class="orient-card__hint">${ui().esc(o.p[0])}</span>
          </span>
          <span class="orient-card__go">Ver orientación →</span>
        </button>`).join("")}</div>
      </div>
      <div class="section tk-box">
        <div class="tk-box__eyebrow">Caja de herramientas del Coordinador</div>
        <h2 class="tk-box__title">Cómo implementar, movilizar y sostener el Programa RNAO / BPSO</h2>
        <p class="tk-box__sub">Ruta práctica del programa RNAO traducida al contexto operativo de un hospital público. Toca cada guía para ver un ejemplo.</p>
        ${tkGrid(RNAO_TOOLKIT, "rnao")}
      </div>
      <div class="section tk-box tk-box--nt">
        <div class="tk-box__eyebrow">Caja de herramientas del Coordinador</div>
        <h2 class="tk-box__title">Cómo implementar y monitorear la Norma Técnica 234</h2>
        <p class="tk-box__sub">Ruta práctica para la prevención de lesiones por presión y el cumplimiento de la NT 234. Toca cada guía para ver un ejemplo.</p>
        ${tkGrid(NT_TOOLKIT, "nt")}
      </div>
      <div class="section">
        <div class="section__head"><div><h2 class="section__title">Recursos y enlaces de la Unidad</h2>
          <p class="section__hint">Guarda aquí links importantes: guías BPSO, protocolos, formularios, RNAO, MINSAL, etc.</p></div>
          <button class="btn btn--primary btn--sm" id="guia-addrec">+ Agregar enlace</button></div>
        <div id="guia-recursos"></div>
      </div>`;
  }

  /* ---------- Orientación: detalle en modal ---------- */
  function openOrientacion(o) {
    const u = ui();
    u.modal({
      title: `${o.ic}  ${o.t}`,
      body: `<div class="orient-detail" style="--tc:${o.c}">
          <ul class="orient-list">${o.p.map(x => `<li>${u.esc(x)}</li>`).join("")}</ul>
          <div class="orient-ej"><span class="orient-ej__lbl">💡 Ejemplo práctico</span><p>${u.esc(o.ej)}</p></div>
        </div>`,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>
               ${o.link ? `<a class="btn btn--primary" href="${o.link.route}" data-close>${u.esc(o.link.label)} →</a>` : ""}`
    });
  }

  /* ---------- Recursos y enlaces editables ---------- */
  function recursosHTML() {
    const u = ui();
    const list = S().all("recursosGuia").sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));
    if (!list.length) return u.empty("Aún no hay enlaces guardados.", "Agrega guías, protocolos o formularios de uso frecuente.", "🔗");
    return `<div class="rec-grid">${list.map(r => {
      const url = /^https?:\/\//i.test(r.url || "") ? r.url : "https://" + (r.url || "");
      let host = ""; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch (e) { host = r.url || ""; }
      return `<div class="rec-card">
        <a class="rec-card__main" href="${u.esc(url)}" target="_blank" rel="noopener">
          <span class="rec-card__ic">${u.esc(r.icono || "🔗")}</span>
          <span class="rec-card__body"><span class="rec-card__title">${u.esc(r.titulo)}</span>
            <span class="rec-card__host">${u.esc(host)} ↗</span></span>
        </a>
        <span class="rec-card__act">
          <button class="btn-icon" data-recedit="${r.id}" title="Editar">✏️</button>
          <button class="btn-icon" data-recdel="${r.id}" title="Eliminar">🗑️</button>
        </span>
      </div>`;
    }).join("")}</div>`;
  }
  function recursoForm(rec) {
    const u = ui();
    u.modal({ title: rec ? "Editar enlace" : "Nuevo enlace", body: u.formHTML([
      { name: "titulo", label: "Título del recurso", required: true, full: true, value: rec ? rec.titulo : "" },
      { name: "url", label: "Enlace (URL)", required: true, full: true, value: rec ? rec.url : "", placeholder: "https://..." },
      { name: "icono", label: "Ícono (emoji)", value: rec ? rec.icono : "🔗", hint: "Opcional. Ej.: 📘 📄 🔬 🏥" }
    ], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        if (!d.titulo || !d.url) { u.toast("Título y enlace son obligatorios", "danger"); return; }
        if (!d.icono) d.icono = "🔗";
        if (rec) S().update("recursosGuia", rec.id, d); else S().insert("recursosGuia", d);
        u.closeModal(); guiaBind();
      }; } });
  }

  /* ---------- Evidencia para la acción (EVI, movida del Home) ---------- */
  function eviHTML() {
    const u = ui();
    const list = S().all("evidenciaSemana").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const e = list[0];
    const cuerpo = !e ? u.empty("Aún no hay evidencia registrada.", "Agrega la primera evidencia para comenzar.", "🔬")
      : `<div class="evi">
          <div>
            ${e.codigo ? `<span class="mono" style="font-size:12px">${u.esc(e.codigo)}</span>` : ""}
            <h3 style="margin:.1rem 0">${u.esc(e.titulo)}</h3>
            <div class="kpi__sub">${u.esc(e.fuente || "")} · ${u.fechaCL(e.fecha)}</div>
            <p class="narrativo" style="margin:.5rem 0 .3rem">${u.esc(e.resumen || "")}</p>
            <p style="margin:.2rem 0"><strong>Recomendación para la práctica:</strong> ${u.esc(e.recomendacion || "—")}</p>
            ${e.enlace ? `<a href="${u.esc(e.enlace)}" target="_blank" rel="noopener">Ver fuente ↗</a>` : ""}
          </div>
          <div class="evi__mascot"><img class="evi-img" src="assets/img/evi-full.png" alt="EVI, mascota de la UBPC"></div>
        </div>`;
    const otras = list.slice(1, 5);
    return cuerpo +
      (otras.length ? `<div style="margin-top:.6rem"><span class="muted" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Más evidencia</span>
        <ul class="feed">${otras.map(o => `<li><span class="feed__ico">🔬</span><div><strong>${u.esc(o.titulo)}</strong><div class="feed__meta">${o.codigo ? u.esc(o.codigo) + " · " : ""}${u.esc(o.fuente || "")} · ${u.fechaCL(o.fecha)}</div></div></li>`).join("")}</ul></div>` : "") +
      `<p class="evi__quote">"La evidencia cobra valor cuando transforma la práctica y mejora el cuidado."</p>`;
  }
  function eviForm() {
    const u = ui();
    u.modal({ title: "Nueva evidencia para la acción", body: u.formHTML([
      { name: "titulo", label: "Título", required: true, full: true },
      { name: "fuente", label: "Fuente" }, { name: "fecha", label: "Fecha", type: "date", value: u.hoyISO() },
      { name: "resumen", label: "Resumen", type: "textarea", full: true },
      { name: "recomendacion", label: "Recomendación para la práctica", type: "textarea", full: true },
      { name: "enlace", label: "Enlace", full: true }
    ], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m); if (!d.titulo) { u.toast("El título es obligatorio", "danger"); return; }
        S().insert("evidenciaSemana", d, { withCode: true }); u.closeModal(); guiaBind();
      }; } });
  }

  /* ---------- Brechas automáticas ---------- */
  function brechas() {
    const u = ui(); const items = [];
    // RNAO: indicadores bajo meta
    S().all("evaluacionesRNAO").forEach(e => {
      CS().indicadoresBajoMeta(e).forEach(i => {
        const meta = Number(e.meta) || 90; const critico = i.pct < meta - 15;
        items.push({ p: critico ? 0 : 1, tag: "RNAO", titulo: i.nombre, detalle: `${e.guia || ""} · ${e.unidad || ""} — ${i.pct}% (meta ${meta}%)`, ref: "#/coord/m3?tab=evaluaciones" });
      });
    });
    // Acciones de mejora vencidas/pendientes
    S().all("accionesRNAO").filter(a => a.estado !== "Completado").forEach(a => {
      const venc = a.fechaComprometida && new Date(a.fechaComprometida) < new Date();
      items.push({ p: venc ? 0 : 2, tag: "Acción de mejora", titulo: a.indicadorOrigen || "Acción", detalle: `${a.unidad || ""} — ${a.estado}${venc ? " · vencida" : ""}`, ref: "#/coord/m3?tab=acciones" });
    });
    // Indicadores UBPC en rojo
    S().all("indicadores").forEach(ind => {
      const cur = currentInd(ind);
      if (cur.sem === "rojo") items.push({ p: 0, tag: "Indicador", titulo: ind.nombre, detalle: `${cur.cur}% (meta ${ind.meta}%)`, ref: "#/coord/indicadores" });
    });
    // Planes NT 234 pendientes
    S().all("planesNT234").filter(p => p.estado !== "Completado").forEach(p => {
      items.push({ p: 2, tag: "NT 234", titulo: "Plan de mejora · " + (p.unidad || ""), detalle: `${p.indicadores || ""} — ${p.porcentaje != null ? p.porcentaje + "%" : ""} · ${p.estado}`, ref: "#/coord/m6?tab=planes" });
    });
    // Solicitudes en gestión
    const sol = S().all("solicitudes").filter(x => (x.direccion || "coord-a-ref") === "coord-a-ref" && x.estado && x.estado !== "Cerrada por coordinación");
    if (sol.length) items.push({ p: 1, tag: "Solicitudes", titulo: sol.length + " solicitud(es) técnica(s) en gestión", detalle: "Revisa el flujo con el Referente Técnico", ref: "#/coord/enlace" });
    // Documentos pendientes
    const docp = S().all("documentos").filter(d => /revisi|borrador|enviado/i.test(d.estado || ""));
    if (docp.length) items.push({ p: 2, tag: "Documentos", titulo: docp.length + " documento(s) por validar", detalle: "Gestión Documental", ref: "#/coord/m2" });

    items.sort((a, b) => a.p - b.p);
    if (!items.length) return `<div class="badge badge--ok">Sin brechas activas · las buenas prácticas están dentro de meta.</div>`;
    const K = ["alta", "media", "seg"];
    const cnt = [0, 0, 0]; items.forEach(i => cnt[i.p]++);
    const summary = `<div class="brecha-sum">
      <span class="brecha-sum__chip brecha-sum__chip--alta">🔴 ${cnt[0]} alta${cnt[0] === 1 ? "" : "s"}</span>
      <span class="brecha-sum__chip brecha-sum__chip--media">🟠 ${cnt[1]} media${cnt[1] === 1 ? "" : "s"}</span>
      <span class="brecha-sum__chip brecha-sum__chip--seg">🟡 ${cnt[2]} en seguimiento</span>
      <span class="kpi__sub" style="margin-left:auto">${items.length} brecha(s) · orden por prioridad</span>
    </div>`;
    const grid = `<div class="brecha-grid">${items.slice(0, 9).map(it => `
      <a class="brecha-card brecha-card--${K[it.p]}" href="${it.ref}" title="${u.esc(it.titulo)} — ${u.esc(it.detalle)}">
        <span class="brecha-card__tag">${u.esc(it.tag)}</span>
        <strong class="brecha-card__t">${u.esc(it.titulo)}</strong>
        <span class="brecha-card__meta">${u.esc(it.detalle)}</span>
        <span class="brecha-card__go">Ir →</span>
      </a>`).join("")}</div>`;
    const more = items.length > 9 ? `<p class="kpi__sub" style="margin-top:.6rem">Mostrando las 9 de mayor prioridad. Entra a cada módulo para ver el resto.</p>` : "";
    return summary + grid + more;
  }
  function currentInd(ind) {
    const seg = (ind.seguimientos || []).filter(s => s.valor !== "" && s.valor != null);
    let cur = null;
    if (seg.length) cur = Number(seg[seg.length - 1].valor);
    else if (Number(ind.denominador) > 0) cur = Math.round(Number(ind.numerador) / Number(ind.denominador) * 100);
    else if (ind.lineaBase != null && ind.lineaBase !== "") cur = Number(ind.lineaBase);
    const meta = Number(ind.meta); let sem = "sd";
    if (cur != null && meta) {
      const menor = ind.sentido === "Menor es mejor";
      sem = menor ? (cur <= meta ? "verde" : cur <= meta + 15 ? "amarillo" : "rojo") : (cur >= meta ? "verde" : cur >= meta - 15 ? "amarillo" : "rojo");
    }
    return { cur, sem };
  }

  function guiaBind() {
    document.getElementById("guia-brechas").innerHTML = brechas();
    document.getElementById("guia-evi").innerHTML = eviHTML();
    const add = document.getElementById("guia-addevi");
    if (add) add.onclick = () => eviForm();
    // Orientaciones -> modal
    document.querySelectorAll("[data-orient]").forEach(b => b.onclick = () => openOrientacion(ORIENTACIONES[+b.dataset.orient]));
    // Cajas de herramientas (RNAO y NT 234) -> modal con ejemplo
    document.querySelectorAll("[data-tkset]").forEach(b => b.onclick = () => {
      const data = b.dataset.tkset === "nt" ? NT_TOOLKIT : RNAO_TOOLKIT;
      openToolkit(data[+b.dataset.tki]);
    });
    // Recursos y enlaces
    const rec = document.getElementById("guia-recursos");
    if (rec) rec.innerHTML = recursosHTML();
    const addRec = document.getElementById("guia-addrec");
    if (addRec) addRec.onclick = () => recursoForm(null);
    document.querySelectorAll("[data-recedit]").forEach(b => b.onclick = () => recursoForm(S().get("recursosGuia", b.dataset.recedit)));
    document.querySelectorAll("[data-recdel]").forEach(b => b.onclick = () => {
      ui().confirmDelete("¿Eliminar este enlace?", () => { S().remove("recursosGuia", b.dataset.recdel); guiaBind(); });
    });
  }

  U.coord.views.guia = guia;
  U.coord.binders.guia = guiaBind;
})();
