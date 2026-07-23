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
      html: `<h2>Resumen ejecutivo</h2><p>Síntesis del año de gestión de la Unidad.</p>
        <h2>Logros del año</h2><ul><li>Logro destacado 1</li><li>Logro destacado 2</li></ul>
        <h2>Indicadores clave</h2><p>Cumplimiento RNAO, Norma Técnica 234, cobertura de capacitación e indicadores UBPC.</p>
        <h2>Programa RNAO</h2><p>Avances en la implementación de guías de buenas prácticas.</p>
        <h2>Norma Técnica 234</h2><p>Adherencia institucional y planes de mejora.</p>
        <h2>Fortalecimiento y capacitación</h2><p>Actividades formativas y cobertura por estamento.</p>
        <h2>Red de colaboración</h2><p>Alianzas y colaboraciones institucionales del período.</p>
        <h2>Desafíos y proyecciones</h2><p>Metas y focos para el próximo período.</p>`
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
    }
  };

  const plMeta = k => PLANTILLAS[k] || PLANTILLAS.informeTecnico;

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
    const contenido = rec ? (rec.contenido || p.html) : p.html;

    const tools = [
      { c: "bold", ic: "𝗕", t: "Negrita" }, { c: "italic", ic: "𝘐", t: "Cursiva" }, { c: "underline", ic: "U̲", t: "Subrayado" },
      { sep: 1 },
      { c: "formatBlock", v: "H2", ic: "T", t: "Título" }, { c: "formatBlock", v: "H3", ic: "t", t: "Subtítulo" }, { c: "formatBlock", v: "P", ic: "¶", t: "Texto" },
      { sep: 1 },
      { c: "insertUnorderedList", ic: "•—", t: "Lista con viñetas" }, { c: "insertOrderedList", ic: "1.", t: "Lista numerada" },
      { sep: 1 },
      { c: "undo", ic: "↶", t: "Deshacer" }, { c: "redo", ic: "↷", t: "Rehacer" }
    ];
    const toolbar = tools.map(x => x.sep ? `<span class="doc-tb__sep"></span>`
      : `<button class="doc-tb__btn" data-cmd="${x.c}" ${x.v ? `data-val="${x.v}"` : ""} title="${x.t}" type="button">${x.ic}</button>`).join("");

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

    // Toolbar (execCommand sobre la selección; mousedown para no perder foco)
    container.querySelectorAll(".doc-tb__btn").forEach(b => b.addEventListener("mousedown", e => {
      e.preventDefault();
      bodyEl.focus();
      const cmd = b.dataset.cmd, val = b.dataset.val || null;
      try { document.execCommand(cmd, false, val); } catch (err) {}
    }));

    let current = rec;
    document.getElementById("doc-back").onclick = () => renderList(container);
    document.getElementById("doc-save").onclick = () => {
      const data = { titulo: titleEl.value.trim() || p.titulo, plantilla, contenido: bodyEl.innerHTML };
      if (current) S().update("docsTrabajo", current.id, data);
      else current = S().insert("docsTrabajo", data);
      u.toast("Documento guardado", "ok");
    };
    document.getElementById("doc-print").onclick = () => printDoc(titleEl.value, bodyEl.innerHTML, me);
    document.getElementById("doc-word").onclick = () =>
      u.exportWord("documento-ubpc-" + u.hoyISO(), titleEl.value || p.titulo,
        `<h1 style="color:#0d5044">${u.esc(titleEl.value || p.titulo)}</h1>` + bodyEl.innerHTML);
  }

  function printDoc(titulo, html, me) {
    const u = ui();
    const w = window.open("", "_blank");
    if (!w) { u.toast("Permite las ventanas emergentes para imprimir", "danger"); return; }
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${u.esc(titulo || "Documento")}</title>
      <style>
        @page{size:A4;margin:16mm} *{box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#17263d;margin:0;padding:4mm;line-height:1.5}
        h1{font-family:Georgia,serif;color:#0d5044;font-size:22px;margin:.2em 0 .5em}
        h2{font-family:Georgia,serif;color:#0f8f83;font-size:15px;margin:1em 0 .3em;border-bottom:1px solid #dbe6f2;padding-bottom:3px}
        h3{font-family:Georgia,serif;color:#5b34b0;font-size:13px;margin:.8em 0 .2em}
        p,li{font-size:12.5px} table{border-collapse:collapse;width:100%;font-size:11.5px;margin:6px 0}
        th{background:#0f8f83;color:#fff;text-align:left;padding:6px;border:1px solid #bbb} td{padding:5px;border:1px solid #ddd}
        .franja{height:6px;border-radius:3px;margin-bottom:12px;background:linear-gradient(90deg,#1554b8,#1e9fe0,#0fb5ad,#37a04a,#f2c53d,#f07f2e,#7d4bcf,#e0538a)}
        .hd{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #dbe6f2;padding-bottom:8px;margin-bottom:14px}
        .hd img{width:48px;height:48px} .hd .b{display:flex;gap:10px;align-items:center} .muted{color:#5a6b84;font-size:11px}
        .meta{text-align:right;font-size:11px;color:#5a6b84}
      </style></head><body>
      <div class="franja"></div>
      <div class="hd"><div class="b"><img src="${logoData()}" alt="HUAP"><div><strong>Unidad de Buenas Prácticas Clínicas – UBPC</strong><div class="muted">Hospital de Urgencia Asistencia Pública</div></div></div>
        <div class="meta">${u.fechaCL(new Date())}<br>${u.esc(me ? me.nombre : "")}</div></div>
      <h1>${u.esc(titulo || "Documento")}</h1>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 350);
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
