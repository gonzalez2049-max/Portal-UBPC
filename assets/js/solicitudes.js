/* ============================================================
   SOLICITUDES DE APOYO TÉCNICO — Flujo de cierre con trazabilidad
   Coordinador ⇄ Referente. Consolidación automática desde módulos.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  // Estados canónicos (visibles según la especificación)
  const E = { ENVIADA: "Enviada", CURSO: "En curso", COMPLETADA: "Completada por referente", CERRADA: "Cerrada por coordinación" };
  const STEPS = ["Enviada", "En gestión", "Respuesta técnica", "Cierre del Coordinador"];

  function stepIndex(estado) {
    if (estado === E.ENVIADA) return 0;
    if (estado === E.CURSO) return 1;
    if (estado === E.COMPLETADA) return 2;
    if (estado === E.CERRADA) return 3;
    return 0;
  }
  function stepper(estado) {
    const cur = stepIndex(estado);
    return `<div class="stepper">${STEPS.map((s, i) => {
      const cls = i < cur ? "done" : (i === cur ? "current" : "");
      return `<div class="step ${cls}"><span class="step__n">${i < cur ? "✓" : i + 1}</span>${ui().esc(s)}</div>`;
    }).join("")}</div>`;
  }

  /* ---------- Crear solicitud desde cualquier módulo ---------- */
  function crearDesde(modulo, prefill, onDone) {
    const u = ui();
    prefill = prefill || {};
    const ref = U.auth.referente();
    const fields = [
      { name: "titulo", label: "Título de la solicitud", required: true, full: true, value: prefill.titulo || "" },
      { name: "unidad", label: "Unidad", type: "select", options: U.data.CAT.unidades, placeholder: "Seleccionar…", value: prefill.unidad || "" },
      { name: "prioridad", label: "Prioridad", type: "select", options: U.data.CAT.prioridades, value: prefill.prioridad || "media" },
      { name: "plazo", label: "Plazo", type: "date", value: prefill.plazo || "" },
      { name: "descripcion", label: "Descripción", type: "textarea", full: true, required: true, value: prefill.descripcion || "" }
    ];
    u.modal({
      title: "Solicitar intervención técnica",
      body: `<p class="card__hint">Se enviará al Referente Técnico y se consolidará en “Solicitudes de apoyo técnico” con un código automático.</p>${u.formHTML(fields, {})}`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Enviar solicitud</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.titulo || !d.descripcion) { u.toast("Título y descripción son obligatorios", "danger"); return; }
          const me = U.auth.current();
          const rec = S().insert("solicitudes", Object.assign({
            direccion: "coord-a-ref",
            moduloOrigen: modulo,
            solicitante: me ? me.nombre : "Coordinación",
            fechaEnvio: new Date().toISOString(),
            referente: ref ? ref.nombre : "Referente Técnico",
            estado: E.ENVIADA,
            respuestaTecnica: "", intervencion: "", medioVerificacion: "", conclusion: "",
            decisionCoordinador: "", obsCierre: ""
          }, d), { withCode: true });
          U.notif.push({
            titulo: "Nueva solicitud técnica: " + rec.titulo,
            modulo: "Solicitudes de apoyo", prioridad: d.prioridad === "alta" ? "alta" : "normal",
            destinatario: "referente", ref: "#/ref/solicitudesRecibidas"
          });
          u.closeModal();
          u.toast("Solicitud enviada al Referente (" + rec.codigo + ")", "ok");
          if (onDone) onDone();
        };
      }
    });
  }

  /* ---------- Detalle + acciones según rol ---------- */
  function detalle(sol, onChange) {
    const u = ui();
    const me = U.auth.current();
    const soyReferente = me && me.rol === "referente";
    const soyCoordinador = me && me.rol === "coordinador";

    function fila(label, val, mono) {
      return `<div><span>${u.esc(label)}</span><strong class="${mono ? "mono" : ""}">${val ? u.esc(val) : "—"}</strong></div>`;
    }

    const info = `
      ${stepper(sol.estado)}
      <div class="dl">
        ${fila("Código", sol.codigo, true)}
        ${fila("Módulo de origen", sol.moduloOrigen)}
        ${fila("Fecha de envío", u.fechaCL(sol.fechaEnvio))}
        ${fila("Solicitante", sol.solicitante)}
        ${fila("Unidad", sol.unidad)}
        ${fila("Prioridad", sol.prioridad)}
        ${fila("Plazo", u.fechaCL(sol.plazo))}
        ${fila("Referente asignado", sol.referente)}
        <div style="grid-column:1/-1">${fila("Estado", "").replace("—", u.estadoBadge(sol.estado))}</div>
      </div>
      <div style="grid-column:1/-1"><span class="muted" style="font-size:12px;font-weight:600">Descripción</span>
        <p class="narrativo">${u.esc(sol.descripcion || "—")}</p></div>
      ${sol.respuestaTecnica || sol.medioVerificacion ? `
        <div class="dl" style="border-top:1px dashed var(--border-2);padding-top:.6rem">
          ${fila("Respuesta técnica", sol.respuestaTecnica)}
          ${fila("Intervención realizada", sol.intervencion)}
          ${fila("Medio de verificación", sol.medioVerificacion)}
          ${fila("Conclusión y próximo paso", sol.conclusion)}
          ${fila("Fecha de respuesta", u.fechaCL(sol.fechaRespuesta))}
        </div>` : ""}
      ${sol.decisionCoordinador ? `<div class="dl">
          ${fila("Decisión del Coordinador", sol.decisionCoordinador)}
          ${fila("Observaciones de cierre", sol.obsCierre)}
          ${fila("Coordinador que revisa", sol.cerradoPor || sol.revisadoPor)}
          ${fila("Fecha de cierre", u.fechaCL(sol.fechaCierre))}
        </div>` : ""}
      ${U.components.resource.trazabilidad(sol)}`;

    // Botonera según rol y estado
    let footer = `<button class="btn btn--ghost" data-close>Cerrar</button>`;
    if (soyReferente && sol.estado === E.ENVIADA)
      footer += `<button class="btn btn--primary" data-tomar>Marcar “En curso”</button>`;
    if (soyReferente && sol.estado === E.CURSO)
      footer += `<button class="btn btn--primary" data-responder>Registrar respuesta técnica</button>`;
    if (soyReferente && sol.estado === E.CURSO && sol.respuestaTecnica && sol.medioVerificacion)
      footer += `<button class="btn" style="background:var(--verde);color:#fff" data-completar>Completada por referente</button>`;
    if (soyCoordinador && sol.estado === E.COMPLETADA) {
      footer += `<button class="btn btn--ghost" data-devolver>Devolver con observaciones</button>
                 <button class="btn btn--primary" data-cerrar>Cerrar solicitud</button>`;
    }

    u.modal({
      title: "Solicitud " + (sol.codigo || ""),
      wide: true,
      body: info,
      footer,
      onMount(m) {
        const refresh = () => { u.closeModal(); if (onChange) onChange(); };
        const tomar = m.querySelector("[data-tomar]");
        if (tomar) tomar.onclick = () => {
          S().update("solicitudes", sol.id, { estado: E.CURSO });
          U.notif.push({ titulo: "Solicitud en gestión: " + sol.titulo, modulo: "Solicitudes de apoyo", destinatario: "coordinador", ref: "#/coord/solicitudes" });
          u.toast("Solicitud tomada", "ok"); refresh();
        };
        const responder = m.querySelector("[data-responder]");
        if (responder) responder.onclick = () => formRespuesta(sol, onChange);
        const completar = m.querySelector("[data-completar]");
        if (completar) completar.onclick = () => {
          S().update("solicitudes", sol.id, { estado: E.COMPLETADA });
          S().stamp("solicitudes", sol.id, "revisado"); // marca de gestión técnica
          U.notif.push({ titulo: "Respuesta técnica lista: " + sol.titulo, modulo: "Solicitudes de apoyo", prioridad: "alta", destinatario: "coordinador", ref: "#/coord/solicitudes" });
          u.toast("Marcada como completada por referente", "ok"); refresh();
        };
        const cerrar = m.querySelector("[data-cerrar]");
        if (cerrar) cerrar.onclick = () => {
          if (!sol.respuestaTecnica || !sol.medioVerificacion) {
            u.toast("No se puede cerrar sin respuesta técnica ni medio de verificación", "danger"); return;
          }
          formCierre(sol, onChange);
        };
        const devolver = m.querySelector("[data-devolver]");
        if (devolver) devolver.onclick = () => formDevolver(sol, onChange);
      }
    });
  }

  function formRespuesta(sol, onChange) {
    const u = ui();
    const fields = [
      { name: "respuestaTecnica", label: "Respuesta técnica", type: "textarea", full: true, required: true, value: sol.respuestaTecnica },
      { name: "intervencion", label: "Intervención realizada", type: "textarea", full: true, value: sol.intervencion },
      { name: "medioVerificacion", label: "Medio de verificación", full: true, required: true, value: sol.medioVerificacion, hint: "Documento, acta, registro o enlace que respalda la intervención." },
      { name: "conclusion", label: "Conclusión y próximo paso", type: "textarea", full: true, value: sol.conclusion }
    ];
    u.modal({
      title: "Respuesta técnica", wide: true, body: u.formHTML(fields, {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar respuesta</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.respuestaTecnica || !d.medioVerificacion) { u.toast("Respuesta técnica y medio de verificación son obligatorios", "danger"); return; }
          d.fechaRespuesta = new Date().toISOString();
          S().update("solicitudes", sol.id, d);
          u.closeModal(); u.toast("Respuesta registrada", "ok");
          if (onChange) onChange();
        };
      }
    });
  }

  function formCierre(sol, onChange) {
    const u = ui();
    u.modal({
      title: "Cerrar solicitud",
      body: `<p class="narrativo">Al cerrar, la solicitud queda “Cerrada por coordinación” y se conserva en el historial (no se puede eliminar).</p>
        ${u.formHTML([{ name: "obsCierre", label: "Observaciones de cierre", type: "textarea", full: true, value: sol.obsCierre }], {})}`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Confirmar cierre</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          S().update("solicitudes", sol.id, { estado: E.CERRADA, decisionCoordinador: "Cerrada por coordinación", obsCierre: d.obsCierre, fechaCierre: new Date().toISOString() });
          S().stamp("solicitudes", sol.id, "cerrado");
          U.notif.push({ titulo: "Solicitud cerrada: " + sol.titulo, modulo: "Solicitudes de apoyo", destinatario: "referente", ref: "#/ref/solicitudesRecibidas" });
          u.closeModal(); u.toast("Solicitud cerrada", "ok");
          if (onChange) onChange();
        };
      }
    });
  }

  function formDevolver(sol, onChange) {
    const u = ui();
    u.modal({
      title: "Devolver con observaciones",
      body: u.formHTML([{ name: "obsCierre", label: "Observaciones para el Referente", type: "textarea", full: true, required: true, value: "" }], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--danger" data-save>Devolver</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.obsCierre) { u.toast("Escribe las observaciones", "danger"); return; }
          S().update("solicitudes", sol.id, { estado: E.CURSO, decisionCoordinador: "Devuelta con observaciones", obsCierre: d.obsCierre });
          U.notif.push({ titulo: "Solicitud devuelta: " + sol.titulo, modulo: "Solicitudes de apoyo", prioridad: "alta", destinatario: "referente", ref: "#/ref/solicitudesRecibidas" });
          u.closeModal(); u.toast("Solicitud devuelta al Referente", "ok");
          if (onChange) onChange();
        };
      }
    });
  }

  /* ---------- Panel del Coordinador ---------- */
  function coordPanel(container) {
    U.components.resource.mount(container, {
      collection: "solicitudes", title: "Solicitud de apoyo técnico",
      hint: "Todas las solicitudes enviadas al Referente Técnico se consolidan aquí. No se eliminan las solicitudes cerradas.",
      newLabel: "Nueva solicitud", icon: "📨",
      emptyMsg: "Aún no hay solicitudes registradas.", emptySub: "Envía una intervención técnica desde cualquier módulo o crea una aquí.",
      filter: r => (r.direccion || "coord-a-ref") === "coord-a-ref",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "titulo", label: "Título" },
        { key: "unidad", label: "Unidad" },
        { key: "prioridad", label: "Prioridad", render: (r, u) => `<span class="tag" style="text-transform:capitalize">${u.esc(r.prioridad)}</span>` },
        { key: "fechaEnvio", label: "Envío", date: true },
        { key: "estado", label: "Estado", badge: true }
      ],
      canDelete: r => r.estado !== E.CERRADA,
      deleteMsg: "¿Eliminar esta solicitud? (Solo se permite si no está cerrada).",
      detail: detalle,
      // Formulario de creación desde el panel
      fields: [
        { name: "titulo", label: "Título de la solicitud", required: true, full: true },
        { name: "moduloOrigen", label: "Módulo de origen", value: "Solicitudes de apoyo" },
        { name: "unidad", label: "Unidad", type: "select", options: U.data.CAT.unidades, placeholder: "Seleccionar…" },
        { name: "prioridad", label: "Prioridad", type: "select", options: U.data.CAT.prioridades },
        { name: "plazo", label: "Plazo", type: "date" },
        { name: "descripcion", label: "Descripción", type: "textarea", full: true, required: true }
      ],
      defaults: () => ({ prioridad: "media", moduloOrigen: "Solicitudes de apoyo" }),
      withCode: true,
      onBeforeSave: (d, rec) => {
        if (rec) return d; // edición normal
        const me = U.auth.current(); const ref = U.auth.referente();
        return Object.assign(d, {
          direccion: "coord-a-ref", solicitante: me ? me.nombre : "Coordinación",
          fechaEnvio: new Date().toISOString(), referente: ref ? ref.nombre : "Referente Técnico",
          estado: E.ENVIADA
        });
      },
      afterSave: () => {
        const ref = U.auth.referente();
        U.notif.push({ titulo: "Nueva solicitud técnica", modulo: "Solicitudes de apoyo", destinatario: "referente", ref: "#/ref/solicitudesRecibidas" });
      }
    });
  }

  /* ---------- Panel del Referente ---------- */
  function refPanel(container) {
    U.components.resource.mount(container, {
      collection: "solicitudes", title: "Solicitud recibida", readOnly: true, export: true,
      hint: "Solicitudes técnicas enviadas por Coordinación. Ábrelas para gestionar y registrar la respuesta técnica.",
      emptyMsg: "No hay solicitudes recibidas.", emptySub: "Las solicitudes enviadas por Coordinación aparecerán aquí.", icon: "📨",
      filter: r => (r.direccion || "coord-a-ref") === "coord-a-ref",
      columns: [
        { key: "codigo", label: "Código", mono: true, width: "150px" },
        { key: "titulo", label: "Título" },
        { key: "unidad", label: "Unidad" },
        { key: "prioridad", label: "Prioridad", render: (r, u) => r.prioridad === "alta"
          ? `<span class="badge badge--danger">Alta</span>` : `<span class="tag" style="text-transform:capitalize">${u.esc(r.prioridad)}</span>` },
        { key: "plazo", label: "Plazo", date: true },
        { key: "estado", label: "Estado", badge: true }
      ],
      detail: detalle
    });
  }

  U.solicitudes = { crearDesde, detalle, coordPanel, refPanel, E };
})();
