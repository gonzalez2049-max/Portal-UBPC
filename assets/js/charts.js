/* ============================================================
   CHARTS — Gráficos SVG autónomos (sin librerías externas)
   Con títulos, etiquetas, porcentajes y leyendas legibles.
   ============================================================ */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Gauge de cumplimiento (dona con % centrado) */
  function gauge(percent, opts) {
    opts = opts || {};
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const size = opts.size || 150, r = size / 2 - 14, cx = size / 2, cy = size / 2;
    const circ = 2 * Math.PI * r;
    const meta = opts.meta;
    const color = p >= (meta || 0) ? "var(--verde)" : (p >= (meta || 0) - 15 ? "var(--naranjo)" : "var(--danger)");
    const off = circ * (1 - p / 100);
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Cumplimiento ${p}%">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--chart-track,#e6edf6)" stroke-width="14"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"
        stroke-dasharray="${circ}" stroke-dashoffset="${off}" transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="30" font-weight="800" fill="var(--text)">${p}%</text>
      <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="12" fill="var(--text-muted)">${esc(opts.label || "Cumplimiento")}</text>
    </svg>`;
  }

  /* Gráfico de línea temporal (un indicador por serie; incluye meta) */
  function lineChart(cfg) {
    // cfg: { width, height, labels:[], series:[{name,color,values:[]}], meta, metaLabel, yUnit:"%" }
    const w = cfg.width || 880, h = cfg.height || 220;
    const padL = 46, padR = 30, padT = 22, padB = 40;
    const iw = w - padL - padR, ih = h - padT - padB;
    const labels = cfg.labels || [];
    const suffix = cfg.valueSuffix != null ? cfg.valueSuffix : "%";
    const minY = 0, maxY = cfg.maxY || 100; // por defecto 0–100 (porcentajes); cfg.maxY para conteos
    const x = i => padL + (labels.length <= 1 ? iw / 2 : (iw * i) / (labels.length - 1));
    const y = v => padT + ih - (ih * (v - minY)) / (maxY - minY);

    const grid = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxY * f)).map(v =>
      `<line x1="${padL}" y1="${y(v)}" x2="${w - padR}" y2="${y(v)}" stroke="var(--chart-grid,#eef2f8)"/>
       <text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--text-muted)">${v}</text>`).join("");

    const xlabels = labels.map((l, i) =>
      `<text x="${x(i)}" y="${h - 14}" text-anchor="middle" font-size="11" fill="var(--text-2)">${esc(l)}</text>`).join("");

    let metaLine = "";
    if (cfg.meta != null) {
      metaLine = `<line x1="${padL}" y1="${y(cfg.meta)}" x2="${w - padR}" y2="${y(cfg.meta)}"
        stroke="var(--morado)" stroke-width="2" stroke-dasharray="6 4"/>
        <text x="${w - padR}" y="${y(cfg.meta) - 6}" text-anchor="end" font-size="11" font-weight="700" fill="var(--morado)" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round">Meta ${cfg.meta}%</text>`;
    }

    const showVals = cfg.hideValues !== true;
    const paths = (cfg.series || []).map(s => {
      // Puntos válidos (omite null/NaN) → permite superponer series con distintos períodos
      const valid = s.values.map((v, i) => ({ v, i })).filter(o => o.v != null && !isNaN(o.v));
      const pts = valid.map(o => `${x(o.i)},${y(o.v)}`).join(" ");
      const dots = valid.map((o, k) => {
        const first = k === 0, lastp = k === valid.length - 1;
        const anchor = first ? "start" : (lastp ? "end" : "middle");
        const dx = first ? 5 : (lastp ? -5 : 0);
        // Si el valor está cerca de la meta, la etiqueta va DEBAJO del punto
        // para no chocar con la línea/etiqueta de meta.
        const near = cfg.meta != null && Math.abs(o.v - cfg.meta) < 12;
        const ly = near ? y(o.v) + 17 : y(o.v) - 9;
        return `<circle cx="${x(o.i)}" cy="${y(o.v)}" r="4" fill="${s.color}"/>${showVals
          ? `<text x="${x(o.i) + dx}" y="${ly}" text-anchor="${anchor}" font-size="11" font-weight="700" fill="${s.color}" paint-order="stroke" stroke="#fff" stroke-width="3.5" stroke-linejoin="round">${o.v}${suffix}</text>` : ""}`;
      }).join("");
      return `<polyline fill="none" stroke="${s.color}" stroke-width="3" points="${pts}"/>${dots}`;
    }).join("");

    const legend = `<div class="chart-legend">
      ${(cfg.series || []).map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("")}
      ${cfg.meta != null ? `<span><i style="background:var(--morado)"></i>Meta institucional</span>` : ""}
    </div>`;

    return `<div class="chart-wrap" style="width:100%">
      <svg viewBox="0 0 ${w} ${h}" width="100%" style="height:auto;display:block;max-width:1280px;margin:0 auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Tendencia de cumplimiento">
        ${grid}${metaLine}${paths}${xlabels}
      </svg></div>${legend}`;
  }

  /* Barras horizontales (comparación por guía / unidad) */
  function bars(items, opts) {
    opts = opts || {};
    const meta = opts.meta;
    if (!items || !items.length) return "";
    return `<div class="bars">` + items.map(it => {
      const v = Math.max(0, Math.min(100, it.value || 0));
      const color = meta != null ? (v >= meta ? "var(--verde)" : v >= meta - 15 ? "var(--naranjo)" : "var(--danger)") : "var(--celeste)";
      return `<div style="margin-bottom:.55rem">
        <div class="flex" style="justify-content:space-between;font-size:13px;font-weight:600">
          <span>${esc(it.label)}</span><span>${v}%</span>
        </div>
        <div style="background:var(--chart-track,#e9eff7);border-radius:6px;height:12px;overflow:hidden">
          <div style="width:${v}%;height:100%;background:${color};border-radius:6px"></div>
        </div>
      </div>`;
    }).join("") + `</div>`;
  }

  /* Sparkline limpio (mini tendencia, sin ejes) */
  function sparkline(values, opts) {
    opts = opts || {};
    if (!values || !values.length) return "";
    const w = 280, h = 42, pad = 5;
    const extra = opts.meta != null ? [opts.meta] : [];
    const mn = Math.min.apply(0, values.concat(extra)), mx = Math.max.apply(0, values.concat(extra)), rng = (mx - mn) || 1;
    const x = i => pad + (values.length <= 1 ? (w - 2 * pad) / 2 : (w - 2 * pad) * i / (values.length - 1));
    const y = v => h - pad - ((v - mn) / rng) * (h - 2 * pad);
    const pts = values.map((v, i) => [x(i), y(v)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = line + ` L${x(values.length - 1).toFixed(1)} ${h - pad} L${x(0).toFixed(1)} ${h - pad} Z`;
    const col = opts.color || "var(--c-celeste)";
    const last = pts[pts.length - 1];
    const id = "sp" + Math.random().toString(36).slice(2, 7);
    const metaLine = opts.meta != null
      ? `<line x1="${pad}" y1="${y(opts.meta).toFixed(1)}" x2="${w - pad}" y2="${y(opts.meta).toFixed(1)}" stroke="var(--morado)" stroke-width="1.3" stroke-dasharray="4 3" opacity=".6"/>` : "";
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Tendencia" style="display:block">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".26"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      ${metaLine}<path d="${area}" fill="url(#${id})"/>
      <path d="${line}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3.2" fill="${col}"/></svg>`;
  }

  /* Bloom: anillos concéntricos (global + hasta 3 segmentos) */
  function bloomRings(segs, opts) {
    opts = opts || {};
    const track = opts.track || "rgba(9,70,63,.16)";
    const radii = opts.radii || [52, 41, 30];
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    const rings = (segs || []).slice(0, 3).map((s, i) => {
      const r = radii[i], c = 2 * Math.PI * r, off = c * (1 - (Number(s.pct) || 0) / 100);
      const start = reduce ? off.toFixed(1) : c.toFixed(1);
      const anim = reduce ? "" : `<animate attributeName="stroke-dashoffset" from="${c.toFixed(1)}" to="${off.toFixed(1)}"
          dur="1.1s" begin="${(0.15 + i * 0.12).toFixed(2)}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.22 0.7 0.3 1"/>`;
      return `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${track}" stroke-width="7"/>
        <circle cx="60" cy="60" r="${r}" fill="none" stroke="${s.color}" stroke-width="7" stroke-linecap="round"
          stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${start}" transform="rotate(-90 60 60)">${anim}</circle>`;
    }).join("");
    return `<svg viewBox="0 0 120 120" width="100%" role="img" aria-label="Cumplimiento por guía">
      ${rings}<circle cx="60" cy="60" r="23" fill="${opts.disc || "rgba(9,70,63,.28)"}"/></svg>`;
  }

  window.UBPC = window.UBPC || {};
  window.UBPC.charts = { gauge, lineChart, bars, bloomRings, sparkline };
})();
