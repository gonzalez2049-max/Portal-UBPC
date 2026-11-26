/* ============================================================
   RESOURCE — Framework de módulos CRUD orientado a configuración
   Tabla + formulario + exportación + trazabilidad, reutilizable.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui;

  /* Barra de sub-pestañas para módulos con submódulos */
  const TAB_COLORS = ["#12b5a5", "#7a5cd0", "#e0912f", "#e0526f", "#1e9fe0", "#37a04a", "#0d6ea8", "#b8355a"];
  function tabsBar(portal, moduleKey, tabs, active) {
    return `<div class="tabs no-print">${tabs.map((t, i) => {
      const c = t.color || TAB_COLORS[i % TAB_COLORS.length];
      return `<a class="tab ${t.key === active ? "active" : ""}" style="--tab-c:${c}" href="#/${portal}/${moduleKey}?tab=${t.key}"><span class="tab__dot"></span>${ui().esc(t.label)}</a>`;
    }).join("")}</div>`;
  }

  /* Valor de celda según definición de columna.
     Blindado: si una celda falla, muestra "—" en vez de romper toda la tabla. */
  function cell(col, rec) {
    const u = ui();
    try {
      if (col.render) return col.render(rec, u);
      let v = rec[col.key];
      if (col.date) return `<span class="cell-date">${u.fechaCL(v)}</span>`;
      if (col.badge) return u.estadoBadge(v);
      if (v == null || v === "") return `<span class="muted">—</span>`;
      if (col.mono) return `<span class="mono">${u.esc(v)}</span>`;
      if (col.num) return u.esc(v);
      return u.esc(String(v).length > 120 ? String(v).slice(0, 120) + "…" : v);
    } catch (e) {
      return `<span class="muted" title="${u.esc(String((e && e.message) || e))}">—</span>`;
    }
  }

  /* ---------- Formato estándar de listados (como Gestión Documental) ----------
     · Columna principal en negrita con subtítulo «🏥 Unidad · Responsable».
     · Campos de selección (tipo, modalidad, pilar…) como chips de color.
     · Campos Sí/No como píldoras («✔ Sí» / «—»).
     Se aplica solo a columnas SIN render propio; cfg.plainFormat lo desactiva. */
  const META_KEYS = ["unidad", "unidadResponsable", "responsable", "jefatura", "encargado"];
  const CHIP_PALETTE = ["#1554b8", "#0f8f83", "#7a5cd0", "#c86a1f", "#e0526f", "#37a04a", "#0d6ea8", "#b8355a", "#8a44c9", "#0d8175"];
  function chipColor(v) {
    let h = 0; const t = String(v); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    return CHIP_PALETTE[h % CHIP_PALETTE.length];
  }
  function chipHTML(v, u) {
    const c = chipColor(v);
    return `<span class="tag tipo-chip res-chip" style="background:${c}1f;color:${c};border-color:${c}"><span class="tipo-chip__dot" style="background:${c}"></span>${u.esc(v)}</span>`;
  }
  function siNoHTML(v, u) {
    if (/^s[íi]$/i.test(String(v || "").trim())) return `<span class="badge badge--ok">✔ Sí</span>`;
    if (/^no$/i.test(String(v || "").trim())) return `<span class="badge badge--neutral">No</span>`;
    return `<span class="muted">—</span>`;
  }
  function layout(cfg) {
    if (cfg._layout) return cfg._layout;
    const L = { title: null, hidden: {}, chip: {}, sino: {} };
    if (cfg.plainFormat) return (cfg._layout = L);
    let fields = [];
    try { fields = (typeof cfg.fields === "function" ? cfg.fields(null) : cfg.fields) || []; } catch (e) { fields = []; }
    const fmap = {}; fields.forEach(f => { if (f && f.name) fmap[f.name] = f; });
    const plain = c => !c.render && !c.mono && !c.date && !c.badge && !c.num;
    cfg.columns.forEach(c => {
      if (!plain(c)) return;
      const f = fmap[c.key];
      if (f && f.type === "select" && Array.isArray(f.options)) {
        const opts = f.options.map(o => String(o && o.value != null ? o.value : o));
        if (opts.length <= 3 && opts.some(o => /^s[íi]$/i.test(o)) && opts.some(o => /^no$/i.test(o))) L.sino[c.key] = true;
        else if (META_KEYS.indexOf(c.key) < 0) L.chip[c.key] = true;
      }
    });
    const t = cfg.columns.find(c => plain(c) && !L.chip[c.key] && !L.sino[c.key] && META_KEYS.indexOf(c.key) < 0);
    // Solo si la columna principal está al inicio (entre las 3 primeras visibles).
    const visibles = cfg.columns.filter(c => !(plain(c) && META_KEYS.indexOf(c.key) >= 0));
    if (t && visibles.indexOf(t) <= 2) {
      L.title = t.key;
      L.meta = META_KEYS.filter(k => { const c = cfg.columns.find(x => x.key === k); return !c || plain(c); });
      cfg.columns.forEach(c => { if (plain(c) && META_KEYS.indexOf(c.key) >= 0) L.hidden[c.key] = true; });
    }
    return (cfg._layout = L);
  }
  function fmtCell(col, rec, L) {
    const u = ui();
    try {
      if (!col.render) {
        const v = rec[col.key];
        if (L.title === col.key) {
          const meta = L.meta.map(k => rec[k]).filter(x => x != null && String(x).trim() !== "");
          const uniq = meta.filter((x, i) => meta.indexOf(x) === i).map(x => u.esc(x)).join(" · ");
          const txt = (v == null || v === "") ? "—" : (String(v).length > 140 ? String(v).slice(0, 140) + "…" : v);
          return `<div class="res-title">${u.esc(txt)}</div>${uniq ? `<div class="res-sub">🏥 ${uniq}</div>` : ""}`;
        }
        if (L.sino[col.key]) return siNoHTML(v, u);
        if (L.chip[col.key]) return (v == null || v === "") ? `<span class="muted">—</span>` : chipHTML(v, u);
      }
    } catch (e) { /* cae al formato básico */ }
    return cell(col, rec);
  }


  /* ============================================================
     PANEL DE GESTIÓN (cfg.dash) — evolución y seguimiento sobre el listado.
     Usa SOLO los registros de la colección (con los filtros activos) y se
     actualiza solo al crear/editar/eliminar. Cada módulo elige sus gráficos:
       dash: { date, dateLabel, estado, unidad, tipo, tipoLabel, plazo, grupo(r),
               charts: ["mes","avance","estado","unidad","tipo","pendientes"],
               pendientes: [{ lab, fn }], avanceLab, intro }
     ============================================================ */
  const MES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const ymOf = v => { const m = String(v || "").match(/^(\d{4})-(\d{2})/); return m ? m[1] + "-" + m[2] : null; };
  const ymLabel = ym => { const [y, m] = ym.split("-"); return MES_C[Number(m) - 1] + " " + y.slice(2); };
  const ymLong = ym => { const [y, m] = ym.split("-"); return ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][Number(m) - 1] + " " + y; };
  function grupoDefault(estado) {
    const e = String(estado || "").toLowerCase();
    if (!e) return "nd";
    if (/finaliz|complet|cerrad|entreg|realizad|aprobad|vigente|ejecutad|cumplid|resuelt|publicad|hecho|terminad/.test(e)) return "fin";
    if (/pendien|program|borrador|no inici|por hacer|planific|abiert|nuev/.test(e)) return "pend";
    if (/suspend|cancel|obsolet|anulad/.test(e)) return "out";
    return "curso";
  }
  const G_COL = { fin: "#1f9d57", curso: "#1e7fd0", pend: "#e0912f", out: "#8a94a6", nd: "#b7c1cc" };
  const G_LAB = { fin: "Realizados", curso: "En ejecución", pend: "Pendientes", out: "Suspendidos / obsoletos", nd: "Sin estado" };
  const DASH_PAL = ["#0f8f83", "#1554b8", "#7a5cd0", "#c86a1f", "#e0526f", "#37a04a", "#0d6ea8", "#b8355a", "#8a44c9", "#5f7d76"];
  function hbarsHTML(items, total) {
    const u = ui();
    if (!items.length) return `<p class="dash-empty">Sin datos en el período.</p>`;
    const max = Math.max.apply(null, items.map(i => i.n).concat([1]));
    return `<div class="dash-hb">${items.map((i, k) => `<div class="dash-hb__r">
      <span class="dash-hb__l" title="${u.esc(i.l)}">${u.esc(i.l)}</span>
      <span class="dash-hb__t"><i style="width:${Math.max(3, i.n / max * 100)}%;background:${i.c || DASH_PAL[k % DASH_PAL.length]}"></i></span>
      <b>${i.n}${total ? `<small> ${Math.round(i.n / total * 100)}%</small>` : ""}</b></div>`).join("")}</div>`;
  }
  function contar(list, key, top) {
    const m = {};
    list.forEach(r => { const v = (typeof key === "function" ? key(r) : r[key]); const k = (v == null || String(v).trim() === "") ? "Sin dato" : String(v).trim(); m[k] = (m[k] || 0) + 1; });
    let arr = Object.keys(m).map(l => ({ l, n: m[l] })).sort((a, b) => b.n - a.n);
    if (top && arr.length > top) { const rest = arr.slice(top).reduce((a, x) => a + x.n, 0); arr = arr.slice(0, top).concat([{ l: "Otras (" + (arr.length - top) + ")", n: rest, c: "#b7c1cc" }]); }
    return arr;
  }
  const gLab = (D, g) => (D.labels && D.labels[g]) || G_LAB[g];
  function mesesHTML(all, D, grupo, perSel) {
    const u = ui();
    const dated = all.map(r => ({ r, ym: ymOf(typeof D.date === "function" ? D.date(r) : r[D.date]) })).filter(x => x.ym);
    if (!dated.length) return `<p class="dash-empty">Los registros no tienen fecha para mostrar la evolución.</p>`;
    const last = dated.map(x => x.ym).sort().pop();
    const [ly, lm] = last.split("-").map(Number);
    const months = []; for (let i = 11; i >= 0; i--) { const d = new Date(ly, lm - 1 - i, 1); months.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")); }
    const grupos = ["fin", "curso", "pend", "out", "nd"];
    const data = months.map(ym => { const o = { ym, t: 0 }; grupos.forEach(g => o[g] = 0);
      dated.filter(x => x.ym === ym).forEach(x => { const g = grupo(x.r); o[g] = (o[g] || 0) + 1; o.t++; }); return o; });
    const max = Math.max.apply(null, data.map(d => d.t).concat([1]));
    const used = grupos.filter(g => data.some(d => d[g]));
    const W = 560, H = 150, pl = 22, pb = 20, bw = (W - pl) / 12;
    const yv = v => (H - pb) - v / max * (H - pb - 14);
    const bars = data.map((d, i) => { let y0 = H - pb; const x = pl + i * bw + bw * .18, w = bw * .64;
      const segs = used.map(g => { if (!d[g]) return ""; const h = d[g] / max * (H - pb - 14); y0 -= h;
        return `<rect x="${x}" y="${y0}" width="${w}" height="${h}" fill="${G_COL[g]}" rx="2"><title>${ymLong(d.ym)} · ${gLab(D, g)}: ${d[g]}</title></rect>`; }).join("");
      const sel = perSel && d.ym.indexOf(perSel) === 0 ? `<rect x="${pl + i * bw + 1}" y="2" width="${bw - 2}" height="${H - pb}" fill="rgba(15,143,131,.08)" rx="4"/>` : "";
      return sel + segs + (d.t ? `<text x="${x + w / 2}" y="${yv(d.t) - 3}" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text-2,#40536f)">${d.t}</text>` : "")
        + `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle" font-size="9.5" fill="var(--text-muted,#6b7a90)">${ymLabel(d.ym)}</text>`; }).join("");
    const cur = data[11], prev = data[10];
    const dif = cur.t - prev.t;
    const cmp = `<span class="dash-cmp">${ymLong(cur.ym)}: <b>${cur.t}</b> · ${dif === 0 ? "igual que" : dif > 0 ? "▲ " + dif + " más que" : "▼ " + Math.abs(dif) + " menos que"} ${ymLong(prev.ym)}</span>`;
    return `<svg viewBox="0 0 ${W} ${H}" class="dash-svg" role="img" aria-label="Evolución mensual">${bars}</svg>
      <div class="dash-leg">${used.map(g => `<span><i style="background:${G_COL[g]}"></i>${gLab(D, g)}</span>`).join("")}${cmp}</div>`;
  }
  function avanceHTML(list, D, grupo) {
    const n = list.length;
    const c = { fin: 0, curso: 0, pend: 0, out: 0, nd: 0 }; list.forEach(r => c[grupo(r)]++);
    const base = n - c.out;
    const pct = base > 0 ? Math.round(c.fin / base * 100) : null;
    let venc = 0;
    if (D.plazo) { const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      venc = list.filter(r => grupo(r) !== "fin" && grupo(r) !== "out" && r[D.plazo] && new Date(r[D.plazo]) < hoy).length; }
    const R = 34, C = 2 * Math.PI * R, off = pct == null ? C : C * (1 - pct / 100);
    const col = pct == null ? "#b7c1cc" : pct >= 75 ? "#1f9d57" : pct >= 50 ? "#e0912f" : "#c62f3b";
    const row = (g, v) => v ? `<div class="dash-av__r"><i style="background:${G_COL[g]}"></i>${gLab(D, g)}<b>${v}</b></div>` : "";
    return `<div class="dash-av">
      <svg viewBox="0 0 84 84" class="dash-ring"><circle cx="42" cy="42" r="${R}" fill="none" stroke="var(--surface-2,#eef3f1)" stroke-width="9"/>
        <circle cx="42" cy="42" r="${R}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 42 42)"/>
        <text x="42" y="46" text-anchor="middle" font-size="16" font-weight="800" fill="${col}">${pct == null ? "—" : pct + "%"}</text></svg>
      <div class="dash-av__l">
        ${row("fin", c.fin)}${row("curso", c.curso)}${row("pend", c.pend)}${row("out", c.out)}${row("nd", c.nd)}
        ${D.plazo ? `<div class="dash-av__r ${venc ? "is-late" : ""}"><i style="background:${venc ? "#c62f3b" : "#1f9d57"}"></i>Con plazo vencido<b>${venc}</b></div>` : ""}</div></div>`;
  }
  function analisisDash(list, all, D, grupo, perSel) {
    const n = list.length; if (!n) return "";
    const partes = [];
    const fin = list.filter(r => grupo(r) === "fin").length, out = list.filter(r => grupo(r) === "out").length;
    if (D.charts.indexOf("avance") >= 0 && n - out > 0) partes.push(`${Math.round(fin / (n - out) * 100)}% ${(D.finLab || "realizados")} (${fin} de ${n - out})`);
    if (D.plazo) { const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const v = list.filter(r => grupo(r) !== "fin" && grupo(r) !== "out" && r[D.plazo] && new Date(r[D.plazo]) < hoy).length;
      if (v) partes.push(`${v} con plazo vencido`); }
    if (D.unidad) { const top = contar(list, D.unidad).filter(x => x.l !== "Sin dato")[0]; if (top && top.n > 1) partes.push(`la unidad con más registros es ${top.l} (${top.n})`); }
    if (D.tipo) { const top = contar(list, D.tipo).filter(x => x.l !== "Sin dato")[0]; if (top) partes.push(`predomina «${top.l}» (${Math.round(top.n / n * 100)}%)`); }
    (D.pendientes || []).forEach(p => { const k = list.filter(p.fn).length; if (k) partes.push(`${k} ${p.lab.charAt(0).toLowerCase() + p.lab.slice(1)}`); });
    if (!partes.length) return "";
    return `<div class="dash-ana">🔎 <b>Análisis:</b> ${perSel ? "En " + (perSel.length === 4 ? perSel : ymLong(perSel)) + ", " : "Del total registrado, "}${partes.join("; ")}.</div>`;
  }
  function dashHTML(list, all, D, perSel) {
    const u = ui();
    const grupo = D.grupo || (r => grupoDefault(D.estado ? r[D.estado] : r.estado));
    const panels = [];
    D.charts.forEach(ch => {
      if (ch === "mes" && D.date) panels.push({ w: 2, t: "📈 Evolución mensual", s: D.dateLabel ? "Según " + D.dateLabel + " · últimos 12 meses" : "Últimos 12 meses", h: mesesHTML(all, D, grupo, perSel) });
      if (ch === "avance") panels.push({ w: 1, t: "🎯 " + (D.avanceTitle || "Avance"), s: (D.labels && D.labels.fin ? D.labels.fin : "Realizados") + " / total (sin " + ((D.labels && D.labels.out) || "suspendidos").toLowerCase() + ")", h: avanceHTML(list, D, grupo) });
      if (ch === "estado" && D.estado) panels.push({ w: 1, t: "🏷️ Por estado", s: list.length + " registro(s)", h: hbarsHTML(contar(list, D.estado).map(x => Object.assign(x, { c: G_COL[grupoDefault(x.l)] })), list.length) });
      if (ch === "unidad" && D.unidad) panels.push({ w: 1, t: "🏥 Por unidad clínica", s: "Principales unidades", h: hbarsHTML(contar(list, D.unidad, 6), list.length) });
      if (ch === "tipo" && D.tipo) panels.push({ w: 1, t: "🧩 Por " + (D.tipoLabel || "tipo"), s: "Distribución", h: hbarsHTML(contar(list, D.tipo, 6), list.length) });
      if (ch === "pendientes" && D.pendientes) panels.push({ w: 1, t: "⏳ " + (D.pendTitle || "Pendientes"), s: "Requieren gestión", h: `<div class="dash-pend">${D.pendientes.map(p => { const k = list.filter(p.fn).length;
        return `<div class="dash-pend__r ${k ? "is-on" : ""}"><b>${k}</b><span>${u.esc(p.lab)}</span></div>`; }).join("")}</div>` });
    });
    if (!panels.length) return "";
    return `<div class="dash-grid">${panels.map(p => `<div class="dash-card ${p.w === 2 ? "dash-card--w2" : ""}">
        <div class="dash-card__h"><h4>${p.t}</h4><span>${u.esc(p.s)}</span></div>${p.h}</div>`).join("")}</div>
      ${analisisDash(list, all, D, grupo, perSel)}`;
  }
  function secHead(ico, t, sub) {
    return `<div class="mod-sec"><h3>${ico} ${ui().esc(t)}</h3>${sub ? `<p>${ui().esc(sub)}</p>` : ""}</div>`;
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
    const state = { q: "", f: {}, per: "" };
    const D = cfg.dash ? Object.assign({ charts: ["mes", "avance"] }, cfg.dash) : null;
    const dateOf = r => D && D.date ? (typeof D.date === "function" ? D.date(r) : r[D.date]) : null;

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
      if (state.per) list = list.filter(r => String(dateOf(r) || "").indexOf(state.per) === 0);
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
          ${D && D.date ? (() => { const yms = [...new Set(base.map(r => ymOf(dateOf(r))).filter(Boolean))].sort().reverse();
            const ys = [...new Set(yms.map(x => x.slice(0, 4)))];
            return yms.length ? `<select class="select res-filter" id="res-per" aria-label="Período"><option value="">Período: todos</option>
              ${ys.map(y => `<optgroup label="${y}"><option value="${y}">Año ${y} completo</option>${yms.filter(m => m.indexOf(y) === 0).map(m => `<option value="${m}">${ymLong(m)}</option>`).join("")}</optgroup>`).join("")}</select>` : ""; })() : ""}
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
      container.innerHTML = (D && base.length ? secHead("📊", D.title || "Evolución y seguimiento", D.intro || "Se actualiza automáticamente con los registros y los filtros del listado.") + `<div id="res-dash"></div>`
          + secHead("📋", cfg.listTitle || "Listado de registros", "") : "")
        + toolbar + tools + `<div class="res-body" id="res-body"></div>`;
      bindToolbar();
      bindTools();
      renderBody();
    }

    function paintDash() {
      const el = container.querySelector("#res-dash"); if (!el || !D) return;
      // Evolución mensual: todos los registros con los filtros de estado/unidad/búsqueda, sin el filtro de período.
      const per = state.per; state.per = ""; const sinPer = records(); state.per = per;
      try { el.innerHTML = dashHTML(records(), sinPer, D, state.per); } catch (e) { el.innerHTML = ""; }
    }
    function renderBody() {
      paintDash();
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
      const L = layout(cfg);
      const cols = cfg.columns.filter(c => !L.hidden[c.key]);
      const rowHTML = rec => {
        try {
          return `<tr data-id="${rec.id}">
            ${cols.map(c => `<td class="${c.num ? "num" : ""}${c.center || L.sino[c.key] ? " res-center" : ""}${c.mono ? " res-code" : ""}${c.date ? " res-date" : ""}">${fmtCell(c, rec, L)}</td>`).join("")}
            <td class="acciones"><div class="btn-row" style="justify-content:flex-end">
              ${(cfg.rowActions || []).map((a, i) =>
                (!a.show || a.show(rec)) ? `<button class="${a.label ? "btn btn--primary btn--sm res-act" : "btn-icon"}" data-act="${i}" data-id="${rec.id}" title="${u.esc(a.title)}">${a.ico}${a.label ? ` ${u.esc(a.label)}` : ""}</button>` : "").join("")}
              ${canEdit ? `<button class="btn-icon" data-edit="${rec.id}" title="Editar">✏️</button>` : ""}
              ${canEdit && (!cfg.canDelete || cfg.canDelete(rec)) ? `<button class="btn-icon" data-del="${rec.id}" title="Eliminar">🗑️</button>` : ""}
              ${cfg.detail ? `<button class="btn-icon" data-detail="${rec.id}" title="Ver detalle">👁️</button>` : ""}
            </div></td></tr>`;
        } catch (e) {
          return `<tr data-id="${rec.id}"><td colspan="${cols.length + 1}" class="muted">⚠️ No se pudo mostrar este registro
            <button class="btn-icon" data-edit="${rec.id}" title="Editar">✏️</button>
            <button class="btn-icon" data-del="${rec.id}" title="Eliminar">🗑️</button></td></tr>`;
        }
      };
      bodyEl.innerHTML = `<div class="table-wrap"><table class="tbl"><thead><tr>
        ${cols.map(c => `<th scope="col" class="${c.center || L.sino[c.key] ? "res-center" : ""}" ${c.width ? `style="width:${c.width}"` : ""}>${u.esc(c.label)}</th>`).join("")}
        <th scope="col" class="right">Acciones</th></tr></thead><tbody>
        ${list.map(rowHTML).join("")}
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
      const ps = container.querySelector("#res-per");
      if (ps) { ps.value = state.per; ps.onchange = () => { state.per = ps.value; renderBody(); }; }
      container.querySelectorAll(".res-filter[data-fkey]").forEach(sel => {
        sel.value = state.f[sel.dataset.fkey] || "";
        sel.onchange = () => { state.f[sel.dataset.fkey] = sel.value; renderBody(); };
      });
    }
    function bindBody() {
      container.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => form(S().get(cfg.collection, b.dataset.edit)));
      container.querySelectorAll("[data-del]").forEach(b => b.onclick = () =>
        u.confirmDelete(cfg.deleteMsg || "¿Deseas eliminar este registro? Esta acción no se puede deshacer.",
          () => { S().remove(cfg.collection, b.dataset.del); render(); if (cfg.afterChange) cfg.afterChange(); }));
      container.querySelectorAll("[data-detail]").forEach(b => b.onclick = () => cfg.detail(S().get(cfg.collection, b.dataset.detail), renderBody));
      (cfg.rowActions || []).forEach((a, i) => {
        container.querySelectorAll(`[data-act="${i}"]`).forEach(b => b.onclick = () => a.fn(S().get(cfg.collection, b.dataset.id), render));
      });
    }

    // prefill (opcional): valores iniciales para un registro NUEVO (no edita nada existente)
    function form(rec, prefill) {
      const fields = typeof cfg.fields === "function" ? cfg.fields(rec) : cfg.fields;
      const values = rec || Object.assign({}, (typeof cfg.defaults === "function" ? cfg.defaults() : cfg.defaults) || {}, prefill || {});
      u.modal({
        title: (rec ? "Editar · " : "Nuevo · ") + (cfg.title || ""),
        wide: cfg.wideForm,
        body: (cfg.formIntro ? `<p class="card__hint">${u.esc(cfg.formIntro)}</p>` : "") + u.formHTML(fields, values),
        footer: `<button class="btn btn--ghost" data-close>Cancelar</button>
                 <button class="btn btn--primary" data-save>Guardar</button>`,
        onMount(m) {
          if (cfg.onFormMount) cfg.onFormMount(m, rec, prefill);
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
            if (cfg.afterChange) cfg.afterChange();
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
  U.components.resource = { mount, tabsBar, trazabilidad, secHead };
})();
