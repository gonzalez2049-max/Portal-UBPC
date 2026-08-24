/* ============================================================
   MÓDULOS 1, 2 y 5 — Coordinador (Fase 2)
   Se registran sobre U.coord definido en coordinator.js
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CAT = () => U.data.CAT, R = () => U.components.resource;

  function kpiStrip(items) {
    return `<div class="grid grid--kpi" style="margin-bottom:1.1rem">${items.map(i =>
      `<div class="card kpi ${i.kind ? "kpi--" + i.kind : ""}"><div class="kpi__label">${ui().esc(i.label)}</div>
       <div class="kpi__value">${i.value}</div><div class="kpi__sub">${ui().esc(i.sub)}</div></div>`).join("")}</div>`;
  }
  function solicitarAction(modulo, mkPrefill) {
    return { ico: "📨", title: "Solicitar intervención técnica",
      fn: (rec, refresh) => U.solicitudes.crearDesde(modulo, mkPrefill(rec), refresh) };
  }

  /* ===================== MÓDULO 1 — APOYO Y MEJORA CONTINUA ===================== */
  const M1_TABS = [
    { key: "procesos", label: "Procesos de apoyo" },
    { key: "nt234", label: "Norma Técnica 234" }
  ];
  function m1(params) {
    const tab = (params && params.tab) || "procesos";
    return `<div class="page-head"><h1>Apoyo y Mejora Continua</h1>
      <p>Apoyo técnico, asesorías, intervenciones y procesos de mejora del cuidado.</p></div>
      ${R().tabsBar("coord", "m1", M1_TABS, tab)}<div id="m1-tab"></div>`;
  }
  function m1Bind(main, params) {
    const tab = (params && params.tab) || "procesos";
    const box = document.getElementById("m1-tab");
    if (tab === "nt234") { U.nt234Embed(box, params); return; }
    box.innerHTML = `<div id="m1-kpi"></div><div id="m1-body"></div>`;
    procesosApoyo();
  }
  function procesosApoyo() {
    const list = S().all("apoyoMejora");
    const fin = list.filter(a => /finaliz/i.test(a.estado || "")).length;
    const unidades = new Set(list.map(a => a.unidad).filter(Boolean)).size;
    document.getElementById("m1-kpi").innerHTML = kpiStrip([
      { label: "Procesos apoyados", value: list.length, sub: list.length ? "Registrados en total" : "Aún sin procesos", kind: "info" },
      { label: "Unidades apoyadas", value: unidades, sub: unidades ? "Con apoyo registrado" : "Sin unidades aún", kind: "ok" },
      { label: "En desarrollo", value: list.length - fin, sub: "Procesos activos", kind: "warn" },
      { label: "Finalizados", value: fin, sub: "Procesos concluidos", kind: "ok" }
    ]);
    R().mount(document.getElementById("m1-body"), {
      collection: "apoyoMejora", title: "Proceso de apoyo", icon: "🤝",
      hint: "Registra el apoyo técnico, la intervención y el resultado por unidad.",
      newLabel: "Nuevo proceso",
      filters: [{ key: "estado", label: "Estado" }, { key: "unidad", label: "Unidad" }],
      emptyMsg: "Aún no hay procesos de apoyo registrados.",
      columns: [
        { key: "unidad", label: "Unidad" },
        { key: "responsable", label: "Responsable" },
        { key: "problema", label: "Problema o necesidad" },
        { key: "resultado", label: "Resultado" },
        { key: "estado", label: "Estado", badge: true }
      ],
      fields: [
        { name: "responsable", label: "Responsable", required: true },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…", required: true },
        { name: "problema", label: "Problema o necesidad", type: "textarea", full: true },
        { name: "intervencion", label: "Intervención realizada", type: "textarea", full: true },
        { name: "resultado", label: "Resultado", type: "textarea", full: true },
        { name: "proximaAccion", label: "Próxima acción", full: true },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En desarrollo", "En curso", "Finalizado"] },
        { name: "respaldo", label: "Respaldo (documento/enlace)", full: true }
      ],
      defaults: () => ({ estado: "En desarrollo" }),
      detail: (rec) => detalleGenerico("Proceso de apoyo", rec, [
        ["Unidad", rec.unidad], ["Responsable", rec.responsable], ["Estado", ui().estadoBadge(rec.estado), true],
        ["Problema o necesidad", rec.problema], ["Intervención realizada", rec.intervencion],
        ["Resultado", rec.resultado], ["Próxima acción", rec.proximaAccion], ["Respaldo", rec.respaldo]
      ]),
      rowActions: [solicitarAction("Apoyo y Mejora Continua", r => ({
        titulo: "Apoyo en " + (r.unidad || "unidad"), unidad: r.unidad, descripcion: r.problema || "" }))],
      afterSave: () => procesosApoyo()
    });
  }

  /* ===================== MÓDULO 2 — GESTIÓN DOCUMENTAL ===================== */
  const M2_TABS = [
    { key: "documentos", label: "Documentos institucionales" },
    { key: "protocolos", label: "Control de protocolos de enfermería" },
    { key: "docs", label: "Documentos de trabajo" },
    { key: "generador", label: "Generador de código" }
  ];
  function m2(params) {
    const tab = (params && params.tab) || "documentos";
    return `<div class="page-head"><h1>Gestión Documental</h1>
      <p>Protocolos, normas, procedimientos, manuales y documentos institucionales. Códigos automáticos y permanentes.</p></div>
      ${R().tabsBar("coord", "m2", M2_TABS, tab)}
      <div id="m2-body"></div>`;
  }
  function m2Bind(main, params) {
    const tab = (params && params.tab) || "documentos";
    const box = document.getElementById("m2-body");
    if (tab === "docs") { U.docsEditor.mount(box, params); return; }
    if (tab === "protocolos") protocolosTab(box);
    else if (tab === "generador") generadorTab(box);
    else documentosTab(box);
  }

  /* ===================== GENERADOR DE CÓDIGO INTERNO =====================
     Entrega el próximo código correlativo REAL (avanza el contador, igual que
     al crear en el portal), para usarlo en documentos trabajados fuera del
     sistema y mantener coherencia y correlación. Cada código queda registrado. */
  const GEN_FAMILIAS = [
    { key: "documentos", label: "Documento institucional (UBPC-DOC)" },
    { key: "informesTec", label: "Informe técnico (UBPC-INF)" },
    { key: "auditorias", label: "Informe de auditoría (UBPC-AUD)" },
    { key: "recursosEdu", label: "Recurso educativo / capacitación (UBPC-EDU)" },
    { key: "fichasTec", label: "Ficha técnica / instrumento (UBPC-FIC)" },
    { key: "presentaciones", label: "Presentación / material (UBPC-PPT)" },
    { key: "protocolosEnf", label: "Protocolo de enfermería · control (UBPC-PRO)" },
    { key: "planesIntervencion", label: "Plan de intervención RNAO (UBPC-PIN)" },
    { key: "reuniones", label: "Acta / Reunión (UBPC-REU)" },
    { key: "acuerdos", label: "Acuerdo (UBPC-ACU)" },
    { key: "actividades", label: "Capacitación (UBPC-CAP)" },
    { key: "colaboraciones", label: "Colaboración (UBPC-COL)" }
  ];
  function generadorTab(box) {
    const u = ui();
    const famOpts = GEN_FAMILIAS.map(f => `<option value="${f.key}">${u.esc(f.label)}</option>`).join("");
    const tipoOpts = CAT().tiposDocumento.map(t => `<option>${u.esc(t)}</option>`).join("");
    box.innerHTML = `
      <div class="card" style="border-left:5px solid var(--morado);margin-bottom:1rem">
        <h3 class="card__title">🔢 Generar código interno</h3>
        <p class="card__hint">Obtén el siguiente código correlativo de la Unidad para un documento que estás trabajando <strong>fuera del portal</strong>. El contador avanza igual que al crear aquí, así se mantiene la coherencia y no se repiten códigos.</p>
        <div class="form-grid">
          <div class="field"><label for="gen-fam">Familia / tipo de registro</label>
            <select id="gen-fam" class="select">${famOpts}</select></div>
          <div class="field"><label for="gen-tipo">Tipo de documento</label>
            <select id="gen-tipo" class="select">${tipoOpts}</select></div>
          <div class="field" style="grid-column:1/-1"><label for="gen-nombre">Nombre del documento</label>
            <input id="gen-nombre" class="input" placeholder="Ej: Protocolo de manejo de accesos vasculares"></div>
          <div class="field"><label for="gen-resp">Responsable</label>
            <input id="gen-resp" class="input" value="${u.esc((U.auth.current() || {}).nombre || "")}"></div>
        </div>
        <div class="gen-preview" id="gen-preview"></div>
        <div class="btn-row" style="margin-top:.7rem">
          <button class="btn btn--primary" id="gen-btn">🔢 Generar código</button>
        </div>
      </div>
      <div class="section__head"><div><h3 class="section__title">Códigos generados</h3>
        <p class="section__hint">Registro de los códigos internos emitidos (incluye los usados fuera del portal).</p></div></div>
      <div id="gen-list"></div>`;

    const famSel = box.querySelector("#gen-fam");
    const prevEl = box.querySelector("#gen-preview");
    const paintPreview = () => {
      const code = S().peekCode(famSel.value);
      prevEl.innerHTML = `Próximo código disponible: <span class="gen-code">${u.esc(code || "—")}</span>`;
    };
    famSel.onchange = paintPreview;
    paintPreview();

    box.querySelector("#gen-btn").onclick = () => {
      const fam = famSel.value;
      const nombre = box.querySelector("#gen-nombre").value.trim();
      if (!nombre) { u.toast("Indica el nombre del documento", "danger"); return; }
      const codigo = S().nextCode(fam);
      if (!codigo) { u.toast("No se pudo generar el código", "danger"); return; }
      S().insert("codigosInternos", {
        codigo, familia: fam,
        familiaLabel: (GEN_FAMILIAS.find(f => f.key === fam) || {}).label || fam,
        tipo: box.querySelector("#gen-tipo").value,
        nombre, responsable: box.querySelector("#gen-resp").value.trim(),
        fecha: new Date().toISOString()
      });
      u.toast("Código generado: " + codigo, "ok");
      box.querySelector("#gen-nombre").value = "";
      generadorTab(box); // redibuja (actualiza preview + lista)
      // Muestra el código recién creado destacado
      setTimeout(() => { const pv = box.querySelector("#gen-preview"); if (pv) pv.innerHTML = `Último código generado: <span class="gen-code gen-code--new">${u.esc(codigo)}</span> <button class="btn btn--ghost btn--sm" data-copy="${u.esc(codigo)}">📋 Copiar</button>`; bindCopy(box); }, 30);
    };

    renderGenLista(box);
    bindCopy(box);
  }
  function bindCopy(box) {
    box.querySelectorAll("[data-copy]").forEach(b => b.onclick = () => {
      const txt = b.dataset.copy;
      const done = () => ui().toast("Código copiado: " + txt, "ok");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
      else fallbackCopy(txt, done);
    });
  }
  function fallbackCopy(txt, done) {
    try { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); done(); } catch (e) { ui().toast("No se pudo copiar automáticamente: " + txt, "warn"); }
  }
  function renderGenLista(box) {
    const u = ui();
    const el = box.querySelector("#gen-list");
    const list = S().all("codigosInternos").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    if (!list.length) { el.innerHTML = u.empty("Aún no has generado códigos internos.", "Genera el primero arriba para documentos que trabajes fuera del portal.", "🔢"); return; }
    el.innerHTML = `<div class="table-wrap"><table class="tbl"><thead><tr>
      <th>Código</th><th>Documento</th><th>Tipo</th><th>Responsable</th><th>Fecha</th><th></th></tr></thead><tbody>
      ${list.map(r => `<tr>
        <td><span class="mono"><strong>${u.esc(r.codigo)}</strong></span></td>
        <td>${u.esc(r.nombre || "—")}</td>
        <td>${r.tipo ? tipoDocChip(r.tipo, u) : "—"}</td>
        <td>${u.esc(r.responsable || "—")}</td>
        <td>${u.fechaCL(r.fecha)}</td>
        <td class="right"><div class="btn-row" style="justify-content:flex-end">
          <button class="btn-icon" data-copy="${u.esc(r.codigo)}" title="Copiar código">📋</button>
          <button class="btn-icon" data-gendel="${r.id}" title="Eliminar del registro">🗑️</button></div></td></tr>`).join("")}
      </tbody></table></div>`;
    el.querySelectorAll("[data-gendel]").forEach(b => b.onclick = () =>
      u.confirmDelete("¿Quitar este código del registro? (No revierte el contador correlativo.)", () => { S().remove("codigosInternos", b.dataset.gendel); renderGenLista(box); bindCopy(box); }));
    bindCopy(box);
  }

  /* ---------- Control de protocolos de enfermería ---------- */
  const VIGENCIAS = ["6 meses", "1 año", "2 años", "3 años", "4 años", "5 años"];
  const VIG_MESES = { "6 meses": 6, "1 año": 12, "2 años": 24, "3 años": 36, "4 años": 48, "5 años": 60 };
  const FORMATO_OPC = ["Vigente", "Actualizado", "En revisión", "Por vencer", "Obsoleto"];
  const FORMATO_BADGE = { "Vigente": "ok", "Actualizado": "ok", "En revisión": "warn", "Por vencer": "warn", "Obsoleto": "danger" };
  function proximaRevision(rec) {
    const mo = VIG_MESES[rec.vigencia]; if (!mo || !rec.fecha) return null;
    const d = new Date(rec.fecha); if (isNaN(d)) return null;
    d.setMonth(d.getMonth() + mo); d.setHours(0, 0, 0, 0); return d;
  }
  function revisionInfo(rec) {
    const d = proximaRevision(rec); if (!d) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dias = Math.round((d - today) / 86400000);
    return { d, dias, vencido: dias < 0, porVencer: dias >= 0 && dias <= 90 };
  }
  function respElab(rec) {
    const arr = (rec.responsablesElab && rec.responsablesElab.length) ? rec.responsablesElab : (rec.responsable ? [{ nombre: rec.responsable }] : []);
    return arr.map(x => x.nombre + (x.cargo ? " (" + x.cargo + ")" : "")).join(" · ") || "—";
  }
  function protRespRow(r) {
    const u = ui(); r = r || {};
    return `<tr data-rrow>
      <td><input class="input input--sm" data-f="nombre" value="${u.esc(r.nombre || "")}" placeholder="Nombre"></td>
      <td><input class="input input--sm" data-f="cargo" value="${u.esc(r.cargo || "")}" placeholder="Cargo / estamento"></td>
      <td class="pf-rep__x"><button type="button" class="btn-icon" data-rrm title="Quitar">🗑️</button></td></tr>`;
  }
  function protRespHTML(rows) {
    rows = (rows && rows.length) ? rows : [{}];
    return `<div class="field" style="grid-column:1/-1">
      <label>Responsables de la elaboración</label>
      <div class="kpi__sub" style="margin-bottom:.35rem">Agrega una o más personas que elaboraron el protocolo, con su cargo o estamento.</div>
      <div class="pf-rep" id="prot-resp"><div class="table-wrap"><table class="tbl pf-rep__t"><thead><tr>
        <th>Nombre</th><th>Cargo / estamento</th><th></th></tr></thead>
        <tbody>${rows.map(protRespRow).join("")}</tbody></table></div>
        <button type="button" class="btn btn--ghost btn--sm" id="prot-addresp">+ Agregar responsable</button></div></div>`;
  }
  function protocoloDetalle(rec) {
    const u = ui(); const ri = revisionInfo(rec);
    const revTxt = ri ? (u.fechaCL(ri.d) + " · " + (ri.vencido ? "Vencido" : ri.porVencer ? "Por vencer (" + ri.dias + " días)" : "Vigente")) : "—";
    detalleGenerico("Protocolo de enfermería", rec, [
      ["Código", `<span class="mono">${u.esc(rec.codigo || "—")}</span>`, true],
      ["Protocolo", rec.nombre], ["Unidad", rec.unidad], ["Versión", "v" + (rec.version || "1")],
      ["Fecha", u.fechaCL(rec.fecha)], ["Vigencia", rec.vigencia],
      ["Próxima revisión / modificación", revTxt, true],
      ["Estado del formato (Coordinación)", u.estadoBadge(rec.estadoFormato), true],
      ["Responsables de la elaboración", respElab(rec)], ["Ubicación / respaldo", rec.ubicacion],
      ["Observaciones", rec.observaciones]
    ]);
  }
  function protocolosTab(box) {
    const u = ui();
    const list = S().all("protocolosEnf");
    const venc = list.filter(r => { const ri = revisionInfo(r); return ri && ri.vencido; }).length;
    const porV = list.filter(r => { const ri = revisionInfo(r); return ri && !ri.vencido && ri.porVencer; }).length;
    const obs = list.filter(r => r.estadoFormato === "Obsoleto").length;
    const kpiC = (n, lab, kind) => `<div class="card kpi kpi--${kind}"><div class="kpi__label">${u.esc(lab)}</div><div class="kpi__value">${n}</div></div>`;
    box.innerHTML = `<div class="grid grid--kpi" style="margin-bottom:1rem">
        ${kpiC(list.length, "Protocolos registrados", "info")}
        ${kpiC(porV, "Por vencer (≤90 días)", porV ? "warn" : "ok")}
        ${kpiC(venc, "Con revisión vencida", venc ? "danger" : "ok")}
        ${kpiC(obs, "Marcados obsoletos", obs ? "danger" : "ok")}
      </div><div id="prot-res"></div>`;
    R().mount(document.getElementById("prot-res"), {
      collection: "protocolosEnf", title: "Protocolo de enfermería", icon: "📋", withCode: true, wideForm: true,
      hint: "Registro de control de protocolos de enfermería. La próxima revisión se calcula desde la fecha y la vigencia; el estado del formato lo declara la Coordinación UBPC.",
      newLabel: "Nuevo protocolo",
      filters: [{ key: "unidad", label: "Unidad" }, { key: "estadoFormato", label: "Estado" }],
      emptyMsg: "Aún no hay protocolos de enfermería registrados.",
      emptySub: "Agrega el primero para llevar el control de vigencia y revisiones.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "140px" },
        { key: "nombre", label: "Protocolo" },
        { key: "unidad", label: "Unidad" },
        { key: "version", label: "Versión", center: true, render: (r, u2) => `v${u2.esc(r.version || "1")}` },
        { key: "fecha", label: "Fecha", date: true, center: true },
        { key: "vigencia", label: "Vigencia", center: true },
        { key: "proxRev", label: "Próxima revisión", center: true, exportVal: r => { const ri = revisionInfo(r); return ri ? ui().fechaCL(ri.d) : ""; },
          render: (r, u2) => { const ri = revisionInfo(r); if (!ri) return `<span class="muted">—</span>`; const cls = ri.vencido ? "danger" : ri.porVencer ? "warn" : "ok"; return `${u2.fechaCL(ri.d)} <span class="badge badge--${cls}">${ri.vencido ? "Vencido" : ri.porVencer ? "Por vencer" : "Vigente"}</span>`; } },
        { key: "estadoFormato", label: "Estado (Coord.)", center: true, render: (r, u2) => `<span class="badge badge--${FORMATO_BADGE[r.estadoFormato] || "neutral"}">${u2.esc(r.estadoFormato || "—")}</span>` }
      ],
      fields: [
        { name: "nombre", label: "Nombre del protocolo", required: true, full: true },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "version", label: "Versión", value: "1" },
        { name: "fecha", label: "Fecha (emisión / aprobación)", type: "date" },
        { name: "vigencia", label: "Vigencia", type: "select", options: VIGENCIAS },
        { name: "estadoFormato", label: "Estado del formato (Coordinación UBPC)", type: "select", options: FORMATO_OPC },
        { name: "ubicacion", label: "Ubicación / respaldo (enlace o carpeta)", full: true },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true }
      ],
      defaults: () => ({ version: "1", vigencia: "3 años", estadoFormato: "Vigente", fecha: ui().hoyISO() }),
      canDelete: () => true,
      detail: protocoloDetalle,
      afterChange: () => protocolosTab(box),
      onFormMount(m, rec) {
        const grid = m.querySelector(".form-grid");
        grid.insertAdjacentHTML("afterend", protRespHTML(rec && rec.responsablesElab));
        const wrap = m.querySelector("#prot-resp");
        const bindRm = () => wrap.querySelectorAll("[data-rrm]").forEach(b => b.onclick = () => {
          if (wrap.querySelectorAll("[data-rrow]").length > 1) b.closest("tr").remove();
          else ui().toast("Debe quedar al menos una fila", "warn");
        });
        m.querySelector("#prot-addresp").onclick = () => { wrap.querySelector("tbody").insertAdjacentHTML("beforeend", protRespRow({})); bindRm(); };
        bindRm();
      },
      onBeforeSave(data, rec, m) {
        const rows = [...m.querySelectorAll("#prot-resp [data-rrow]")].map(tr => ({
          nombre: (tr.querySelector('[data-f="nombre"]').value || "").trim(),
          cargo: (tr.querySelector('[data-f="cargo"]').value || "").trim()
        })).filter(r => r.nombre || r.cargo);
        data.responsablesElab = rows;
        data.responsable = rows.map(r => r.nombre).filter(Boolean).join(", ");
        return data;
      }
    });
  }

  // Color propio por tipo documental (distintos entre sí y del color base de las etiquetas)
  const TIPO_DOC_COLOR = {
    "Protocolo": "#1554b8", "Guía": "#2f9d57", "Norma": "#7a5cd0", "Procedimiento": "#e0912f",
    "Manual": "#0891b2", "Instructivo": "#be185d", "Flujograma": "#b45309", "Otro": "#5f7d76"
  };
  function tipoDocChip(tipo, u) {
    const t = tipo || "—";
    const c = TIPO_DOC_COLOR[t] || "#5f7d76";
    return `<span class="tag tipo-chip" style="background:${c}22;color:${c};border-color:${c}">`
      + `<span class="tipo-chip__dot" style="background:${c}"></span>${u.esc(t)}</span>`;
  }

  // KPIs de productividad documental (encima de la tabla)
  function documentosKPIs(el) {
    if (!el) return;
    const u = ui(), s = S();
    const docs = s.all("documentos");
    const total = docs.length;
    const by = est => docs.filter(d => (d.estado || "") === est).length;
    const vigentes = by("Vigente");
    const enProceso = docs.filter(d => /borrador|revisi|enviado/i.test(d.estado || "")).length;
    const revisados = docs.filter(d => /s[íi]/i.test(d.revisadoUBP || "")).length;
    const pctRev = total ? Math.round(revisados / total * 100) : 0;
    const yr = new Date().getFullYear();
    const esteAnio = docs.filter(d => d.fecha && new Date(d.fecha).getFullYear() === yr).length;
    const mes = new Date().getMonth();
    const esteMes = docs.filter(d => d.fecha && new Date(d.fecha).getFullYear() === yr && new Date(d.fecha).getMonth() === mes).length;
    const card = (lab, val, sub, color) => `<div class="card kpi" style="border-left-color:${color}">
      <div class="kpi__label">${lab}</div><div class="kpi__value">${val}</div><div class="kpi__sub">${u.esc(sub)}</div></div>`;
    const chips = CAT().estadosDoc.map(e => { const n = by(e); return n ? `<span style="display:inline-flex;align-items:center;gap:.35rem;margin:.15rem .5rem .15rem 0">${u.estadoBadge(e)}<strong>${n}</strong></span>` : ""; }).join("")
      || `<span class="kpi__sub">Aún sin documentos.</span>`;
    el.innerHTML = `
      <div class="grid grid--kpi" style="margin-bottom:.8rem">
        ${card("Total documentos", total, "Registrados en la unidad", "var(--c-celeste)")}
        ${card("Vigentes", vigentes, "Aprobados y en uso", "var(--verde)")}
        ${card("En proceso", enProceso, "Borrador · revisión · Calidad", "var(--naranjo)")}
        ${card("Con V°B° UBPC", revisados + " · " + pctRev + "%", "Revisados por la Unidad", pctRev >= 70 ? "var(--verde)" : "var(--morado)")}
        ${card("Productividad " + yr, esteAnio, esteMes + " este mes", "var(--c-azul)")}
      </div>
      <div class="card" style="margin-bottom:1rem">
        <div class="flex" style="justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:.4rem">
          <h3 class="card__title" style="margin:0">Estado del inventario documental</h3>
          <span class="kpi__sub">Cobertura de revisión UBPC: <strong>${pctRev}%</strong> (${revisados}/${total})</span>
        </div>
        <div class="pin-prog" style="margin:.5rem 0 .7rem"><div class="pin-prog__bar" style="width:${pctRev}%;background:${pctRev >= 70 ? "var(--verde)" : "var(--naranjo)"}"></div></div>
        <div>${chips}</div>
      </div>`;
  }

  function documentosTab(box) {
    box.innerHTML = `<div id="doc-kpis"></div><div id="doc-list"></div>`;
    const kpisEl = document.getElementById("doc-kpis");
    documentosKPIs(kpisEl);
    R().mount(document.getElementById("doc-list"), {
      collection: "documentos", title: "Documento", icon: "📄", withCode: true,
      afterChange: () => documentosKPIs(kpisEl),
      hint: "Cada documento recibe un código automático permanente (UBPC-DOC-AAAA-000) y conserva su historial de versiones.",
      newLabel: "Nuevo documento",
      filters: [{ key: "estado", label: "Estado" }, { key: "tipo", label: "Tipo" }],
      emptyMsg: "Aún no hay documentos registrados.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "nombre", label: "Documento" },
        { key: "tipo", label: "Tipo", render: (r, u) => tipoDocChip(r.tipo, u) },
        { key: "version", label: "Versión", render: (r, u) => `v${u.esc(r.version || "1")}` },
        { key: "estado", label: "Estado", badge: true },
        { key: "revisadoUBP", label: "V°B° UBPC", center: true,
          render: r => /s[íi]/i.test(r.revisadoUBP || "") ? `<span class="badge badge--ok" title="Revisado por la UBPC${r.responsableRevision ? " · " + r.responsableRevision : ""}">✔ Sí</span>` : `<span class="badge badge--neutral" title="Sin V°B° de la UBPC">—</span>`,
          exportVal: r => /s[íi]/i.test(r.revisadoUBP || "") ? "Sí" : "No" },
        { key: "fecha", label: "Fecha", date: true }
      ],
      fields: [
        { name: "nombre", label: "Nombre del documento", required: true, full: true },
        { name: "tipo", label: "Tipo documental", type: "select", options: CAT().tiposDocumento, required: true },
        { name: "version", label: "Versión", value: "1" },
        { name: "fecha", label: "Fecha", type: "date" },
        { name: "unidadResponsable", label: "Unidad responsable", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "responsable", label: "Responsable" },
        { name: "estado", label: "Estado actual", type: "select", options: CAT().estadosDoc },
        { name: "envioCalidad", label: "Envío a Calidad", type: "select", options: ["No", "Sí"] },
        { name: "fechaEnvio", label: "Fecha de envío", type: "date" },
        { name: "revisadoUBP", label: "Revisado por Unidad Buenas Prácticas", type: "select", options: ["No", "Sí"] },
        { name: "responsableRevision", label: "Responsable de la revisión" },
        { name: "fechaRecepcion", label: "Fecha de recepción del documento", type: "date" },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true },
        { name: "respaldo", label: "Respaldo (enlace)", full: true }
      ],
      defaults: () => ({ version: "1", estado: "Borrador", envioCalidad: "No", fecha: ui().hoyISO() }),
      canDelete: () => true,
      detail: detalleDocumento,
      rowActions: [
        { ico: "🆕", title: "Registrar nueva versión", fn: nuevaVersion },
        solicitarAction("Gestión Documental", r => ({ titulo: "Validación técnica: " + (r.nombre || ""), descripcion: "Solicitud de validación técnica del documento " + (r.codigo || "") }))
      ]
    });
  }
  function nuevaVersion(rec, refresh) {
    const u = ui();
    const fields = [
      { name: "version", label: "Nueva versión", required: true, value: String((parseFloat(rec.version) || 1) + 1) },
      { name: "fecha", label: "Fecha", type: "date", value: u.hoyISO() },
      { name: "responsable", label: "Responsable del cambio", value: rec.responsable },
      { name: "cambio", label: "Descripción del cambio", type: "textarea", full: true, required: true }
    ];
    u.modal({ title: "Nueva versión · " + (rec.codigo || ""), body: u.formHTML(fields, {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar versión</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        if (!d.version || !d.cambio) { u.toast("Versión y descripción del cambio son obligatorios", "danger"); return; }
        const hist = (rec.historialVersiones || []).concat([{ version: rec.version, fecha: rec.fecha, responsable: rec.responsable, cambio: rec.__ultimoCambio || "Versión previa" }]);
        S().update("documentos", rec.id, { version: d.version, fecha: d.fecha, responsable: d.responsable, __ultimoCambio: d.cambio, historialVersiones: hist });
        u.closeModal(); u.toast("Versión registrada", "ok"); if (refresh) refresh();
      }; } });
  }
  function detalleDocumento(rec) {
    const u = ui();
    const hist = rec.historialVersiones || [];
    const histHTML = hist.length ? `<div class="traza"><strong>Historial de versiones</strong>
      <table class="tbl" style="margin-top:.3rem"><thead><tr><th>Versión</th><th>Fecha</th><th>Responsable</th><th>Cambio</th></tr></thead>
      <tbody>${hist.map(h => `<tr><td>v${u.esc(h.version)}</td><td>${u.fechaCL(h.fecha)}</td><td>${u.esc(h.responsable || "—")}</td><td>${u.esc(h.cambio || "—")}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="muted">Sin versiones anteriores registradas.</p>`;
    detalleGenerico("Documento", rec, [
      ["Código", `<span class="mono">${u.esc(rec.codigo)}</span>`, true],
      ["Nombre", rec.nombre], ["Tipo", rec.tipo], ["Versión actual", "v" + (rec.version || "1")],
      ["Unidad responsable", rec.unidadResponsable], ["Responsable", rec.responsable],
      ["Estado", u.estadoBadge(rec.estado), true], ["Envío a Calidad", rec.envioCalidad],
      ["Fecha de envío", u.fechaCL(rec.fechaEnvio)],
      ["Revisado por Unidad Buenas Prácticas", rec.revisadoUBP],
      ["Responsable de la revisión", rec.responsableRevision],
      ["Fecha de recepción", rec.fechaRecepcion ? u.fechaCL(rec.fechaRecepcion) : "—"],
      ["Observaciones", rec.observaciones]
    ], histHTML);
  }

  /* ===================== MÓDULO 5 — ARTICULACIÓN Y RESPALDO INSTITUCIONAL =====================
     Fusiona el antiguo "Gestión y Respaldo" con "Red de Colaboración": reúne
     reuniones, acuerdos, colaboraciones, articulación, solicitudes y documentos.
     No elimina datos: solo agrupa colecciones ya existentes en un solo módulo. */
  const M5_TABS = [
    { key: "reuniones", label: "Participaciones y reuniones" },
    { key: "acuerdos", label: "Acuerdos y acciones" },
    { key: "colaboraciones", label: "Colaboraciones y red" },
    { key: "articulacion", label: "Articulación y posicionamiento" },
    { key: "respaldos", label: "Documentos y respaldos" }
  ];
  function m5(params) {
    const tab = (params && params.tab) || "reuniones";
    return `<div class="page-head"><h1>Articulación y Respaldo Institucional</h1>
      <p>Reuniones, acuerdos, colaboraciones, articulación institucional y documentos de respaldo, en un solo lugar.</p></div>
      ${R().tabsBar("coord", "m5", M5_TABS, tab)}
      <div id="m5-body"></div>`;
  }
  function m5Bind(main, params) {
    const tab = (params && params.tab) || "reuniones";
    const box = document.getElementById("m5-body");
    if (tab === "reuniones") return m5Reuniones(box);
    if (tab === "respaldos") return m5Respaldos(box);
    if (tab === "acuerdos") return m5Acuerdos(box);
    if (tab === "articulacion") return m5Articulacion(box);
    if (tab === "colaboraciones") return U.coord.colabPanel && U.coord.colabPanel(box);
  }
  function m5Reuniones(box) {
    R().mount(box, {
      collection: "reuniones", title: "Reunión", icon: "📅", withCode: true,
      hint: "Participaciones y reuniones. Cada una recibe código UBPC-REU-AAAA-000.",
      newLabel: "Nueva reunión",
      emptyMsg: "Aún no hay reuniones registradas.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "fecha", label: "Fecha", date: true },
        { key: "tipo", label: "Tipo", render: (r, u) => `<span class="tag">${u.esc(r.tipo || "—")}</span>` },
        { key: "tema", label: "Tema o título" },
        { key: "unidad", label: "Unidad o institución" },
        { key: "responsable", label: "Responsable" },
        { key: "resultado", label: "Resultado / próxima acción" }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "tipo", label: "Tipo", type: "select", options: ["Reunión interna", "Reunión institucional", "Comité", "Mesa técnica", "Participación", "Otra"] },
        { name: "tema", label: "Tema o título", required: true, full: true },
        { name: "unidad", label: "Unidad o institución" },
        { name: "responsable", label: "Responsable" },
        { name: "resultado", label: "Resultado o próxima acción", type: "textarea", full: true }
      ],
      defaults: () => ({ fecha: ui().hoyISO() }),
      rowActions: [{ ico: "🤝", title: "Generar acuerdo desde la reunión", fn: (rec) => crearAcuerdoDesde(rec) }]
    });
  }
  // Registro maestro: vincula automáticamente los Documentos UBPC (estación
  // tipo Word) sin duplicarlos — muestra código, versión, responsable, estado
  // y última acción, con acceso directo al documento.
  function renderRegistroMaestro(cont) {
    const u = ui();
    const docs = S().all("docsTrabajo").sort((a, b) => new Date(b.fechaModificacion || 0) - new Date(a.fechaModificacion || 0));
    const meta = U.docsEditor || {};
    const estadoDe = meta.estadoDe || (() => ({ label: "—", color: "#8a94a6", ic: "" }));
    const plMeta = meta.plMeta || (() => ({ label: "Documento" }));
    const ultimaAccion = d => {
      const h = d.historial && d.historial.length ? d.historial[d.historial.length - 1] : null;
      if (h) return h.accion + " · " + u.fechaCL(h.fecha);
      return "Modificado · " + u.fechaCL(d.fechaModificacion);
    };
    const responsable = d => d.finalizadoPor || d.aprobadoPor || d.modificadoPor || d.creadoPor || "—";
    const filas = docs.map(d => {
      const est = estadoDe(d), p = plMeta(d.plantilla);
      return `<tr>
        <td>${d.codigo ? `<span class="mono">${u.esc(d.codigo)}</span>` : `<span class="muted">— sin código —</span>`}</td>
        <td><strong>${u.esc(d.titulo || "Documento")}</strong><div class="kpi__sub">${u.esc(p.label)}</div></td>
        <td>v${d.version || 1}</td>
        <td><span class="doc-estado doc-estado--sm" style="--ec:${est.color}">${est.ic} ${u.esc(est.label)}</span></td>
        <td>${u.esc(responsable(d))}</td>
        <td>${u.esc(ultimaAccion(d))}</td>
        <td class="acciones"><a class="btn btn--ghost btn--sm" href="#/coord/m2?tab=docs&doc=${d.id}">Abrir ↗</a></td>
      </tr>`;
    }).join("");
    const finalizados = docs.filter(d => d.estado === "finalizado").length;
    cont.innerHTML = `
      <div class="section__head"><div><h3 class="section__title">Registro maestro · Documentos UBPC</h3>
        <p class="section__hint">Vinculado automáticamente a la estación de Documentos (Apoyo y Mejora). ${docs.length} documento(s), ${finalizados} finalizado(s).</p></div>
        <a class="btn btn--primary btn--sm" href="#/coord/m2?tab=docs">+ Nuevo documento</a></div>
      ${docs.length ? `<div class="table-wrap"><table class="tbl"><thead><tr>
        <th>Código</th><th>Documento</th><th>Versión</th><th>Estado</th><th>Responsable</th><th>Última acción</th><th></th>
        </tr></thead><tbody>${filas}</tbody></table></div>`
        : u.empty("Aún no hay documentos UBPC.", "Créalos en Apoyo y Mejora → Documentos de trabajo; aquí aparecerán con su código y estado.", "🗂️")}`;
  }
  function m5Respaldos(box) {
    box.innerHTML = `<div id="doc-registro"></div><div class="section__head" style="margin-top:1.4rem"><div><h3 class="section__title">Otros respaldos</h3><p class="section__hint">Documentos externos, escaneos, presentaciones y enlaces.</p></div></div><div id="respaldos-mount"></div>`;
    renderRegistroMaestro(document.getElementById("doc-registro"));
    R().mount(document.getElementById("respaldos-mount"), {
      collection: "respaldos", title: "Documento o respaldo", icon: "🗄️",
      hint: "Documentos, informes, actas, presentaciones, memorandos y resoluciones.",
      newLabel: "Nuevo respaldo",
      emptyMsg: "Aún no hay documentos de respaldo.",
      columns: [
        { key: "fecha", label: "Fecha", date: true },
        { key: "tipo", label: "Tipo", render: (r, u) => `<span class="tag">${u.esc(r.tipo || "—")}</span>` },
        { key: "titulo", label: "Título" },
        { key: "responsable", label: "Responsable" },
        { key: "enlace", label: "Respaldo", render: (r, u) => r.enlace ? `<a href="${u.esc(r.enlace)}" target="_blank" rel="noopener">Abrir ↗</a>` : "—" }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "tipo", label: "Tipo", type: "select", options: ["Documento", "Informe", "Acta", "Presentación", "Memorando", "Resolución", "Otro"] },
        { name: "titulo", label: "Título", required: true, full: true },
        { name: "responsable", label: "Responsable" },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true },
        { name: "enlace", label: "Enlace / ubicación del respaldo", full: true }
      ],
      defaults: () => ({ fecha: ui().hoyISO() })
    });
  }
  function m5Acuerdos(box) {
    R().mount(box, {
      collection: "acuerdos", title: "Acuerdo o acción", icon: "🤝", withCode: true,
      hint: "Compromisos derivados de reuniones. Código UBPC-ACU-AAAA-000.",
      newLabel: "Nuevo acuerdo",
      emptyMsg: "Aún no hay acuerdos registrados.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "compromiso", label: "Compromiso" },
        { key: "reunionOrigen", label: "Reunión de origen", mono: true },
        { key: "responsable", label: "Responsable" },
        { key: "plazo", label: "Plazo", date: true },
        { key: "estado", label: "Estado", badge: true }
      ],
      fields: () => ([
        { name: "compromiso", label: "Compromiso o acción", required: true, full: true, type: "textarea" },
        { name: "reunionOrigen", label: "Reunión de origen", type: "select", placeholder: "Sin reunión asociada",
          options: S().all("reuniones").map(r => ({ value: r.codigo, label: (r.codigo || "") + " · " + (r.tema || "") })) },
        { name: "responsable", label: "Responsable" },
        { name: "plazo", label: "Plazo", type: "date" },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] }
      ]),
      defaults: () => ({ estado: "Pendiente" })
    });
  }
  function crearAcuerdoDesde(reunion) {
    const u = ui();
    u.modal({ title: "Nuevo acuerdo desde " + (reunion.codigo || "reunión"),
      body: u.formHTML([
        { name: "compromiso", label: "Compromiso o acción", required: true, full: true, type: "textarea" },
        { name: "responsable", label: "Responsable", value: reunion.responsable },
        { name: "plazo", label: "Plazo", type: "date" },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] }
      ], { estado: "Pendiente" }),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Crear acuerdo</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m);
        if (!d.compromiso) { u.toast("El compromiso es obligatorio", "danger"); return; }
        d.reunionOrigen = reunion.codigo;
        S().insert("acuerdos", d, { withCode: true });
        u.closeModal(); u.toast("Acuerdo creado", "ok");
      }; } });
  }
  function m5Articulacion(box) {
    R().mount(box, {
      collection: "articulaciones", title: "Articulación", icon: "🌐", withCode: true,
      hint: "Articulación y posicionamiento institucional de la UBPC.",
      newLabel: "Nueva articulación",
      emptyMsg: "Aún no hay articulaciones registradas.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "institucion", label: "Institución o espacio" },
        { key: "aporte", label: "Aporte técnico" },
        { key: "resultado", label: "Resultado" },
        { key: "continuidad", label: "Continuidad", render: (r, u) => `<span class="tag">${u.esc(r.continuidad || "—")}</span>` }
      ],
      fields: [
        { name: "institucion", label: "Institución o espacio", required: true, full: true },
        { name: "participacion", label: "Participación de la UBPC", type: "textarea", full: true },
        { name: "aporte", label: "Aporte técnico", type: "textarea", full: true },
        { name: "resultado", label: "Resultado", type: "textarea", full: true },
        { name: "continuidad", label: "Continuidad", type: "select", options: ["Sí", "No", "Por definir"] },
        { name: "proximaAccion", label: "Próxima acción", full: true }
      ],
      defaults: () => ({ continuidad: "Por definir" })
    });
  }

  /* ---------- Detalle genérico reutilizable ---------- */
  function detalleGenerico(titulo, rec, filas, extraHTML) {
    const u = ui();
    const body = `<div class="dl">${filas.map(f =>
      `<div style="${f[2] ? "grid-column:1/-1" : ""}"><span>${u.esc(f[0])}</span><strong>${f[1] != null && f[1] !== "" ? f[1] : "—"}</strong></div>`
    ).join("")}</div>${extraHTML || ""}${U.components.resource.trazabilidad(rec)}`;
    u.modal({ title: titulo + (rec.codigo ? " · " + rec.codigo : ""), wide: true, body,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>` });
  }

  /* ---------- Registro en el portal del Coordinador ---------- */
  Object.assign(U.coord.views, { m1, m2, m5, solicitudes: solicitudesCoord });
  Object.assign(U.coord.binders, { m1: m1Bind, m2: m2Bind, m5: m5Bind, solicitudes: solicitudesCoordBind });
  // Utilidad para la Agenda: próxima revisión de protocolos
  U.protocolos = { proximaRevision, revisionInfo };

  // El módulo "Solicitudes técnicas" se integró en "Enlace con el Referente".
  // Se conserva la ruta como redirección para no romper enlaces o marcadores previos.
  function solicitudesCoord() { return ""; }
  function solicitudesCoordBind() { U.router.go("#/coord/enlace"); }
})();
