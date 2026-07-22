/* ============================================================
   RESOURCE — Framework de módulos CRUD orientado a configuración
   Tabla + formulario + exportación + trazabilidad, reutilizable.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  /* Barra de sub-pestañas para módulos con submódulos */
  function tabsBar(portal, moduleKey, tabs, active) {
    return `<div class="tabs no-print">${tabs.map(t =>
      `<a class="tab ${t.key === active ? "active" : ""}" href="#/${portal}/${moduleKey}?tab=${t.key}">${ui().esc(t.label)}</a>`
    ).join("")}</div>`;
  }

  /* Valor de celda según definición de columna */
  function cell(col, rec) {
    const u = ui();
    if (col.render) return col.render(rec, u);
    let v = rec[col.key];
    if (col.date) return `<span class="cell-date">${u.fechaCL(v)}</span>`;
    if (col.badge) return u.estadoBadge(v);
    if (v == null || v === "") return `<span class="muted">—</span>`;
    if (col.mono) return `<span class="mono">${u.esc(v)}</span>`;
    if (col.num) return u.esc(v);
    return u.esc(String(v).length > 120 ? String(v).slice(0, 120) + "…" : v);
  }

  /* Exportación de una colección a CSV usando las columnas */
  function exportValue(col, rec) {
    if (col.exportVal) return col.exportVal(rec);
    let v = rec[col.key];
    if (col.date) return ui().fechaCL(v);
    return v == null ? "" : v;
  }

  function mount(container, cfg) {
    if (!container) return;
    const u = ui();
    const canEdit = cfg.readOnly ? false : true;
    const state = { q: "", f: {} };

    function baseRecords() {
      let list = S().all(cfg.collection);
      if (cfg.filter) list = list.filter(cfg.filter);
      return list;
    }
    function searchText(rec) {
      return cfg.columns.map(c => exportValue(c, rec)).join(" ").toLowerCase() + " " + String(rec.codigo || "").toLowerCase();
    }
    function records() {
      let list = baseRecords();
      (cfg.filters || []).forEach(f => { const v = state.f[f.key]; if (v) list = list.filter(r => String(r[f.key] || "") === v); });
      const q = state.q.trim().toLowerCase();
      if (q) list = list.filter(r => searchText(r).includes(q));
      list.sort(cfg.sort || ((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0)));
      return list;
    }

    function render() {
      const base = baseRecords();
      const filtersHTML = (cfg.filters || []).map(f => {
        const opts = f.options || [...new Set(base.map(r => r[f.key]).filter(x => x != null && x !== ""))];
        return `<select class="select res-filter" data-fkey="${f.key}" aria-label="${u.esc(f.label)}">
          <option value="">${u.esc(f.label)}: todos</option>
          ${opts.map(o => `<option value="${u.esc(o)}">${u.esc(o)}</option>`).join("")}</select>`;
      }).join("");
      const tools = base.length ? `<div class="res-tools no-print">
          <div class="res-search"><span class="ic">🔍</span>
            <input class="input" type="search" id="res-q" placeholder="Buscar…" aria-label="Buscar en la tabla"></div>
          ${filtersHTML}
          <span class="res-count" id="res-count"></span>
        </div>` : "";
      const toolbar = `<div class="section__head">
        <p class="section__hint">${u.esc(cfg.hint || "")}</p>
        <div class="btn-row">
          ${cfg.export !== false ? `<button class="btn btn--ghost btn--sm" data-export>⬇️ Exportar</button>` : ""}
          ${cfg.print ? `<button class="btn btn--ghost btn--sm" data-print>🖨️ Imprimir</button>` : ""}
          ${canEdit ? `<button class="btn btn--primary btn--sm" data-new>+ ${u.esc(cfg.newLabel || "Nuevo registro")}</button>` : ""}
        </div>
      </div>`;
      container.innerHTML = toolbar + tools + `<div class="res-body" id="res-body"></div>`;
      bindToolbar();
      bindTools();
      renderBody();
    }

    function renderBody() {
      const bodyEl = container.querySelector("#res-body");
      const countEl = container.querySelector("#res-count");
      if (!baseRecords().length) {
        bodyEl.innerHTML = u.empty(cfg.emptyMsg || "Aún no hay registros disponibles.",
          cfg.emptySub || "Agrega el primer registro para comenzar.", cfg.icon || "🗂️");
        return;
      }
      const list = records();
      if (countEl) countEl.textContent = list.length + " registro" + (list.length === 1 ? "" : "s");
      if (!list.length) {
        bodyEl.innerHTML = u.empty("Sin resultados.", "Ajusta la búsqueda o los filtros.", "🔍");
        return;
      }
      const cols = cfg.columns;
      bodyEl.innerHTML = `<div class="table-wrap"><table class="tbl"><thead><tr>
        ${cols.map(c => `<th scope="col" ${c.width ? `style="width:${c.width}"` : ""}>${u.esc(c.label)}</th>`).join("")}
        <th scope="col" class="right">Acciones</th></tr></thead><tbody>
        ${list.map(rec => `<tr data-id="${rec.id}">
          ${cols.map(c => `<td class="${c.num ? "num" : ""}">${cell(c, rec)}</td>`).join("")}
          <td class="acciones"><div class="btn-row" style="justify-content:flex-end">
            ${(cfg.rowActions || []).map((a, i) =>
              (!a.show || a.show(rec)) ? `<button class="btn-icon" data-act="${i}" data-id="${rec.id}" title="${u.esc(a.title)}">${a.ico}</button>` : "").join("")}
            ${canEdit ? `<button class="btn-icon" data-edit="${rec.id}" title="Editar">✏️</button>` : ""}
            ${canEdit && (!cfg.canDelete || cfg.canDelete(rec)) ? `<button class="btn-icon" data-del="${rec.id}" title="Eliminar">🗑️</button>` : ""}
            ${cfg.detail ? `<button class="btn-icon" data-detail="${rec.id}" title="Ver detalle">👁️</button>` : ""}
          </div></td></tr>`).join("")}
      </tbody></table></div>`;
      bindBody();
    }

    function bindToolbar() {
      const nb = container.querySelector("[data-new]");
      if (nb) nb.onclick = () => form(null);
      const ex = container.querySelector("[data-export]");
      if (ex) ex.onclick = () => {
        const rows = records().map(rec => {
          const o = {}; cfg.columns.forEach(c => { o[c.label] = exportValue(c, rec); }); return o;
        });
        u.exportCSV((cfg.collection || "export") + "-ubpc", rows, cfg.columns.map(c => c.label));
      };
      const pr = container.querySelector("[data-print]");
      if (pr) pr.onclick = () => u.printSection();
    }
    function bindTools() {
      const q = container.querySelector("#res-q");
      if (q) { q.value = state.q; q.oninput = () => { state.q = q.value; renderBody(); }; }
      container.querySelectorAll(".res-filter").forEach(sel => {
        sel.value = state.f[sel.dataset.fkey] || "";
        sel.onchange = () => { state.f[sel.dataset.fkey] = sel.value; renderBody(); };
      });
    }
    function bindBody() {
      container.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => form(S().get(cfg.collection, b.dataset.edit)));
      container.querySelectorAll("[data-del]").forEach(b => b.onclick = () =>
        u.confirmDelete(cfg.deleteMsg || "¿Deseas eliminar este registro? Esta acción no se puede deshacer.",
          () => { S().remove(cfg.collection, b.dataset.del); render(); }));
      container.querySelectorAll("[data-detail]").forEach(b => b.onclick = () => cfg.detail(S().get(cfg.collection, b.dataset.detail), renderBody));
      (cfg.rowActions || []).forEach((a, i) => {
        container.querySelectorAll(`[data-act="${i}"]`).forEach(b => b.onclick = () => a.fn(S().get(cfg.collection, b.dataset.id), render));
      });
    }

    function form(rec) {
      const fields = typeof cfg.fields === "function" ? cfg.fields(rec) : cfg.fields;
      const values = rec || (typeof cfg.defaults === "function" ? cfg.defaults() : cfg.defaults) || {};
      u.modal({
        title: (rec ? "Editar · " : "Nuevo · ") + (cfg.title || ""),
        wide: cfg.wideForm,
        body: (cfg.formIntro ? `<p class="card__hint">${u.esc(cfg.formIntro)}</p>` : "") + u.formHTML(fields, values),
        footer: `<button class="btn btn--ghost" data-close>Cancelar</button>
                 <button class="btn btn--primary" data-save>Guardar</button>`,
        onMount(m) {
          if (cfg.onFormMount) cfg.onFormMount(m, rec);
          m.querySelector("[data-save]").onclick = () => {
            let data = u.readForm(m);
            // Validación de requeridos
            const missing = fields.filter(f => f.required && !data[f.name]);
            if (missing.length) { u.toast("Completa los campos obligatorios: " + missing.map(f => f.label).join(", "), "danger"); return; }
            if (cfg.onBeforeSave) { const r = cfg.onBeforeSave(data, rec, m); if (r === false) return; if (r) data = r; }
            if (rec) S().update(cfg.collection, rec.id, data);
            else S().insert(cfg.collection, data, { withCode: !!cfg.withCode });
            u.closeModal();
            u.toast(rec ? "Registro actualizado" : "Registro creado", "ok");
            if (cfg.afterSave) cfg.afterSave();
            render();
          };
        }
      });
    }

    render();
    return { render, form };
  }

  /* Bloque de trazabilidad para detalles */
  function trazabilidad(rec) {
    const u = ui();
    const rows = [
      ["Creado por", rec.creadoPor, rec.fechaCreacion],
      ["Última modificación", rec.modificadoPor, rec.fechaModificacion],
      ["Revisado por", rec.revisadoPor, rec.fechaRevisado],
      ["Cerrado por", rec.cerradoPor, rec.fechaCerrado]
    ].filter(r => r[1]);
    return `<div class="traza"><strong>Trazabilidad</strong>
      <table class="tbl" style="margin-top:.3rem"><tbody>
      ${rows.map(r => `<tr><td>${u.esc(r[0])}</td><td>${u.esc(r[1])}</td><td class="muted">${u.fechaHoraCL(r[2])}</td></tr>`).join("")}
      </tbody></table></div>`;
  }

  U.components = U.components || {};
  U.components.resource = { mount, tabsBar, trazabilidad };
})();
