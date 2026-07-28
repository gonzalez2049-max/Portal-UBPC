/* ============================================================
   COMPONENTS — Tablero Kanban reutilizable (Coordinador y Referente)
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const COLS = [
    { key: "Pendiente", label: "Pendientes" },
    { key: "En curso", label: "En curso" },
    { key: "Completado", label: "Completado" }
  ];
  const PRIO = { alta: "Alta", media: "Media", baja: "Baja" };

  function cards(owner) {
    return U.store.all("kanban").filter(c => (c.owner || "coordinador") === owner)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }

  function kanbanHTML(owner) {
    const ui = U.ui;
    const all = cards(owner);
    return `<div class="kanban" data-kanban="${owner}">
      ${COLS.map(col => {
        const list = all.filter(c => c.columna === col.key);
        return `<div class="kanban__col" data-col="${col.key}">
          <div class="kanban__col-head">
            <span>${col.label}</span>
            <span class="kcount">${list.length}</span>
          </div>
          <div class="kanban__drop" data-col-drop="${col.key}">
            ${list.map(c => cardHTML(c)).join("")}
          </div>
          <button class="btn btn--ghost btn--sm btn--block" data-kadd="${col.key}">+ Agregar tarjeta</button>
        </div>`;
      }).join("")}
    </div>`;
  }

  function cardHTML(c) {
    const ui = U.ui;
    const dias = ui.diasHasta(c.fechaLimite);
    const venc = dias != null && dias < 0 && c.columna !== "Completado";
    const prio = c.prioridad || "media";
    return `<div class="kcard kcard--${prio}" draggable="true" data-kid="${c.id}">
      <span class="kprio kprio--${prio}">${PRIO[prio] || prio}</span>
      <div class="kcard__title">${ui.esc(c.titulo)}</div>
      <div class="kcard__meta">
        ${c.responsable ? `<span>👤 ${ui.esc(c.responsable)}</span>` : ""}
        ${c.fechaLimite ? `<span style="${venc ? "color:var(--danger);font-weight:700" : ""}">📅 ${ui.fechaCL(c.fechaLimite)}${venc ? " · vencida" : ""}</span>` : ""}
        <span style="margin-left:auto" class="btn-row">
          <button class="btn-icon" data-kedit="${c.id}" title="Editar">✏️</button>
          <button class="btn-icon" data-kdel="${c.id}" title="Eliminar">🗑️</button>
        </span>
      </div>
    </div>`;
  }

  function cardForm(owner, card, columna) {
    const ui = U.ui;
    const fields = [
      { name: "titulo", label: "Título de la tarjeta", required: true, full: true, value: card ? card.titulo : "" },
      { name: "responsable", label: "Responsable", value: card ? card.responsable : "" },
      { name: "prioridad", label: "Prioridad", type: "select", options: ["alta", "media", "baja"], value: card ? card.prioridad : "media" },
      { name: "fechaLimite", label: "Fecha límite", type: "date", value: card ? ui.isoDay(card.fechaLimite) : "" },
      { name: "columna", label: "Columna", type: "select", options: COLS.map(c => c.key), value: card ? card.columna : (columna || "Pendiente") }
    ];
    ui.modal({
      title: card ? "Editar tarjeta" : "Nueva tarjeta",
      body: ui.formHTML(fields, {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button>
               <button class="btn btn--primary" data-save>Guardar</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = ui.readForm(m);
          if (!d.titulo) { ui.toast("El título es obligatorio", "danger"); return; }
          if (card) {
            U.store.update("kanban", card.id, d);
          } else {
            const max = Math.max(0, ...cards(owner).map(c => c.orden || 0));
            U.store.insert("kanban", Object.assign({ owner, orden: max + 1 }, d));
          }
          ui.closeModal();
          refresh(owner);
        };
      }
    });
  }

  let _container = null, _owner = null;
  function mount(container, owner) {
    _container = container; _owner = owner;
    refresh(owner);
  }
  function refresh(owner) {
    if (!_container) return;
    _container.innerHTML = kanbanHTML(owner);
    bind(owner);
  }

  function bind(owner) {
    const root = _container;
    root.querySelectorAll("[data-kadd]").forEach(b => b.onclick = () => cardForm(owner, null, b.dataset.kadd));
    root.querySelectorAll("[data-kedit]").forEach(b => b.onclick = () => cardForm(owner, U.store.get("kanban", b.dataset.kedit)));
    root.querySelectorAll("[data-kdel]").forEach(b => b.onclick = () => {
      U.ui.confirmDelete("¿Eliminar esta tarjeta del tablero?", () => { U.store.remove("kanban", b.dataset.kdel); refresh(owner); });
    });

    // Drag & drop: mover entre columnas Y reordenar dentro de la misma columna
    let dragEl = null;

    root.querySelectorAll(".kcard").forEach(card => {
      card.addEventListener("dragstart", e => {
        dragEl = card;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", () => {
        if (dragEl) dragEl.classList.remove("dragging");
        dragEl = null;
        root.querySelectorAll(".kanban__col").forEach(c => c.classList.remove("drag-over"));
        persistOrder(owner);
      });
    });

    // Devuelve la tarjeta que debe quedar DESPUÉS del punto de soltado (según la Y del cursor)
    function afterCard(drop, y) {
      const els = [...drop.querySelectorAll(".kcard:not(.dragging)")];
      let closest = { off: -Infinity, el: null };
      els.forEach(el => {
        const box = el.getBoundingClientRect();
        const off = y - box.top - box.height / 2;
        if (off < 0 && off > closest.off) closest = { off, el };
      });
      return closest.el;
    }

    root.querySelectorAll(".kanban__drop").forEach(drop => {
      const col = drop.closest(".kanban__col");
      drop.addEventListener("dragover", e => {
        e.preventDefault();
        if (!dragEl) return;
        col.classList.add("drag-over");
        const ref = afterCard(drop, e.clientY);
        if (ref == null) drop.appendChild(dragEl);
        else drop.insertBefore(dragEl, ref);
      });
      drop.addEventListener("dragleave", e => {
        if (!drop.contains(e.relatedTarget)) col.classList.remove("drag-over");
      });
      drop.addEventListener("drop", e => {
        e.preventDefault();
        col.classList.remove("drag-over");
      });
    });
  }

  // Lee el orden visual del DOM y persiste columna + orden de cada tarjeta en una sola escritura
  function persistOrder(owner) {
    const root = _container;
    if (!root) return;
    const rest = U.store.all("kanban").filter(c => (c.owner || "coordinador") !== owner);
    const mine = [];
    let idx = 0;
    root.querySelectorAll(".kanban__drop").forEach(drop => {
      const columna = drop.dataset.colDrop;
      drop.querySelectorAll(".kcard").forEach(el => {
        const rec = U.store.get("kanban", el.dataset.kid);
        if (rec) mine.push(Object.assign({}, rec, { columna, orden: idx++ }));
      });
    });
    U.store.replaceAll("kanban", rest.concat(mine));
    refresh(owner);
  }

  U.components = U.components || {};
  U.components.kanban = { mount, kanbanHTML, refresh };
})();
