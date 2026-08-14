/* ============================================================
   ENLACE COORDINACIÓN ⇄ REFERENTE TÉCNICO
   Hub del lado del Coordinador para conectarse con el Referente:
   identidad, actividad operativa, solicitudes en ambos sentidos,
   asignación directa de tareas y seguimiento.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  const E = () => (U.solicitudes && U.solicitudes.E) || {};

  /* ---------- Asignar tarea directa al Referente ---------- */
  function asignarTarea(onDone) {
    const u = ui();
    const ref = U.auth.referente();
    const fields = [
      { name: "titulo", label: "Tarea para el Referente", required: true, full: true },
      { name: "prioridad", label: "Prioridad", type: "select", options: ["alta", "media", "baja"], value: "media" },
      { name: "fechaLimite", label: "Fecha límite", type: "date" },
      { name: "nota", label: "Instrucción o detalle", type: "textarea", full: true }
    ];
    u.modal({
      title: "Asignar tarea al Referente Técnico",
      body: `<p class="card__hint">La tarea aparecerá en el tablero del Referente y recibirá una notificación. Podrás seguir su avance desde aquí.</p>${u.formHTML(fields, { prioridad: "media" })}`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Asignar tarea</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.titulo) { u.toast("Escribe el título de la tarea", "danger"); return; }
          const me = U.auth.current();
          const max = Math.max(0, ...S().all("kanban").filter(c => c.owner === "referente").map(c => c.orden || 0));
          S().insert("kanban", {
            owner: "referente", columna: "Pendiente", titulo: d.titulo,
            prioridad: d.prioridad || "media", fechaLimite: d.fechaLimite || "",
            responsable: ref ? ref.nombre : "Referente Técnico",
            asignadoPor: me ? me.nombre : "Coordinación",
            nota: d.nota || "", orden: max + 1
          });
          U.notif.push({
            titulo: "Nueva tarea asignada: " + d.titulo, modulo: "Enlace con Coordinación",
            prioridad: d.prioridad === "alta" ? "alta" : "normal",
            destinatario: "referente", ref: "#/ref/inicio"
          });
          u.closeModal(); u.toast("Tarea asignada al Referente", "ok");
          if (onDone) onDone();
        };
      }
    });
  }

  /* ---------- Vista principal ---------- */
  function enlace() {
    const u = ui();
    const ref = U.auth.referente();

    if (!ref) {
      return `<div class="page-head"><h1>Enlace con el Referente Técnico</h1>
        <p>Aún no hay un Referente Técnico registrado. Créalo para habilitar el trabajo conjunto.</p></div>
        ${u.empty("Sin Referente Técnico", "Agrégalo desde Usuarios y perfiles con el rol “Referente Técnico”.", "🧑‍⚕️")}
        <div class="section"><a class="btn btn--primary" href="#/coord/usuarios">Ir a Usuarios y perfiles →</a></div>`;
    }

    const sols = S().all("solicitudes");
    const alRef = sols.filter(s => (s.direccion || "coord-a-ref") === "coord-a-ref");
    const delRef = sols.filter(s => s.direccion === "ref-a-coord");
    const abiertasRef = alRef.filter(s => !/cerrad/i.test(s.estado || ""));
    // Solicitudes del referente que esperan MI respuesta (soy gestor, aún no cerrada)
    const esperanCoord = delRef.filter(s => !/cerrad/i.test(s.estado || ""));

    const tareas = S().all("kanban").filter(c => c.owner === "referente");
    const tareasPend = tareas.filter(c => c.columna !== "Completado");
    const tareasHechas = tareas.filter(c => c.columna === "Completado");

    // Actividad operativa (colección compartida)
    const act = [
      ["🔬", "Evidencia y recomendación", S().all("evidenciaSemana").length, "#/ref/evidencia"],
      ["📈", "Monitoreo e implementación", S().all("monitoreoRef").length, "#/ref/monitoreo"],
      ["🎓", "Capacitación por turno", S().all("capacitacionRef").length, "#/ref/capacitacion"],
      ["📚", "Bitácora Biblioteca", S().all("bibliotecaBitacora").length, "#/ref/biblioteca"]
    ];

    const rolLabel = "Referente Técnico";

    return `<div class="page-head"><h1>Enlace con el Referente Técnico</h1>
      <p>Tu espacio de trabajo conjunto con el Referente: solicitudes, tareas asignadas y su actividad operativa, en tiempo real.</p></div>

    <div class="enl-grid">
      <div class="card enl-id">
        <div class="enl-id__row">
          <div class="avatar avatar--lg" style="background:var(--c-turquesa)">${ref.foto ? `<img src="${u.esc(ref.foto)}">` : u.initials(ref.nombre)}</div>
          <div class="enl-id__meta">
            <span class="tag tag--role">${rolLabel}</span>
            <h2>${u.esc(ref.nombre)}</h2>
            <div class="muted">${u.esc(ref.cargo || "")}</div>
            <div class="kpi__sub">🏥 ${u.esc(ref.unidad || "UBPC – HUAP")}</div>
          </div>
        </div>
        <div class="enl-actions">
          <button class="btn btn--primary btn--sm" id="enlSolicitud">📨 Enviar solicitud técnica</button>
          <button class="btn btn--sm" id="enlTarea" style="background:var(--c-turquesa);color:#fff">✅ Asignar tarea</button>
          <a class="btn btn--ghost btn--sm" href="#/coord/m5?tab=reuniones">📅 Programar reunión</a>
        </div>
      </div>

      <div class="card enl-stat">
        <div class="enl-stat__grid">
          <div class="enl-chip enl-chip--warn"><b>${esperanCoord.length}</b><span>Esperan tu respuesta</span></div>
          <div class="enl-chip enl-chip--info"><b>${abiertasRef.length}</b><span>Solicitudes activas al Referente</span></div>
          <div class="enl-chip enl-chip--tq"><b>${tareasPend.length}</b><span>Tareas en curso</span></div>
          <div class="enl-chip enl-chip--ok"><b>${tareasHechas.length}</b><span>Tareas completadas</span></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section__head"><div><h2 class="section__title">Tareas asignadas</h2>
        <p class="section__hint">Tablero del Referente. Sigue el avance de lo que le encargas.</p></div>
        <button class="btn btn--primary btn--sm" id="enlTarea2">+ Asignar tarea</button></div>
      <div class="card">
        ${tareas.length ? `<ul class="feed">${tareas.slice(0, 6).map(t => `<li>
            <span class="feed__ico">${t.columna === "Completado" ? "✅" : t.prioridad === "alta" ? "🔴" : "📌"}</span>
            <div><strong>${u.esc(t.titulo)}</strong>
            <div class="feed__meta">${u.esc(t.columna)}${t.fechaLimite ? " · vence " + u.fechaCL(t.fechaLimite) : ""}${t.asignadoPor ? " · por " + u.esc(t.asignadoPor) : ""}</div></div></li>`).join("")}</ul>`
          : u.empty("Sin tareas asignadas.", "Asigna la primera tarea al Referente.", "✅")}
      </div>
    </div>

    <div class="section">
      <div class="section__head"><div><h2 class="section__title">Solicitudes con el Referente</h2>
        <p class="section__hint">Flujo de solicitudes en ambos sentidos, con código, estado y cierre.</p></div></div>
      <div id="enl-sol-body"></div>
    </div>

    <div class="section">
      <div class="section__head"><div><h2 class="section__title">Actividad operativa del Referente</h2>
        <p class="section__hint">Registros que el Referente lleva en su portal (se actualizan al sincronizar).</p></div></div>
      <div class="grid grid--kpi">
        ${act.map(a => `<a class="card enl-act" href="${a[3]}">
          <div class="enl-act__ico">${a[0]}</div>
          <div class="enl-act__n">${a[2]}</div>
          <div class="enl-act__l">${a[1]}</div>
          <div class="kpi__sub">${a[2] ? "Ver registros →" : "Sin registros aún"}</div></a>`).join("")}
      </div>
    </div>`;
  }

  function enlaceBind() {
    const rerender = () => U.router.render();
    const s = document.getElementById("enlSolicitud");
    if (s) s.onclick = () => U.solicitudes.crearDesde("Enlace con el Referente", {}, rerender);
    [document.getElementById("enlTarea"), document.getElementById("enlTarea2")].forEach(b => {
      if (b) b.onclick = () => asignarTarea(rerender);
    });
    // Panel completo de solicitudes (antes era el módulo "Solicitudes técnicas")
    const box = document.getElementById("enl-sol-body");
    if (box && U.solicitudes) U.solicitudes.coordPanel(box);

    // Lucecita: al llegar desde "Próximos pasos", resalta el panel de solicitudes.
    // Se apunta al panel interno (no a la .section, hija directa de app__main cuya
    // animación de entrada taparía el parpadeo).
    if (box && /[?&]focus=solicitudes/.test(location.hash)) {
      setTimeout(() => {
        box.classList.add("is-spotlight");
        try { box.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
        setTimeout(() => box.classList.remove("is-spotlight"), 5400);
      }, 140);
    }
  }

  // Registrar en el portal del Coordinador
  U.coord.views.enlace = enlace;
  U.coord.binders.enlace = enlaceBind;
  U.enlace = { asignarTarea };
})();
