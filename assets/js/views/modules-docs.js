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

  function mount(container) { renderList(container); }

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
          return `<div class="doc-card" style="--tc:${p.color}">
            <div class="doc-card__top"><span class="doc-card__ic">${p.ic}</span>
              <span class="doc-card__tag">${u.esc(p.label)}</span></div>
            <h4 class="doc-card__title">${u.esc(d.titulo || "Documento sin título")}</h4>
            <div class="doc-card__meta">Modificado ${u.fechaCL(d.fechaModificacion)}${d.modificadoPor ? " · " + u.esc(d.modificadoPor) : ""}</div>
            <div class="doc-card__acts">
              <button class="btn btn--primary btn--sm" data-open="${d.id}">Abrir</button>
              <button class="btn btn--ghost btn--sm" data-del="${d.id}">🗑️</button></div></div>`;
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

  /* ---------- Editor ---------- */
  function openEditor(container, rec, tplKey) {
    const u = ui();
    const plantilla = rec ? rec.plantilla : tplKey;
    const p = plMeta(plantilla);
    const me = U.auth.current();
    const titulo = rec ? (rec.titulo || p.titulo) : p.titulo;
    const contenido = rec ? (rec.contenido || tplContenido(p)) : tplContenido(p);

    const tools = [
      { c: "bold", ic: "𝗕", t: "Negrita" }, { c: "italic", ic: "𝘐", t: "Cursiva" }, { c: "underline", ic: "U̲", t: "Subrayado" },
      { sep: 1 },
      { c: "formatBlock", v: "H2", ic: "T", t: "Título" }, { c: "formatBlock", v: "H3", ic: "t", t: "Subtítulo" }, { c: "formatBlock", v: "P", ic: "¶", t: "Texto normal" },
      { sep: 1 },
      { c: "insertUnorderedList", ic: "•", t: "Lista con viñetas" }, { c: "insertOrderedList", ic: "1.", t: "Lista numerada" },
      { sep: 1 },
      { c: "undo", ic: "↶", t: "Deshacer" }, { c: "redo", ic: "↷", t: "Rehacer" }
    ];
    const FONTS = [["", "Fuente…"], ["'Nunito Sans',sans-serif", "Nunito Sans"], ["Arial,Helvetica,sans-serif", "Arial"], ["Georgia,serif", "Georgia"], ["'Times New Roman',serif", "Times"], ["'Courier New',monospace", "Courier"]];
    const SIZES = [["", "Tamaño…"], ["2", "Pequeña"], ["3", "Normal"], ["4", "Media"], ["5", "Grande"], ["6", "Muy grande"], ["7", "Enorme"]];
    const btns = tools.map(x => x.sep ? `<span class="doc-tb__sep"></span>`
      : `<button class="doc-tb__btn" data-cmd="${x.c}" ${x.v ? `data-val="${x.v}"` : ""} title="${x.t}" type="button">${x.ic}</button>`).join("");
    const selFont = `<select class="doc-tb__sel" id="doc-font" title="Tipo de letra">${FONTS.map(o => `<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`;
    const selSize = `<select class="doc-tb__sel" id="doc-size" title="Tamaño de letra">${SIZES.map(o => `<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`;
    const toolbar = btns + `<span class="doc-tb__sep"></span>` + selFont + selSize
      + `<span class="doc-tb__sep"></span><button class="doc-tb__btn doc-tb__wide" id="doc-pagebreak" title="Insertar salto de página" type="button">⤓ Salto de hoja</button>`;

    container.innerHTML = `
      <div class="doc-editor">
        <div class="doc-bar no-print">
          <button class="btn btn--ghost btn--sm" id="doc-back">← Volver</button>
          <div class="doc-bar__title"><span class="tag" style="background:${p.color}22;color:${p.color}">${p.ic} ${u.esc(p.label)}</span></div>
          <div class="btn-row">
            <button class="btn btn--ghost btn--sm" id="doc-print">🖨️ Imprimir / PDF</button>
            <button class="btn btn--ghost btn--sm" id="doc-word">📄 Word</button>
            <button class="btn btn--primary btn--sm" id="doc-save">💾 Guardar</button>
          </div>
        </div>
        <div class="doc-tb no-print">${toolbar}</div>
        <div class="doc-page" id="doc-page">
          <div class="doc-page__franja"></div>
          <div class="doc-page__hd">
            <div class="doc-page__brand"><img src="assets/img/huap-logo.png" alt="HUAP">
              <div><strong>Unidad de Buenas Prácticas Clínicas – UBPC</strong>
              <div class="muted">Hospital de Urgencia Asistencia Pública</div></div></div>
            <div class="doc-page__meta">${u.fechaCL(new Date())}<br>${u.esc(me ? me.nombre : "")}</div>
          </div>
          <input class="doc-page__title" id="doc-title" value="${u.esc(titulo)}" placeholder="Título del documento">
          <div class="doc-page__body" id="doc-body" contenteditable="true">${contenido}</div>
        </div>
      </div>`;

    const page = document.getElementById("doc-page");
    const bodyEl = document.getElementById("doc-body");
    const titleEl = document.getElementById("doc-title");

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

    let current = rec;
    document.getElementById("doc-back").onclick = () => renderList(container);
    document.getElementById("doc-save").onclick = () => {
      const data = { titulo: titleEl.value.trim() || p.titulo, plantilla, contenido: bodyEl.innerHTML };
      if (current) S().update("docsTrabajo", current.id, data);
      else current = S().insert("docsTrabajo", data);
      u.toast("Documento guardado", "ok");
    };
    document.getElementById("doc-print").onclick = () => printDoc(titleEl.value, bodyEl.innerHTML, me);
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

  function printDoc(titulo, html, me) {
    const u = ui();
    const w = window.open("", "_blank");
    if (!w) { u.toast("Permite las ventanas emergentes para imprimir", "danger"); return; }
    const fr = new URL("assets/fonts/fraunces.woff2", document.baseURI).href;
    const ns = new URL("assets/fonts/nunitosans.woff2", document.baseURI).href;
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${u.esc(titulo || "Documento")}</title>
      <style>
        @font-face{font-family:'Fraunces';src:url('${fr}') format('woff2');font-weight:100 900;font-display:swap}
        @font-face{font-family:'Nunito Sans';src:url('${ns}') format('woff2');font-weight:200 900;font-display:swap}
        @page{size:A4;margin:0}
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
      </style></head><body>
      <div class="franja"></div>
      <div class="sheet">
        <div class="hd"><div class="b"><img src="${logoData()}" alt="HUAP"><div><strong>Unidad de Buenas Prácticas Clínicas – UBPC</strong><div class="muted">Hospital de Urgencia Asistencia Pública</div></div></div>
          <div class="meta">${u.fechaCL(new Date())}<br>${u.esc(me ? me.nombre : "")}</div></div>
        <h1>${u.esc(titulo || "Documento")}</h1>${html}
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

  U.docsEditor = { mount };
})();
