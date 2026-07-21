/* ============================================================
   UI — Helpers de interfaz: fechas CL, modales, toasts, badges,
   estados vacíos, exportación e impresión.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Fechas en formato chileno DD-MM-AAAA ---------- */
  function toDate(v) {
    if (!v) return null;
    if (v instanceof Date) return v;
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }
  function fechaCL(v) {
    const d = toDate(v);
    if (!d) return "—";
    const p = n => String(n).padStart(2, "0");
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
  }
  function fechaHoraCL(v) {
    const d = toDate(v);
    if (!d) return "—";
    const p = n => String(n).padStart(2, "0");
    return `${fechaCL(d)} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  // Para inputs date (YYYY-MM-DD)
  function isoDay(v) {
    const d = toDate(v);
    if (!d) return "";
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function hoyISO() { return isoDay(new Date()); }
  function diasHasta(v) {
    const d = toDate(v); if (!d) return null;
    return Math.ceil((d - new Date()) / 86400000);
  }

  /* ---------- Escape HTML ---------- */
  function esc(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function initials(name) {
    if (!name) return "?";
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  }

  /* ---------- Badges de estado ---------- */
  const ESTADO_MAP = {
    // genéricos
    "pendiente": "warn", "en curso": "info", "en desarrollo": "info",
    "completado": "ok", "completada": "ok", "finalizado": "ok", "finalizada": "ok",
    "cerrada": "ok", "cerrado": "ok", "aprobado": "ok", "vigente": "ok", "activo": "ok", "activa": "ok",
    "vencido": "danger", "vencida": "danger", "atrasado": "danger", "crítico": "danger",
    "en revisión": "info", "revisión": "info", "borrador": "neutral", "enviado": "info",
    "devuelta": "danger", "observaciones": "warn", "sin iniciar": "neutral",
    "en seguimiento": "warn", "intervención": "danger", "dentro de meta": "ok",
    // solicitudes
    "enviada": "info", "completada por referente": "info", "cerrada por coordinación": "ok"
  };
  function estadoBadge(estado) {
    const key = String(estado || "").toLowerCase().trim();
    let kind = ESTADO_MAP[key];
    if (!kind) { // respaldo por palabra clave
      if (/cerrad|complet|finaliz|vigente|aprobad|dentro de meta/.test(key)) kind = "ok";
      else if (/curso|gesti|revisi|respond|enviad|seguimiento/.test(key)) kind = "info";
      else if (/pendiente|observ|amarillo/.test(key)) kind = "warn";
      else if (/vencid|devuel|crític|interven|rojo|atrasad/.test(key)) kind = "danger";
      else kind = "neutral";
    }
    return `<span class="badge badge--${kind}">${esc(estado || "—")}</span>`;
  }

  /* ---------- Estados vacíos ---------- */
  function empty(msg, sub, icon) {
    return `<div class="empty">
      <span class="empty__icon">${icon || "🗂️"}</span>
      <div class="empty__title">${esc(msg || "Aún no hay registros disponibles.")}</div>
      ${sub ? `<div>${esc(sub)}</div>` : ""}
    </div>`;
  }

  /* ---------- Toasts ---------- */
  function toast(msg, kind) {
    let host = document.getElementById("toasts");
    if (!host) { host = document.createElement("div"); host.id = "toasts"; document.body.appendChild(host); }
    const el = document.createElement("div");
    el.className = "toast" + (kind ? " toast--" + kind : "");
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3200);
  }

  /* ---------- Modal genérico ---------- */
  let _modalEl = null;
  function modal(opts) {
    closeModal();
    opts = opts || {};
    const back = document.createElement("div");
    back.className = "modal-backdrop";
    back.innerHTML = `
      <div class="modal ${opts.wide ? "modal--lg" : ""}" role="dialog" aria-modal="true">
        <div class="modal__head">
          <h3 class="card__title">${esc(opts.title || "")}</h3>
          <button class="btn-icon" data-close aria-label="Cerrar">✕</button>
        </div>
        <div class="modal__body">${opts.body || ""}</div>
        <div class="modal__foot">${opts.footer || `<button class="btn btn--ghost" data-close>Cerrar</button>`}</div>
      </div>`;
    document.body.appendChild(back);
    _modalEl = back;
    back.addEventListener("click", e => {
      if (e.target === back || e.target.hasAttribute("data-close")) closeModal();
    });
    document.addEventListener("keydown", escClose);
    if (typeof opts.onMount === "function") opts.onMount(back.querySelector(".modal"));
    return back;
  }
  function escClose(e) { if (e.key === "Escape") closeModal(); }
  function closeModal() {
    if (_modalEl) { _modalEl.remove(); _modalEl = null; document.removeEventListener("keydown", escClose); }
  }

  /* ---------- Confirmación antes de eliminar ---------- */
  function confirmDelete(message, onConfirm) {
    modal({
      title: "Confirmar eliminación",
      body: `<p class="narrativo">${esc(message || "¿Deseas eliminar este registro? Esta acción no se puede deshacer.")}</p>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button>
               <button class="btn btn--danger" data-confirm>Eliminar</button>`,
      onMount(m) {
        m.querySelector("[data-confirm]").addEventListener("click", () => { closeModal(); onConfirm(); });
      }
    });
  }

  /* ---------- Constructor de formularios ---------- */
  // fields: [{name,label,type,required,options,value,full,hint,rows}]
  function formHTML(fields, values) {
    values = values || {};
    return `<div class="form-grid">` + fields.map(f => {
      const v = values[f.name] != null ? values[f.name] : (f.value != null ? f.value : "");
      const req = f.required ? "req" : "";
      const style = f.full ? 'style="grid-column:1/-1"' : "";
      let control;
      if (f.type === "select") {
        control = `<select class="select" name="${f.name}">
          ${(f.placeholder ? `<option value="">${esc(f.placeholder)}</option>` : "")}
          ${(f.options || []).map(o => {
            const val = typeof o === "object" ? o.value : o;
            const lab = typeof o === "object" ? o.label : o;
            return `<option value="${esc(val)}" ${String(v) === String(val) ? "selected" : ""}>${esc(lab)}</option>`;
          }).join("")}
        </select>`;
      } else if (f.type === "textarea") {
        control = `<textarea class="textarea" name="${f.name}" rows="${f.rows || 3}">${esc(v)}</textarea>`;
      } else {
        control = `<input class="input" type="${f.type || "text"}" name="${f.name}" value="${esc(v)}" ${f.attrs || ""}>`;
      }
      return `<div class="field" ${style}>
        <label class="${req}">${esc(f.label)}</label>
        ${control}
        ${f.hint ? `<div class="kpi__sub">${esc(f.hint)}</div>` : ""}
      </div>`;
    }).join("") + `</div>`;
  }
  function readForm(rootEl) {
    const data = {};
    rootEl.querySelectorAll("input,select,textarea").forEach(el => {
      if (!el.name) return;
      data[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
    });
    return data;
  }

  /* ---------- Descargas / exportación ---------- */
  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }
  // Exporta filas a CSV (abre en Excel). rows: array de objetos; headers opcional.
  function exportCSV(filename, rows, headers) {
    if (!rows || !rows.length) { toast("No hay datos para exportar", "danger"); return; }
    headers = headers || Object.keys(rows[0]);
    const escCell = s => `"${String(s == null ? "" : s).replace(/"/g, '""')}"`;
    const csv = "﻿" + [headers.map(escCell).join(";")]
      .concat(rows.map(r => headers.map(h => escCell(r[h])).join(";"))).join("\r\n");
    download(filename.replace(/\.\w+$/, "") + ".csv", csv, "text/csv;charset=utf-8");
  }
  function printSection() { window.print(); }

  window.UBPC = window.UBPC || {};
  window.UBPC.ui = {
    fechaCL, fechaHoraCL, isoDay, hoyISO, diasHasta,
    esc, initials, estadoBadge, empty, toast, modal, closeModal,
    confirmDelete, formHTML, readForm, download, exportCSV, printSection
  };
})();
