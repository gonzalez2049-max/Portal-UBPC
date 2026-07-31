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
    medicion: { ic: "📏", c: "#0891b2", lab: "Medición de indicador" },
    protocolo: { ic: "📋", c: "#be185d", lab: "Revisión de protocolo" },
    champion: { ic: "⭐", c: "#ca8a04", lab: "Convocatoria Champions" },
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
    s.all("planesNT234").forEach(r => push(r.plazo, "Plan de mejora NT 234 · " + (r.unidad || ""), "planNT", "#/coord/m6?tab=planes", { deadline: true, done: /entreg|complet|cerr/i.test((r.estado || "") + " " + (r.subestado || "")) }));
    s.all("accionesRNAO").forEach(r => push(r.fechaComprometida, "Acción de mejora · " + (r.guia || r.indicadorOrigen || ""), "accionRNAO", "#/coord/m3", { deadline: true, done: /complet/i.test(r.estado || "") }));
    s.all("evaluacionesRNAO").forEach(r => push(r.proximaMedicion, "Próxima evaluación · " + (r.guia || "") + (r.unidad ? " (" + r.unidad + ")" : ""), "evalRNAO", "#/coord/m3"));
    s.all("kanban").forEach(r => push(r.fechaLimite, r.titulo || r.tarea || "Tarea", "tarea", "#/coord/home", { deadline: true, done: /complet/i.test(r.columna || "") }));
    s.all("actividades").forEach(r => push(r.fecha, "Capacitación · " + (r.actividad || ""), "capacitacion", "#/coord/m4"));
    s.all("convocatoriaChampion").forEach(r => push(r.fecha, "Champions · " + (r.tipo || "Convocatoria") + (r.tema ? " · " + r.tema : ""), "champion", "#/coord/m3?tab=champion"));
    s.all("colaboraciones").forEach(r => push(r.fecha, "Colaboración · " + (r.institucion || ""), "colaboracion", "#/coord/m5?tab=colaboraciones"));
    s.all("agendaEventos").forEach(r => push(r.fecha, r.titulo || "Evento", "propio", null, { propio: true, id: r.id, hora: r.hora, nota: r.nota }));
    // Próxima medición de cada indicador según su periodicidad
    if (U.indicadoresUtil && U.indicadoresUtil.proximaMedicion) {
      s.all("indicadores").forEach(r => {
        const pm = U.indicadoresUtil.proximaMedicion(r);
        if (pm) push(pm.toISOString(), "Medición · " + (r.nombre || "Indicador"), "medicion", "#/coord/indicadores", { deadline: true });
      });
    }
    // Próxima revisión de protocolos de enfermería (según fecha + vigencia)
    if (U.protocolos && U.protocolos.proximaRevision) {
      s.all("protocolosEnf").forEach(r => {
        if (r.estadoFormato === "Obsoleto") return;
        const pr = U.protocolos.proximaRevision(r);
        if (pr) push(pr.toISOString(), "Revisión protocolo · " + (r.nombre || ""), "protocolo", "#/coord/m2?tab=protocolos", { deadline: true });
      });
    }
    return ev.sort((a, b) => a.d - b.d);
  }

  function eventoForm(rec, done, preset) {
    const u = ui();
    u.modal({
      title: rec ? "Editar evento" : "Nuevo evento",
      body: u.formHTML([
        { name: "titulo", label: "Título del evento", required: true, full: true, value: rec ? rec.titulo : "" },
        { name: "fecha", label: "Fecha", type: "date", required: true, value: rec ? rec.fecha : (preset || u.hoyISO()) },
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
    let monthOffset = 0, selIso = null, hiddenTypes = {};

    const draw = () => {
      const events = buildEvents().filter(e => !hiddenTypes[e.tipo]);
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
      const MAXCHIP = 3;
      let cells = "";
      for (let i = 0; i < lead; i++) cells += `<div class="agc-day agc-day--blank"></div>`;
      for (let dnum = 1; dnum <= days; dnum++) {
        const iso = y + "-" + pad(mo + 1) + "-" + pad(dnum);
        const evs = byIso[iso] || [];
        const isToday = iso === (today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate()));
        const overdue = evs.some(e => e.deadline && !e.done && dateFromIso(iso) < today);
        // Bloques de evento estilo Outlook, con el color del proceso
        const chips = evs.slice(0, MAXCHIP).map(e => {
          const m = TIPO[e.tipo];
          const over = e.deadline && !e.done && e.d < today;
          const label = (e.hora ? `<b>${u.esc(e.hora)}</b> ` : "") + u.esc(e.titulo);
          return `<span class="agc-chip${over ? " is-over" : ""}${e.done ? " is-done" : ""}" style="--cc:${m.c}"
            ${e.propio ? `data-cev="${e.id}"` : `data-cruta="${u.esc(e.ruta || "")}"`}
            title="${u.esc(e.titulo)} · ${m.lab}">${label}</span>`;
        }).join("");
        const more = evs.length > MAXCHIP ? `<span class="agc-more">+${evs.length - MAXCHIP} más</span>` : "";
        cells += `<div class="agc-day${isToday ? " is-today" : ""}${evs.length ? " has-ev" : ""}${selIso === iso ? " is-sel" : ""}${overdue ? " is-over" : ""}"
          data-iso="${iso}" title="Ver / agregar evento el ${dnum}">
          <span class="agc-day__n">${dnum}</span>
          <div class="agc-day__evs">${chips}${more}</div>
          ${evs.length ? "" : `<span class="agc-day__add">＋</span>`}</div>`;
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
        : (selIso
            ? `<div class="agc-empty"><span>📅</span><p>Sin eventos el ${u.fechaCL(dateFromIso(selIso))}.</p>
                <button class="btn btn--primary btn--sm" id="agc-addday2">+ Agregar evento este día</button></div>`
            : `<p class="muted" style="padding:.6rem">Sin eventos próximos.</p>`);

      const vencHTML = vencidos.length ? `<div class="card agc-venc" style="border-left:4px solid var(--danger)">
          <h3 class="card__title" style="color:var(--danger);margin:0 0 .4rem">⏰ Vencidos (${vencidos.length})</h3>
          <div class="agc-list" style="max-height:230px;overflow:auto">${vencidos.map(itemHTML).join("")}</div></div>` : "";

      const legend = `<div class="agc-legend-t">Filtra por tipo (toca para mostrar/ocultar):</div>` +
        `<div class="agc-legend">${Object.keys(TIPO).map(k => `<button class="agc-leg${hiddenTypes[k] ? " is-off" : ""}" data-legtype="${k}" style="--lc:${TIPO[k].c}" type="button" title="Mostrar u ocultar ${TIPO[k].lab}"><i></i>${TIPO[k].lab}</button>`).join("")}</div>`;

      container.innerHTML = `
        <div class="grid grid--kpi" style="margin-bottom:1rem">
          ${kpi("Próximos", proximos, "Eventos desde hoy", "info", "🗓️")}
          ${kpi("En 7 días", venc7, "Esta semana", "warn", "⏳")}
          ${kpi("Vencidos", vencidos.length, "Plazos sin cerrar", vencidos.length ? "danger" : "ok", "⏰")}
          ${kpi("Este mes", mesEventos, MESES[mo] + " " + y, "info", "📆")}
        </div>
        <div class="grid grid--2" style="align-items:start">
          <div class="card">
            <div class="agc-cal-head">
              <button class="btn-icon" id="agc-prev" aria-label="Mes anterior">‹</button>
              <strong>${MESES[mo][0].toUpperCase() + MESES[mo].slice(1)} ${y}</strong>
              <button class="btn-icon" id="agc-next" aria-label="Mes siguiente">›</button>
            </div>
            <div class="agc-grid agc-dow">${DOW.map(d => `<div class="agc-dow__c">${d}</div>`).join("")}</div>
            <div class="agc-grid">${cells}</div>
            ${legend}
          </div>
          <div class="agc-right">
            ${vencHTML}
            <div class="card">
              <div class="section__head" style="margin-bottom:.4rem"><h3 class="card__title" style="margin:0">${listTitle}</h3>
                <div class="btn-row">
                  ${selIso ? `<button class="btn btn--ghost btn--sm" id="agc-clear">Ver próximos</button>
                    <button class="btn btn--primary btn--sm" id="agc-addday">+ Agregar este día</button>`
                    : `<button class="btn btn--primary btn--sm" id="agc-newev">+ Nuevo evento</button>`}</div></div>
              <div class="agc-list">${lista}</div>
            </div>
          </div>
        </div>`;

      document.getElementById("agc-prev").onclick = () => { monthOffset--; selIso = null; draw(); };
      document.getElementById("agc-next").onclick = () => { monthOffset++; selIso = null; draw(); };
      const clr = document.getElementById("agc-clear"); if (clr) clr.onclick = () => { selIso = null; draw(); };
      container.querySelectorAll("[data-iso]").forEach(b => b.onclick = () => { selIso = b.dataset.iso; draw(); });
      // Clic en un bloque de evento: abre el registro (o edita el evento propio)
      container.querySelectorAll(".agc-chip").forEach(c => c.onclick = ev => {
        ev.stopPropagation();
        if (c.dataset.cev) eventoForm(S().get("agendaEventos", c.dataset.cev), draw);
        else if (c.dataset.cruta) U.router.go(c.dataset.cruta);
      });
      const nev = document.getElementById("agc-newev"); if (nev) nev.onclick = () => eventoForm(null, () => { selIso = null; draw(); });
      const addDay = () => eventoForm(null, () => draw(), selIso);
      const ad1 = document.getElementById("agc-addday"); if (ad1) ad1.onclick = addDay;
      const ad2 = document.getElementById("agc-addday2"); if (ad2) ad2.onclick = addDay;
      container.querySelectorAll("[data-legtype]").forEach(b => b.onclick = () => {
        const t = b.dataset.legtype; hiddenTypes[t] = !hiddenTypes[t]; draw();
      });
      container.querySelectorAll("[data-evedit]").forEach(b => b.onclick = () => eventoForm(S().get("agendaEventos", b.dataset.evedit), draw));
      container.querySelectorAll("[data-evdel]").forEach(b => b.onclick = () =>
        u.confirmDelete("¿Eliminar este evento?", () => { S().remove("agendaEventos", b.dataset.evdel); draw(); }));
    };
    draw();

    // Al llegar desde "Próximos pasos" (tareas vencidas): resalta con una
    // lucecita intermitente lo que está vencido, para ubicarlo de inmediato.
    if (/[?&]focus=vencidos/.test(location.hash)) {
      setTimeout(() => {
        const card = container.querySelector(".agc-venc") || container.querySelector(".kpi--danger");
        if (card) {
          card.classList.add("is-spotlight");
          try { card.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
          setTimeout(() => card.classList.remove("is-spotlight"), 5400);
        }
      }, 120);
    }
  }

  function kpi(label, value, sub, kind, icon) {
    const u = ui();
    return `<div class="card kpi kpi--${kind || "info"}">
      <div class="kpi__top"><div class="kpi__label">${u.esc(label)}</div><div class="kpi__ico">${icon || ""}</div></div>
      <div class="kpi__value">${value}</div><div class="kpi__sub">${u.esc(sub || "")}</div></div>`;
  }

  U.coord.views.agenda = agenda;
  U.coord.binders.agenda = agendaBind;
  U.agenda = U.agenda || {};
  U.agenda.buildEvents = buildEvents;   // reutilizable por el Home (próximos eventos)
})();
