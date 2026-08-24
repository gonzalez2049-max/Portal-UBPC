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
    s.all("planesNT234").forEach(r => push(r.plazo, "Plan de mejora NT 234 · " + (r.unidad || ""), "planNT", "#/coord/m1?tab=nt234&sub=planes", { deadline: true, done: /entreg|complet|cerr/i.test((r.estado || "") + " " + (r.subestado || "")), col: "planesNT234", rid: r.id, dateField: "plazo" }));
    s.all("accionesRNAO").forEach(r => push(r.fechaComprometida, "Acción de mejora · " + (r.guia || r.indicadorOrigen || ""), "accionRNAO", "#/coord/m3", { deadline: true, done: /complet/i.test(r.estado || ""), col: "accionesRNAO", rid: r.id, dateField: "fechaComprometida" }));
    s.all("evaluacionesRNAO").forEach(r => push(r.proximaMedicion, "Próxima evaluación · " + (r.guia || "") + (r.unidad ? " (" + r.unidad + ")" : ""), "evalRNAO", "#/coord/m3"));
    s.all("kanban").forEach(r => push(r.fechaLimite, r.titulo || r.tarea || "Tarea", "tarea", "#/coord/home", { deadline: true, done: /complet/i.test(r.columna || ""), col: "kanban", rid: r.id, dateField: "fechaLimite" }));
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

  // Editar la fecha del plazo de un registro vencido (tarea, acción, plan)
  const LABEL_COL = { kanban: "tarea del tablero", accionesRNAO: "acción de mejora", planesNT234: "plan de mejora NT 234" };
  function editarFechaVencido(col, rid, field, done) {
    const u = ui();
    const rec = S().get(col, rid);
    if (!rec) { u.toast("El registro ya no existe", "warn"); if (done) done(); return; }
    const titulo = rec.titulo || rec.tarea || rec.accion || rec.unidad || "registro";
    u.modal({
      title: "Editar fecha del plazo",
      body: `<p class="card__hint">Nueva fecha para <strong>${u.esc(titulo)}</strong> (${LABEL_COL[col] || "registro"}).</p>`
        + u.formHTML([{ name: "fecha", label: "Fecha del plazo", type: "date", required: true, value: rec[field] ? u.isoDay(rec[field]) : u.hoyISO() }], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-ok>Guardar fecha</button>`,
      onMount(m) {
        m.querySelector("[data-ok]").onclick = () => {
          const d = u.readForm(m);
          if (!d.fecha) { u.toast("Indica la fecha", "danger"); return; }
          // Se ancla al mediodía local para evitar el desfase de un día
          S().update(col, rid, { [field]: new Date(d.fecha + "T12:00:00").toISOString() });
          u.closeModal(); u.toast("Fecha actualizada", "ok"); if (done) done();
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
    let monthOffset = 0, selIso = null, hiddenTypes = {}, showProx = false;

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

      // ---- Detalle del día seleccionado / próximos (bajo el calendario) ----
      const dayEvents = selIso ? (byIso[selIso] || []) : [];
      const proxEvents = events.filter(e => e.d >= today).slice(0, 15);
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
        // Con origen editable (tarea, acción, plan): ofrece Editar fecha / Eliminar /
        // Ir al registro, en vez de navegar directamente al módulo.
        if (e.col && e.dateField) {
          const key = e.col + "|" + e.rid + "|" + e.dateField;
          return `<div class="agc-item${over ? " agc-item--venc" : ""}" style="--tc:${m.c}">
            <span class="agc-item__ic">${m.ic}</span>
            <div class="agc-item__body"><strong>${u.esc(e.titulo)}</strong>
              <span class="agc-item__meta">${meta}</span></div>
            ${cuando}
            <span class="agc-item__acts">
              <button class="btn btn--ghost btn--sm" data-vfecha="${key}" title="Editar fecha">📅 Fecha</button>
              <button class="btn btn--ghost btn--sm" data-vdel="${e.col}|${e.rid}" title="Eliminar">🗑️</button>
              ${e.ruta ? `<a class="btn btn--ghost btn--sm" href="${e.ruta}" title="Ir al registro">↗</a>` : ""}
            </span></div>`;
        }
        return `<a class="agc-item" href="${e.ruta}" style="--tc:${m.c}">
          <span class="agc-item__ic">${m.ic}</span>
          <div class="agc-item__body"><strong>${u.esc(e.titulo)}</strong>
            <span class="agc-item__meta">${meta}</span></div>
          ${cuando}</a>`;
      };
      // Contenido del panel inferior según el modo (día seleccionado · próximos · pista)
      let panelTitle, panelActions, panelBody;
      if (selIso) {
        panelTitle = "Eventos del " + u.fechaCL(dateFromIso(selIso));
        panelActions = `<button class="btn btn--ghost btn--sm" id="agc-clear">✕ Cerrar día</button>
          <button class="btn btn--primary btn--sm" id="agc-addday">+ Agregar este día</button>`;
        panelBody = dayEvents.length ? `<div class="agc-list">${dayEvents.map(itemHTML).join("")}</div>`
          : `<div class="agc-empty"><span>📅</span><p>Sin eventos el ${u.fechaCL(dateFromIso(selIso))}.</p>
              <button class="btn btn--primary btn--sm" id="agc-addday2">+ Agregar evento este día</button></div>`;
      } else if (showProx) {
        panelTitle = "Próximos eventos";
        panelActions = `<button class="btn btn--ghost btn--sm" id="agc-hideprox">Ocultar</button>
          <button class="btn btn--primary btn--sm" id="agc-newev">+ Nuevo evento</button>`;
        panelBody = proxEvents.length ? `<div class="agc-list">${proxEvents.map(itemHTML).join("")}</div>`
          : `<p class="muted" style="padding:.6rem">Sin eventos próximos.</p>`;
      } else {
        panelTitle = "Agenda del mes";
        panelActions = `<button class="btn btn--ghost btn--sm" id="agc-showprox">🗓️ Ver próximos eventos</button>
          <button class="btn btn--primary btn--sm" id="agc-newev">+ Nuevo evento</button>`;
        panelBody = `<div class="agc-empty"><span>👆</span><p>Haz clic en un día del calendario para ver o agregar lo que está agendado.</p></div>`;
      }

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
        <div class="card agc-cal-card">
          <div class="agc-cal-head">
            <button class="btn-icon" id="agc-prev" aria-label="Mes anterior">‹</button>
            <strong>${MESES[mo][0].toUpperCase() + MESES[mo].slice(1)} ${y}</strong>
            <button class="btn-icon" id="agc-next" aria-label="Mes siguiente">›</button>
          </div>
          <div class="agc-grid agc-dow">${DOW.map(d => `<div class="agc-dow__c">${d}</div>`).join("")}</div>
          <div class="agc-grid agc-grid--big">${cells}</div>
          ${legend}
        </div>
        <div class="agc-below" style="margin-top:1rem">
          ${vencHTML}
          <div class="card${selIso ? " agc-daycard is-open" : ""}">
            <div class="section__head" style="margin-bottom:.4rem"><h3 class="card__title" style="margin:0">${panelTitle}</h3>
              <div class="btn-row">${panelActions}</div></div>
            ${panelBody}
          </div>
        </div>`;

      document.getElementById("agc-prev").onclick = () => { monthOffset--; selIso = null; draw(); };
      document.getElementById("agc-next").onclick = () => { monthOffset++; selIso = null; draw(); };
      const clr = document.getElementById("agc-clear"); if (clr) clr.onclick = () => { selIso = null; draw(); };
      const sp = document.getElementById("agc-showprox"); if (sp) sp.onclick = () => { showProx = true; draw(); };
      const hp = document.getElementById("agc-hideprox"); if (hp) hp.onclick = () => { showProx = false; draw(); };
      container.querySelectorAll("[data-iso]").forEach(b => b.onclick = () => { selIso = b.dataset.iso; showProx = false; draw(); });
      // Clic en un bloque de evento: abre el detalle del día (para ver/editar/eliminar)
      // en vez de navegar directamente al módulo.
      container.querySelectorAll(".agc-chip").forEach(c => c.onclick = ev => {
        ev.stopPropagation();
        const day = c.closest(".agc-day");
        if (day && day.dataset.iso) { selIso = day.dataset.iso; showProx = false; draw(); }
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
      // Vencidos con origen editable: editar la fecha del plazo o eliminar el registro
      container.querySelectorAll("[data-vfecha]").forEach(b => b.onclick = () => {
        const [col, rid, field] = b.dataset.vfecha.split("|");
        editarFechaVencido(col, rid, field, draw);
      });
      container.querySelectorAll("[data-vdel]").forEach(b => b.onclick = () => {
        const [col, rid] = b.dataset.vdel.split("|");
        u.confirmDelete("¿Eliminar este registro vencido? Se quita de forma permanente.", () => { S().remove(col, rid); draw(); });
      });
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
