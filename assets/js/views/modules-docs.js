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
      label: "Plan de Mejora", ic: "🎯", color: "#e0912f",
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
      label: "Plan de Entrenamiento · Transferencia del Conocimiento", ic: "🎓", color: "#37a04a",
      titulo: "Plan de Entrenamiento · Transferencia del Conocimiento",
      html: `<h2>1. Brecha de conocimiento y fundamentación</h2><p>Brecha de conocimiento o práctica detectada (a partir de la guía BPSO) y su relación con la calidad y seguridad del cuidado. Programa RNAO · Knowledge-to-Action.</p>
        <h2>2. Guía BPSO y objetivos de transferencia</h2><p><strong>Guía BPSO:</strong> — · <strong>Unidad(es):</strong> —</p>
        <ul><li>Objetivo de transferencia 1</li><li>Objetivo de transferencia 2</li></ul>
        <h2>3. Población objetivo</h2><p>Estamentos, turnos y unidades a entrenar.</p>
        <h2>4. Contenidos, competencias y metodología</h2><ol><li>Contenido / competencia 1 — metodología (cápsula, taller, simulación, etc.)</li><li>Contenido / competencia 2 — metodología</li></ol>
        <h2>5. Cronograma y cobertura</h2>
        <table><thead><tr><th>Actividad</th><th>Fecha</th><th>Modalidad</th><th>Estamento</th><th>Responsable</th></tr></thead>
        <tbody><tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody></table>
        <h2>6. Evaluación de la transferencia</h2><p>Cómo se verifica que el conocimiento se transfirió a la práctica: evaluación del aprendizaje, cobertura por estamento y auditoría de la conducta clínica en el turno.</p>`
    },
    fichaBP: {
      label: "Boletín Clínico · Buena Práctica", ic: "📰", color: "#e0912f", sinPortada: true,
      titulo: "Boletín Clínico · Buenas Prácticas",
      html: `<div style="background:linear-gradient(120deg,#0d6b62,#12b5a5);color:#fff;border-radius:12px;padding:16px 20px;margin:0 0 14px">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.92;font-weight:700">Boletín Clínico · Unidad de Buenas Prácticas Clínicas</div>
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:800;margin:2px 0 3px">Título del boletín / buena práctica</div>
          <div style="font-size:13px;opacity:.92">Edición N° — · Fecha — · Unidad / guía —</div>
        </div>
        <div style="border-left:4px solid #7a5cd0;background:#f4f0fc;border-radius:10px;padding:10px 14px;margin:12px 0">
          <div style="font-weight:800;color:#5b34b0;text-transform:uppercase;letter-spacing:.5px;font-size:12px">📌 En esta edición</div>
          <p>Resumen breve de lo que trata este boletín (2–3 líneas).</p></div>
        <div style="border-left:4px solid #e0912f;background:#fdf3e3;border-radius:10px;padding:10px 14px;margin:12px 0">
          <div style="font-weight:800;color:#b56b12;text-transform:uppercase;letter-spacing:.5px;font-size:12px">⭐ Buena práctica destacada</div>
          <p>Describe la práctica: qué es, en qué unidad y por quién se aplica.</p></div>
        <div style="border-left:4px solid #0f8f83;background:#e9f6f3;border-radius:10px;padding:10px 14px;margin:12px 0">
          <div style="font-weight:800;color:#0d6b62;text-transform:uppercase;letter-spacing:.5px;font-size:12px">🔬 ¿Por qué importa? · Evidencia</div>
          <p>Evidencia o justificación clínica que respalda la práctica.</p></div>
        <div style="border-left:4px solid #1e9fe0;background:#e8f4fc;border-radius:10px;padding:10px 14px;margin:12px 0">
          <div style="font-weight:800;color:#1370a8;text-transform:uppercase;letter-spacing:.5px;font-size:12px">✅ Cómo aplicarla</div>
          <ol><li>Paso 1</li><li>Paso 2</li><li>Paso 3</li></ol></div>
        <div style="border-left:4px solid #37a04a;background:#eaf6ec;border-radius:10px;padding:10px 14px;margin:12px 0">
          <div style="font-weight:800;color:#2b7d3a;text-transform:uppercase;letter-spacing:.5px;font-size:12px">📊 Resultados / impacto</div>
          <p>Datos, indicadores o resultados obtenidos con la práctica.</p></div>
        <div style="background:#fff8e6;border:1px dashed #e0b23a;border-radius:10px;padding:12px 14px;margin:12px 0">
          <div style="font-weight:800;color:#a9791a;font-size:13px">💡 Recomendaciones clave</div>
          <ul><li>Recomendación 1</li><li>Recomendación 2</li></ul></div>
        <div style="border-left:4px solid #5f7d76;background:#f1f4f3;border-radius:10px;padding:10px 14px;margin:12px 0">
          <div style="font-weight:800;color:#4a615b;text-transform:uppercase;letter-spacing:.5px;font-size:12px">📚 Referencias y contacto</div>
          <p>Fuentes, guía BPSO relacionada y a quién contactar en la Unidad.</p></div>`
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
    },
    informeBPSO: {
      label: "Informe Anual BPSO", ic: "🏅", color: "#0d6ea8",
      titulo: "Informe Anual BPSO",
      html: `<h2>Informe Anual BPSO</h2>
        <p><strong>Nombre de la Organización:</strong> Hospital de Urgencia Asistencia Pública (HUAP)</p>
        <h2>1. Información general del BPSO</h2>
        <table><tbody>
          <tr><td width="45%"><b>Estatus de designación</b></td><td>Pre-Designación / Designado</td></tr>
          <tr><td><b>Cohorte (año)</b></td><td>—</td></tr>
          <tr><td><b>Número de sitios de implementación</b></td><td>—</td></tr>
          <tr><td><b>Nombre del Líder de la organización (SDGC)</b></td><td>—</td></tr>
          <tr><td><b>Correo electrónico del líder (SDGC)</b></td><td>—</td></tr>
          <tr><td><b>Nombre y cargo de quien reporta</b></td><td>—</td></tr>
          <tr><td><b>Correo electrónico de quien reporta</b></td><td>—</td></tr>
          <tr><td><b>Tiempo semanal asignado a la iniciativa BPSO</b></td><td>—</td></tr>
        </tbody></table>
        <h2>2. Resumen del progreso</h2>
        <h3>a) Champions / Líderes de Mejores Prácticas</h3>
        <p>Incorporación de una masa crítica de al menos el 15% del personal de enfermería como Líderes de Buenas Prácticas de la RNAO.</p>
        <p><strong>Objetivos de desarrollo de líderes:</strong></p>
        <ul><li>Año 1: 6%</li><li>Año 2: 6% adicional (totalizando 12%)</li><li>Año 3: 3% adicional (totalizando 15%)</li></ul>
        <p><strong>% a la fecha:</strong> — &nbsp; <em>(N° total de personas con el curso realizado y aprobado (Dotación SDGC) / N° total dotación de RRHH asignado a la SDGC × 100)</em></p>
        <h3>b) Otros profesionales capacitados como Champions</h3>
        <p>Número y profesión: —</p>
        <h3>c) Actividades destacadas del año coordinadas con la iniciativa BPSO</h3>
        <p>Nombre y descripción breve: —</p>
        <h2>3. Guías implementadas a la fecha</h2>
        <table><thead><tr><th>Guía</th><th width="30%">Edición</th></tr></thead><tbody><tr><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td></tr></tbody></table>
        <h2>4. Indicadores medidos y fecha de inicio de medición</h2>
        <table><thead><tr><th>Indicador</th><th width="35%">Fecha inicio medición</th></tr></thead><tbody><tr><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td></tr></tbody></table>
        <div class="doc-pagebreak" contenteditable="false">Salto de hoja</div>
        <h2>Avances en BPG #1 (Progress on BPG #1)</h2>
        <p><em>Máximo 1 página por guía (BPG). Copia este bloque para cada guía implementada.</em></p>
        <p><strong>Nombre de la guía:</strong> —</p>
        <h3>Capacitación (Training)</h3>
        <p>Cursos / metodología / número de personas capacitadas / horas certificadas / otros: —</p>
        <h3>Implementación (Implementation)</h3>
        <p>Estrategias de implementación, gestión de recursos y coordinaciones realizadas: —</p>
        <h3>NQuIRE</h3>
        <p>Resultados globales en porcentaje para cada indicador y su variación respecto al período anterior (caracterización del resultado): —</p>
        <h3>Otros (Other)</h3>
        <p>—</p>`
    }
  };

  const plMeta = k => PLANTILLAS[k] || PLANTILLAS.informeTecnico;
  const tplContenido = p => (typeof p.build === "function" ? p.build() : p.html);

  // Portada institucional (se agrega automáticamente a cada documento nuevo).
  // Es contenteditable="false": los datos NO se repiten en el membrete y no se
  // pueden alterar por accidente al escribir. El título se sincroniza al guardar.
  // ¿El documento pertenece al Programa RNAO / BPSO? (Plan de Mejora / Plan de Intervención)
  function esRNAO(rec) {
    if (!rec) return false;
    if (rec === true) return true;
    return rec.plantilla === "planMejora" || rec.plantilla === "planRNAO" || !!rec.planRef;
  }
  function coverHTML(titulo, label, programa) {
    const u = ui(), me = U.auth.current();
    return `<div class="doc-cover" contenteditable="false">`
      + `<div class="doc-cover__top">`
      + `<img class="doc-cover__logo" src="assets/img/huap-logo.png" alt="HUAP">`
      + `<div class="doc-cover__org"><div class="doc-cover__unit">Unidad de Buenas Prácticas Clínicas · UBPC</div>`
      + (programa ? `<div class="doc-cover__prog" style="color:#5b34b0;font-weight:700;font-size:.72rem;letter-spacing:.5px;text-transform:uppercase">Programa RNAO / BPSO</div>` : "")
      + `<div class="doc-cover__hosp">Hospital de Urgencia Asistencia Pública</div></div>`
      + `</div>`
      + `<div class="doc-cover__mid">`
      + (label ? `<div class="doc-cover__kind">${u.esc(label)}</div>` : "")
      + `<h1 class="doc-cover__title">${u.esc(titulo || "Documento institucional")}</h1>`
      + `<div class="doc-cover__rule"></div></div>`
      + `<div class="doc-cover__box">`
      + `<span class="doc-cover__f"><b>Código</b><span class="doc-cover__cod">__________</span></span>`
      + `<span class="doc-cover__f"><b>Versión</b><span class="doc-cover__ver">v1</span></span>`
      + `<span class="doc-cover__f"><b>Fecha</b><span class="doc-cover__fec">${u.fechaCL(new Date())}</span></span>`
      + `<span class="doc-cover__f"><b>Elaborado por</b>${u.esc(me ? me.nombre : "—")}</span>`
      + `</div>`
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
  // Mantiene el título de la portada igual al título del documento (al guardar)
  function syncCoverTitle(html, titulo) {
    try {
      const tmp = document.createElement("div"); tmp.innerHTML = html || "";
      const t = tmp.querySelector(".doc-cover__title");
      if (t) { t.textContent = titulo || "Documento institucional"; return tmp.innerHTML; }
      return html;
    } catch (e) { return html; }
  }

  /* ============================================================
     EXPORTACIÓN UNIFICADA — Impresión/PDF y Word comparten el MISMO
     formato. Se aplican estilos EN LÍNEA (pt) al contenido para que
     ambos motores (ventana de impresión y Word) rendericen igual.
     ============================================================ */
  function applyInlineExport(root) {
    const S1 = "font-family:Georgia,'Times New Roman',serif;";
    root.querySelectorAll("h1").forEach(h => h.setAttribute("style", S1 + "color:#0d5044;font-size:21pt;font-weight:700;margin:0 0 6pt"));
    root.querySelectorAll("h2").forEach(h => h.setAttribute("style", S1 + "color:#0f8f83;font-size:14pt;font-weight:700;margin:15pt 0 4pt;border-bottom:1px solid #dbe6f2;padding-bottom:2pt"));
    root.querySelectorAll("h3").forEach(h => h.setAttribute("style", S1 + "color:#5b34b0;font-size:12pt;font-weight:700;margin:12pt 0 3pt"));
    root.querySelectorAll("p").forEach(p => { if (!p.getAttribute("style")) p.setAttribute("style", "margin:5pt 0;line-height:1.5"); });
    root.querySelectorAll("ul,ol").forEach(l => l.setAttribute("style", "margin:5pt 0 5pt 18pt;line-height:1.5"));
    root.querySelectorAll("li").forEach(li => li.setAttribute("style", "margin:2pt 0"));
    root.querySelectorAll("hr").forEach(h => h.setAttribute("style", "border:none;border-top:1px solid #dbe6f2;margin:9pt 0"));
    root.querySelectorAll("table").forEach(t => { if (!t.classList.contains("doc-kv") && !t.classList.contains("doc-bpso")) t.setAttribute("style", "border-collapse:collapse;width:100%;margin:7pt 0;font-size:10.5pt"); t.setAttribute("cellspacing", "0"); });
    root.querySelectorAll("th").forEach(c => { if (c.closest("table.doc-bpso")) return; c.setAttribute("style", "background:#0f8f83;color:#fff;text-align:left;padding:5pt 7pt;border:1px solid #cdd8e2;font-weight:700"); });
    // Las tablas "ficha" (clave/valor) y el anexo BPSO conservan sus estilos en línea; el resto usa el estilo estándar.
    root.querySelectorAll("td").forEach(c => { if (c.closest("table.doc-kv") || c.closest("table.doc-bpso")) return; c.setAttribute("style", "padding:5pt 7pt;border:1px solid #e2e9f0;vertical-align:top"); });
    // Saltos de hoja
    root.querySelectorAll(".doc-pagebreak").forEach(d => { const br = document.createElement("div"); br.setAttribute("style", "page-break-before:always;height:0;font-size:0;line-height:0;border:none"); br.innerHTML = "&nbsp;"; d.replaceWith(br); });
  }
  // Portada con estilos en línea (idéntica en PDF y Word), a partir de rec/título
  function coverInline(titulo, label, me, rec) {
    const u = ui(); rec = rec || {};
    const cod = rec.codigo || "En trámite";
    const ver = "v" + (rec.version || 1);
    const fec = u.fechaCL(rec.fechaFinalizado || rec.fechaModificacion || new Date());
    const elab = rec.finalizadoPor || rec.aprobadoPor || (me ? me.nombre : "—");
    const cel = 'style="padding:6pt 12pt;border:1px solid #dbe6f2;font-size:9.5pt;color:#40536f"';
    return `<div align="center" style="text-align:center;padding:34pt 0">`
      + `<img src="${logoData()}" width="88" height="88" style="display:block;margin:0 auto 8pt"><br>`
      + `<div style="font-family:Georgia,serif;font-weight:700;font-size:14pt;color:#0d5044">Unidad de Buenas Prácticas Clínicas · UBPC</div>`
      + (esRNAO(rec) ? `<div style="color:#5b34b0;font-weight:700;font-size:9.5pt;letter-spacing:1pt;text-transform:uppercase;margin-top:2pt">Programa RNAO / BPSO</div>` : "")
      + `<div style="color:#5a6b84;font-size:10pt;margin-bottom:20pt">Hospital de Urgencia Asistencia Pública</div>`
      + (label ? `<div style="color:#5b34b0;font-weight:700;font-size:10.5pt;letter-spacing:1pt;text-transform:uppercase;margin-bottom:6pt">${u.esc(label)}</div>` : "")
      + `<div style="font-family:Georgia,serif;color:#17263d;font-size:24pt;font-weight:700;margin:0 40pt 10pt">${u.esc(titulo || "Documento institucional")}</div>`
      + `<div style="width:70pt;height:3pt;background:#12b5a5;margin:0 auto 22pt;font-size:0">&nbsp;</div>`
      + `<table cellspacing="0" style="border-collapse:collapse;margin:0 auto;font-size:9.5pt"><tr>`
      + `<td ${cel}><b>Código</b><br>${u.esc(cod)}</td>`
      + `<td ${cel}><b>Versión</b><br>${u.esc(ver)}</td>`
      + `<td ${cel}><b>Fecha</b><br>${u.esc(fec)}</td>`
      + `<td ${cel}><b>Elaborado por</b><br>${u.esc(elab)}</td>`
      + `</tr></table></div><div style="page-break-before:always;height:0;font-size:0;line-height:0">&nbsp;</div>`;
  }
  // Membrete (letterhead) para las páginas de contenido — mismo en PDF y Word
  function membreteInline(me, rec) {
    const u = ui(); rec = rec || {};
    return `<div style="border-top:6px solid #12b5a5;height:0;font-size:0;margin:0 0 10pt">&nbsp;</div>`
      + `<table cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:12pt"><tr>`
      + `<td style="border:none;padding:0;font-size:10.5pt;vertical-align:middle"><b>Unidad de Buenas Prácticas Clínicas · UBPC</b>${esRNAO(rec) ? `<br><span style="color:#5b34b0;font-weight:700;font-size:8pt;letter-spacing:.5pt">PROGRAMA RNAO / BPSO</span>` : ""}<br><span style="color:#5a6b84;font-size:8.5pt">Hospital de Urgencia Asistencia Pública</span></td>`
      + `<td style="border:none;padding:0;text-align:right;color:#5a6b84;font-size:8.5pt;vertical-align:middle">${u.fechaCL(new Date())}${rec.codigo ? `<br><span style="color:#0d8175;font-weight:700">${u.esc(rec.codigo)}</span> · v${rec.version || 1}` : ""}</td>`
      + `</tr></table>`;
  }
  // Construye el cuerpo exportable (idéntico para PDF y Word), sin repetir datos.
  // Si el contenido trae portada, esta va como página 1 y NO se repite el título.
  function buildExportBody(titulo, bodyHTML, me, rec, label) {
    rec = rec || {};
    const u = ui();
    const tmp = document.createElement("div"); tmp.innerHTML = bodyHTML || "";
    const coverEl = tmp.querySelector(".doc-cover");
    const hasCover = !!coverEl;
    if (coverEl) {
      // quita la portada editable y el salto que la sigue (los reemplaza la portada inline)
      let nxt = coverEl.nextElementSibling;
      coverEl.remove();
      if (nxt && nxt.classList && nxt.classList.contains("doc-pagebreak")) { const after = nxt.nextElementSibling; nxt.remove(); if (after && after.tagName === "P" && !after.textContent.trim()) after.remove(); }
    }
    applyInlineExport(tmp);
    const anulado = rec.estado === "anulado"
      ? `<div style="margin:10pt 0;border:2px solid #c62f3b;color:#c62f3b;padding:8pt 12pt;text-align:center"><div style="font-weight:800;letter-spacing:3pt;font-size:15pt">ANULADO</div><div style="font-size:9.5pt"><b>Motivo:</b> ${u.esc(rec.motivoAnulacion || "—")}</div></div>`
      : "";
    const firma = rec.estado === "finalizado" ? firmaInline(me, rec) : "";
    let out = "";
    if (hasCover) out += coverInline(titulo, label, me, rec);
    out += membreteInline(me, rec) + anulado;
    const sinPortada = rec.plantilla && PLANTILLAS[rec.plantilla] && PLANTILLAS[rec.plantilla].sinPortada;
    if (!hasCover && !sinPortada) out += `<h1 style="font-family:Georgia,serif;color:#0d5044;font-size:21pt;font-weight:700;margin:0 0 6pt">${u.esc(titulo || "Documento")}</h1>`;
    out += tmp.innerHTML + firma;
    return out;
  }
  function firmaInline(me, rec) {
    const u = ui(); rec = rec || {};
    const nombre = rec.finalizadoPor || (me ? me.nombre : "");
    const fecha = rec.fechaFinalizado ? u.fechaCL(rec.fechaFinalizado) : u.fechaCL(new Date());
    return `<div style="margin-top:44pt;text-align:center;page-break-inside:avoid">`
      + `<div style="width:200pt;border-top:1px solid #17263d;margin:0 auto 5pt">&nbsp;</div>`
      + `<div style="font-weight:700;color:#17263d">${u.esc(nombre)}</div>`
      + `<div style="color:#5a6b84;font-size:9.5pt">Coordinador/a · Unidad de Buenas Prácticas Clínicas – UBPC</div>`
      + `<div style="margin:9pt auto 0;color:#9aa7b6;font-size:8.5pt;border:1px dashed #c4d0dc;width:150pt;padding:16pt 6pt">Espacio para firma y timbre</div>`
      + `<div style="margin-top:6pt;color:#5a6b84;font-size:8.5pt">${rec.codigo ? u.esc(rec.codigo) + " · " : ""}Versión ${rec.version || 1} · ${fecha}</div></div>`;
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
    renderList(container, params);
  }

  /* ---------- Listado + galería de plantillas ---------- */
  function renderList(container, params) {
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
          return `<div class="doc-card" data-estado="${u.esc(d.estado || "borrador")}" style="--tc:${p.color}">
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

    // Lucecita: al llegar desde "Próximos pasos", resalta los documentos del estado pedido
    if (params && params.focus) {
      const target = { borradores: "borrador", aprobados: "aprobado" }[params.focus];
      if (target) {
        const cards = [...container.querySelectorAll('.doc-card[data-estado="' + target + '"]')];
        if (cards.length) {
          cards.forEach(c => c.classList.add("is-spotlight"));
          setTimeout(() => { try { cards[0].scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {} }, 100);
          setTimeout(() => cards.forEach(c => c.classList.remove("is-spotlight")), 5400);
        }
      }
    }
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
      planData: doc.planData || undefined, // conserva el formulario del Plan RNAO al versionar
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
    // Documento vinculado a un Plan de Intervención y aún en borrador:
    // se regenera desde el plan (fuente única) para reflejar los últimos cambios.
    if (rec && rec.planRef && (rec.estado || "borrador") === "borrador") {
      const plan = S().get("planesIntervencion", rec.planRef);
      if (plan) {
        const titulo = "Plan de Mejora · " + (plan.guia || "RNAO") + (plan.unidad ? " · " + plan.unidad : "");
        const contenido = coverHTML(titulo, PLANTILLAS.planMejora.label, true) + planMejoraContentFromPlan(plan);
        if (contenido !== rec.contenido || titulo !== rec.titulo) { S().update("docsTrabajo", rec.id, { titulo, contenido }); rec = S().get("docsTrabajo", rec.id); }
      }
    }
    const plantilla = rec ? rec.plantilla : tplKey;
    // El Plan RNAO/BPSO usa un formulario guiado en lugar del editor libre.
    if (plantilla === "planRNAO") return openPlanRNAO(container, rec, tplKey);
    const p = plMeta(plantilla);
    const me = U.auth.current();
    const titulo = rec ? (rec.titulo || p.titulo) : p.titulo;
    // Documento nuevo: incluye portada institucional automáticamente.
    const contenido = rec ? (rec.contenido || tplContenido(p)) : ((p.sinPortada ? "" : coverHTML(p.titulo, p.label)) + tplContenido(p));

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

    const hasCover = /doc-cover/.test(contenido);
    container.innerHTML = `
      <div class="doc-editor">
        <div class="doc-tools no-print">
          <div class="doc-bar">
            <button class="btn btn--ghost btn--sm" id="doc-back">← Volver</button>
            <div class="doc-bar__title"><span class="tag" style="background:${p.color}22;color:${p.color}">${p.ic} ${u.esc(p.label)}</span> ${estadoBadge}</div>
            <div class="btn-row">
              ${histBtn}
              <button class="btn btn--ghost btn--sm" id="doc-print">🖨️ Imprimir / PDF</button>
              <button class="btn btn--ghost btn--sm" id="doc-word">📄 Word</button>
              ${locked ? "" : `<button class="btn btn--primary btn--sm" id="doc-save">💾 Guardar</button>`}
            </div>
          </div>
          ${wf || locked ? `<div class="doc-wf">${wf}${locked ? `<span class="doc-wf__lock">🔒 Documento bloqueado (solo lectura)</span>` : ""}</div>` : ""}
          ${rec && rec.planRef ? `<div class="doc-linked">📎 Documento vinculado al <strong>Plan de Intervención RNAO/BPSO</strong>. Se genera y sincroniza desde el plan; edita el plan para cambiar el contenido, y valídalo aquí (Aprobar → Finalizar). <a href="#/coord/m3?tab=planes&plan=${u.esc(rec.planRef)}">Abrir el plan →</a> <button class="btn btn--ghost btn--sm" id="doc-regen" type="button" style="margin-left:.4rem">🔄 Actualizar al formato nuevo</button></div>` : ""}
          ${locked ? "" : `<div class="doc-tb">${toolbar}</div>`}
        </div>
        <div class="doc-page ${hasCover ? "doc-page--cover" : ""}" id="doc-page">
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

    // ---- Puntero visible: resalta el bloque (párrafo/título) donde está el cursor ----
    const blockOf = node => {
      let n = node && node.nodeType === 3 ? node.parentNode : node;
      while (n && n !== bodyEl && n.parentNode !== bodyEl) n = n.parentNode;
      return (n && n !== bodyEl && n.nodeType === 1) ? n : null;
    };
    const markActive = () => {
      bodyEl.querySelectorAll(".is-active-block").forEach(el => el.classList.remove("is-active-block"));
      const s = window.getSelection();
      if (!s || !s.rangeCount || !bodyEl.contains(s.anchorNode)) return;
      const b = blockOf(s.anchorNode);
      if (b && !b.classList.contains("doc-cover") && !b.classList.contains("doc-pagebreak")) b.classList.add("is-active-block");
    };
    bodyEl.addEventListener("keyup", markActive);
    bodyEl.addEventListener("mouseup", markActive);
    bodyEl.addEventListener("focus", markActive);
    bodyEl.addEventListener("blur", () => bodyEl.querySelectorAll(".is-active-block").forEach(el => el.classList.remove("is-active-block")));

    // ---- Enter controlado: inserta un párrafo limpio, sin copiar/duplicar contenido ----
    // Los títulos (H1/H2/H3) salen a texto normal al presionar Enter, y nunca se
    // arrastra el formato ni el texto de la línea anterior.
    bodyEl.addEventListener("keydown", e => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const s = window.getSelection();
      if (!s || !s.rangeCount || !bodyEl.contains(s.anchorNode)) return;
      const blk = blockOf(s.anchorNode);
      const isHeading = blk && /^H[1-6]$/.test(blk.tagName);
      const atEnd = blk && s.isCollapsed && (() => {
        const r = s.getRangeAt(0).cloneRange(); r.selectNodeContents(blk); r.setStart(s.anchorNode, s.anchorOffset);
        return r.toString().trim() === "";
      })();
      // Solo intervenimos en el caso problemático: fin de un título → nuevo párrafo vacío.
      if (isHeading && atEnd) {
        e.preventDefault();
        const pNew = document.createElement("p"); pNew.innerHTML = "<br>";
        blk.parentNode.insertBefore(pNew, blk.nextSibling);
        const r = document.createRange(); r.setStart(pNew, 0); r.collapse(true);
        s.removeAllRanges(); s.addRange(r); saveSel(); markActive();
      }
    });

    // ---- Pegar como texto limpio: evita traer estilos y "cosas copiadas" raras ----
    bodyEl.addEventListener("paste", e => {
      const cd = e.clipboardData || window.clipboardData; if (!cd) return;
      e.preventDefault();
      const text = cd.getData("text/plain") || "";
      const html = text.split(/\r?\n/).map(l => l.trim() === "" ? "<br>" : u.esc(l)).join("<br>");
      try { document.execCommand("insertHTML", false, html); } catch (err) { try { document.execCommand("insertText", false, text); } catch (e2) {} }
      saveSel();
    });

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
      const titulo = titleEl.value.trim() || p.titulo;
      // Sincroniza el título de la portada con el título del documento (sin repetir edición)
      if (bodyEl.querySelector(".doc-cover")) {
        const ct = bodyEl.querySelector(".doc-cover__title"); if (ct) ct.textContent = titulo;
      }
      const data = { titulo, plantilla, contenido: bodyEl.innerHTML, tamano: sheet };
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
    document.getElementById("doc-print").onclick = () => printDoc(titleEl.value, bodyEl.innerHTML, me, sheet, current || { plantilla });
    document.getElementById("doc-word").onclick = () =>
      exportWordDoc(titleEl.value || p.titulo, bodyEl.innerHTML, me, current || { plantilla }, "documento-ubpc");
    // Regenera el documento vinculado desde el plan (aplica el formato actual),
    // conservando código y versión si ya los tiene (revisado/finalizado).
    const regenBtn = document.getElementById("doc-regen");
    if (regenBtn) regenBtn.onclick = () => {
      if (!current || !current.planRef) return;
      const plan = S().get("planesIntervencion", current.planRef);
      if (!plan) { u.toast("No se encontró el plan vinculado", "danger"); return; }
      const t = "Plan de Mejora · " + (plan.guia || "RNAO") + (plan.unidad ? " · " + plan.unidad : "");
      let contenido = coverHTML(t, PLANTILLAS.planMejora.label, true) + planMejoraContentFromPlan(plan);
      if (current.codigo) contenido = stampCover(contenido, current.codigo, current.version);
      S().update("docsTrabajo", current.id, { titulo: t, contenido });
      u.toast("Documento actualizado al formato nuevo", "ok");
      reopen(container, current.id);
    };
  }

  /* ============================================================
     PLAN RNAO / BPSO — Formulario guiado (8 secciones)
     ============================================================ */
  const KTA = ["Identificar el problema", "Adaptar el conocimiento al contexto local",
    "Evaluar barreras y facilitadores", "Seleccionar e implementar intervenciones",
    "Monitorear el uso del conocimiento", "Evaluar resultados", "Sostener el uso del conocimiento"];
  const EST_SEG = ["Pendiente", "En curso", "Completado", "Retrasado"];
  const EST_CIERRE = ["En ejecución", "Cerrado", "Suspendido"];
  const ACT_COLS = [
    { f: "actividad", label: "Actividad" }, { f: "responsable", label: "Responsable" },
    { f: "recursos", label: "Recursos" }, { f: "verificador", label: "Verificador" },
    { f: "kta", label: "Etapa KTA", type: "select", options: KTA }];
  const SEG_COLS = [
    { f: "fecha", label: "Fecha", type: "date" }, { f: "descripcion", label: "Descripción / avance" },
    { f: "avance", label: "% avance", type: "number" }, { f: "estado", label: "Estado", type: "select", options: EST_SEG }];
  const ACC_COLS = [
    { f: "accion", label: "Acción de mejora" }, { f: "responsable", label: "Responsable" },
    { f: "plazo", label: "Plazo", type: "date" }, { f: "estado", label: "Estado", type: "select", options: EST_SEG },
    { f: "resultado", label: "Resultado / observación" }];
  const REP_COLS = { actividades: ACT_COLS, seguimientos: SEG_COLS, acciones: ACC_COLS };
  const REP_ADD = { actividades: "Agregar actividad", seguimientos: "Agregar seguimiento", acciones: "Agregar acción" };
  const pnum = v => (v === "" || v == null || isNaN(v)) ? null : Number(v);

  function pfld(name, label, help, opt) {
    opt = opt || {}; const u = ui(); const id = "pf-" + name;
    const req = opt.req ? ' <span class="pf-req">*</span>' : "";
    const val = opt.value == null ? "" : opt.value;
    let ctrl;
    if (opt.type === "textarea") ctrl = `<textarea class="input" id="${id}" data-pf="${name}" rows="${opt.rows || 2}" ${opt.req ? "data-req" : ""} ${opt.ro ? "readonly" : ""}>${u.esc(val)}</textarea>`;
    else if (opt.type === "select") ctrl = `<select class="input" id="${id}" data-pf="${name}">${(opt.options || []).map(o => `<option ${String(o) === String(val) ? "selected" : ""}>${u.esc(o)}</option>`).join("")}</select>`;
    else ctrl = `<input class="input" id="${id}" data-pf="${name}" type="${opt.type || "text"}" value="${u.esc(val)}" ${opt.req ? "data-req" : ""} ${opt.ro ? "readonly" : ""}>`;
    return `<div class="pf-field ${opt.full ? "pf-field--full" : ""}"><label for="${id}">${u.esc(label)}${req}</label>${ctrl}${help ? `<span class="pf-help">${u.esc(help)}</span>` : ""}</div>`;
  }
  function repRow(rep, values) {
    const u = ui(); const cols = REP_COLS[rep]; values = values || {};
    return `<tr data-reprow>${cols.map(c => {
      const v = values[c.f] == null ? "" : values[c.f];
      let ctrl;
      if (c.type === "select") ctrl = `<select class="input input--sm" data-f="${c.f}">${c.options.map(o => `<option ${String(o) === String(v) ? "selected" : ""}>${u.esc(o)}</option>`).join("")}</select>`;
      else ctrl = `<input class="input input--sm" data-f="${c.f}" type="${c.type || "text"}" value="${u.esc(v)}">`;
      return `<td data-col="${c.f}">${ctrl}</td>`;
    }).join("")}<td class="pf-rep__x"><button type="button" class="btn-icon" data-reprm title="Quitar fila">🗑️</button></td></tr>`;
  }
  function repTable(rep, rows) {
    const u = ui(); const cols = REP_COLS[rep]; rows = (rows && rows.length) ? rows : [];
    return `<div class="pf-rep" data-rep="${rep}">
      <div class="table-wrap"><table class="tbl pf-rep__t"><thead><tr>${cols.map(c => `<th>${u.esc(c.label)}</th>`).join("")}<th></th></tr></thead>
      <tbody>${rows.map(r => repRow(rep, r)).join("")}</tbody></table></div>
      <button type="button" class="btn btn--ghost btn--sm" data-repadd="${rep}">+ ${u.esc(REP_ADD[rep])}</button></div>`;
  }
  function secH(n, t) { return `<div class="pf-sec-h"><span class="pf-sec-n">${n}</span><h3>${t}</h3></div>`; }

  function planFormHTML(data) {
    const me = U.auth.current();
    const variTxt = (pnum(data.evalPost) != null && pnum(data.evalBase) != null) ? (pnum(data.evalPost) - pnum(data.evalBase)) : "";
    const cumplTxt = (pnum(data.evalPost) != null && pnum(data.evalMeta) > 0) ? Math.round(pnum(data.evalPost) / pnum(data.evalMeta) * 100) : "";
    return `<div class="plan-form">
      <section class="pf-section">${secH(1, "Identificación del plan")}
        <div class="pf-grid">
          ${pfld("nombre", "Nombre del plan", "Título claro y específico. Ej: “Plan LPP · UTI 2026”.", { value: data.nombre, req: true, full: true })}
          ${pfld("unidades", "Unidad(es) implementadora(s)", "Unidades clínicas donde se aplica el plan.", { value: data.unidades })}
          ${pfld("coordinador", "Coordinador/a responsable", "Quién lidera y responde por el plan.", { value: data.coordinador != null ? data.coordinador : (me ? me.nombre : "") })}
          ${pfld("fechaInicio", "Fecha de inicio", "Cuándo comienza la implementación.", { value: data.fechaInicio, type: "date" })}
          ${pfld("periodo", "Período / año", "Ej: 2026 o 2026–2027.", { value: data.periodo })}
        </div></section>

      <section class="pf-section">${secH(2, "Guía, recomendación y brecha")}
        <div class="pf-grid">
          ${pfld("guia", "Guía BPSO / RNAO", "Guía de buenas prácticas de referencia.", { value: data.guia, req: true })}
          ${pfld("lineaBaseCumpl", "Cumplimiento línea base (%)", "Nivel de cumplimiento medido al inicio.", { value: data.lineaBaseCumpl, type: "number" })}
          ${pfld("recomendacion", "Recomendación abordada", "Recomendación específica de la guía que se trabaja.", { value: data.recomendacion, type: "textarea", full: true })}
          ${pfld("brecha", "Brecha detectada", "Diferencia entre la práctica actual y la recomendada.", { value: data.brecha, type: "textarea", full: true })}
        </div></section>

      <section class="pf-section">${secH(3, "Objetivos, actividades, responsables, recursos, verificadores y etapa KTA")}
        ${pfld("objetivoGeneral", "Objetivo general", "Propósito central del plan.", { value: data.objetivoGeneral, type: "textarea", req: true, full: true })}
        ${pfld("objetivosEspecificos", "Objetivos específicos", "Escribe uno por línea.", { value: data.objetivosEspecificos, type: "textarea", full: true })}
        <div class="pf-rep-lbl">Actividades <span class="pf-help">Agrega todas las que necesites. La etapa KTA ubica cada actividad en el ciclo Conocimiento→Acción.</span></div>
        ${repTable("actividades", data.actividades)}</section>

      <section class="pf-section">${secH(4, "Plazos, seguimientos, avance, cierre y lecciones aprendidas")}
        <div class="pf-grid">
          ${pfld("plazoInicio", "Plazo · inicio", "", { value: data.plazoInicio, type: "date" })}
          ${pfld("plazoFin", "Plazo · término", "Fecha comprometida de término.", { value: data.plazoFin, type: "date" })}
          ${pfld("avanceGlobal", "Avance global (%)", "Estimación del avance total del plan.", { value: data.avanceGlobal, type: "number" })}
          ${pfld("fechaCierre", "Fecha de cierre", "Cuándo se cerró (si aplica).", { value: data.fechaCierre, type: "date" })}
          ${pfld("estadoCierre", "Estado del plan", "", { value: data.estadoCierre || "En ejecución", type: "select", options: EST_CIERRE })}
        </div>
        <div class="pf-rep-lbl">Seguimientos cronológicos <span class="pf-help">Registra cada revisión con su fecha, avance y estado.</span></div>
        ${repTable("seguimientos", data.seguimientos)}
        ${pfld("lecciones", "Lecciones aprendidas", "Aprendizajes, qué funcionó y qué mejorar a futuro.", { value: data.lecciones, type: "textarea", full: true, rows: 3 })}</section>

      <section class="pf-section">${secH(5, "Acciones de mejora")}
        <div class="pf-rep-lbl">Tabla de acciones <span class="pf-help">Acciones concretas para cerrar la brecha, con responsable, plazo y estado.</span></div>
        ${repTable("acciones", data.acciones)}</section>

      <section class="pf-section">${secH(6, "Comunicación y participación")}
        <div class="pf-grid">
          ${pfld("comunicacion", "Estrategia de comunicación", "Cómo se comunica el plan al equipo.", { value: data.comunicacion, type: "textarea", full: true })}
          ${pfld("participantes", "Equipo y participantes", "Personas y roles que participan (Red Champion, referentes).", { value: data.participantes, type: "textarea", full: true })}
          ${pfld("participacion", "Instancias de participación", "Reuniones, comités o espacios de trabajo conjunto.", { value: data.participacion, type: "textarea", full: true })}
          ${pfld("difusion", "Difusión y sensibilización", "Acciones de difusión realizadas o planificadas.", { value: data.difusion, type: "textarea", full: true })}
        </div></section>

      <section class="pf-section">${secH(7, "Barreras, facilitadores, riesgos y recursos")}
        <div class="pf-grid">
          ${pfld("barreras", "Barreras", "Obstáculos que dificultan la implementación.", { value: data.barreras, type: "textarea", full: true })}
          ${pfld("facilitadores", "Facilitadores", "Factores que favorecen la implementación.", { value: data.facilitadores, type: "textarea", full: true })}
          ${pfld("riesgos", "Riesgos", "Riesgos identificados y su mitigación.", { value: data.riesgos, type: "textarea", full: true })}
          ${pfld("recursos", "Recursos", "Recursos humanos, materiales y de coordinación.", { value: data.recursos, type: "textarea", full: true })}
        </div></section>

      <section class="pf-section">${secH(8, "Evaluación de resultados")}
        <div class="pf-grid">
          ${pfld("evalBase", "Línea base (%)", "Medición inicial.", { value: data.evalBase, type: "number" })}
          ${pfld("evalPost", "Resultado posterior (%)", "Medición tras la intervención.", { value: data.evalPost, type: "number" })}
          ${pfld("variacion", "Variación (pts)", "Se calcula solo: posterior − base.", { value: variTxt, ro: true })}
          ${pfld("evalMeta", "Meta (%)", "Meta comprometida.", { value: data.evalMeta, type: "number" })}
          ${pfld("cumplimiento", "Cumplimiento (%)", "Se calcula solo: posterior ÷ meta × 100.", { value: cumplTxt, ro: true })}
        </div>
        <div class="pf-grid">
          ${pfld("evalA1", "Resultado Año 1", "", { value: data.evalA1 })}
          ${pfld("evalA2", "Resultado Año 2", "", { value: data.evalA2 })}
          ${pfld("evalA3", "Resultado Año 3", "", { value: data.evalA3 })}
        </div>
        ${pfld("conclusion", "Conclusión", "Síntesis del resultado y decisión (sostener, ajustar, escalar).", { value: data.conclusion, type: "textarea", full: true, rows: 3 })}</section>
    </div>`;
  }

  function readPlanForm(root) {
    const d = {};
    root.querySelectorAll("[data-pf]").forEach(el => { d[el.dataset.pf] = (el.value || "").trim(); });
    Object.keys(REP_COLS).forEach(rep => {
      const cols = REP_COLS[rep];
      d[rep] = [...root.querySelectorAll(`[data-rep="${rep}"] [data-reprow]`)].map(tr => {
        const o = {}; cols.forEach(c => { const el = tr.querySelector(`[data-f="${c.f}"]`); o[c.f] = el ? (el.value || "").trim() : ""; }); return o;
      }).filter(o => Object.keys(o).some(k => o[k] !== ""));
    });
    d.variacion = (pnum(d.evalPost) != null && pnum(d.evalBase) != null) ? (pnum(d.evalPost) - pnum(d.evalBase)) : "";
    d.cumplimiento = (pnum(d.evalPost) != null && pnum(d.evalMeta) > 0) ? Math.round(pnum(d.evalPost) / pnum(d.evalMeta) * 100) : "";
    return d;
  }

  // Genera el documento HTML del plan (para portada, impresión, PDF, Word e historial)
  function planToHTML(data) {
    const u = ui();
    const e = v => u.esc(v != null && String(v).trim() !== "" ? v : "—");
    const pct = v => (v != null && String(v).trim() !== "" && !isNaN(v)) ? v + "%" : "—";
    const par = t => (t && t.trim()) ? `<p>${u.esc(t).replace(/\r?\n/g, "<br>")}</p>` : "<p>—</p>";
    const list = t => { const it = (t || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean); return it.length ? `<ul>${it.map(i => `<li>${u.esc(i)}</li>`).join("")}</ul>` : "<p>—</p>"; };
    const tbl = (rep, rows) => {
      const cols = REP_COLS[rep];
      if (!rows || !rows.length) return "<p>—</p>";
      return `<table><thead><tr>${cols.map(c => `<th>${u.esc(c.label)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${e(r[c.f])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    };
    const vari = (pnum(data.evalPost) != null && pnum(data.evalBase) != null) ? ((pnum(data.evalPost) - pnum(data.evalBase) > 0 ? "+" : "") + (pnum(data.evalPost) - pnum(data.evalBase)) + " pts") : "—";
    const cumpl = (pnum(data.evalPost) != null && pnum(data.evalMeta) > 0) ? Math.round(pnum(data.evalPost) / pnum(data.evalMeta) * 100) + "%" : "—";
    return `<h2>1. Identificación del plan</h2>
      <p><strong>Nombre:</strong> ${e(data.nombre)} · <strong>Unidad(es):</strong> ${e(data.unidades)}<br>
      <strong>Coordinador/a:</strong> ${e(data.coordinador)} · <strong>Inicio:</strong> ${e(data.fechaInicio)} · <strong>Período:</strong> ${e(data.periodo)}</p>
      <h2>2. Guía, recomendación y brecha</h2>
      <p><strong>Guía BPSO / RNAO:</strong> ${e(data.guia)} · <strong>Línea base:</strong> ${pct(data.lineaBaseCumpl)}</p>
      <p><strong>Recomendación:</strong></p>${par(data.recomendacion)}
      <p><strong>Brecha detectada:</strong></p>${par(data.brecha)}
      <h2>3. Objetivos, actividades y etapa KTA</h2>
      <p><strong>Objetivo general:</strong></p>${par(data.objetivoGeneral)}
      <p><strong>Objetivos específicos:</strong></p>${list(data.objetivosEspecificos)}
      <p><strong>Actividades:</strong></p>${tbl("actividades", data.actividades)}
      <h2>4. Plazos, seguimientos, avance y cierre</h2>
      <p><strong>Plazo:</strong> ${e(data.plazoInicio)} → ${e(data.plazoFin)} · <strong>Avance global:</strong> ${pct(data.avanceGlobal)} · <strong>Estado:</strong> ${e(data.estadoCierre)} · <strong>Cierre:</strong> ${e(data.fechaCierre)}</p>
      <p><strong>Seguimientos:</strong></p>${tbl("seguimientos", data.seguimientos)}
      <p><strong>Lecciones aprendidas:</strong></p>${par(data.lecciones)}
      <h2>5. Acciones de mejora</h2>${tbl("acciones", data.acciones)}
      <h2>6. Comunicación y participación</h2>
      <p><strong>Estrategia de comunicación:</strong></p>${par(data.comunicacion)}
      <p><strong>Equipo y participantes:</strong></p>${par(data.participantes)}
      <p><strong>Instancias de participación:</strong></p>${par(data.participacion)}
      <p><strong>Difusión:</strong></p>${par(data.difusion)}
      <h2>7. Barreras, facilitadores, riesgos y recursos</h2>
      <p><strong>Barreras:</strong></p>${par(data.barreras)}
      <p><strong>Facilitadores:</strong></p>${par(data.facilitadores)}
      <p><strong>Riesgos:</strong></p>${par(data.riesgos)}
      <p><strong>Recursos:</strong></p>${par(data.recursos)}
      <h2>8. Evaluación de resultados</h2>
      <table><thead><tr><th>Línea base</th><th>Resultado posterior</th><th>Variación</th><th>Meta</th><th>Cumplimiento</th></tr></thead>
      <tbody><tr><td>${pct(data.evalBase)}</td><td>${pct(data.evalPost)}</td><td>${vari}</td><td>${pct(data.evalMeta)}</td><td>${cumpl}</td></tr></tbody></table>
      <table><thead><tr><th>Resultado Año 1</th><th>Resultado Año 2</th><th>Resultado Año 3</th></tr></thead>
      <tbody><tr><td>${e(data.evalA1)}</td><td>${e(data.evalA2)}</td><td>${e(data.evalA3)}</td></tr></tbody></table>
      <p><strong>Conclusión:</strong></p>${par(data.conclusion)}`;
  }

  function openPlanRNAO(container, rec, tplKey) {
    const u = ui();
    const me = U.auth.current();
    const p = PLANTILLAS.planRNAO;
    const estado = (rec && rec.estado) || "borrador";
    const est = ESTADOS[estado] || ESTADOS.borrador;
    const locked = estado !== "borrador";
    const version = (rec && rec.version) || 1;
    const codigo = rec && rec.codigo;
    const data = (rec && rec.planData) ? rec.planData : { actividades: [], seguimientos: [], acciones: [] };
    let current = rec;
    let sheet = (rec && rec.tamano) || "a4";

    const estadoBadge = `<span class="doc-estado" style="--ec:${est.color}">${est.ic} ${u.esc(est.label)}${codigo ? " · " + u.esc(codigo) : ""}${(version > 1 || locked) ? " · v" + version : ""}</span>`;
    let wf = "";
    if (estado === "borrador") wf = `<button class="btn btn--primary btn--sm" id="wf-aprobar">✔️ Aprobar (Coordinador)</button>`;
    else if (estado === "aprobado") wf = `<button class="btn btn--primary btn--sm" id="wf-finalizar">🔒 Asignar código y finalizar</button><button class="btn btn--ghost btn--sm" id="wf-borrador">↩️ Volver a borrador</button>`;
    else if (estado === "finalizado") wf = `<button class="btn btn--primary btn--sm" id="wf-version">🆕 Nueva versión</button><button class="btn btn--ghost btn--sm" id="wf-anular">🚫 Anular</button>`;
    else if (estado === "anulado") wf = `<button class="btn btn--primary btn--sm" id="wf-version">🆕 Nueva versión</button>`;
    const histBtn = rec ? `<button class="btn btn--ghost btn--sm" id="wf-hist">🕘 Historial</button>` : "";

    let surface;
    if (locked) {
      const firmaBlock = estado === "finalizado" ? firmaHTML(rec) : "";
      const anuladoBlock = estado === "anulado"
        ? `<div class="doc-anulado"><div class="doc-anulado__sello">ANULADO</div><div class="doc-anulado__motivo"><strong>Motivo:</strong> ${u.esc(rec.motivoAnulacion || "—")}</div></div>` : "";
      surface = `<div class="doc-page" id="doc-page" data-sheet="${sheet}">
        <div class="doc-page__franja"></div>
        <div class="doc-page__hd">
          <div class="doc-page__brand"><img src="assets/img/huap-logo.png" alt="HUAP">
            <div><strong>Unidad de Buenas Prácticas Clínicas – UBPC</strong>
            <div class="muted">Hospital de Urgencia Asistencia Pública</div></div></div>
          <div class="doc-page__meta">${u.fechaCL(new Date())}<br>${u.esc(me ? me.nombre : "")}${codigo ? `<br><span class="mono">${u.esc(codigo)}</span>` : ""}</div>
        </div>
        <div class="doc-page__title" style="font-weight:800">${u.esc(data.nombre || p.titulo)}</div>
        <div class="doc-page__body">${planToHTML(data)}</div>
        ${anuladoBlock}${firmaBlock}
      </div>`;
    } else {
      surface = `<div class="pf-intro">📋 Completa las secciones del plan. Los campos con <span class="pf-req">*</span> son obligatorios. Puedes agregar todas las actividades, acciones y seguimientos que necesites.</div>${planFormHTML(data)}`;
    }

    container.innerHTML = `
      <div class="doc-editor">
        <div class="doc-tools no-print">
          <div class="doc-bar">
            <button class="btn btn--ghost btn--sm" id="doc-back">← Volver</button>
            <div class="doc-bar__title"><span class="tag" style="background:${p.color}22;color:${p.color}">${p.ic} ${u.esc(p.label)}</span> ${estadoBadge}</div>
            <div class="btn-row">
              ${histBtn}
              <button class="btn btn--ghost btn--sm" id="doc-print">🖨️ Imprimir / PDF</button>
              <button class="btn btn--ghost btn--sm" id="doc-word">📄 Word</button>
              ${locked ? "" : `<button class="btn btn--primary btn--sm" id="doc-save">💾 Guardar</button>`}
            </div>
          </div>
          ${wf || locked ? `<div class="doc-wf">${wf}${locked ? `<span class="doc-wf__lock">🔒 Documento bloqueado (solo lectura)</span>` : ""}</div>` : ""}
        </div>
        ${surface}
      </div>`;

    document.getElementById("doc-back").onclick = () => renderList(container);

    function contenidoNow() {
      const d = locked ? data : readPlanForm(container);
      const titulo = (d.nombre || p.titulo);
      return { titulo, html: (locked && current) ? current.contenido : (coverHTML(titulo, p.label, true) + planToHTML(d)), data: d };
    }
    function validar(d) {
      const faltan = [];
      if (!d.nombre) faltan.push("nombre");
      if (!d.guia) faltan.push("guia");
      if (!d.objetivoGeneral) faltan.push("objetivoGeneral");
      container.querySelectorAll(".pf-field--err").forEach(x => x.classList.remove("pf-field--err"));
      faltan.forEach(n => { const el = container.querySelector(`[data-pf="${n}"]`); if (el) el.closest(".pf-field").classList.add("pf-field--err"); });
      return faltan;
    }
    function doSavePlan(silent) {
      const d = readPlanForm(container);
      const faltan = validar(d);
      if (faltan.length) { u.toast("Completa los campos obligatorios (Nombre, Guía y Objetivo general)", "danger"); return null; }
      const titulo = d.nombre;
      const payload = { titulo, plantilla: "planRNAO", contenido: coverHTML(titulo, p.label, true) + planToHTML(d), planData: d, tamano: sheet };
      if (current) S().update("docsTrabajo", current.id, payload);
      else current = S().insert("docsTrabajo", Object.assign({ estado: "borrador", version: 1 }, payload));
      if (!silent) u.toast("Plan guardado", "ok");
      return current;
    }

    if (!locked) {
      const saveBtn = document.getElementById("doc-save");
      if (saveBtn) saveBtn.onclick = () => doSavePlan();
      // Repetibles: agregar / quitar filas
      const bindRm = () => container.querySelectorAll("[data-reprm]").forEach(b => b.onclick = () => b.closest("tr").remove());
      container.querySelectorAll("[data-repadd]").forEach(b => b.onclick = () => {
        const rep = b.dataset.repadd;
        container.querySelector(`[data-rep="${rep}"] tbody`).insertAdjacentHTML("beforeend", repRow(rep, {}));
        bindRm();
      });
      bindRm();
      // Cálculo en vivo de variación y cumplimiento
      const g = n => container.querySelector(`[data-pf="${n}"]`);
      const recompute = () => {
        const base = pnum(g("evalBase").value), post = pnum(g("evalPost").value), meta = pnum(g("evalMeta").value);
        g("variacion").value = (base != null && post != null) ? ((post - base > 0 ? "+" : "") + (post - base)) : "";
        g("cumplimiento").value = (post != null && meta > 0) ? Math.round(post / meta * 100) : "";
      };
      ["evalBase", "evalPost", "evalMeta"].forEach(n => { const el = g(n); if (el) el.addEventListener("input", recompute); });
    }

    const wfBtn = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = fn; };
    wfBtn("wf-aprobar", () => { const c = doSavePlan(true); if (c) aprobar(container, c); });
    wfBtn("wf-finalizar", () => finalizar(container, current));
    wfBtn("wf-borrador", () => volverBorrador(container, current));
    wfBtn("wf-version", () => nuevaVersion(container, current));
    wfBtn("wf-anular", () => anular(container, current));
    wfBtn("wf-hist", () => verHistorial(current));

    document.getElementById("doc-print").onclick = () => { const c = contenidoNow(); printDoc(c.titulo, c.html, me, sheet, current || { plantilla: "planRNAO" }); };
    document.getElementById("doc-word").onclick = () => { const c = contenidoNow(); exportWordDoc(c.titulo, c.html, me, current || { plantilla: "planRNAO" }, "plan-rnao-ubpc"); };
  }

  function printDoc(titulo, html, me, sheet, rec) {
    const u = ui();
    const w = window.open("", "_blank");
    if (!w) { u.toast("Permite las ventanas emergentes para imprimir", "danger"); return; }
    rec = rec || {};
    const label = rec.plantilla ? plMeta(rec.plantilla).label : "";
    const PAGE = { a4: "A4", carta: "216mm 279mm", oficio: "216mm 330mm" };
    const pageSize = PAGE[sheet] || "A4";
    // Cuerpo unificado (mismo que Word) con estilos en línea → PDF y Word idénticos
    const body = buildExportBody(titulo, html, me, rec, label);
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${u.esc(titulo || "Documento")}</title>
      <style>
        /* margin:0 en la página → el navegador NO imprime fecha/URL/nº de página
           en los bordes; el margen real lo da el padding de .sheet */
        @page{size:${pageSize};margin:0}
        *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        html,body{margin:0;padding:0}
        body{font-family:'Nunito Sans',system-ui,Segoe UI,Arial,sans-serif;color:#22303a;line-height:1.55;font-size:11.5pt}
        .sheet{padding:16mm 15mm}
        img{max-width:100%}
      </style></head><body><div class="sheet">${body}</div></body></html>`);
    w.document.close();
    const go = () => { try { w.focus(); w.print(); } catch (e) {} };
    if (w.document.fonts && w.document.fonts.ready) { w.document.fonts.ready.then(() => setTimeout(go, 150)); setTimeout(go, 1200); }
    else setTimeout(go, 500);
  }

  // Word con el MISMO cuerpo/formato que la impresión (estilos en línea)
  function exportWordDoc(titulo, html, me, rec, filenamePrefix) {
    const u = ui(); rec = rec || {};
    const label = rec.plantilla ? plMeta(rec.plantilla).label : "";
    const body = buildExportBody(titulo, html, me, rec, label);
    u.exportWord((filenamePrefix || "documento-ubpc") + "-" + u.hoyISO(), titulo, body);
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

  /* ============================================================
     Vínculo con "Plan de Intervención RNAO" (Programa RNAO)
     Genera y sincroniza el documento "Plan de Mejora (breve)" a partir
     del plan. El plan es la única fuente; el documento se regenera
     mientras está en borrador (no se duplica la información).
     ============================================================ */
  function planMejoraContentFromPlan(plan) {
    const u = ui();
    const e = v => u.esc(v != null && String(v).trim() !== "" ? v : "—");
    const pct = v => (v != null && String(v).trim() !== "" && !isNaN(v)) ? v + "%" : "—";
    const par = t => (t && String(t).trim()) ? `<p>${u.esc(t).replace(/\r?\n/g, "<br>")}</p>` : "<p>—</p>";
    const acc = (plan.acciones || []).filter(a => (a.accion || "").trim());
    const acts = (plan.actividades || []).filter(a => (a.actividad || "").trim());
    const segs = (plan.seguimientos || []).filter(s => (s.descripcion || s.fecha || "").trim());
    // Responsables y medios de verificación: se consolidan SIN repetir y se
    // presentan como lista con viñetas (documento formal, legible).
    const uniq = arr => [...new Set(arr.map(s => (s || "").trim()).filter(Boolean))];
    const respList = uniq([].concat(acc.map(a => a.responsable), acts.map(a => a.responsable)));
    const verifList = uniq([].concat(acc.map(a => a.verificador), acts.map(a => a.verificador)));
    const listCell = arr => !arr.length ? "—"
      : (arr.length === 1 ? u.esc(arr[0])
        : `<ul style="margin:0;padding-left:1.1em">${arr.map(x => `<li style="margin:2px 0">${u.esc(x)}</li>`).join("")}</ul>`);
    // Fila clave/valor para las tablas tipo "ficha" (estilos en línea → idéntico en pantalla, PDF y Word)
    const kvKS = "padding:5pt 9pt;border:1px solid #dbe6f2;vertical-align:top;background:#eef5f3;color:#233b45;font-weight:700;width:36%";
    const kvVS = "padding:5pt 9pt;border:1px solid #dbe6f2;vertical-align:top";
    const kv = (k, v) => `<tr><td style="${kvKS}">${k}</td><td style="${kvVS}">${v}</td></tr>`;
    const ficha = rows => `<table class="doc-kv" style="border-collapse:collapse;width:100%;margin:7pt 0;font-size:10.5pt"><tbody>${rows.join("")}</tbody></table>`;
    const brechaTxt = e(plan.brecha) + ((plan.brechaPct !== "" && plan.brechaPct != null && !isNaN(plan.brechaPct)) ? ` <b>(${pct(plan.brechaPct)})</b>` : "");

    // ---- Anexo: Plantilla de Plan de Implementación (orientaciones BPSO/MINSAL) ----
    const respBPSO = [].concat(
      acc.map(a => a.accion ? u.esc(a.accion) + (a.responsable ? " — <b>" + u.esc(a.responsable) + "</b>" : "") : ""),
      acts.map(a => a.actividad ? u.esc(a.actividad) + (a.responsable ? " — <b>" + u.esc(a.responsable) + "</b>" : "") : "")
    ).filter(Boolean).join("<br>") || "—";
    const cronBPSO = (plan.plazoInicio || plan.plazoFin)
      ? (e(plan.plazoInicio) + " → " + e(plan.plazoFin)) + ((plan.frecuenciaSeg && plan.frecuenciaSeg !== "—") ? "<br><span style='color:#5a6b84'>Seguimiento: " + e(plan.frecuenciaSeg) + "</span>" : "")
      : "—";
    const comBPSO = [plan.comunicacionInvolucrados, plan.comunicacionForma].filter(x => x && String(x).trim()).map(x => u.esc(x)).join("<br>") || "—";
    const bpsoTh = "background:#5b34b0;color:#fff;text-align:left;padding:5pt 6pt;border:1px solid #cdd8e2;font-weight:700;font-size:9pt";
    const bpsoTd = "padding:5pt 6pt;border:1px solid #e2e9f0;vertical-align:top;font-size:9pt";
    const anexoBPSO = `<div class="doc-pagebreak" contenteditable="false">Salto de hoja</div>
      <h2>Anexo · Plan de Implementación (Orientaciones Técnicas BPSO)</h2>
      <p style="color:#5a6b84;font-size:9.5pt;margin:.2rem 0 .5rem">Estructura conforme a la plantilla de Plan de Implementación de las Orientaciones Técnicas BPSO (MINSAL).</p>
      <table class="doc-bpso" style="border-collapse:collapse;width:100%;table-layout:fixed"><thead><tr>
        <th style="${bpsoTh};width:16%">Recomendación<br>(del análisis de brechas)</th>
        <th style="${bpsoTh};width:22%">Responsabilidades<br>(¿Qué? / ¿Quién?)</th>
        <th style="${bpsoTh};width:14%">Cronología<br>(¿Para cuándo?)</th>
        <th style="${bpsoTh};width:14%">Recursos<br>(¿disponibles? / ¿se necesitan?)</th>
        <th style="${bpsoTh};width:16%">Barreras y facilitadores</th>
        <th style="${bpsoTh};width:18%">Plan de comunicación<br>(¿quiénes? / ¿cómo? / ¿frecuencia?)</th>
      </tr></thead><tbody><tr>
        <td style="${bpsoTd}">${e(plan.recomendacion || plan.indicador || plan.brecha)}</td>
        <td style="${bpsoTd}">${respBPSO}</td>
        <td style="${bpsoTd}">${cronBPSO}</td>
        <td style="${bpsoTd}">${e(plan.recursos)}</td>
        <td style="${bpsoTd}">${e(plan.barrerasFacilitadores)}</td>
        <td style="${bpsoTd}">${comBPSO}</td>
      </tr></tbody></table>`;

    return `<h2>1. Identificación de la brecha</h2>
      ${ficha([
        kv("Guía BPSO", e(plan.guia)),
        kv("Unidad implementadora", e(plan.unidad)),
        kv("Indicador / recomendación", e(plan.indicador)),
        kv("Línea base (cumplimiento de la guía)", pct(plan.lineaBase)),
        kv("Meta comprometida", pct(plan.meta)),
        kv("Brecha a trabajar", brechaTxt)
      ])}
      <h2>2. Recomendación abordada</h2>${par(plan.recomendacion)}
      <h2>3. Objetivo de mejora</h2>${par(plan.objetivo)}
      <h2>4. Acciones de mejora</h2>
      ${acc.length
        ? `<table><thead><tr><th width="5%">N°</th><th>Acción</th><th width="20%">Responsable</th><th width="12%">Regularidad</th><th width="12%">Plazo</th><th width="20%">Verificador</th></tr></thead><tbody>${acc.map((a, i) => `<tr><td>${i + 1}</td><td>${e(a.accion)}</td><td>${e(a.responsable)}</td><td>${(a.regularidad && a.regularidad !== "—") ? e(a.regularidad) : "—"}</td><td>${e(a.plazo)}</td><td>${e(a.verificador)}</td></tr>`).join("")}</tbody></table>`
        : `<p style="color:#5a6b84">Sin acciones registradas aún.</p>`}
      ${acts.length ? `<h2>5. Actividades y responsables</h2><table><thead><tr><th>Actividad</th><th width="26%">Responsable</th><th width="26%">Verificador</th></tr></thead><tbody>${acts.map(a => `<tr><td>${e(a.actividad)}</td><td>${e(a.responsable)}</td><td>${e(a.verificador)}</td></tr>`).join("")}</tbody></table>` : ""}
      <h2>${acts.length ? "6" : "5"}. Plazos y seguimiento</h2>
      ${ficha([
        kv("Plazo de inicio", e(plan.plazoInicio)),
        kv("Plazo de término", e(plan.plazoFin)),
        kv("Duración estimada", (() => {
          const ini = plan.plazoInicio, fin = plan.plazoFin;
          if (!ini || !fin) return "—";
          const a = new Date(String(ini).slice(0, 10) + "T12:00:00"), b = new Date(String(fin).slice(0, 10) + "T12:00:00");
          if (isNaN(a) || isNaN(b)) return "—";
          const days = Math.round((b - a) / 86400000);
          if (days < 0) return "Revisar fechas";
          if (days === 0) return "Mismo día";
          const sem = Math.round(days / 7), mes = Math.floor(days / 30);
          return days <= 21 ? (days + (days === 1 ? " día" : " días")) : days < 75 ? (sem + " semanas (" + days + " días)") : (mes + " meses aprox. (" + days + " días)");
        })()),
        kv("Frecuencia de seguimiento", (plan.frecuenciaSeg && plan.frecuenciaSeg !== "—") ? e(plan.frecuenciaSeg) : "—"),
        kv("Responsables", listCell(respList)),
        kv("Avance global", pct(plan.avance))
      ])}
      ${segs.length ? `<h2>${acts.length ? "7" : "6"}. Seguimientos registrados</h2><table><thead><tr><th width="18%">Fecha</th><th>Descripción / avance</th><th width="14%">% avance</th><th width="18%">Estado</th></tr></thead><tbody>${segs.map(s => `<tr><td>${e(s.fecha)}</td><td>${e(s.descripcion)}</td><td>${pct(s.avance)}</td><td>${e(s.estado)}</td></tr>`).join("")}</tbody></table>` : ""}
      <h2>${(acts.length ? 1 : 0) + (segs.length ? 1 : 0) + 6}. Indicador de éxito y verificación</h2>
      ${ficha([
        kv("Meta de cumplimiento", pct(plan.meta)),
        kv("Medios de verificación", (acc.length || acts.length) ? "Según el verificador indicado en cada acción y actividad (secciones anteriores)." : listCell(verifList))
      ])}
      ${anexoBPSO}`;
  }

  // Crea o actualiza el documento vinculado y devuelve su id.
  function syncLinkedPlanDoc(plan) {
    const titulo = "Plan de Mejora · " + (plan.guia || "RNAO") + (plan.unidad ? " · " + plan.unidad : "");
    const contenido = coverHTML(titulo, PLANTILLAS.planMejora.label, true) + planMejoraContentFromPlan(plan);
    let doc = S().all("docsTrabajo").find(d => d.planRef === plan.id);
    if (doc) {
      if ((doc.estado || "borrador") === "borrador") S().update("docsTrabajo", doc.id, { titulo, contenido });
      return doc.id;
    }
    const me = U.auth.current();
    doc = S().insert("docsTrabajo", {
      titulo, plantilla: "planMejora", contenido, tamano: "a4",
      estado: "borrador", version: 1, planRef: plan.id,
      historial: [{ accion: "Generado desde Plan de Intervención RNAO", detalle: "", por: me ? me.nombre : "Sistema", fecha: new Date().toISOString() }]
    });
    return doc.id;
  }
  function printDocById(id) {
    const d = S().get("docsTrabajo", id); if (!d) return;
    const me = U.auth.current();
    printDoc(d.titulo, d.contenido, me, d.tamano || "a4", d);
  }

  U.docsEditor = { mount, ESTADOS, estadoDe, plMeta, syncLinkedPlanDoc, printDocById };
})();
