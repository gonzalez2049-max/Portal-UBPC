/* ============================================================
   BÚSQUEDA GLOBAL — cruza todos los módulos del Coordinador
   Paleta de comandos (Ctrl/Cmd+K). Navega al resultado.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  // Colección → módulo, ícono y ruta destino
  const SRC = [
    { col: "documentos", ic: "📄", mod: "Gestión Documental", route: "#/coord/m2" },
    { col: "apoyoMejora", ic: "🤝", mod: "Apoyo y Mejora", route: "#/coord/m1" },
    { col: "docsTrabajo", ic: "📝", mod: "Documentos de trabajo", route: "#/coord/m1?tab=docs" },
    { col: "evaluacionesRNAO", ic: "🧭", mod: "Programa RNAO", route: "#/coord/m3" },
    { col: "accionesRNAO", ic: "🎯", mod: "Acciones de mejora RNAO", route: "#/coord/m3" },
    { col: "guiasBPSO", ic: "📗", mod: "Guías BPSO", route: "#/coord/m3" },
    { col: "indicadores", ic: "📏", mod: "Indicadores UBPC", route: "#/coord/indicadores" },
    { col: "actividades", ic: "🎓", mod: "Fortalecimiento", route: "#/coord/m4" },
    { col: "reconocimientos", ic: "🏆", mod: "Reconocimientos", route: "#/coord/m4?tab=reconocimientos" },
    { col: "reuniones", ic: "📅", mod: "Gestión y Respaldo", route: "#/coord/m5" },
    { col: "acuerdos", ic: "🤝", mod: "Acuerdos", route: "#/coord/m5" },
    { col: "nt234", ic: "📊", mod: "Norma Técnica 234", route: "#/coord/m6" },
    { col: "planesNT234", ic: "🛠️", mod: "Planes de mejora NT 234", route: "#/coord/m6?tab=planes" },
    { col: "colaboraciones", ic: "🌐", mod: "Articulación y Respaldo", route: "#/coord/m5?tab=colaboraciones" },
    { col: "solicitudes", ic: "📨", mod: "Solicitudes técnicas", route: "#/coord/solicitudes" },
    { col: "hitos", ic: "⭐", mod: "Línea de tiempo", route: "#/coord/home" }
  ];
  const norm = s => (s == null ? "" : String(s)).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const TITLE_FIELDS = ["titulo", "nombre", "tema", "actividad", "unidad", "institucion", "guia", "codigo"];
  const titleOf = r => { for (const f of TITLE_FIELDS) if (r[f]) return r[f]; return "(registro)"; };
  function hayText(r) {
    let t = "";
    for (const k in r) { const v = r[k]; if (typeof v === "string" && k !== "id" && !/^fecha|Por$|Version/.test(k)) t += " " + v; }
    return norm(t);
  }

  function buscar(q) {
    const nq = norm(q).trim(); if (nq.length < 2) return [];
    const out = [];
    SRC.forEach(src => {
      S().all(src.col).forEach(r => {
        if (hayText(r).includes(nq)) out.push({ ic: src.ic, mod: src.mod, route: src.route, title: titleOf(r), sub: r.codigo || r.estado || r.tipo || "" });
      });
    });
    return out.slice(0, 40);
  }

  let overlay = null;
  function open() {
    if (overlay) return;
    const u = ui();
    overlay = document.createElement("div");
    overlay.className = "gsearch";
    overlay.innerHTML = `<div class="gsearch__panel" role="dialog" aria-label="Búsqueda global">
        <div class="gsearch__bar"><span class="gsearch__ic">🔎</span>
          <input class="gsearch__input" id="gs-input" placeholder="Buscar en todo el portal…" autocomplete="off">
          <kbd class="gsearch__kbd">Esc</kbd></div>
        <div class="gsearch__results" id="gs-results">
          <p class="gsearch__hint">Escribe al menos 2 letras. Busca documentos, evaluaciones, indicadores, reconocimientos, solicitudes y más.</p>
        </div></div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector("#gs-input");
    const results = overlay.querySelector("#gs-results");

    const render = () => {
      const q = input.value;
      const list = buscar(q);
      if (norm(q).trim().length < 2) {
        results.innerHTML = `<p class="gsearch__hint">Escribe al menos 2 letras para buscar.</p>`; return;
      }
      if (!list.length) { results.innerHTML = `<p class="gsearch__hint">Sin resultados para “${u.esc(q)}”.</p>`; return; }
      const groups = {};
      list.forEach(r => { (groups[r.mod] = groups[r.mod] || []).push(r); });
      results.innerHTML = Object.keys(groups).map(mod => `
        <div class="gsearch__group"><div class="gsearch__glabel">${u.esc(mod)}</div>
          ${groups[mod].map(r => `<a class="gsearch__row" href="${r.route}" data-close>
            <span class="gsearch__rowic">${r.ic}</span>
            <span class="gsearch__rowtx"><strong>${u.esc(r.title)}</strong>${r.sub ? `<span>${u.esc(r.sub)}</span>` : ""}</span>
            <span class="gsearch__go">↵</span></a>`).join("")}</div>`).join("")
        + `<div class="gsearch__count">${list.length} resultado(s)</div>`;
      results.querySelectorAll("[data-close]").forEach(a => a.onclick = () => close());
    };

    input.addEventListener("input", render);
    overlay.addEventListener("mousedown", e => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKey, true);
    setTimeout(() => input.focus(), 30);
  }
  function onKey(e) { if (e.key === "Escape") { e.preventDefault(); close(); } }
  function close() {
    if (!overlay) return;
    document.removeEventListener("keydown", onKey, true);
    overlay.remove(); overlay = null;
  }

  // Atajo global Ctrl/Cmd + K (una sola vez)
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      const sess = U.auth && U.auth.current();
      if (sess && sess.rol === "coordinador") { e.preventDefault(); overlay ? close() : open(); }
    }
  });

  U.gsearch = { open, close };
})();
