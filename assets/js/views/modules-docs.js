/* ============================================================
   EDITOR DE DOCUMENTOS INSTITUCIONALES ("nex doc")
   Plantillas UBPC: informe técnico, informe anual, plan de trabajo,
   plan de mejora (breve). Edición enriquecida y exportación.
   Se monta como pestaña del módulo Apoyo y Mejora Continua.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  const PLANTILLAS = {
    informeTecnico: {
      label: "Informe Técnico", ic: "📝", color: "#12b5a5",
      titulo: "Informe Técnico",
      html: `<h2>1. Antecedentes</h2><p>Describe el contexto y los antecedentes que motivan este informe técnico.</p>
        <h2>2. Objetivo</h2><p>Indica el objetivo del informe.</p>
        <h2>3. Desarrollo y análisis</h2><p>Detalle técnico, hallazgos, datos y análisis de la situación.</p>
        <h2>4. Conclusiones</h2><p>Principales conclusiones a partir del análisis.</p>
        <h2>5. Recomendaciones</h2><ul><li>Recomendación 1</li><li>Recomendación 2</li></ul>`
    },
    informeAnual: {
      label: "Informe Anual", ic: "📅", color: "#7a5cd0",
      titulo: "Informe Anual de Gestión · UBPC",
      build: buildInformeAnual
    },
    planTrabajo: {
      label: "Plan de Trabajo", ic: "🗺️", color: "#1e9fe0",
      titulo: "Plan de Trabajo · UBPC",
      html: `<h2>Objetivo general</h2><p>Propósito general del plan de trabajo.</p>
        <h2>Objetivos específicos</h2><ul><li>Objetivo específico 1</li><li>Objetivo específico 2</li></ul>
        <h2>Actividades planificadas</h2>
        <table><thead><tr><th>Actividad</th><th>Responsable</th><th>Plazo</th><th>Estado</th></tr></thead>
        <tbody><tr><td>Actividad 1</td><td>—</td><td>—</td><td>Pendiente</td></tr>
        <tr><td>Actividad 2</td><td>—</td><td>—</td><td>Pendiente</td></tr></tbody></table>
        <h2>Recursos necesarios</h2><p>Recursos humanos, materiales y de coordinación requeridos.</p>`
    },
    planMejora: {
      label: "Plan de Mejora (breve)", ic: "🎯", color: "#e0912f",
      titulo: "Plan de Mejora",
      html: `<h2>Problema o brecha detectada</h2><p>Describe brevemente la brecha a intervenir.</p>
        <h2>Objetivo de mejora</h2><p>Resultado esperado de la intervención.</p>
        <h2>Acciones</h2><ol><li>Acción 1</li><li>Acción 2</li></ol>
        <h2>Responsable y plazo</h2><p>Responsable: — · Plazo: —</p>
        <h2>Indicador de éxito</h2><p>Cómo se medirá el logro de la mejora.</p>`
    },
    actaReunion: {
      label: "Acta de Reunión", ic: "🗒️", color: "#0f8f83",
      titulo: "Acta de Reunión · UBPC",
      html: `<h2>Datos de la reunión</h2>
        <p><strong>Fecha:</strong> — · <strong>Hora:</strong> — · <strong>Lugar:</strong> —<br><strong>Tipo:</strong> Comité / Reunión técnica · <strong>Convoca:</strong> Coordinación UBPC</p>
        <h2>Asistentes</h2><ul><li>Nombre — Cargo / Unidad</li><li>Nombre — Cargo / Unidad</li></ul>
        <h2>Temas tratados</h2><ol><li>Tema 1</li><li>Tema 2</li></ol>
        <h2>Acuerdos y compromisos</h2>
        <table><thead><tr><th>Acuerdo</th><th>Responsable</th><th>Plazo</th></tr></thead>
        <tbody><tr><td>—</td><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td><td>—</td></tr></tbody></table>
        <h2>Próxima reunión</h2><p>Fecha: — · Tema: —</p>`
    },
    auditoria: {
      label: "Informe de Auditoría", ic: "🔍", color: "#7a5cd0",
      titulo: "Informe de Auditoría Clínica · UBPC",
      html: `<h2>1. Objetivo</h2><p>Propósito de la auditoría clínica.</p>
        <h2>2. Alcance</h2><p>Unidad(es), período y proceso auditado.</p>
        <h2>3. Metodología</h2><p>Criterios, muestra e instrumentos aplicados.</p>
        <h2>4. Resultados y hallazgos</h2><ul><li>Hallazgo 1</li><li>Hallazgo 2</li></ul>
        <h2>5. No conformidades</h2>
        <table><thead><tr><th>Hallazgo</th><th>Criterio / estándar</th><th>Severidad</th></tr></thead>
        <tbody><tr><td>—</td><td>—</td><td>—</td></tr></tbody></table>
        <h2>6. Recomendaciones y plan de acción</h2><ol><li>Recomendación 1</li><li>Recomendación 2</li></ol>
        <h2>7. Conclusión</h2><p>Síntesis y nivel de cumplimiento global.</p>`
    },
    protocolo: {
      label: "Protocolo / Procedimiento", ic: "📘", color: "#1554b8",
      titulo: "Protocolo / Procedimiento · UBPC",
      html: `<h2>1. Objetivo</h2><p>Finalidad del protocolo o procedimiento.</p>
        <h2>2. Alcance</h2><p>Unidades y situaciones en que aplica.</p>
        <h2>3. Responsables</h2><ul><li>Rol — responsabilidad</li></ul>
        <h2>4. Definiciones</h2><p>Términos clave.</p>
        <h2>5. Desarrollo del procedimiento</h2><ol><li>Paso 1</li><li>Paso 2</li><li>Paso 3</li></ol>
        <h2>6. Registros y evidencias</h2><p>Documentos y registros asociados.</p>
        <h2>7. Referencias</h2><ul><li>Guía / norma de referencia</li></ul>`
    },
    planCapacitacion: {
      label: "Plan de Capacitación", ic: "🎓", color: "#37a04a",
      titulo: "Plan de Capacitación · UBPC",
      html: `<h2>Fundamentación</h2><p>Necesidad formativa detectada y su relación con la calidad del cuidado.</p>
        <h2>Objetivos de aprendizaje</h2><ul><li>Objetivo 1</li><li>Objetivo 2</li></ul>
        <h2>Población objetivo</h2><p>Estamentos y unidades a capacitar.</p>
        <h2>Contenidos</h2><ol><li>Contenido 1</li><li>Contenido 2</li></ol>
        <h2>Cronograma</h2>
        <table><thead><tr><th>Actividad</th><th>Fecha</th><th>Modalidad</th><th>Responsable</th></tr></thead>
        <tbody><tr><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody></table>
        <h2>Evaluación</h2><p>Forma de evaluar el aprendizaje y la cobertura.</p>`
    },
    fichaBP: {
      label: "Ficha de Buena Práctica", ic: "🌟", color: "#e0a12f",
      titulo: "Ficha de Buena Práctica · UBPC",
      html: `<h2>Nombre de la buena práctica</h2><p>—</p>
        <h2>Unidad y contexto</h2><p>Unidad, equipo y contexto en que se implementa.</p>
        <h2>Problema abordado</h2><p>Brecha o necesidad que motivó la práctica.</p>
        <h2>Intervención implementada</h2><p>Descripción de la práctica realizada.</p>
        <h2>Resultados obtenidos</h2><ul><li>Resultado 1</li><li>Resultado 2</li></ul>
        <h2>Evidencia que la respalda</h2><p>Referencia a la evidencia científica o datos locales.</p>
        <h2>Lecciones aprendidas</h2><p>Aprendizajes y condiciones para replicarla.</p>`
    },
    planRNAO: {
      label: "Plan RNAO / BPSO", ic: "🧭", color: "#12b5a5",
      titulo: "Plan de Implementación RNAO / BPSO · UBPC",
      html: `<h2>1. Guía BPSO y unidad</h2><p>Guía de buenas prácticas y unidad(es) implementadoras.</p>
        <h2>2. Línea base</h2><p>Cumplimiento inicial y brechas detectadas.</p>
        <h2>3. Objetivos e indicadores</h2>
        <table><thead><tr><th>Indicador</th><th>Línea base</th><th>Meta</th><th>Plazo</th></tr></thead>
        <tbody><tr><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody></table>
        <h2>4. Actividades de implementación</h2><ol><li>Actividad 1</li><li>Actividad 2</li></ol>
        <h2>5. Red Champion y responsables</h2><p>Champions por unidad y responsables del seguimiento.</p>
        <h2>6. Evaluación y sostenibilidad</h2><p>Auditorías, periodicidad y estrategia de sostenibilidad.</p>`
    },
    planFortalecimiento: {
      label: "Plan de Fortalecimiento", ic: "💪", color: "#e0526f",
      titulo: "Plan de Fortalecimiento de Buenas Prácticas · UBPC",
      html: `<h2>1. Diagnóstico</h2><p>Situación actual y necesidades de fortalecimiento detectadas.</p>
        <h2>2. Objetivos</h2><ul><li>Objetivo 1</li><li>Objetivo 2</li></ul>
        <h2>3. Líneas de acción</h2>
        <table><thead><tr><th>Línea de acción</th><th>Responsable</th><th>Plazo</th><th>Indicador</th></tr></thead>
        <tbody><tr><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody></table>
        <h2>4. Recursos y coordinación</h2><p>Recursos requeridos y articulación con otras unidades.</p>
        <h2>5. Seguimiento</h2><p>Cómo y cuándo se evaluará el fortalecimiento.</p>`
    },
    memo: {
      label: "Memorándum", ic: "✉️", color: "#5f7d76",
      titulo: "Memorándum · UBPC",
      html: `<h2>MEMORÁNDUM</h2>
        <p><strong>Para:</strong> —<br><strong>De:</strong> Coordinación UBPC<br><strong>Fecha:</strong> —<br><strong>Asunto:</strong> —</p>
        <hr>
        <p>Cuerpo del mensaje. Redacta aquí el contenido de la comunicación interna.</p>
        <p>Sin otro particular, saluda atentamente,</p>
        <p>—<br>Coordinación · Unidad de Buenas Prácticas Clínicas</p>`
    }
  };

  const plMeta = k => PLANTILLAS[k] || PLANTILLAS.informeTecnico;
  const tplContenido = p => (typeof p.build === "function" ? p.build() : p.html);

  // Portada institucional (se agrega automáticamente a cada documento nuevo)
  function coverHTML(titulo, label) {
    const u = ui(), me = U.auth.current();
    return `<div class="doc-cover">`
      + `<img class="doc-cover__logo" src="assets/img/huap-logo.png" alt="HUAP">`
      + `<div class="doc-cover__unit">Unidad de Buenas Prácticas Clínicas · UBPC</div>`
      + `<div class="doc-cover__hosp">Hospital de Urgencia Asistencia Pública</div>`
      + `<div class="doc-cover__rule"></div>`
      + `<h1 class="doc-cover__title">${u.esc(titulo || "Documento institucional")}</h1>`
      + `<div class="doc-cover__sub">Documento institucional${label ? " · " + u.esc(label) : ""}</div>`
      + `<div class="doc-cover__box">Código: <span class="doc-cover__cod">__________</span> · Versión: <span class="doc-cover__ver">v1</span> · Fecha: <span class="doc-cover__fec">${u.fechaCL(new Date())}</span><br>Elaborado por: ${u.esc(me ? me.nombre : "")} · Coordinación UBPC</div>`
      + `</div><div class="doc-pagebreak" contenteditable="false">Salto de hoja</div><p><br></p>`;
  }
  // Estampa el código/versión reales en la portada (al finalizar)
  function stampCover(html, codigo, version) {
    try {
      const tmp = document.createElement("div"); tmp.innerHTML = html || "";
      const cod = tmp.querySelector(".doc-cover__cod"); if (cod) cod.textContent = codigo || "__________";
      const ver = tmp.querySelector(".doc-cover__ver"); if (ver) ver.textContent = "v" + (version || 1);
      return tmp.querySelector(".doc-cover") ? tmp.innerHTML : html;
    } catch (e) { return html; }
  }
  function resetCover(html, version) {
    try {
      const tmp = document.createElement("div"); tmp.innerHTML = html || "";
      const cod = tmp.querySelector(".doc-cover__cod"); if (cod) cod.textContent = "__________";
      const ver = tmp.querySelector(".doc-cover__ver"); if (ver) ver.textContent = "v" + (version || 1);
      return tmp.querySelector(".doc-cover") ? tmp.innerHTML : html;
    } catch (e) { return html; }
  }

  /* Informe Anual pre-rellenado con los datos reales del portal */
  function buildInformeAnual() {
    const s = S(), CS = U.coordStats || {};
    const year = new Date().getFullYear();
    const pct = v => v == null ? "—" : v + "%";
    const evals = s.all("evaluacionesRNAO");
    const gl = CS.globalCumplimiento ? evals.map(CS.globalCumplimiento).filter(v => v != null) : [];
    const rnao = gl.length ? Math.round(gl.reduce((a, b) => a + b, 0) / gl.length) : null;
    const nt = s.all("nt234");
    const ntG = nt.length ? Math.round(nt.reduce((a, b) => a + (Number(b.porcentaje) || 0), 0) / nt.length) : null;
    const acts = s.all("actividades");
    const cap = acts.reduce((n, a) => n + (parseInt(a.personasCapacitadas) || 0), 0);
    const po = acts.reduce((n, a) => n + (parseInt(a.poblacionObjetivo) || 0), 0);
    const cob = po > 0 ? Math.round(cap / po * 100) : null;
    const cols = s.all("colaboraciones");
    const inst = new Set(cols.map(c => (c.institucion || "").trim()).filter(Boolean)).size;
    const guias = s.all("guiasBPSO").filter(g => g.estado === "Activa").length;
    const docs = s.all("documentos").filter(d => /vigente/i.test(d.estado || "")).length;
    const recon = s.all("reconocimientos");
    const byU = {}; recon.forEach(r => { const un = r.unidad || "—"; byU[un] = (byU[un] || 0) + 1; });
    const lider = Object.keys(byU).sort((a, b) => byU[b] - byU[a])[0];
    const planes = s.all("planesNT234").length, acc = s.all("accionesRNAO").length;

    const rows = [
      ["Programa RNAO", "Cumplimiento institucional", pct(rnao)],
      ["Norma Técnica 234", "Adherencia promedio", pct(ntG)],
      ["Fortalecimiento", "Personas capacitadas", cap],
      ["Fortalecimiento", "Cobertura", pct(cob)],
      ["Gestión documental", "Documentos vigentes", docs],
      ["Red de colaboración", "Colaboraciones / instituciones", cols.length + " / " + inst],
      ["Reconocimientos", "Registrados en el año", recon.length]
    ].map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><strong>${r[2]}</strong></td></tr>`).join("");

    const logros = [
      guias ? `${guias} guía(s) BPSO en implementación activa.` : null,
      cap ? `${cap} personas capacitadas${cob != null ? " (cobertura " + cob + "%)" : ""}.` : null,
      rnao != null ? `Cumplimiento RNAO institucional de ${rnao}%.` : null,
      lider ? `Unidad más reconocida del año: <strong>${lider}</strong>.` : null,
      cols.length ? `${cols.length} colaboración(es) con ${inst} institución(es).` : null
    ].filter(Boolean).map(x => `<li>${x}</li>`).join("") || "<li>Registra actividad en el portal para poblar los logros.</li>";

    return `<h2>Resumen ejecutivo</h2>
      <p>Durante el año ${year}, la Unidad de Buenas Prácticas Clínicas mantuvo un cumplimiento RNAO institucional de <strong>${pct(rnao)}</strong> y una adherencia promedio a la Norma Técnica 234 de <strong>${pct(ntG)}</strong>. Se capacitó a <strong>${cap}</strong> personas${cob != null ? " (cobertura " + cob + "%)" : ""} y se registraron <strong>${cols.length}</strong> colaboración(es) institucional(es). <em>(Redacta aquí el análisis cualitativo del período.)</em></p>
      <h2>Indicadores clave</h2>
      <table><thead><tr><th>Programa</th><th>Indicador</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>Logros del año</h2><ul>${logros}</ul>
      <h2>Programa RNAO</h2><p>Cumplimiento institucional ${pct(rnao)} sobre ${evals.length} evaluación(es); ${acc} acción(es) de mejora registradas. <em>(Describe los avances por guía.)</em></p>
      <h2>Norma Técnica 234</h2><p>Adherencia promedio ${pct(ntG)} sobre ${nt.length} medición(es); ${planes} plan(es) de mejora. <em>(Comenta las unidades priorizadas.)</em></p>
      <h2>Fortalecimiento y capacitación</h2><p>${acts.length} actividad(es), ${cap} personas capacitadas${cob != null ? ", cobertura " + cob + "%" : ""}. <em>(Detalla los estamentos alcanzados.)</em></p>
      <h2>Red de colaboración</h2><p>${cols.length} colaboración(es) con ${inst} institución(es). <em>(Destaca las alianzas más relevantes.)</em></p>
      <h2>Desafíos y proyecciones</h2><p><em>(Define las metas y focos para el próximo período.)</em></p>`;
  }

  function mount(container, params) {
    if (params && params.doc) {
      const d = S().get("docsTrabajo", params.doc);
      if (d) { openEditor(container, d); return; }
    }
    renderList(container);
  }

  /* ---------- Listado + galería de plantillas ---------- */
  function renderList(container) {
    const u = ui();
    const docs = S().all("docsTrabajo").sort((a, b) => new Date(b.fechaModificacion || 0) - new Date(a.fechaModificacion || 0));
    const gallery = Object.keys(PLANTILLAS).map(k => {
      const p = PLANTILLAS[k];
      return `<button class="doc-tpl" data-tpl="${k}" style="--tc:${p.color}">
        <span class="doc-tpl__ic">${p.ic}</span>
        <span class="doc-tpl__lab">${u.esc(p.label)}</span>
        <span class="doc-tpl__new">+ Crear</span></button>`;
    }).join("");

    const list = docs.length
      ? `<div class="grid grid--3">${docs.map(d => {
          const p = plMeta(d.plantilla);
          const dst = estadoDe(d);
          return `<div class="doc-card" style="--tc:${p.color}">
            <div class="doc-card__top"><span class="doc-card__ic">${p.ic}</span>
              <span class="doc-card__tag">${u.esc(p.label)}</span>
              <span class="doc-estado doc-estado--sm" style="--ec:${dst.color}">${dst.ic} ${u.esc(dst.label)}</span></div>
            <h4 class="doc-card__title">${u.esc(d.titulo || "Documento sin título")}</h4>
            <div class="doc-card__meta">${d.codigo ? `<span class="mono">${u.esc(d.codigo)}</span> · ` : ""}v${d.version || 1} · Modificado ${u.fechaCL(d.fechaModificacion)}</div>
            <div class="doc-card__acts">
              <button class="btn btn--primary btn--sm" data-open="${d.id}">Abrir</button>
              ${(d.estado && d.estado !== "borrador") ? "" : `<button class="btn btn--ghost btn--sm" data-del="${d.id}">🗑️</button>`}</div></div>`;
        }).join("")}</div>`
      : u.empty("Aún no hay documentos.", "Elige una plantilla arriba para crear tu primer documento institucional.", "🗂️");

    container.innerHTML = `
      <div class="section"><h3 class="section__title">Nuevo documento desde plantilla</h3>
        <p class="card__hint" style="margin:.1rem 0 .7rem">Plantillas con la identidad de la Unidad. Elige una y edítala como en un documento.</p>
        <div class="doc-gallery">${gallery}</div></div>
      <div class="section__head" style="margin-top:1.2rem"><h3 class="section__title">Documentos guardados</h3></div>
      ${list}`;

    container.querySelectorAll("[data-tpl]").forEach(b => b.onclick = () => openEditor(container, null, b.dataset.tpl));
    container.querySelectorAll("[data-open]").forEach(b => b.onclick = () => openEditor(container, S().get("docsTrabajo", b.dataset.open)));
    container.querySelectorAll("[data-del]").forEach(b => b.onclick = () =>
      u.confirmDelete("¿Eliminar este documento?", () => { S().remove("docsTrabajo", b.dataset.del); renderList(container); }));
  }

  /* ---------- Flujo documental (Etapa 4) ---------- */
  const ESTADOS = {
    borrador: { label: "Borrador", color: "#8a94a6", ic: "✏️" },
    aprobado: { label: "Aprobado por Coordinador", color: "#e0912f", ic: "✔️" },
    finalizado: { label: "Finalizado", color: "#1f9d57", ic: "🔒" },
    anulado: { label: "Anulado", color: "#c62f3b", ic: "🚫" }
  };
  const estadoDe = d => ESTADOS[(d && d.estado) || "borrador"] || ESTADOS.borrador;
  function logHist(d, accion, detalle) {
    const me = U.auth.current();
    const h = (d && d.historial ? d.historial : []).slice();
    h.push({ accion, detalle: detalle || "", por: me ? me.nombre : "Sistema", fecha: new Date().toISOString() });
    return h;
  }
  function firmaHTML(rec) {
    const u = ui();
    const nombre = rec.finalizadoPor || (U.auth.current() ? U.auth.current().nombre : "");
    const fecha = rec.fechaFinalizado ? u.fechaCL(rec.fechaFinalizado) : u.fechaCL(new Date());
    return `<div class="doc-firma">
      <div class="doc-firma__line"></div>
      <div class="doc-firma__name">${u.esc(nombre)}</div>
      <div class="doc-firma__role">Coordinador/a · Unidad de Buenas Prácticas Clínicas – UBPC</div>
      <div class="doc-firma__stamp">Espacio para firma y timbre</div>
      <div class="doc-firma__meta">${rec.codigo ? u.esc(rec.codigo) + " · " : ""}Versión ${rec.version || 1} · ${fecha}</div>
    </div>`;
  }
  const reopen = (container, id) => openEditor(container, S().get("docsTrabajo", id));

  function aprobar(container, doc) {
    const u = ui();
    u.modal({ title: "Aprobar documento",
      body: `<p>Al aprobar, el Coordinador/a autoriza este documento. Luego podrás asignarle un código oficial y finalizarlo.</p>
        <p class="card__hint">Documento: <strong>${u.esc(doc.titulo)}</strong></p>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-ok>✔️ Aprobar</button>`,
      onMount(m) { m.querySelector("[data-ok]").onclick = () => {
        S().update("docsTrabajo", doc.id, { estado: "aprobado", aprobadoPor: (U.auth.current() || {}).nombre, fechaAprobado: new Date().toISOString(), historial: logHist(doc, "Aprobado por Coordinador") });
        u.closeModal(); u.toast("Documento aprobado", "ok"); reopen(container, doc.id);
      }; } });
  }
  function finalizar(container, doc) {
    const u = ui();
    u.modal({ title: "Asignar código y finalizar",
      body: `<p>Se asignará un <strong>código oficial</strong>, el documento quedará <strong>bloqueado</strong> y se agregará el espacio de <strong>firma y timbre</strong> del Coordinador/a.</p>
        <p class="card__hint">Podrás crear una nueva versión más adelante si necesitas cambios.</p>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-ok>🔒 Asignar código y finalizar</button>`,
      onMount(m) { m.querySelector("[data-ok]").onclick = () => {
        const codigo = doc.codigo || S().nextCode("docsTrabajo");
        const contenido = stampCover(doc.contenido, codigo, doc.version || 1);
        S().update("docsTrabajo", doc.id, { estado: "finalizado", codigo, contenido, finalizadoPor: (U.auth.current() || {}).nombre, fechaFinalizado: new Date().toISOString(), historial: logHist(doc, "Finalizado y codificado", codigo) });
        u.closeModal(); u.toast("Documento finalizado · " + codigo, "ok"); reopen(container, doc.id);
      }; } });
  }
  function volverBorrador(container, doc) {
    const u = ui();
    u.modal({ title: "Volver a borrador",
      body: `<p>El documento volverá a estar <strong>editable</strong> como borrador. Se registra en el historial.</p>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-ok>Volver a borrador</button>`,
      onMount(m) { m.querySelector("[data-ok]").onclick = () => {
        S().update("docsTrabajo", doc.id, { estado: "borrador", historial: logHist(doc, "Devuelto a borrador") });
        u.closeModal(); reopen(container, doc.id);
      }; } });
  }
  function nuevaVersion(container, doc) {
    const u = ui();
    const root = doc.origenId || doc.id;
    const sameRoot = S().all("docsTrabajo").filter(x => (x.origenId || x.id) === root);
    const maxV = Math.max.apply(0, sameRoot.map(x => x.version || 1));
    const nueva = S().insert("docsTrabajo", {
      titulo: doc.titulo, plantilla: doc.plantilla, contenido: resetCover(doc.contenido, maxV + 1), tamano: doc.tamano || "a4",
      estado: "borrador", version: maxV + 1, origenId: root,
      historial: logHist({}, "Nueva versión creada", "a partir de " + (doc.codigo || ("v" + (doc.version || 1))))
    });
    u.toast("Nueva versión creada (v" + nueva.version + ")", "ok");
    openEditor(container, nueva);
  }
  function anular(container, doc) {
    const u = ui();
    u.modal({ title: "Anular documento",
      body: `<p>La anulación requiere un <strong>motivo</strong>. El documento queda marcado como <strong>ANULADO</strong>; no se elimina y su historial se conserva.</p>`
        + u.formHTML([{ name: "motivo", label: "Motivo de la anulación", type: "textarea", required: true, full: true }], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--danger" data-ok>🚫 Anular</button>`,
      onMount(m) { m.querySelector("[data-ok]").onclick = () => {
        const d = u.readForm(m); if (!d.motivo) { u.toast("Indica el motivo", "danger"); return; }
        S().update("docsTrabajo", doc.id, { estado: "anulado", anuladoPor: (U.auth.current() || {}).nombre, fechaAnulado: new Date().toISOString(), motivoAnulacion: d.motivo, historial: logHist(doc, "Anulado", d.motivo) });
        u.closeModal(); u.toast("Documento anulado", "ok"); reopen(container, doc.id);
      }; } });
  }
  function verHistorial(doc) {
    const u = ui();
    const h = (doc.historial || []).slice().reverse();
    const rows = h.length ? h.map(x => `<li><span class="feed__ico">📌</span><div><strong>${u.esc(x.accion)}</strong>${x.detalle ? " · " + u.esc(x.detalle) : ""}
      <div class="feed__meta">${u.esc(x.por)} · ${u.fechaHoraCL(x.fecha)}</div></div></li>`).join("") : "<li>Sin movimientos registrados.</li>";
    u.modal({ title: "Historial del documento", body: `<ul class="feed">${rows}</ul>`,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>` });
  }

  /* ---------- Editor ---------- */
  function openEditor(container, rec, tplKey) {
    const u = ui();
    const plantilla = rec ? rec.plantilla : tplKey;
    const p = plMeta(plantilla);
    const me = U.auth.current();
    const titulo = rec ? (rec.titulo || p.titulo) : p.titulo;
    // Documento nuevo: incluye portada institucional automáticamente.
    const contenido = rec ? (rec.contenido || tplContenido(p)) : (coverHTML(p.titulo, p.label) + tplContenido(p));

    const estado = (rec && rec.estado) || "borrador";
    const est = ESTADOS[estado] || ESTADOS.borrador;
    const locked = estado !== "borrador";
    const version = (rec && rec.version) || 1;
    const codigo = rec && rec.codigo;

    const tools = [
      { c: "bold", ic: "𝗕", t: "Negrita" }, { c: "italic", ic: "𝘐", t: "Cursiva" }, { c: "underline", ic: "U̲", t: "Subrayado" },
      { sep: 1 },
      { c: "formatBlock", v: "H2", ic: "T", t: "Título" }, { c: "formatBlock", v: "H3", ic: "t", t: "Subtítulo" }, { c: "formatBlock", v: "P", ic: "¶", t: "Texto normal" },
      { sep: 1 },
      { c: "insertUnorderedList", ic: "•", t: "Lista con viñetas" }, { c: "insertOrderedList", ic: "1.", t: "Lista numerada" },
      { sep: 1 },
      { c: "justifyLeft", ic: "⯇", t: "Alinear a la izquierda" }, { c: "justifyCenter", ic: "≡", t: "Centrar" },
      { c: "justifyRight", ic: "⯈", t: "Alinear a la derecha" }, { c: "justifyFull", ic: "▤", t: "Justificar" },
      { sep: 1 },
      { c: "undo", ic: "↶", t: "Deshacer" }, { c: "redo", ic: "↷", t: "Rehacer" }
    ];
    const FONTS = [["", "Fuente…"], ["'Nunito Sans',sans-serif", "Nunito Sans"], ["Arial,Helvetica,sans-serif", "Arial"], ["Georgia,serif", "Georgia"], ["'Times New Roman',serif", "Times"], ["'Courier New',monospace", "Courier"]];
    const SIZES = [["", "Tamaño…"], ["2", "Pequeña"], ["3", "Normal"], ["4", "Media"], ["5", "Grande"], ["6", "Muy grande"], ["7", "Enorme"]];
    const btns = tools.map(x => x.sep ? `<span class="doc-tb__sep"></span>`
      : `<button class="doc-tb__btn" data-cmd="${x.c}" ${x.v ? `data-val="${x.v}"` : ""} title="${x.t}" type="button">${x.ic}</button>`).join("");
    const SHEETS = [["a4", "A4"], ["carta", "Carta"], ["oficio", "Oficio"]];
    const selFont = `<select class="doc-tb__sel" id="doc-font" title="Tipo de letra">${FONTS.map(o => `<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`;
    const selSize = `<select class="doc-tb__sel" id="doc-size" title="Tamaño de letra">${SIZES.map(o => `<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`;
    const selSheet = `<select class="doc-tb__sel" id="doc-sheet" title="Tamaño de hoja">${SHEETS.map(o => `<option value="${o[0]}">📄 ${o[1]}</option>`).join("")}</select>`;
    const colorInp = `<label class="doc-tb__color" title="Color del texto"><span>A</span><input type="color" id="doc-color" value="#17263d"></label>`;
    const tableBtns = `<button class="doc-tb__btn" id="tbl-ins" title="Insertar tabla" type="button">⊞ Tabla</button>`
      + `<button class="doc-tb__btn" id="tbl-rowa" title="Agregar fila" type="button">＋fila</button>`
      + `<button class="doc-tb__btn" id="tbl-cola" title="Agregar columna" type="button">＋col</button>`
      + `<button class="doc-tb__btn" id="tbl-rowd" title="Quitar fila" type="button">－fila</button>`
      + `<button class="doc-tb__btn" id="tbl-cold" title="Quitar columna" type="button">－col</button>`;
    const toolbar = btns + `<span class="doc-tb__sep"></span>` + colorInp + selFont + selSize
      + `<span class="doc-tb__sep"></span>` + selSheet
      + `<span class="doc-tb__sep"></span>` + tableBtns
      + `<span class="doc-tb__sep"></span><button class="doc-tb__btn doc-tb__wide" id="doc-pagebreak" title="Insertar salto de página" type="button">⤓ Salto de hoja</button>`
      + `<button class="doc-tb__btn doc-tb__wide" id="doc-cover-btn" title="Insertar portada institucional" type="button">🏛️ Portada</button>`;

    const estadoBadge = `<span class="doc-estado" style="--ec:${est.color}">${est.ic} ${u.esc(est.label)}${codigo ? " · " + u.esc(codigo) : ""}${(version > 1 || locked) ? " · v" + version : ""}</span>`;
    let wf = "";
    if (estado === "borrador") wf = `<button class="btn btn--primary btn--sm" id="wf-aprobar">✔️ Aprobar (Coordinador)</button>`;
    else if (estado === "aprobado") wf = `<button class="btn btn--primary btn--sm" id="wf-finalizar">🔒 Asignar código y finalizar</button><button class="btn btn--ghost btn--sm" id="wf-borrador">↩️ Volver a borrador</button>`;
    else if (estado === "finalizado") wf = `<button class="btn btn--primary btn--sm" id="wf-version">🆕 Nueva versión</button><button class="btn btn--ghost btn--sm" id="wf-anular">🚫 Anular</button>`;
    else if (estado === "anulado") wf = `<button class="btn btn--primary btn--sm" id="wf-version">🆕 Nueva versión</button>`;
    const histBtn = rec ? `<button class="btn btn--ghost btn--sm" id="wf-hist">🕘 Historial</button>` : "";
    const firmaBlock = estado === "finalizado" ? firmaHTML(rec) : "";
    const anuladoBlock = estado === "anulado"
      ? `<div class="doc-anulado"><div class="doc-anulado__sello">ANULADO</div><div class="doc-anulado__motivo"><strong>Motivo:</strong> ${u.esc(rec.motivoAnulacion || "—")}</div></div>` : "";

    container.innerHTML = `
      <div class="doc-editor">
        <div class="doc-bar no-print">
          <button class="btn btn--ghost btn--sm" id="doc-back">← Volver</button>
          <div class="doc-bar__title"><span class="tag" style="background:${p.color}22;color:${p.color}">${p.ic} ${u.esc(p.label)}</span> ${estadoBadge}</div>
          <div class="btn-row">
            ${histBtn}
            <button class="btn btn--ghost btn--sm" id="doc-print">🖨️ Imprimir / PDF</button>
            <button class="btn btn--ghost btn--sm" id="doc-word">📄 Word</button>
            ${locked ? "" : `<button class="btn btn--primary btn--sm" id="doc-save">💾 Guardar</button>`}
          </div>
        </div>
        <div class="doc-wf no-print">${wf}${locked ? `<span class="doc-wf__lock">🔒 Documento bloqueado (solo lectura)</span>` : ""}</div>
        ${locked ? "" : `<div class="doc-tb no-print">${toolbar}</div>`}
        <div class="doc-page" id="doc-page">
          <div class="doc-page__franja"></div>
          <div class="doc-page__hd">
            <div class="doc-page__brand"><img src="assets/img/huap-logo.png" alt="HUAP">
              <div><strong>Unidad de Buenas Prácticas Clínicas – UBPC</strong>
              <div class="muted">Hospital de Urgencia Asistencia Pública</div></div></div>
            <div class="doc-page__meta">${u.fechaCL(new Date())}<br>${u.esc(me ? me.nombre : "")}${codigo ? `<br><span class="mono">${u.esc(codigo)}</span>` : ""}</div>
          </div>
          <input class="doc-page__title" id="doc-title" value="${u.esc(titulo)}" placeholder="Título del documento" ${locked ? "readonly" : ""}>
          <div class="doc-page__body" id="doc-body" contenteditable="${locked ? "false" : "true"}">${contenido}</div>
          ${anuladoBlock}${firmaBlock}
        </div>
      </div>`;

    const page = document.getElementById("doc-page");
    const bodyEl = document.getElementById("doc-body");
    const titleEl = document.getElementById("doc-title");

    // Tamaño de hoja (Carta / A4 / Oficio)
    const SHEET_W = { a4: "210mm", carta: "216mm", oficio: "216mm" };
    let sheet = (rec && rec.tamano) || "a4";
    function applySheet(v) { sheet = SHEET_W[v] ? v : "a4"; page.style.maxWidth = SHEET_W[sheet]; page.dataset.sheet = sheet; }
    applySheet(sheet);

    if (!locked) {
    // El formato se aplica como CSS (para que negrita/fuente/tamaño se impriman igual)
    try { document.execCommand("styleWithCSS", false, true); } catch (e) {}

    // Preservar la selección del editor aunque el foco pase a un menú de la barra
    let savedRange = null;
    const saveSel = () => { const s = window.getSelection(); if (s && s.rangeCount && bodyEl.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange(); };
    const restoreSel = () => { bodyEl.focus(); if (savedRange) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(savedRange); } };
    bodyEl.addEventListener("keyup", saveSel);
    bodyEl.addEventListener("mouseup", saveSel);
    bodyEl.addEventListener("focus", saveSel);

    // Botones (mousedown + preventDefault conserva la selección)
    container.querySelectorAll(".doc-tb__btn[data-cmd]").forEach(b => b.addEventListener("mousedown", e => {
      e.preventDefault(); bodyEl.focus();
      try { document.execCommand(b.dataset.cmd, false, b.dataset.val || null); } catch (err) {}
      saveSel();
    }));

    // Tipo y tamaño de letra
    const applySel = (cmd, val) => { restoreSel(); try { document.execCommand(cmd, false, val); } catch (e) {} saveSel(); };
    const fontSel = document.getElementById("doc-font"), sizeSel = document.getElementById("doc-size");
    fontSel.addEventListener("mousedown", saveSel);
    sizeSel.addEventListener("mousedown", saveSel);
    fontSel.addEventListener("change", () => { if (fontSel.value) applySel("fontName", fontSel.value); fontSel.selectedIndex = 0; });
    sizeSel.addEventListener("change", () => { if (sizeSel.value) applySel("fontSize", sizeSel.value); sizeSel.selectedIndex = 0; });

    // Salto de hoja (nueva página)
    document.getElementById("doc-pagebreak").addEventListener("mousedown", e => {
      e.preventDefault(); restoreSel();
      try { document.execCommand("insertHTML", false, '<div class="doc-pagebreak" contenteditable="false">Salto de hoja</div><p><br></p>'); } catch (err) {}
      saveSel();
    });

    // Color del texto
    const colorEl = document.getElementById("doc-color");
    colorEl.addEventListener("mousedown", saveSel);
    colorEl.addEventListener("input", () => applySel("foreColor", colorEl.value));

    // Tamaño de hoja
    const sheetSel = document.getElementById("doc-sheet");
    sheetSel.value = sheet;
    sheetSel.addEventListener("change", () => applySheet(sheetSel.value));

    // ---- Tablas: insertar / agregar y quitar filas y columnas ----
    function cellFromSel() {
      const sel = window.getSelection();
      let n = (sel && sel.rangeCount && bodyEl.contains(sel.anchorNode)) ? sel.anchorNode
        : (savedRange ? savedRange.startContainer : null);
      while (n && n !== bodyEl) { if (n.nodeType === 1 && /^(TD|TH)$/.test(n.tagName)) return n; n = n.parentNode; }
      return null;
    }
    function needCell() { const c = cellFromSel(); if (!c) ui().toast("Pon el cursor dentro de una tabla", "warn"); return c; }
    function tblBtn(id, fn) {
      const b = document.getElementById(id);
      if (b) b.addEventListener("mousedown", e => { e.preventDefault(); fn(); saveSel(); });
    }
    tblBtn("tbl-ins", () => {
      restoreSel();
      const html = `<table><thead><tr><th>Encabezado 1</th><th>Encabezado 2</th><th>Encabezado 3</th></tr></thead>`
        + `<tbody><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`
        + `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br></p>`;
      try { document.execCommand("insertHTML", false, html); } catch (e) {}
    });
    tblBtn("tbl-rowa", () => {
      const cell = needCell(); if (!cell) return;
      const row = cell.parentNode, n = row.children.length, nr = document.createElement("tr");
      for (let i = 0; i < n; i++) { const td = document.createElement("td"); td.innerHTML = "&nbsp;"; nr.appendChild(td); }
      row.parentNode.insertBefore(nr, row.nextSibling);
    });
    tblBtn("tbl-cola", () => {
      const cell = needCell(); if (!cell) return;
      const idx = Array.prototype.indexOf.call(cell.parentNode.children, cell), table = cell.closest("table");
      table.querySelectorAll("tr").forEach(tr => {
        const ref = tr.children[idx];
        const head = tr.parentNode.tagName === "THEAD" || (ref && ref.tagName === "TH");
        const c = document.createElement(head ? "th" : "td"); c.innerHTML = head ? "Encabezado" : "&nbsp;";
        tr.insertBefore(c, ref ? ref.nextSibling : null);
      });
    });
    tblBtn("tbl-rowd", () => {
      const cell = needCell(); if (!cell) return;
      const table = cell.closest("table");
      if (table.querySelectorAll("tr").length <= 1) { ui().toast("La tabla debe tener al menos una fila", "warn"); return; }
      cell.parentNode.remove();
    });
    tblBtn("tbl-cold", () => {
      const cell = needCell(); if (!cell) return;
      const idx = Array.prototype.indexOf.call(cell.parentNode.children, cell), table = cell.closest("table");
      if (table.querySelector("tr").children.length <= 1) { ui().toast("La tabla debe tener al menos una columna", "warn"); return; }
      table.querySelectorAll("tr").forEach(tr => { if (tr.children[idx]) tr.children[idx].remove(); });
    });

    // Portada institucional (por si se quitó o para reinsertarla)
    tblBtn("doc-cover-btn", () => {
      if (bodyEl.querySelector(".doc-cover")) { ui().toast("El documento ya tiene portada", "warn"); return; }
      bodyEl.insertAdjacentHTML("afterbegin", coverHTML(titleEl.value || p.titulo, p.label));
    });
    } // fin handlers de edición (documento no bloqueado)

    let current = rec;
    document.getElementById("doc-back").onclick = () => renderList(container);
    function doSave(silent) {
      const data = { titulo: titleEl.value.trim() || p.titulo, plantilla, contenido: bodyEl.innerHTML, tamano: sheet };
      if (current) S().update("docsTrabajo", current.id, data);
      else current = S().insert("docsTrabajo", Object.assign({ estado: "borrador", version: 1 }, data));
      if (!silent) u.toast("Documento guardado", "ok");
      return current;
    }
    const saveBtn = document.getElementById("doc-save");
    if (saveBtn) saveBtn.onclick = () => doSave();
    // Flujo documental: aprobar → código/finalizar → versiones / anular
    const wfBtn = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = fn; };
    wfBtn("wf-aprobar", () => aprobar(container, doSave(true)));
    wfBtn("wf-finalizar", () => finalizar(container, current));
    wfBtn("wf-borrador", () => volverBorrador(container, current));
    wfBtn("wf-version", () => nuevaVersion(container, current));
    wfBtn("wf-anular", () => anular(container, current));
    wfBtn("wf-hist", () => verHistorial(current));
    document.getElementById("doc-print").onclick = () => printDoc(titleEl.value, bodyEl.innerHTML, me, sheet, current);
    document.getElementById("doc-word").onclick = () => {
      const title = titleEl.value || p.titulo;
      const franja = `<div style="border-top:6px solid #12b5a5;height:0;margin:0 0 10px"></div>`;
      const header = `<table style="width:100%;border:none;margin-bottom:12px"><tr>
        <td style="border:none;padding:0;font-size:11pt"><strong>Unidad de Buenas Prácticas Clínicas – UBPC</strong><br><span style="color:#5a6b84;font-size:9pt">Hospital de Urgencia Asistencia Pública</span></td>
        <td style="border:none;padding:0;text-align:right;color:#5a6b84;font-size:9pt">${u.fechaCL(new Date())}<br>${u.esc(me ? me.nombre : "")}</td></tr></table>`;
      const h1 = `<h1 style="font-family:Georgia,serif;color:#0d5044">${u.esc(title)}</h1>`;
      const body = bodyEl.innerHTML
        .replace(/<h2>/g, '<h2 style="font-family:Georgia,serif;color:#0f8f83;border-bottom:1px solid #dbe6f2;padding-bottom:3px">')
        .replace(/<h3>/g, '<h3 style="font-family:Georgia,serif;color:#5b34b0">')
        .replace(/<div class="doc-pagebreak"[^>]*>.*?<\/div>/g, '<br clear="all" style="page-break-before:always">');
      u.exportWord("documento-ubpc-" + u.hoyISO(), title, franja + header + h1 + body);
    };
  }

  function printDoc(titulo, html, me, sheet, rec) {
    const u = ui();
    const w = window.open("", "_blank");
    if (!w) { u.toast("Permite las ventanas emergentes para imprimir", "danger"); return; }
    rec = rec || {};
    const fr = new URL("assets/fonts/fraunces.woff2", document.baseURI).href;
    const ns = new URL("assets/fonts/nunitosans.woff2", document.baseURI).href;
    const PAGE = { a4: "A4", carta: "216mm 279mm", oficio: "216mm 330mm" };
    const pageSize = PAGE[sheet] || "A4";
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${u.esc(titulo || "Documento")}</title>
      <style>
        @font-face{font-family:'Fraunces';src:url('${fr}') format('woff2');font-weight:100 900;font-display:swap}
        @font-face{font-family:'Nunito Sans';src:url('${ns}') format('woff2');font-weight:200 900;font-display:swap}
        @page{size:${pageSize};margin:0}
        .doc-cover{min-height:calc(100vh - 30mm);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;break-after:page;page-break-after:always;gap:6px}
        .doc-cover__logo{width:96px;height:96px;object-fit:contain;margin-bottom:8px}
        .doc-cover__unit{font-family:'Fraunces',Georgia,serif;font-weight:700;font-size:1.25rem;color:#0d5044}
        .doc-cover__hosp{color:#5a6b84;font-size:12px}
        .doc-cover__rule{width:90px;height:4px;border-radius:3px;background:linear-gradient(90deg,#12b5a5,#7a5cd0);margin:14px 0}
        .doc-cover__title{font-family:'Fraunces',Georgia,serif;color:#17263d;font-size:2rem;margin:.2em 1.5cm;border:none}
        .doc-cover__sub{color:#5b34b0;font-weight:700}
        .doc-cover__box{margin-top:26px;font-size:12px;color:#40536f;border:1px solid #dbe6f2;border-radius:10px;padding:10px 16px}
        *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        html,body{margin:0}
        body{font-family:'Nunito Sans',system-ui,Arial,sans-serif;color:#22303a;line-height:1.6;font-size:14.5px}
        .franja{height:7px;background:linear-gradient(90deg,#1554b8,#1e9fe0,#0fb5ad,#37a04a,#f2c53d,#f07f2e,#7d4bcf,#e0538a)}
        .sheet{padding:15mm 16mm 18mm}
        .hd{display:flex;justify-content:space-between;align-items:center;gap:1rem;border-bottom:2px solid #eef2f8;padding-bottom:9px;margin-bottom:16px}
        .hd .b{display:flex;gap:10px;align-items:center} .hd img{width:46px;height:46px;object-fit:contain}
        .hd strong{font-size:14px;color:#17263d} .muted{color:#5a6b84;font-size:11.5px}
        .meta{text-align:right;font-size:11.5px;color:#5a6b84}
        h1{font-family:'Fraunces',Georgia,serif;font-weight:700;color:#0d5044;font-size:1.7rem;margin:0 0 .25em}
        h2{font-family:'Fraunces',Georgia,serif;font-weight:700;color:#0f8f83;font-size:1.15rem;margin:1.1em 0 .3em;border-bottom:1px solid #eef2f8;padding-bottom:.2em}
        h3{font-family:'Fraunces',Georgia,serif;font-weight:700;color:#5b34b0;font-size:1rem;margin:.9em 0 .2em}
        p{margin:.4em 0} ul,ol{margin:.4em 0 .4em 1.3em} li{margin:.2em 0}
        hr{border:none;border-top:1px solid #dbe6f2;margin:.9em 0}
        em{color:#6f8880}
        table{border-collapse:collapse;width:100%;margin:.6em 0;font-size:13px}
        th{background:#0f8f83;color:#fff;text-align:left;padding:6px 8px;border:1px solid #cdd8e2}
        td{padding:6px 8px;border:1px solid #e2e9f0}
        .doc-pagebreak{break-before:page;page-break-before:always;height:0;color:transparent;font-size:0}
        .doc-firma{margin-top:60px;text-align:center;break-inside:avoid}
        .doc-firma__line{width:270px;border-top:1px solid #17263d;margin:0 auto 6px}
        .doc-firma__name{font-weight:700;color:#17263d}
        .doc-firma__role{color:#5a6b84;font-size:12px}
        .doc-firma__stamp{margin-top:12px;color:#9aa7b6;font-size:11px;border:1px dashed #c4d0dc;border-radius:8px;width:210px;padding:22px 8px;margin-left:auto;margin-right:auto}
        .doc-firma__meta{margin-top:8px;color:#5a6b84;font-size:11px}
        .doc-anulado{margin:10px 0;border:2px solid #c62f3b;color:#c62f3b;border-radius:10px;padding:10px 14px;text-align:center}
        .doc-anulado__sello{font-weight:800;letter-spacing:.2em;font-size:1.3rem}
        .doc-code{color:#0d8175;font-weight:700}
      </style></head><body>
      <div class="franja"></div>
      <div class="sheet">
        <div class="hd"><div class="b"><img src="${logoData()}" alt="HUAP"><div><strong>Unidad de Buenas Prácticas Clínicas – UBPC</strong><div class="muted">Hospital de Urgencia Asistencia Pública</div></div></div>
          <div class="meta">${u.fechaCL(new Date())}<br>${u.esc(me ? me.nombre : "")}${rec.codigo ? `<br><span class="doc-code">${u.esc(rec.codigo)}</span> · v${rec.version || 1}` : ""}</div></div>
        ${rec.estado === "anulado" ? `<div class="doc-anulado"><div class="doc-anulado__sello">ANULADO</div><div><strong>Motivo:</strong> ${u.esc(rec.motivoAnulacion || "—")}</div></div>` : ""}
        <h1>${u.esc(titulo || "Documento")}</h1>${html}
        ${rec.estado === "finalizado" ? firmaHTML(rec) : ""}
      </div></body></html>`);
    w.document.close();
    const go = () => { try { w.focus(); w.print(); } catch (e) {} };
    if (w.document.fonts && w.document.fonts.ready) { w.document.fonts.ready.then(() => setTimeout(go, 150)); setTimeout(go, 1400); }
    else setTimeout(go, 500);
  }

  // Logo embebido para la ventana de impresión (ruta relativa no resuelve en la ventana nueva)
  let _logo = null;
  function logoData() {
    if (_logo != null) return _logo;
    try {
      const img = document.querySelector('.doc-page__brand img') || document.querySelector('.brand-mini__logo img');
      if (img) { const c = document.createElement("canvas"); c.width = img.naturalWidth || 96; c.height = img.naturalHeight || 96;
        c.getContext("2d").drawImage(img, 0, 0); _logo = c.toDataURL("image/png"); return _logo; }
    } catch (e) {}
    _logo = "assets/img/huap-logo.png"; return _logo;
  }

  U.docsEditor = { mount, ESTADOS, estadoDe, plMeta };
})();
