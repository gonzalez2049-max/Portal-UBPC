/* ============================================================
   MÓDULO 4 — PROGRAMA DE FORTALECIMIENTO (Fase 4)
   Actividades y capacitación · EVI (edición) · Reconocimientos
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CAT = () => U.data.CAT, R = () => U.components.resource;

  const TABS = [
    { key: "actividades", label: "Actividades y capacitación" },
    { key: "evi", label: "EVI · Evidencia que transforma" },
    { key: "reconocimientos", label: "Reconocimientos" }
  ];
  const TIPO_EVIDENCIA = ["Revisión sistemática", "Metaanálisis", "Ensayo clínico", "Guía de práctica clínica",
    "Estudio observacional", "Consenso de expertos", "Otro"];

  function m4(params) {
    const tab = (params && params.tab) || "actividades";
    return `<div class="page-head"><h1>Programa de Fortalecimiento</h1>
      <p>Actividades, capacitación y cobertura; evidencia que transforma (EVI); y reconocimientos.</p></div>
      ${R().tabsBar("coord", "m4", TABS, tab)}<div id="m4-body"></div>`;
  }
  function m4Bind(main, params) {
    const tab = (params && params.tab) || "actividades";
    const box = document.getElementById("m4-body");
    ({ actividades, evi, reconocimientos }[tab] || actividades)(box);
  }

  /* ---------- Actividades y capacitación ---------- */
  function kpiMini(label, value, sub, kind, icon) {
    return `<div class="card kpi kpi--${kind || "info"}">
      <div class="kpi__top"><div class="kpi__label">${ui().esc(label)}</div><div class="kpi__ico">${icon || ""}</div></div>
      <div class="kpi__value">${value}</div><div class="kpi__sub">${ui().esc(sub || "")}</div></div>`;
  }
  function periodoDe(fecha) {
    if (!fecha) return "—";
    const d = new Date(fecha); if (isNaN(d)) return "—";
    return d.getFullYear() + "-S" + (d.getMonth() < 6 ? 1 : 2);
  }
  function renderCapChart(el) {
    if (!el) return;
    const u = ui();
    const acts = S().all("actividades");
    if (!acts.length) { el.innerHTML = ""; return; }
    const totalCap = acts.reduce((n, a) => n + (parseInt(a.personasCapacitadas) || 0), 0);
    const sumPO = acts.reduce((n, a) => n + (parseInt(a.poblacionObjetivo) || 0), 0);
    const cob = sumPO > 0 ? Math.round(totalCap / sumPO * 100) : null;

    // Capacitados por período
    const periodos = [...new Set(acts.map(a => periodoDe(a.fecha)).filter(p => p !== "—"))].sort();
    const serie = periodos.map(pr => acts.filter(a => periodoDe(a.fecha) === pr)
      .reduce((n, a) => n + (parseInt(a.personasCapacitadas) || 0), 0));
    const multi = periodos.length > 1;
    const delta = multi ? serie[serie.length - 1] - serie[serie.length - 2] : null;

    // Capacitados por estamento (dónde falta cobertura)
    const porEst = {};
    acts.forEach(a => {
      if (a.desglose && typeof a.desglose === "object" && Object.keys(a.desglose).length) {
        Object.keys(a.desglose).forEach(e => { porEst[e] = (porEst[e] || 0) + (parseInt(a.desglose[e]) || 0); });
      } else {
        const e = a.estamento || "Sin estamento"; porEst[e] = (porEst[e] || 0) + (parseInt(a.personasCapacitadas) || 0);
      }
    });
    const estItems = Object.keys(porEst).map(k => ({ label: k, value: porEst[k] }))
      .sort((a, b) => b.value - a.value);
    const maxEst = Math.max.apply(0, estItems.map(i => i.value)) || 1;

    const dBadge = delta == null ? "" : `<span class="badge badge--${delta > 0 ? "ok" : delta < 0 ? "danger" : "neutral"}">${delta > 0 ? "▲ +" + delta : delta < 0 ? "▼ " + delta : "→ 0"} vs período anterior</span>`;
    const menor = estItems[estItems.length - 1];
    const lectura = multi
      ? (delta > 0 ? `La capacitación <strong>creció ${delta} personas</strong> respecto al período anterior.`
        : delta < 0 ? `La capacitación <strong>bajó ${Math.abs(delta)} personas</strong> respecto al período anterior; conviene reactivar actividades.`
        : `La capacitación se mantuvo estable respecto al período anterior.`)
      : `Registra actividades en más períodos para ver la evolución.`;
    const accion = estItems.length > 1 ? `El estamento con menor cobertura es <strong>${u.esc(menor.label)}</strong> (${menor.value}). Priorizar actividades dirigidas a ese grupo.` : `Diversifica los estamentos para ampliar el alcance.`;

    el.innerHTML = `
      <div class="grid grid--kpi" style="margin-bottom:1rem">
        ${kpiMini("Actividades", acts.length, "Registradas", "info", "🎓")}
        ${kpiMini("Personas capacitadas", totalCap, "Total acumulado", "ok", "👥")}
        ${kpiMini("Cobertura global", cob == null ? "—" : cob + "%", "Capacitados / población objetivo", cob == null ? "neutral" : cob >= 80 ? "ok" : "warn", "🎯")}
        ${kpiMini("Estamentos alcanzados", estItems.length, "Grupos con capacitación", "info", "🩺")}
      </div>
      <div class="grid grid--2" style="margin-bottom:1.1rem">
        <div class="card"><div class="section__head" style="margin-bottom:.4rem">
          <h3 class="card__title" style="margin:0">📈 Personas capacitadas por período</h3>${dBadge}</div>
          ${multi ? `<div style="padding:.2rem .2rem .1rem">${U.charts.sparkline(serie, { color: "var(--verde)" })}</div>
            <div class="flex" style="justify-content:space-between;font-size:12px;color:var(--text-muted);margin-top:.2rem">
              ${periodos.map((pr, i) => `<span>${u.esc(pr)}: <strong style="color:var(--text-2)">${serie[i]}</strong></span>`).join("")}</div>`
            : `<div class="kpi__value" style="font-size:2rem">${serie[0] || 0}</div><div class="kpi__sub">personas en ${u.esc(periodos[0] || "—")}</div>`}
          <div class="nt-lectura"><span class="nt-lectura__ico">🧭</span>
            <div><div style="margin-bottom:.15rem">${lectura}</div><div style="color:var(--text-2)"><strong>Decisión sugerida:</strong> ${accion}</div></div></div>
        </div>
        <div class="card"><h3 class="card__title">Capacitados por estamento</h3>
          <p class="card__hint" style="margin:.1rem 0 .5rem">Distribución del alcance para equilibrar la cobertura.</p>
          <div class="bars">${estItems.map(i => `<div style="margin-bottom:.55rem">
            <div class="flex" style="justify-content:space-between;font-size:13px;font-weight:600"><span>${u.esc(i.label)}</span><span>${i.value}</span></div>
            <div style="background:var(--chart-track,#e9eff7);border-radius:6px;height:12px;overflow:hidden">
              <div style="width:${Math.round(i.value / maxEst * 100)}%;height:100%;background:var(--celeste);border-radius:6px"></div></div></div>`).join("")}</div>
        </div>
      </div>`;
  }

  function actividades(box) {
    box.innerHTML = `<div id="cap-chart"></div><div id="cap-res"></div>`;
    const draw = () => renderCapChart(document.getElementById("cap-chart"));
    draw();
    R().mount(document.getElementById("cap-res"), {
      afterChange: draw,
      collection: "actividades", title: "Actividad", icon: "🎓", withCode: true,
      hint: "Actividades de capacitación con estamento, personas capacitadas y cobertura. Código UBPC-CAP-AAAA-000.",
      newLabel: "Nueva actividad",
      emptyMsg: "Aún no hay actividades registradas.",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "fecha", label: "Fecha", date: true },
        { key: "actividad", label: "Actividad" },
        { key: "tipo", label: "Tipo", render: (r, u) => `<span class="tag">${u.esc(r.tipo || "—")}</span>` },
        { key: "estamento", label: "Estamento" },
        { key: "personasCapacitadas", label: "Capacitados", num: true },
        { key: "cobertura", label: "Cobertura" },
        { key: "estado", label: "Estado", badge: true }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "actividad", label: "Actividad", required: true, full: true },
        { name: "tipo", label: "Tipo", type: "select", options: ["Capacitación", "Taller", "Curso", "Charla", "Inducción", "Simulación", "Otro"] },
        { name: "unidadResp", label: "Unidad responsable", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "unidadesParticipantes", label: "Unidades participantes", full: true },
        { name: "estamento", label: "Estamento", type: "select", options: CAT().estamentos },
        { name: "personasCapacitadas", label: "Personas capacitadas", type: "number" },
        { name: "poblacionObjetivo", label: "Población objetivo", type: "number" },
        { name: "cobertura", label: "Cobertura (%) · automática", hint: "Se calcula solo: capacitados ÷ población objetivo." },
        { name: "guia", label: "Guía BPSO", type: "select", options: ["—"].concat(CAT().guiasArea) },
        { name: "responsable", label: "Responsable" },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] }
      ],
      defaults: () => ({ estado: "Completado", fecha: ui().hoyISO() }),
      onFormMount: (m, rec) => {
        const u = ui();
        rec = rec || {};
        const estSel = m.querySelector('[name="estamento"]');
        const pcInput = m.querySelector('[name="personasCapacitadas"]');
        const poInput = m.querySelector('[name="poblacionObjetivo"]');
        const cobInput = m.querySelector('[name="cobertura"]');
        if (!estSel || !pcInput || !poInput || !cobInput) return;
        cobInput.readOnly = true; cobInput.style.background = "var(--surface-2)";
        // Desglose por estamento (cuando es Multiestamento)
        const ESTS = CAT().estamentos.filter(e => !/multiestamento/i.test(e));
        const des = rec.desglose || {};
        const desHTML = `<div class="field" id="cap-des" style="grid-column:1/-1;display:none">
          <label>Personas capacitadas por estamento</label>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.5rem">
            ${ESTS.map(e => `<div style="display:flex;flex-direction:column;gap:.15rem">
              <span class="kpi__sub">${u.esc(e)}</span>
              <input class="input" type="number" min="0" data-des="${u.esc(e)}" value="${des[e] != null ? des[e] : ""}">
            </div>`).join("")}
          </div>
          <div class="kpi__sub" style="margin-top:.3rem">El total de «Personas capacitadas» se suma automáticamente desde este desglose.</div>
        </div>`;
        estSel.closest(".field").insertAdjacentHTML("afterend", desHTML);
        const desBox = m.querySelector("#cap-des");
        const isMulti = () => /multiestamento/i.test(estSel.value || "");
        const recompute = () => {
          if (isMulti()) {
            desBox.style.display = "";
            let sum = 0; desBox.querySelectorAll("[data-des]").forEach(i => sum += Number(i.value) || 0);
            pcInput.value = sum; pcInput.readOnly = true; pcInput.style.background = "var(--surface-2)";
          } else {
            desBox.style.display = "none";
            pcInput.readOnly = false; pcInput.style.background = "";
          }
          const po = Number(poInput.value), pc = Number(pcInput.value);
          cobInput.value = (po > 0 && pc >= 0) ? Math.round(pc / po * 100) + "%" : "";
        };
        estSel.addEventListener("change", recompute);
        poInput.addEventListener("input", recompute);
        pcInput.addEventListener("input", recompute);
        desBox.querySelectorAll("[data-des]").forEach(i => i.addEventListener("input", recompute));
        recompute();
      },
      onBeforeSave: (d, rec, m) => {
        const estSel = m && m.querySelector('[name="estamento"]');
        const isMulti = /multiestamento/i.test(estSel ? estSel.value : (d.estamento || ""));
        if (isMulti && m) {
          const des = {}; let sum = 0;
          m.querySelectorAll("#cap-des [data-des]").forEach(i => { const v = Number(i.value) || 0; if (v > 0) { des[i.dataset.des] = v; sum += v; } });
          d.desglose = des; d.personasCapacitadas = sum;
        } else {
          delete d.desglose;
        }
        const po = Number(d.poblacionObjetivo), pc = Number(d.personasCapacitadas);
        d.cobertura = (po > 0 && pc >= 0) ? Math.round(pc / po * 100) + "%" : "";
        return d;
      }
    });
  }

  /* ---------- EVI — Evidencia que transforma ---------- */
  // Dos subpestañas: "Evidencia científica" (contenido original, intacto) y
  // "EVI Clínico" (boletines breves para transferir evidencia a la práctica).
  let eviSub = "cientifica";
  function evi(box) {
    box.innerHTML = `<div class="tabs no-print" style="margin-bottom:1rem">
        <a class="tab ${eviSub === "cientifica" ? "active" : ""}" style="--tab-c:#7a5cd0" href="#" data-evisub="cientifica"><span class="tab__dot"></span>Evidencia científica</a>
        <a class="tab ${eviSub === "clinico" ? "active" : ""}" style="--tab-c:#12b5a5" href="#" data-evisub="clinico"><span class="tab__dot"></span>EVI Clínico</a>
      </div><div id="evi-sub-body"></div>`;
    box.querySelectorAll("[data-evisub]").forEach(a => a.onclick = ev => { ev.preventDefault(); eviSub = a.dataset.evisub; evi(box); });
    (eviSub === "clinico" ? eviClinico : eviCientifica)(box.querySelector("#evi-sub-body"));
  }

  /* ---------- EVI · Evidencia científica (edición) — contenido original ---------- */
  function eviCientifica(box) {
    const u = ui();
    const list = S().all("edicionesEVI").sort((a, b) => (b.numeroEdicion || 0) - (a.numeroEdicion || 0));
    box.innerHTML = `<div class="section__head">
        <p class="section__hint">Registra una edición completa; cada edición puede contener varias evidencias. Código UBPC-EVI-AAAA-000.</p>
        <button class="btn btn--primary btn--sm" id="newEvi">+ Nueva edición</button></div>
      ${list.length ? `<div class="grid grid--2" id="evi-list">${list.map(ediCard).join("")}</div>`
        : u.empty("Aún no hay ediciones EVI.", "Crea la primera edición para comenzar.", "🦉")}`;
    document.getElementById("newEvi").onclick = () => ediForm(null, () => eviCientifica(box));
    box.querySelectorAll("[data-eviedit]").forEach(b => b.onclick = () => ediForm(S().get("edicionesEVI", b.dataset.eviedit), () => eviCientifica(box)));
    box.querySelectorAll("[data-evidel]").forEach(b => b.onclick = () => u.confirmDelete("¿Eliminar esta edición EVI?", () => { S().remove("edicionesEVI", b.dataset.evidel); eviCientifica(box); }));
  }

  /* ---------- EVI Clínico · boletines breves para la práctica ---------- */
  function eviClinico(box) {
    const u = ui();
    const list = S().all("edicionesEVIClinico").sort((a, b) => (b.numeroEdicion || 0) - (a.numeroEdicion || 0));
    box.innerHTML = `<div class="section__head" style="align-items:flex-start">
        <div>
          <div class="card__title" style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap"><span>🩺</span>EVI Clínico <span style="color:var(--text-muted);font-weight:500">| De la evidencia al cuidado</span></div>
          <p class="section__hint" style="margin-top:.25rem">Boletines breves que transforman evidencia reciente en acciones concretas para la práctica clínica. Código UBPC-EVIC-AAAA-000.</p>
        </div>
        <button class="btn btn--primary btn--sm" id="newEvic">+ Nuevo boletín</button></div>
      ${list.length ? `<div class="grid grid--2" id="evic-list">${list.map(evicCard).join("")}</div>`
        : u.empty("Aún no hay boletines EVI Clínico.", "Crea el primer boletín para difundir evidencia a la práctica.", "🩺")}`;
    document.getElementById("newEvic").onclick = () => evicForm(null, () => eviClinico(box));
    box.querySelectorAll("[data-cedit]").forEach(b => b.onclick = () => evicForm(S().get("edicionesEVIClinico", b.dataset.cedit), () => eviClinico(box)));
    box.querySelectorAll("[data-cdel]").forEach(b => b.onclick = () => u.confirmDelete("¿Eliminar este boletín EVI Clínico?", () => { S().remove("edicionesEVIClinico", b.dataset.cdel); eviClinico(box); }));
  }
  function evicCard(e) {
    const u = ui();
    return `<div class="card" style="border-top:4px solid #12b5a5">
      <div class="card__head"><div><span class="mono">${u.esc(e.codigo || "")}</span>
        <div class="card__title">Boletín N.º ${u.esc(e.numeroEdicion || "—")}</div></div>
        <span class="kpi__sub">${u.fechaCL(e.fecha)}</span></div>
      ${e.tema ? `<span class="tag">${u.esc(e.tema)}</span>` : ""}
      <div style="font-size:14px;font-weight:700;margin:.45rem 0 .3rem">${u.esc(e.titulo || "Sin título")}</div>
      ${e.mensajeClave ? `<div class="narrativo" style="font-size:13px;background:var(--surface-2);border-radius:9px;padding:.5rem .6rem;margin-bottom:.45rem"><strong>Mensaje clave:</strong> ${u.esc(e.mensajeClave)}</div>` : ""}
      ${e.evidenciaOrigen ? `<div class="kpi__sub" style="margin-bottom:.2rem"><strong>Evidencia de origen:</strong> ${u.esc(e.evidenciaOrigen)}</div>` : ""}
      ${e.publico ? `<div class="kpi__sub" style="margin-bottom:.2rem"><strong>Público objetivo:</strong> ${u.esc(e.publico)}</div>` : ""}
      ${e.responsable ? `<div class="kpi__sub" style="margin-bottom:.2rem"><strong>Responsable del envío:</strong> ${u.esc(e.responsable)}</div>` : ""}
      <div class="btn-row" style="margin-top:.5rem">
        <button class="btn btn--ghost btn--sm" data-cedit="${e.id}">✏️ Editar</button>
        <button class="btn-icon" data-cdel="${e.id}" title="Eliminar">🗑️</button>
      </div></div>`;
  }
  function evicForm(rec, onDone) {
    const u = ui();
    rec = rec || {};
    const isNew = !rec.id;
    const codigo = rec.codigo || S().peekCode("edicionesEVIClinico");
    const cabecera = u.formHTML([
      { name: "numeroEdicion", label: "N.º de edición", type: "number", value: rec.numeroEdicion || nextEdicionClinico() },
      { name: "fecha", label: "Fecha", type: "date", value: rec.fecha ? u.isoDay(rec.fecha) : u.hoyISO() },
      { name: "tema", label: "Tema / área clínica", value: rec.tema || "", full: true },
      { name: "titulo", label: "Título del boletín", value: rec.titulo || "", required: true, full: true },
      { name: "evidenciaOrigen", label: "Evidencia científica de origen", type: "textarea", rows: 2, value: rec.evidenciaOrigen || "", full: true },
      { name: "mensajeClave", label: "Mensaje clave", type: "textarea", rows: 2, value: rec.mensajeClave || "", full: true },
      { name: "publico", label: "Público objetivo", value: rec.publico || "", full: true },
      { name: "responsable", label: "Responsable del envío", value: rec.responsable || "", hint: "Quién difunde el boletín a los equipos clínicos.", full: true }
    ], {});
    u.modal({
      title: (isNew ? "Nuevo" : "Editar") + " boletín EVI Clínico", wide: true,
      body: `<p class="card__hint">Código automático: <span class="mono">${u.esc(codigo || "UBPC-EVIC-…")}</span></p>${cabecera}`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar boletín</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.titulo) { u.toast("Ingresa el título del boletín", "danger"); return; }
          if (d.fecha) d.fecha = new Date(d.fecha).toISOString();
          if (rec.id) S().update("edicionesEVIClinico", rec.id, d); else S().insert("edicionesEVIClinico", d, { withCode: true });
          u.closeModal(); u.toast("Boletín EVI Clínico guardado", "ok"); if (onDone) onDone();
        };
      }
    });
  }
  function nextEdicionClinico() {
    const list = S().all("edicionesEVIClinico");
    return list.length ? Math.max(...list.map(e => Number(e.numeroEdicion) || 0)) + 1 : 1;
  }
  function ediCard(e) {
    const u = ui();
    const evs = e.evidencias || [];
    return `<div class="card" style="border-top:4px solid var(--c-morado)">
      <div class="card__head"><div><span class="mono">${u.esc(e.codigo || "")}</span>
        <div class="card__title">Edición N.º ${u.esc(e.numeroEdicion || "—")} · v${u.esc(e.version || "1")}</div></div>
        <span class="kpi__sub">${u.fechaCL(e.fechaEnvio)}</span></div>
      <div class="kpi__sub" style="margin-bottom:.5rem">${evs.length} evidencia(s)</div>
      ${evs.map((ev, i) => `<div style="border:1px solid var(--border);border-radius:9px;padding:.5rem .6rem;margin-bottom:.4rem">
        <div class="flex" style="justify-content:space-between"><strong style="font-size:13px">Evidencia ${i + 1}</strong><span class="tag">${u.esc(ev.tipo || "—")}</span></div>
        <div style="font-size:13px"><strong>${u.esc(ev.trabajo || "")}</strong></div>
        <div class="kpi__sub">${u.esc(ev.area || "")} · ${u.esc(ev.autores || "")} · ${u.esc(ev.anio || "")}</div>
        ${ev.hallazgo ? `<div style="font-size:12.5px" class="narrativo">${u.esc(ev.hallazgo)}</div>` : ""}
        ${ev.enlace ? `<a href="${u.esc(ev.enlace)}" target="_blank" rel="noopener" style="font-size:12.5px">Ver ↗</a>` : ""}
      </div>`).join("") || `<div class="kpi__sub">Sin evidencias en esta edición.</div>`}
      <div class="btn-row" style="margin-top:.4rem">
        <button class="btn btn--ghost btn--sm" data-eviedit="${e.id}">✏️ Editar edición</button>
        <button class="btn-icon" data-evidel="${e.id}" title="Eliminar">🗑️</button>
      </div></div>`;
  }
  function ediForm(rec, onDone) {
    const u = ui();
    rec = rec || {};
    let evs = rec.evidencias ? JSON.parse(JSON.stringify(rec.evidencias)) : [{}];
    const cabecera = u.formHTML([
      { name: "numeroEdicion", label: "Número de edición", type: "number", value: rec.numeroEdicion || nextEdicion() },
      { name: "version", label: "Versión", value: rec.version || "1" },
      { name: "fechaEnvio", label: "Fecha de envío", type: "date", value: rec.fechaEnvio ? u.isoDay(rec.fechaEnvio) : u.hoyISO() }
    ], {});
    u.modal({
      title: (rec.id ? "Editar" : "Nueva") + " edición EVI", wide: true,
      body: `<p class="card__hint">Formulario compacto, similar a la información enviada por correo.</p>
        ${cabecera}<h4>Evidencias</h4><div id="ev-cards"></div>
        <button class="btn btn--ghost btn--sm" id="addEv" type="button">+ Agregar otra evidencia</button>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar edición</button>`,
      onMount(m) {
        const cards = m.querySelector("#ev-cards");
        function render() {
          cards.innerHTML = evs.map((ev, i) => `<div class="card" style="margin-bottom:.6rem;border-left:4px solid var(--c-celeste)">
            <div class="flex" style="justify-content:space-between;margin-bottom:.4rem"><strong>Evidencia ${i + 1}</strong>
              ${evs.length > 1 ? `<button class="btn-icon" data-rm="${i}" type="button" title="Quitar">🗑️</button>` : ""}</div>
            <div class="form-grid">
              <div class="field"><label>Área</label><select class="select" data-ev="${i}" data-f="area">${["General"].concat(CAT().guiasArea).map(o => `<option ${ev.area === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>
              <div class="field"><label>Año</label><input class="input" type="number" data-ev="${i}" data-f="anio" value="${u.esc(ev.anio || "")}"></div>
              <div class="field" style="grid-column:1/-1"><label>Trabajo / título</label><input class="input" data-ev="${i}" data-f="trabajo" value="${u.esc(ev.trabajo || "")}"></div>
              <div class="field" style="grid-column:1/-1"><label>Autores</label><input class="input" data-ev="${i}" data-f="autores" value="${u.esc(ev.autores || "")}"></div>
              <div class="field"><label>Tipo de evidencia</label><select class="select" data-ev="${i}" data-f="tipo">${["—"].concat(TIPO_EVIDENCIA).map(o => `<option ${ev.tipo === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>
              <div class="field"><label>Enlace</label><input class="input" data-ev="${i}" data-f="enlace" value="${u.esc(ev.enlace || "")}"></div>
              <div class="field" style="grid-column:1/-1"><label>Hallazgo principal</label><textarea class="textarea" data-ev="${i}" data-f="hallazgo" rows="2">${u.esc(ev.hallazgo || "")}</textarea></div>
            </div></div>`).join("");
          cards.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { sync(); evs.splice(Number(b.dataset.rm), 1); render(); });
        }
        function sync() {
          cards.querySelectorAll("[data-ev]").forEach(el => {
            const i = Number(el.dataset.ev); evs[i] = evs[i] || {}; evs[i][el.dataset.f] = el.value;
          });
        }
        m.querySelector("#addEv").onclick = () => { sync(); evs.push({}); render(); };
        render();
        m.querySelector("[data-save]").onclick = () => {
          sync();
          const d = u.readForm(m);
          d.evidencias = evs.filter(ev => ev.trabajo || ev.autores || ev.hallazgo);
          if (d.fechaEnvio) d.fechaEnvio = new Date(d.fechaEnvio).toISOString();
          if (rec.id) S().update("edicionesEVI", rec.id, d); else S().insert("edicionesEVI", d, { withCode: true });
          u.closeModal(); u.toast("Edición EVI guardada", "ok"); if (onDone) onDone();
        };
      }
    });
  }
  function nextEdicion() {
    const list = S().all("edicionesEVI");
    return list.length ? Math.max(...list.map(e => Number(e.numeroEdicion) || 0)) + 1 : 1;
  }

  /* ---------- Reconocimientos ---------- */
  /* ---------- Reconocimientos: podio + muro de trofeos (editable) ---------- */
  const PREMIO_META = {
    "Buena práctica del mes": { ic: "🏆", c: "#e0a12f" },
    "Reconocimiento institucional": { ic: "🏛️", c: "#7a5cd0" },
    "Mención destacada": { ic: "🌟", c: "#12b5a5" },
    "Felicitación": { ic: "👏", c: "#1e9fe0" },
    "Otro": { ic: "🎖️", c: "#5f7d76" }
  };
  const PREMIOS = Object.keys(PREMIO_META);
  const pMeta = t => PREMIO_META[t] || PREMIO_META["Otro"];

  function confettiBurst(host) {
    if (!host) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    if (reduce) return;
    const colors = ["#e0a12f", "#12b5a5", "#7a5cd0", "#1e9fe0", "#e0526f", "#37a04a", "#f2c53d"];
    const wrap = document.createElement("div"); wrap.className = "confetti";
    for (let i = 0; i < 46; i++) {
      const s = document.createElement("i");
      s.style.left = (Math.random() * 100).toFixed(1) + "%";
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
      s.style.animationDuration = (1.6 + Math.random() * 1.3).toFixed(2) + "s";
      if (i % 3 === 0) { s.style.width = "7px"; s.style.height = "7px"; s.style.borderRadius = "50%"; }
      wrap.appendChild(s);
    }
    host.appendChild(wrap);
    setTimeout(() => wrap.remove(), 3400);
  }

  function reconocimientos(box) {
    const u = ui();
    let prevLeader = null;
    const render = (celebrate) => {
      const list = S().all("reconocimientos").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const now = new Date(), mesActual = now.getFullYear() + "-" + now.getMonth();
      const esteMes = list.filter(r => { const d = new Date(r.fecha); return !isNaN(d) && (d.getFullYear() + "-" + d.getMonth()) === mesActual; }).length;

      // Ranking de unidades (podio)
      const byUnit = {};
      list.forEach(r => { const un = r.unidad || "Sin unidad"; byUnit[un] = (byUnit[un] || 0) + 1; });
      // En empates, el líder actual conserva la corona (solo se pierde si alguien lo supera).
      const ranking = Object.keys(byUnit).map(k => ({ unidad: k, n: byUnit[k] }))
        .sort((a, b) => b.n - a.n || (a.unidad === prevLeader ? -1 : b.unidad === prevLeader ? 1 : 0));
      const top = ranking.slice(0, 3);
      const medal = ["🥇", "🥈", "🥉"];
      const spots = [{ t: top[1], p: 2 }, { t: top[0], p: 1 }, { t: top[2], p: 3 }].filter(x => x.t);
      const rey = top[0];
      const nuevoLider = !!(celebrate && rey && prevLeader && rey.unidad !== prevLeader);
      const corona = rey ? `<div class="reco-corona${nuevoLider ? " reco-corona--nuevo" : ""}">
          ${nuevoLider ? `<div class="reco-corona__flash">👑 ¡Nueva unidad líder!</div>` : ""}
          <img class="reco-corona__evi" src="assets/img/evi-full.png" alt="EVI, mascota de la UBPC">
          <div class="reco-corona__msg">
            <strong>🎉 ¡EVI corona a <span>${u.esc(rey.unidad)}</span> como la unidad más reconocida!</strong>
            <span>${rey.n} reconocimiento${rey.n !== 1 ? "s" : ""} · ¡Sigan fortaleciendo el cuidado con evidencia!</span>
          </div></div>` : "";
      const podio = top.length ? `<div class="card reco-podio-card">
          <h3 class="card__title" style="text-align:center">🏆 Podio de unidades más reconocidas</h3>
          ${corona}
          <div class="reco-podio">${spots.map(({ t, p }) => `
            <div class="podio__spot podio__spot--${p}">
              <div class="podio__medal">${medal[p - 1]}</div>
              <div class="podio__unit">${u.esc(t.unidad)}</div>
              <div class="podio__count">${t.n} reconocimiento${t.n !== 1 ? "s" : ""}</div>
              <div class="podio__base"><span>${p}°</span></div>
            </div>`).join("")}</div></div>` : "";

      const wall = list.length
        ? `<div class="grid grid--3">${list.map(r => {
            const m = pMeta(r.tipo);
            return `<div class="trophy" style="--tc:${m.c}">
              <div class="trophy__top"><span class="trophy__ic">${m.ic}</span>
                <div class="trophy__acts">
                  <button class="btn btn--ghost btn--sm" data-edit="${r.id}" title="Editar">✏️</button>
                  <button class="btn btn--ghost btn--sm" data-del="${r.id}" title="Eliminar">🗑️</button></div></div>
              <div class="trophy__tipo">${u.esc(r.tipo || "Reconocimiento")}</div>
              <div class="trophy__unit">${u.esc(r.unidad || "—")}</div>
              ${r.motivo ? `<p class="trophy__motivo">${u.esc(r.motivo)}</p>` : ""}
              ${r.buenaPractica ? `<div class="trophy__bp"><span>Buena práctica</span>${u.esc(r.buenaPractica)}</div>` : ""}
              <div class="trophy__foot">${u.fechaCL(r.fecha)}${r.responsable ? " · " + u.esc(r.responsable) : ""}</div>
            </div>`;
          }).join("")}</div>`
        : u.empty("Aún no hay reconocimientos registrados.", "Agrega el primero y arma el podio de unidades destacadas.", "🏆");

      box.innerHTML = `<div class="grid grid--kpi" style="margin-bottom:1rem">
          ${kpiMini("Reconocimientos", list.length, "Registrados en total", "info", "🏆")}
          ${kpiMini("Unidades reconocidas", ranking.length, "Con al menos uno", "ok", "🏥")}
          ${kpiMini("Este mes", esteMes, "Reconocimientos del mes", "warn", "📅")}
        </div>
        ${podio}
        <div class="section__head" style="margin-top:1.1rem"><h2 class="section__title">Muro de reconocimientos</h2>
          <button class="btn btn--primary btn--sm" id="reco-new">+ Nuevo reconocimiento</button></div>
        ${wall}`;

      document.getElementById("reco-new").onclick = () => recoForm(null, () => render(true));
      box.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => recoForm(S().get("reconocimientos", b.dataset.edit), () => render(false)));
      box.querySelectorAll("[data-del]").forEach(b => b.onclick = () =>
        u.confirmDelete("¿Eliminar este reconocimiento?", () => { S().remove("reconocimientos", b.dataset.del); render(false); }));

      if (celebrate && top.length) {
        const host = box.querySelector(".reco-podio-card");
        confettiBurst(host);
        if (nuevoLider) { confettiBurst(host); u.toast("👑 ¡" + rey.unidad + " es la nueva unidad líder!", "ok"); }
      }
      prevLeader = rey ? rey.unidad : null;
    };
    render(true);
  }

  function recoForm(rec, done) {
    const u = ui();
    u.modal({
      title: rec ? "Editar reconocimiento" : "Nuevo reconocimiento",
      body: u.formHTML([
        { name: "fecha", label: "Fecha", type: "date", required: true, value: rec ? rec.fecha : u.hoyISO() },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…", value: rec ? rec.unidad : "" },
        { name: "tipo", label: "Premio / distinción", type: "select", options: PREMIOS, value: rec ? rec.tipo : "Buena práctica del mes" },
        { name: "motivo", label: "Motivo (¿por qué el premio?)", type: "textarea", full: true, value: rec ? rec.motivo : "" },
        { name: "buenaPractica", label: "Buena práctica destacada", type: "textarea", full: true, value: rec ? rec.buenaPractica : "" },
        { name: "responsable", label: "Responsable", value: rec ? rec.responsable : "" }
      ], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.fecha || !d.unidad) { u.toast("Completa la fecha y la unidad", "danger"); return; }
          if (rec) S().update("reconocimientos", rec.id, d); else S().insert("reconocimientos", d);
          u.closeModal(); u.toast(rec ? "Reconocimiento actualizado" : "Reconocimiento registrado", "ok"); done();
        };
      }
    });
  }

  Object.assign(U.coord.views, { m4 });
  Object.assign(U.coord.binders, { m4: m4Bind });
})();
