/* ============================================================
   AGENDA UBPC — Calendario y próximos hitos (Coordinador)
   Reúne reuniones, plazos de planes, acciones comprometidas,
   evaluaciones, tareas del tablero, capacitaciones y colaboraciones.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  const TIPO = {
    reunion: { ic: "📅", c: "#12b5a5", lab: "Reunión" },
    planNT: { ic: "🛠️", c: "#e0912f", lab: "Plan NT 234" },
    accionRNAO: { ic: "🎯", c: "#7a5cd0", lab: "Acción RNAO" },
    evalRNAO: { ic: "🧭", c: "#1e9fe0", lab: "Evaluación RNAO" },
    tarea: { ic: "✅", c: "#37c6a0", lab: "Tarea del tablero" },
    capacitacion: { ic: "🎓", c: "#37a04a", lab: "Capacitación" },
    colaboracion: { ic: "🌐", c: "#1554b8", lab: "Colaboración" },
    propio: { ic: "📌", c: "#e0526f", lab: "Evento propio" }
  };
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const DOW = ["L", "M", "M", "J", "V", "S", "D"];
  const pad = n => String(n).padStart(2, "0");
  function isoDay(fecha) {
    const s = String(fecha); const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[1] + "-" + m[2] + "-" + m[3];
    const d = new Date(fecha); if (isNaN(d)) return null;
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  const dateFromIso = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };

  function buildEvents() {
    const s = S(), ev = [];
    const push = (fecha, titulo, tipo, ruta, opt) => {
      const iso = isoDay(fecha); if (!iso) return;
      ev.push(Object.assign({ iso, d: dateFromIso(iso), titulo, tipo, ruta }, opt || {}));
    };
    s.all("reuniones").forEach(r => push(r.fecha, r.tema || r.tipo || "Reunión", "reunion", "#/coord/m5"));
    s.all("planesNT234").forEach(r => push(r.plazo, "Plan de mejora NT 234 · " + (r.unidad || ""), "planNT", "#/coord/m6?tab=planes", { deadline: true, done: /complet/i.test(r.estado || "") }));
    s.all("accionesRNAO").forEach(r => push(r.fechaComprometida, "Acción de mejora · " + (r.guia || r.indicadorOrigen || ""), "accionRNAO", "#/coord/m3", { deadline: true, done: /complet/i.test(r.estado || "") }));
    s.all("evaluacionesRNAO").forEach(r => push(r.proximaMedicion, "Próxima evaluación · " + (r.guia || "") + (r.unidad ? " (" + r.unidad + ")" : ""), "evalRNAO", "#/coord/m3"));
    s.all("kanban").forEach(r => push(r.fechaLimite, r.titulo || r.tarea || "Tarea", "tarea", "#/coord/home", { deadline: true, done: /complet/i.test(r.columna || "") }));
    s.all("actividades").forEach(r => push(r.fecha, "Capacitación · " + (r.actividad || ""), "capacitacion", "#/coord/m4"));
    s.all("colaboraciones").forEach(r => push(r.fecha, "Colaboración · " + (r.institucion || ""), "colaboracion", "#/coord/m5?tab=colaboraciones"));
    s.all("agendaEventos").forEach(r => push(r.fecha, r.titulo || "Evento", "propio", null, { propio: true, id: r.id, hora: r.hora, nota: r.nota }));
    return ev.sort((a, b) => a.d - b.d);
  }

  function eventoForm(rec, done) {
    const u = ui();
    u.modal({
      title: rec ? "Editar evento" : "Nuevo evento",
      body: u.formHTML([
        { name: "titulo", label: "Título del evento", required: true, full: true, value: rec ? rec.titulo : "" },
        { name: "fecha", label: "Fecha", type: "date", required: true, value: rec ? rec.fecha : u.hoyISO() },
        { name: "hora", label: "Hora (opcional)", type: "time", value: rec ? rec.hora : "" },
        { name: "nota", label: "Nota (opcional)", type: "textarea", full: true, value: rec ? rec.nota : "" }
      ], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.titulo || !d.fecha) { u.toast("Completa el título y la fecha", "danger"); return; }
          if (rec) S().update("agendaEventos", rec.id, d); else S().insert("agendaEventos", d);
          u.closeModal(); u.toast(rec ? "Evento actualizado" : "Evento agregado", "ok"); done();
        };
      }
    });
  }

  function agenda() {
    return `<div class="page-head"><h1>Agenda UBPC</h1>
      <p>Reuniones, plazos, acciones, evaluaciones y actividades de todos los módulos — más tus propios eventos y recordatorios.</p></div>
      <div id="agenda-body"></div>`;
  }

  function agendaBind() {
    const container = document.getElementById("agenda-body");
    const u = ui();
    let monthOffset = 0, selIso = null;

    const draw = () => {
      const events = buildEvents();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const in8 = new Date(today); in8.setDate(in8.getDate() + 8);
      const byIso = {}; events.forEach(e => { (byIso[e.iso] = byIso[e.iso] || []).push(e); });

      const proximos = events.filter(e => e.d >= today).length;
      const venc7 = events.filter(e => e.d >= today && e.d < in8).length;
      const vencidos = events.filter(e => e.deadline && !e.done && e.d < today);

      // ---- Calendario del mes ----
      const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
      const y = base.getFullYear(), mo = base.getMonth();
      const days = new Date(y, mo + 1, 0).getDate();
      const lead = (new Date(y, mo, 1).getDay() + 6) % 7;
      const mesEventos = events.filter(e => e.d.getFullYear() === y && e.d.getMonth() === mo).length;
      let cells = "";
      for (let i = 0; i < lead; i++) cells += `<div class="agc-day agc-day--blank"></div>`;
      for (let dnum = 1; dnum <= days; dnum++) {
        const iso = y + "-" + pad(mo + 1) + "-" + pad(dnum);
        const evs = byIso[iso] || [];
        const isToday = iso === (today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate()));
        const overdue = evs.some(e => e.deadline && !e.done && dateFromIso(iso) < today);
        const dots = evs.slice(0, 4).map(e => `<i style="background:${TIPO[e.tipo].c}"></i>`).join("");
        cells += `<button class="agc-day${isToday ? " is-today" : ""}${evs.length ? " has-ev" : ""}${selIso === iso ? " is-sel" : ""}${overdue ? " is-over" : ""}"
          ${evs.length ? `data-iso="${iso}"` : "disabled"}>
          <span class="agc-day__n">${dnum}</span>
          ${evs.length ? `<span class="agc-day__dots">${dots}</span>` : ""}</button>`;
      }

      // ---- Lista (día seleccionado o próximos) ----
      const listEvents = selIso ? (byIso[selIso] || []) : events.filter(e => e.d >= today).slice(0, 12);
      const listTitle = selIso ? "Eventos del " + u.fechaCL(dateFromIso(selIso)) : "Próximos eventos";
      const itemHTML = e => {
        const m = TIPO[e.tipo], over = e.deadline && !e.done && e.d < today;
        const dias = Math.round((e.d - today) / 86400000);
        const cuando = over ? `<span class="agc-when over">Vencido</span>`
          : dias === 0 ? `<span class="agc-when hoy">Hoy</span>`
          : dias === 1 ? `<span class="agc-when">Mañana</span>`
          : dias > 0 ? `<span class="agc-when">En ${dias} días</span>` : "";
        const meta = `${u.fechaCL(e.d)}${e.hora ? " · " + u.esc(e.hora) : ""} · ${m.lab}`;
        if (e.propio) {
          return `<div class="agc-item" style="--tc:${m.c}">
            <span class="agc-item__ic">${m.ic}</span>
            <div class="agc-item__body"><strong>${u.esc(e.titulo)}</strong>
              <span class="agc-item__meta">${meta}${e.nota ? " · " + u.esc(e.nota) : ""}</span></div>
            ${cuando}
            <span class="agc-item__acts"><button class="btn btn--ghost btn--sm" data-evedit="${e.id}" title="Editar">✏️</button>
            <button class="btn btn--ghost btn--sm" data-evdel="${e.id}" title="Eliminar">🗑️</button></span></div>`;
        }
        return `<a class="agc-item" href="${e.ruta}" style="--tc:${m.c}">
          <span class="agc-item__ic">${m.ic}</span>
          <div class="agc-item__body"><strong>${u.esc(e.titulo)}</strong>
            <span class="agc-item__meta">${meta}</span></div>
          ${cuando}</a>`;
      };
      const lista = listEvents.length ? listEvents.map(itemHTML).join("")
        : `<p class="muted" style="padding:.6rem">Sin eventos ${selIso ? "este día" : "próximos"}.</p>`;

      const vencHTML = vencidos.length ? `<div class="card" style="border-left:4px solid var(--danger);margin-bottom:1rem">
          <h3 class="card__title" style="color:var(--danger)">⏰ Vencidos (${vencidos.length})</h3>
          <div class="agc-list">${vencidos.slice(0, 6).map(itemHTML).join("")}</div></div>` : "";

      const legend = Object.keys(TIPO).map(k => `<span class="agc-leg"><i style="background:${TIPO[k].c}"></i>${TIPO[k].lab}</span>`).join("");

      container.innerHTML = `
        <div class="grid grid--kpi" style="margin-bottom:1rem">
          ${kpi("Próximos", proximos, "Eventos desde hoy", "info", "🗓️")}
          ${kpi("En 7 días", venc7, "Esta semana", "warn", "⏳")}
          ${kpi("Vencidos", vencidos.length, "Plazos sin cerrar", vencidos.length ? "danger" : "ok", "⏰")}
          ${kpi("Este mes", mesEventos, MESES[mo] + " " + y, "info", "📆")}
        </div>
        ${vencHTML}
        <div class="grid grid--2" style="align-items:start">
          <div class="card">
            <div class="agc-cal-head">
              <button class="btn-icon" id="agc-prev" aria-label="Mes anterior">‹</button>
              <strong>${MESES[mo][0].toUpperCase() + MESES[mo].slice(1)} ${y}</strong>
              <button class="btn-icon" id="agc-next" aria-label="Mes siguiente">›</button>
            </div>
            <div class="agc-grid agc-dow">${DOW.map(d => `<div class="agc-dow__c">${d}</div>`).join("")}</div>
            <div class="agc-grid">${cells}</div>
            <div class="agc-legend">${legend}</div>
          </div>
          <div class="card">
            <div class="section__head" style="margin-bottom:.4rem"><h3 class="card__title" style="margin:0">${listTitle}</h3>
              <div class="btn-row">
                ${selIso ? `<button class="btn btn--ghost btn--sm" id="agc-clear">Ver próximos</button>` : ""}
                <button class="btn btn--primary btn--sm" id="agc-newev">+ Nuevo evento</button></div></div>
            <div class="agc-list">${lista}</div>
          </div>
        </div>`;

      document.getElementById("agc-prev").onclick = () => { monthOffset--; selIso = null; draw(); };
      document.getElementById("agc-next").onclick = () => { monthOffset++; selIso = null; draw(); };
      const clr = document.getElementById("agc-clear"); if (clr) clr.onclick = () => { selIso = null; draw(); };
      container.querySelectorAll("[data-iso]").forEach(b => b.onclick = () => { selIso = b.dataset.iso; draw(); });
      document.getElementById("agc-newev").onclick = () => eventoForm(null, () => { selIso = null; draw(); });
      container.querySelectorAll("[data-evedit]").forEach(b => b.onclick = () => eventoForm(S().get("agendaEventos", b.dataset.evedit), draw));
      container.querySelectorAll("[data-evdel]").forEach(b => b.onclick = () =>
        u.confirmDelete("¿Eliminar este evento?", () => { S().remove("agendaEventos", b.dataset.evdel); draw(); }));
    };
    draw();
  }

  function kpi(label, value, sub, kind, icon) {
    const u = ui();
    return `<div class="card kpi kpi--${kind || "info"}">
      <div class="kpi__top"><div class="kpi__label">${u.esc(label)}</div><div class="kpi__ico">${icon || ""}</div></div>
      <div class="kpi__value">${value}</div><div class="kpi__sub">${u.esc(sub || "")}</div></div>`;
  }

  U.coord.views.agenda = agenda;
  U.coord.binders.agenda = agendaBind;
})();
