/* ============================================================
   MÓDULO — GUÍA PARA EL COORDINADOR
   Orientaciones prácticas + "Evidencia para la acción" (EVI, movida del
   Home) + priorización de acciones según brechas detectadas en el portal.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CS = () => U.coordStats;

  const ORIENTACIONES = [
    { ic: "🏛️", t: "Posicionar la UBPC en el hospital público", p: [
      "Vincula cada acción de la UBPC con los objetivos de calidad y seguridad del paciente de la dirección.",
      "Haz visible el aporte con datos: usa el Dashboard RNAO, la NT 234 y los Indicadores UBPC en comités.",
      "Formaliza la unidad con actas, resoluciones y respaldos (Módulo de Gestión y Respaldo)." ] },
    { ic: "🧭", t: "Fortalecer el liderazgo del coordinador", p: [
      "Lidera con evidencia y ejemplo: prioriza pocas metas claras y hazles seguimiento visible.",
      "Delega con responsables y fechas (usa el tablero Kanban y las solicitudes técnicas).",
      "Comunica avances y reconoce logros; cierra los ciclos de mejora que inicias." ] },
    { ic: "🤝", t: "Trabajar con referentes, líderes de guía y Champions", p: [
      "Define roles: el Referente Técnico ejecuta y responde solicitudes; los Champions dan sostén en cada unidad.",
      "Reúnete periódicamente (Reuniones de seguimiento) y deja acuerdos con plazos.",
      "Mantén la Red Champion activa por guía y unidad (Módulo RNAO)." ] },
    { ic: "💪", t: "Motivación, adherencia y participación de los equipos", p: [
      "Muestra el impacto clínico de las buenas prácticas, no solo el cumplimiento administrativo.",
      "Reduce la carga: integra los registros al flujo de trabajo del turno.",
      "Retroalimenta con datos por unidad y celebra avances (Reconocimientos)." ] },
    { ic: "🎓", t: "Aula virtual para refuerzos educativos (no certificados)", p: [
      "Usa cápsulas breves de refuerzo por turno para reforzar escalas, criterios y prácticas.",
      "Vincula cada refuerzo a una brecha detectada; registra la capacitación por turno.",
      "Estos refuerzos no reemplazan la capacitación certificada: son apoyo continuo." ] },
    { ic: "🔬", t: "Avanzar desde la evidencia hacia la acción", p: [
      "Convierte cada hallazgo de evidencia en una recomendación aplicable y un responsable.",
      "Usa 'Evidencia para la acción' (abajo) y EVI para traducir evidencia en práctica.",
      "Cierra el ciclo: evidencia → protocolo/flujo → capacitación → auditoría → mejora." ] },
    { ic: "♾️", t: "Sostener las buenas prácticas en el tiempo", p: [
      "Estandariza en protocolos y flujos vigentes (Gestión Documental) y mantenlos actualizados.",
      "Monitorea con indicadores y auditorías periódicas; actúa ante cada semáforo amarillo/rojo.",
      "Institucionaliza: acuerdos, responsables y periodicidad definida." ] },
    { ic: "🎯", t: "Priorizar según las brechas del portal", p: [
      "El portal detecta automáticamente indicadores bajo meta, acciones vencidas y planes pendientes.",
      "Concentra el esfuerzo en la guía y la unidad con mayor brecha (ver panel de prioridades abajo).",
      "Traduce cada brecha en una acción de mejora con responsable y plazo." ] }
  ];

  function guia() {
    return `<div class="page-head"><h1>Guía para el Coordinador/a</h1>
      <p>Orientaciones prácticas para conducir la UBPC, con la evidencia y las brechas del portal como apoyo.</p></div>
      <div class="section">
        <div class="section__head"><h2 class="section__title">Prioriza según las brechas detectadas</h2>
          <p class="section__hint">Generado automáticamente con los datos del portal.</p></div>
        <div class="card" id="guia-brechas"></div>
      </div>
      <div class="section">
        <div class="section__head"><div><h2 class="section__title">Evidencia para la acción</h2>
          <p class="section__hint">Evidencia que orienta decisiones y buenas prácticas.</p></div>
          <button class="btn btn--primary btn--sm" id="guia-addevi">+ Nueva evidencia</button></div>
        <div class="card" id="guia-evi"></div>
      </div>
      <div class="section">
        <div class="section__head"><h2 class="section__title">Orientaciones prácticas</h2></div>
        <div class="guia-grid">${ORIENTACIONES.map((o, i) => `<details class="guia-card" ${i === 0 ? "open" : ""}>
          <summary><span class="guia-ic">${o.ic}</span>${ui().esc(o.t)}</summary>
          <ul>${o.p.map(x => `<li>${ui().esc(x)}</li>`).join("")}</ul>
        </details>`).join("")}</div>
      </div>`;
  }

  /* ---------- Evidencia para la acción (EVI, movida del Home) ---------- */
  function eviHTML() {
    const u = ui();
    const list = S().all("evidenciaSemana").sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const e = list[0];
    const cuerpo = !e ? u.empty("Aún no hay evidencia registrada.", "Agrega la primera evidencia para comenzar.", "🔬")
      : `<div class="evi">
          <div>
            <h3 style="margin:.1rem 0">${u.esc(e.titulo)}</h3>
            <div class="kpi__sub">${u.esc(e.fuente || "")} · ${u.fechaCL(e.fecha)}</div>
            <p class="narrativo" style="margin:.5rem 0 .3rem">${u.esc(e.resumen || "")}</p>
            <p style="margin:.2rem 0"><strong>Recomendación para la práctica:</strong> ${u.esc(e.recomendacion || "—")}</p>
            ${e.enlace ? `<a href="${u.esc(e.enlace)}" target="_blank" rel="noopener">Ver fuente ↗</a>` : ""}
          </div>
          <div class="evi__mascot"><img class="evi-img" src="assets/img/evi-full.png" alt="EVI, mascota de la UBPC"></div>
        </div>`;
    const otras = list.slice(1, 5);
    return cuerpo +
      (otras.length ? `<div style="margin-top:.6rem"><span class="muted" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em">Más evidencia</span>
        <ul class="feed">${otras.map(o => `<li><span class="feed__ico">🔬</span><div><strong>${u.esc(o.titulo)}</strong><div class="feed__meta">${u.esc(o.fuente || "")} · ${u.fechaCL(o.fecha)}</div></div></li>`).join("")}</ul></div>` : "") +
      `<p class="evi__quote">"La evidencia cobra valor cuando transforma la práctica y mejora el cuidado."</p>`;
  }
  function eviForm() {
    const u = ui();
    u.modal({ title: "Nueva evidencia para la acción", body: u.formHTML([
      { name: "titulo", label: "Título", required: true, full: true },
      { name: "fuente", label: "Fuente" }, { name: "fecha", label: "Fecha", type: "date", value: u.hoyISO() },
      { name: "resumen", label: "Resumen", type: "textarea", full: true },
      { name: "recomendacion", label: "Recomendación para la práctica", type: "textarea", full: true },
      { name: "enlace", label: "Enlace", full: true }
    ], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) { m.querySelector("[data-save]").onclick = () => {
        const d = u.readForm(m); if (!d.titulo) { u.toast("El título es obligatorio", "danger"); return; }
        S().insert("evidenciaSemana", d); u.closeModal(); guiaBind();
      }; } });
  }

  /* ---------- Brechas automáticas ---------- */
  function brechas() {
    const u = ui(); const items = [];
    // RNAO: indicadores bajo meta
    S().all("evaluacionesRNAO").forEach(e => {
      CS().indicadoresBajoMeta(e).forEach(i => {
        const meta = Number(e.meta) || 90; const critico = i.pct < meta - 15;
        items.push({ p: critico ? 0 : 1, tag: "RNAO", titulo: i.nombre, detalle: `${e.guia || ""} · ${e.unidad || ""} — ${i.pct}% (meta ${meta}%)`, ref: "#/coord/m3?tab=evaluaciones" });
      });
    });
    // Acciones de mejora vencidas/pendientes
    S().all("accionesRNAO").filter(a => a.estado !== "Completado").forEach(a => {
      const venc = a.fechaComprometida && new Date(a.fechaComprometida) < new Date();
      items.push({ p: venc ? 0 : 2, tag: "Acción de mejora", titulo: a.indicadorOrigen || "Acción", detalle: `${a.unidad || ""} — ${a.estado}${venc ? " · vencida" : ""}`, ref: "#/coord/m3?tab=acciones" });
    });
    // Indicadores UBPC en rojo
    S().all("indicadores").forEach(ind => {
      const cur = currentInd(ind);
      if (cur.sem === "rojo") items.push({ p: 0, tag: "Indicador", titulo: ind.nombre, detalle: `${cur.cur}% (meta ${ind.meta}%)`, ref: "#/coord/indicadores" });
    });
    // Planes NT 234 pendientes
    S().all("planesNT234").filter(p => p.estado !== "Completado").forEach(p => {
      items.push({ p: 2, tag: "NT 234", titulo: "Plan de mejora · " + (p.unidad || ""), detalle: `${p.indicadores || ""} — ${p.porcentaje != null ? p.porcentaje + "%" : ""} · ${p.estado}`, ref: "#/coord/m6?tab=planes" });
    });
    // Solicitudes en gestión
    const sol = S().all("solicitudes").filter(x => (x.direccion || "coord-a-ref") === "coord-a-ref" && x.estado && x.estado !== "Cerrada por coordinación");
    if (sol.length) items.push({ p: 1, tag: "Solicitudes", titulo: sol.length + " solicitud(es) técnica(s) en gestión", detalle: "Revisa el flujo con el Referente Técnico", ref: "#/coord/solicitudes" });
    // Documentos pendientes
    const docp = S().all("documentos").filter(d => /revisi|borrador|enviado/i.test(d.estado || ""));
    if (docp.length) items.push({ p: 2, tag: "Documentos", titulo: docp.length + " documento(s) por validar", detalle: "Gestión Documental", ref: "#/coord/m2" });

    items.sort((a, b) => a.p - b.p);
    if (!items.length) return `<div class="badge badge--ok">Sin brechas activas · las buenas prácticas están dentro de meta.</div>`;
    const P = ["Prioridad alta", "Prioridad media", "Seguimiento"];
    const K = ["danger", "warn", "info"];
    return `<ul class="feed">${items.slice(0, 8).map(it => `<li>
      <span class="feed__ico">${it.p === 0 ? "🔴" : it.p === 1 ? "🟠" : "🟡"}</span>
      <div style="flex:1"><div><span class="tag">${u.esc(it.tag)}</span> <strong>${u.esc(it.titulo)}</strong></div>
        <div class="feed__meta">${u.esc(it.detalle)}</div></div>
      <a class="btn btn--ghost btn--sm" href="${it.ref}">Ir</a></li>`).join("")}</ul>
      <p class="kpi__sub" style="margin-top:.5rem">${items.length} brecha(s) detectada(s) · orden por prioridad.</p>`;
  }
  function currentInd(ind) {
    const seg = (ind.seguimientos || []).filter(s => s.valor !== "" && s.valor != null);
    let cur = null;
    if (seg.length) cur = Number(seg[seg.length - 1].valor);
    else if (Number(ind.denominador) > 0) cur = Math.round(Number(ind.numerador) / Number(ind.denominador) * 100);
    else if (ind.lineaBase != null && ind.lineaBase !== "") cur = Number(ind.lineaBase);
    const meta = Number(ind.meta); let sem = "sd";
    if (cur != null && meta) {
      const menor = ind.sentido === "Menor es mejor";
      sem = menor ? (cur <= meta ? "verde" : cur <= meta + 15 ? "amarillo" : "rojo") : (cur >= meta ? "verde" : cur >= meta - 15 ? "amarillo" : "rojo");
    }
    return { cur, sem };
  }

  function guiaBind() {
    document.getElementById("guia-brechas").innerHTML = brechas();
    document.getElementById("guia-evi").innerHTML = eviHTML();
    const add = document.getElementById("guia-addevi");
    if (add) add.onclick = () => eviForm();
  }

  U.coord.views.guia = guia;
  U.coord.binders.guia = guiaBind;
})();
