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
    acts.forEach(a => { const e = a.estamento || "Sin estamento"; porEst[e] = (porEst[e] || 0) + (parseInt(a.personasCapacitadas) || 0); });
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
        { name: "cobertura", label: "Cobertura (%)" },
        { name: "guia", label: "Guía BPSO", type: "select", options: ["—"].concat(CAT().guiasArea) },
        { name: "responsable", label: "Responsable" },
        { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En curso", "Completado"] }
      ],
      defaults: () => ({ estado: "Completado", fecha: ui().hoyISO() }),
      onBeforeSave: (d) => {
        const po = Number(d.poblacionObjetivo), pc = Number(d.personasCapacitadas);
        if (po > 0 && pc >= 0 && !d.cobertura) d.cobertura = Math.round(pc / po * 100) + "%";
        return d;
      }
    });
  }

  /* ---------- EVI — Evidencia que transforma (edición) ---------- */
  function evi(box) {
    const u = ui();
    const list = S().all("edicionesEVI").sort((a, b) => (b.numeroEdicion || 0) - (a.numeroEdicion || 0));
    box.innerHTML = `<div class="section__head">
        <p class="section__hint">Registra una edición completa; cada edición puede contener varias evidencias. Código UBPC-EVI-AAAA-000.</p>
        <button class="btn btn--primary btn--sm" id="newEvi">+ Nueva edición</button></div>
      ${list.length ? `<div class="grid grid--2" id="evi-list">${list.map(ediCard).join("")}</div>`
        : u.empty("Aún no hay ediciones EVI.", "Crea la primera edición para comenzar.", "🦉")}`;
    document.getElementById("newEvi").onclick = () => ediForm(null, () => evi(box));
    box.querySelectorAll("[data-eviedit]").forEach(b => b.onclick = () => ediForm(S().get("edicionesEVI", b.dataset.eviedit), () => evi(box)));
    box.querySelectorAll("[data-evidel]").forEach(b => b.onclick = () => u.confirmDelete("¿Eliminar esta edición EVI?", () => { S().remove("edicionesEVI", b.dataset.evidel); evi(box); }));
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
  function reconocimientos(box) {
    R().mount(box, {
      collection: "reconocimientos", title: "Reconocimiento", icon: "🏆",
      hint: "Reconocimientos a unidades y buenas prácticas destacadas.",
      newLabel: "Nuevo reconocimiento",
      emptyMsg: "Aún no hay reconocimientos registrados.",
      columns: [
        { key: "fecha", label: "Fecha", date: true },
        { key: "unidad", label: "Unidad" },
        { key: "tipo", label: "Tipo", render: (r, u) => `<span class="tag">${u.esc(r.tipo || "—")}</span>` },
        { key: "motivo", label: "Motivo" },
        { key: "buenaPractica", label: "Buena práctica destacada" },
        { key: "responsable", label: "Responsable" }
      ],
      fields: [
        { name: "fecha", label: "Fecha", type: "date", required: true },
        { name: "unidad", label: "Unidad", type: "select", options: CAT().unidades, placeholder: "Seleccionar…" },
        { name: "tipo", label: "Tipo de reconocimiento", type: "select", options: ["Felicitación", "Mención destacada", "Reconocimiento institucional", "Buena práctica del mes", "Otro"] },
        { name: "motivo", label: "Motivo", type: "textarea", full: true },
        { name: "buenaPractica", label: "Buena práctica destacada", type: "textarea", full: true },
        { name: "responsable", label: "Responsable" },
        { name: "observaciones", label: "Observaciones", type: "textarea", full: true }
      ],
      defaults: () => ({ fecha: ui().hoyISO() })
    });
  }

  Object.assign(U.coord.views, { m4 });
  Object.assign(U.coord.binders, { m4: m4Bind });
})();
