/* ============================================================
   MÓDULO — INDICADORES UBPC (estructura · proceso · resultado · impacto)
   Ficha adaptable por tipo; semáforo, cumplimiento, gráficos, tendencia y
   alertas automáticas. EVI recomienda indicadores desde los datos del portal.
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store, ui = () => U.ui, CS = () => U.coordStats;

  const TIPOS = ["Estructura", "Proceso", "Resultado", "Impacto"];
  const PERIODICIDAD = ["Mensual", "Bimensual", "Trimestral", "Semestral", "Anual"];
  const SENTIDOS = ["Mayor es mejor", "Menor es mejor"];
  const TIPO_COLOR = { Estructura: "#7a5cd0", Proceso: "#1e9fe0", Resultado: "#12b5a5", Impacto: "#e0912f" };
  const SEM = {
    verde: { k: "ok", l: "En meta", c: "var(--verde)" },
    amarillo: { k: "warn", l: "En seguimiento", c: "var(--naranjo)" },
    rojo: { k: "danger", l: "Intervención", c: "var(--danger)" },
    sd: { k: "neutral", l: "Sin datos", c: "var(--neutral)" }
  };

  /* ---------- Cálculos ---------- */
  function currentValue(ind) {
    const seg = (ind.seguimientos || []).filter(s => s.valor !== "" && s.valor != null);
    if (seg.length) return Number(seg[seg.length - 1].valor);
    const den = Number(ind.denominador);
    if (den > 0) return Math.round(Number(ind.numerador) / den * 100);
    if (ind.lineaBase !== "" && ind.lineaBase != null) return Number(ind.lineaBase);
    return null;
  }
  function menorMejor(ind) { return ind.sentido === "Menor es mejor"; }
  function semaforo(ind) {
    const cur = currentValue(ind); if (cur == null || ind.meta === "" || ind.meta == null) return "sd";
    const meta = Number(ind.meta);
    if (menorMejor(ind)) return cur <= meta ? "verde" : (cur <= meta + 15 ? "amarillo" : "rojo");
    return cur >= meta ? "verde" : (cur >= meta - 15 ? "amarillo" : "rojo");
  }
  function cumplimiento(ind) {
    const cur = currentValue(ind); const meta = Number(ind.meta);
    if (cur == null || !meta) return null;
    return Math.min(100, Math.round(menorMejor(ind) ? (cur > 0 ? meta / cur * 100 : 100) : cur / meta * 100));
  }
  function serie(ind) {
    const pts = [];
    if (ind.lineaBase !== "" && ind.lineaBase != null) pts.push({ periodo: "Línea base", valor: Number(ind.lineaBase) });
    (ind.seguimientos || []).forEach(s => { if (s.valor !== "" && s.valor != null) pts.push({ periodo: s.periodo || "", valor: Number(s.valor) }); });
    return pts;
  }
  function tendencia(ind) {
    const s = serie(ind); if (s.length < 2) return { arrow: "→", txt: "Sin tendencia", fav: null };
    const d = s[s.length - 1].valor - s[s.length - 2].valor;
    if (d === 0) return { arrow: "→", txt: "Estable", fav: null };
    const up = d > 0; const fav = menorMejor(ind) ? !up : up;
    return { arrow: up ? "▲" : "▼", txt: (up ? "+" : "") + d + " pts", fav };
  }

  /* ============================================================
     ÍNDICE DE CAPACIDAD OPERATIVA UBPC — cálculo mensual y semáforo
     Fórmula: demanda técnica mensual ÷ horas profesionales disponibles × 100
     Semáforo: ≤85 suficiente · 86–100 tensionada · >100 superada
     ============================================================ */
  const MESES_ICO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function icoPeriodoLabel(p) {
    const m = String(p || "").match(/^(\d{4})-(\d{2})/);
    return m ? MESES_ICO[Number(m[2]) - 1] + " " + m[1] : (p || "—");
  }
  function icoIndex(rec) {
    const h = Number(rec && rec.horas);
    const d = Number(rec && rec.demanda);
    if (!h || isNaN(d)) return null;
    return Math.round(d / h * 100);
  }
  function icoEstado(pct) {
    if (pct == null) return { k: "neutral", l: "Sin datos", c: "var(--neutral)" };
    if (pct <= 85) return { k: "ok", l: "Capacidad suficiente", c: "var(--verde)" };
    if (pct <= 100) return { k: "warn", l: "Capacidad tensionada", c: "var(--naranjo)" };
    return { k: "danger", l: "Capacidad superada", c: "var(--danger)" };
  }
  function icoOrdenados() {
    return S().all("capacidadOperativa").slice().sort((a, b) => String(a.periodo || "").localeCompare(String(b.periodo || "")));
  }

  function icoForm(rec) {
    const u = ui(); rec = rec || {};
    const hoy = new Date();
    const mesActual = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");
    u.modal({
      title: (rec.id ? "Editar" : "Registrar") + " mes · Capacidad Operativa",
      body: `<p class="card__hint">Índice = demanda técnica mensual ÷ horas profesionales disponibles × 100. Se calcula y clasifica automáticamente.</p>
        ${u.formHTML([
          { name: "periodo", label: "Mes", type: "month", required: true, value: rec.periodo || mesActual },
          { name: "demanda", label: "Demanda técnica mensual (horas)", type: "number", required: true, value: rec.demanda != null ? rec.demanda : "", hint: "Horas requeridas por la demanda técnica del período." },
          { name: "horas", label: "Horas profesionales disponibles (horas)", type: "number", required: true, value: rec.horas != null ? rec.horas : "", hint: "Horas del Coordinador UBPC disponibles en el mes." },
          { name: "nota", label: "Observación (opcional)", type: "textarea", full: true, value: rec.nota || "" }
        ], {})}
        <div id="ico-preview" class="ico-preview"></div>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar mes</button>`,
      onMount(m) {
        const prev = m.querySelector("#ico-preview");
        const dI = m.querySelector('input[name="demanda"]'), hI = m.querySelector('input[name="horas"]');
        function paint() {
          const pct = icoIndex({ demanda: dI.value, horas: hI.value });
          if (pct == null) { prev.innerHTML = `<span class="kpi__sub">Ingresa demanda y horas para ver el índice.</span>`; return; }
          const e = icoEstado(pct);
          prev.innerHTML = `<div class="ico-preview__row"><span>Índice calculado</span>
            <b style="color:${e.c}">${pct}%</b><span class="badge badge--${e.k}">${e.l}</span></div>`;
        }
        dI.addEventListener("input", paint); hI.addEventListener("input", paint); paint();
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (!d.periodo) { u.toast("Indica el mes", "danger"); return; }
          if (d.demanda === "" || d.horas === "") { u.toast("Ingresa demanda y horas", "danger"); return; }
          if (Number(d.horas) <= 0) { u.toast("Las horas disponibles deben ser mayores a 0", "danger"); return; }
          const dup = S().all("capacidadOperativa").find(x => x.periodo === d.periodo && x.id !== rec.id);
          if (dup) { u.toast("Ya existe un registro para ese mes. Edítalo en su lugar.", "danger"); return; }
          d.demanda = Number(d.demanda); d.horas = Number(d.horas);
          if (rec.id) S().update("capacidadOperativa", rec.id, d); else S().insert("capacidadOperativa", d);
          u.closeModal(); u.toast("Registro guardado", "ok"); renderICO();
        };
      }
    });
  }

  function renderICO() {
    const u = ui();
    const box = document.getElementById("ico-data");
    if (!box) return;
    const recs = icoOrdenados();
    const addBtn = `<button class="btn btn--primary btn--sm" id="ico-add">+ Registrar mes</button>`;
    if (!recs.length) {
      box.innerHTML = `<div class="ico-data__head"><h4>Seguimiento mensual</h4>${addBtn}</div>
        ${u.empty("Aún sin registros mensuales.", "Ingresa el primer mes (demanda técnica y horas disponibles) para calcular el índice.", "🗓️")}`;
      const b = document.getElementById("ico-add"); if (b) b.onclick = () => icoForm(null);
      return;
    }
    const last = recs[recs.length - 1], prev = recs[recs.length - 2];
    const lp = icoIndex(last), pp = prev ? icoIndex(prev) : null;
    const est = icoEstado(lp);
    let vari = "";
    if (lp != null && pp != null) {
      const dd = lp - pp; // menor es mejor
      vari = dd < 0 ? `<span class="ico-var ico-var--good">↘ ${dd} pts · mejora la holgura</span>`
        : dd > 0 ? `<span class="ico-var ico-var--bad">↗ +${dd} pts · más tensión</span>`
        : `<span class="ico-var">→ se mantiene</span>`;
    }
    const labels = recs.map(r => icoPeriodoLabel(r.periodo));
    const values = recs.map(r => icoIndex(r));
    const chart = recs.length > 1
      ? U.charts.lineChart({ labels, series: [{ name: "Índice de Capacidad Operativa", color: est.c, values }], meta: 100 })
      : `<p class="kpi__sub">Registra al menos dos meses para ver la tendencia.</p>`;

    const rows = recs.slice().reverse().map(r => {
      const pct = icoIndex(r), e = icoEstado(pct);
      return `<tr>
        <td><strong>${u.esc(icoPeriodoLabel(r.periodo))}</strong></td>
        <td class="right">${r.demanda != null ? u.esc(r.demanda) : "—"}</td>
        <td class="right">${r.horas != null ? u.esc(r.horas) : "—"}</td>
        <td class="right" style="font-weight:800;color:${e.c}">${pct == null ? "—" : pct + "%"}</td>
        <td><span class="badge badge--${e.k}">${e.l}</span></td>
        <td class="acciones"><div class="btn-row">
          <button class="btn-icon" data-icoedit="${r.id}" title="Editar">✏️</button>
          <button class="btn-icon" data-icodel="${r.id}" title="Eliminar">🗑️</button></div></td></tr>`;
    }).join("");

    box.innerHTML = `<div class="ico-data__head"><h4>Seguimiento mensual</h4>${addBtn}</div>
      <div class="ico-now ico-now--${est.k}">
        <div class="ico-now__val">${lp == null ? "—" : lp + "%"}</div>
        <div class="ico-now__meta">
          <span class="badge badge--${est.k}">${est.l}</span>
          <div class="kpi__sub">${u.esc(icoPeriodoLabel(last.periodo))} · demanda ${u.esc(last.demanda)} h ÷ disponibles ${u.esc(last.horas)} h</div>
          ${vari}
        </div>
      </div>
      <div style="margin:.6rem 0">${chart}</div>
      <div class="table-wrap"><table class="tbl"><thead><tr>
        <th>Mes</th><th class="right">Demanda (h)</th><th class="right">Horas disp. (h)</th><th class="right">Índice</th><th>Estado</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;

    document.getElementById("ico-add").onclick = () => icoForm(null);
    box.querySelectorAll("[data-icoedit]").forEach(b => b.onclick = () => icoForm(S().get("capacidadOperativa", b.dataset.icoedit)));
    box.querySelectorAll("[data-icodel]").forEach(b => b.onclick = () =>
      u.confirmDelete("¿Eliminar este registro mensual?", () => { S().remove("capacidadOperativa", b.dataset.icodel); renderICO(); }));
  }

  /* ---------- Ficha técnica destacada: Índice de Capacidad Operativa UBPC ---------- */
  function fichaCapacidadOperativa() {
    const acc = TIPO_COLOR.Estructura; // morado (indicador de estructura)
    const clase = [
      ["Tipo", "Estructura"],
      ["Dimensión", "Capacidad operativa"],
      ["Subdimensión", "Disponibilidad de recurso humano"],
      ["Periodicidad", "Mensual"],
      ["Responsable", "Coordinador UBPC"]
    ];
    const bandas = [
      ["ok", "≤ 85%", "Capacidad suficiente"],
      ["warn", "86 – 100%", "Capacidad tensionada"],
      ["danger", "> 100%", "Capacidad superada"]
    ];
    return `<section class="section">
      <div class="section__head"><h2 class="section__title">Ficha técnica destacada</h2></div>
      <div class="card ico-ficha" style="--acc:${acc}">
        <div class="ico-ficha__head">
          <span class="ico-ficha__badge">Estructura</span>
          <div class="ico-ficha__id">
            <span class="ico-ficha__eb">Indicador UBPC</span>
            <h3 class="ico-ficha__title">Índice de Capacidad Operativa UBPC</h3>
          </div>
          <span class="ico-ficha__soon ico-ficha__soon--live">🗓️ Actualización mensual</span>
        </div>

        <div class="ico-class">
          ${clase.map(c => `<div class="ico-cl"><span>${c[0]}</span><b>${c[1]}</b></div>`).join("")}
        </div>

        <div class="ico-grid">
          <div class="ico-block">
            <span class="ico-lbl">Objetivo</span>
            <p class="narrativo" style="margin:.2rem 0 0">Determinar si las horas profesionales disponibles del Coordinador UBPC son suficientes para responder a la demanda técnica y fundamentar la necesidad de un/a enfermero/a referente.</p>
          </div>
          <div class="ico-block">
            <span class="ico-lbl">Fórmula</span>
            <div class="ico-formula">
              <div class="ico-frac">
                <span class="ico-frac__num">Demanda técnica mensual</span>
                <span class="ico-frac__bar"></span>
                <span class="ico-frac__den">Horas profesionales disponibles</span>
              </div>
              <span class="ico-frac__x">× 100</span>
            </div>
          </div>
        </div>

        <div class="ico-block">
          <span class="ico-lbl">Semáforo</span>
          <div class="ico-sem">
            ${bandas.map(b => `<div class="ico-sem__band ico-sem__band--${b[0]}">
              <b>${b[1]}</b><span>${b[2]}</span></div>`).join("")}
          </div>
          <p class="kpi__sub" style="margin:.5rem 0 0">A menor índice, mayor holgura: un valor sobre 100% indica que la demanda técnica supera las horas profesionales disponibles.</p>
        </div>

        <div id="ico-data" class="ico-data"></div>
      </div>
    </section>`;
  }

  /* ---------- Vista ---------- */
  function indicadores() {
    return `<div class="page-head"><h1>Indicadores UBPC</h1>
      <p>Gestión de indicadores de estructura, proceso, resultado e impacto, con semáforo, cumplimiento, tendencias y alertas.</p></div>
      <div id="ind-kpi"></div>
      <div id="ind-evi"></div>
      ${fichaCapacidadOperativa()}
      <div class="section__head"><h2 class="section__title">Indicadores registrados</h2>
        <button class="btn btn--primary btn--sm" id="ind-new">+ Nuevo indicador</button></div>
      <div id="ind-list"></div>`;
  }

  function refresh() {
    const u = ui();
    const list = S().all("indicadores");
    const by = k => list.filter(i => semaforo(i) === k).length;
    document.getElementById("ind-kpi").innerHTML = `<div class="grid grid--kpi" style="margin-bottom:1.1rem">
      ${kpi("Indicadores", list.length, "Registrados en total", "info", "📏")}
      ${kpi("En meta", by("verde"), "Semáforo verde", "ok", "🟢")}
      ${kpi("En seguimiento", by("amarillo"), "Semáforo amarillo", "warn", "🟡")}
      ${kpi("En intervención", by("rojo"), "Semáforo rojo", "danger", "🔴")}</div>`;

    renderEvi();
    renderICO();

    const box = document.getElementById("ind-list");
    if (!list.length) { box.innerHTML = u.empty("Aún no hay indicadores registrados.", "Crea uno o usa las recomendaciones de EVI.", "📏"); }
    else {
      box.innerHTML = `<div class="grid grid--3">${list.map(card).join("")}</div>`;
      box.querySelectorAll("[data-idet]").forEach(b => b.onclick = () => detalle(S().get("indicadores", b.dataset.idet)));
      box.querySelectorAll("[data-ied]").forEach(b => b.onclick = () => ficha(S().get("indicadores", b.dataset.ied)));
      box.querySelectorAll("[data-iseg]").forEach(b => b.onclick = () => addSeguimiento(S().get("indicadores", b.dataset.iseg)));
      box.querySelectorAll("[data-idel]").forEach(b => b.onclick = () => u.confirmDelete("¿Eliminar este indicador?", () => { S().remove("indicadores", b.dataset.idel); refresh(); }));
    }
    document.getElementById("ind-new").onclick = () => ficha(null);
  }

  function kpi(label, value, sub, kind, icon) {
    const u = ui();
    return `<div class="card kpi ${kind ? "kpi--" + kind : ""}"><div class="kpi__top"><div class="kpi__label">${u.esc(label)}</div>
      <span class="kpi__ico kpi__ico--${kind}">${icon}</span></div>
      <div class="kpi__value">${value}</div><div class="kpi__sub">${u.esc(sub)}</div></div>`;
  }

  function card(ind) {
    const u = ui();
    const sem = SEM[semaforo(ind)]; const cur = currentValue(ind); const cumpl = cumplimiento(ind); const t = tendencia(ind);
    const s = serie(ind);
    const spark = s.length > 1 ? U.charts.sparkline(s.map(x => x.valor), { color: sem.c, meta: Number(ind.meta) }) : "";
    return `<div class="card" style="border-top:4px solid ${TIPO_COLOR[ind.tipo] || "#12b5a5"}">
      <div class="card__head"><span class="tag" style="background:${TIPO_COLOR[ind.tipo]}22;color:${TIPO_COLOR[ind.tipo]}">${u.esc(ind.tipo || "—")}</span>
        <span class="badge badge--${sem.k}">${sem.l}</span></div>
      <h3 class="card__title" style="font-size:1rem">${u.esc(ind.nombre || "Indicador")}</h3>
      <div class="flex" style="justify-content:space-between;align-items:flex-end;margin:.3rem 0">
        <div><div style="font-size:1.9rem;font-weight:800;font-family:var(--font-disp);color:${sem.c};line-height:1">${cur == null ? "—" : cur + "%"}</div>
          <div class="kpi__sub">Meta ${ind.meta || "—"}% · ${cumpl != null ? cumpl + "% cumpl." : "—"}</div></div>
        <div class="right"><div style="font-weight:800;color:${t.fav == null ? "var(--text-2)" : (t.fav ? "var(--verde)" : "var(--danger)")}">${t.arrow} ${u.esc(t.txt)}</div>
          <div class="kpi__sub">${u.esc(ind.periodicidad || "")}</div></div>
      </div>
      ${spark ? `<div style="margin:.2rem 0 -.3rem">${spark}</div>` : ""}
      <div class="btn-row" style="margin-top:.6rem">
        <button class="btn btn--ghost btn--sm" data-idet="${ind.id}">Ver</button>
        <button class="btn btn--ghost btn--sm" data-iseg="${ind.id}">+ Seguimiento</button>
        <button class="btn-icon" data-ied="${ind.id}" title="Editar">✏️</button>
        <button class="btn-icon" data-idel="${ind.id}" title="Eliminar">🗑️</button>
      </div></div>`;
  }

  /* ---------- Ficha adaptable por tipo ---------- */
  function ficha(rec, prefill) {
    const u = ui(); rec = rec || prefill || {};
    let tipo = rec.tipo || "Resultado";
    let segs = rec.seguimientos ? JSON.parse(JSON.stringify(rec.seguimientos)) : [];

    const commonTop = u.formHTML([
      { name: "nombre", label: "Nombre del indicador", required: true, full: true, value: rec.nombre || "" },
      { name: "tipo", label: "Tipo de indicador", type: "select", options: TIPOS, value: tipo },
      { name: "responsable", label: "Responsable", value: rec.responsable || "" },
      { name: "objetivo", label: "Objetivo", type: "textarea", full: true, value: rec.objetivo || "" }
    ], {});

    u.modal({
      title: (rec.id ? "Editar" : "Nuevo") + " indicador", wide: true,
      body: `${commonTop}<div id="ind-dyn"></div>
        <h4 style="margin:.6rem 0 .3rem">Seguimiento (resultados por período)</h4>
        <div id="ind-segs"></div>
        <button type="button" class="btn btn--ghost btn--sm" id="ind-addseg">+ Agregar período</button>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar indicador</button>`,
      onMount(m) {
        const dyn = m.querySelector("#ind-dyn");
        const tipoSel = m.querySelector('select[name="tipo"]');
        function renderDyn() {
          tipo = tipoSel.value;
          const estructura = tipo === "Estructura";
          dyn.innerHTML = u.formHTML([
            estructura ? null : { name: "formula", label: "Fórmula", full: true, value: rec.formula || "" },
            estructura ? null : { name: "numerador", label: "Numerador", type: "number", value: rec.numerador != null ? rec.numerador : "" },
            estructura ? null : { name: "denominador", label: "Denominador", type: "number", value: rec.denominador != null ? rec.denominador : "" },
            { name: "fuenteDatos", label: "Fuente de datos", full: true, value: rec.fuenteDatos || "" },
            { name: "periodicidad", label: "Periodicidad", type: "select", options: PERIODICIDAD, value: rec.periodicidad || "Trimestral" },
            { name: "sentido", label: "Sentido de la meta", type: "select", options: SENTIDOS, value: rec.sentido || "Mayor es mejor" },
            { name: "meta", label: "Meta (%)", type: "number", value: rec.meta != null ? rec.meta : "" },
            { name: "lineaBase", label: "Línea base (%)", type: "number", value: rec.lineaBase != null ? rec.lineaBase : "" }
          ].filter(Boolean), {});
        }
        tipoSel.onchange = renderDyn; renderDyn();

        const segBox = m.querySelector("#ind-segs");
        function renderSegs() {
          segBox.innerHTML = segs.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Período</th><th>Valor (%)</th><th></th></tr></thead><tbody>
            ${segs.map((s, i) => `<tr><td><input class="input" data-si="${i}" data-sf="periodo" value="${u.esc(s.periodo || "")}" placeholder="2026-S1"></td>
              <td><input class="input" type="number" data-si="${i}" data-sf="valor" value="${s.valor != null ? s.valor : ""}" style="max-width:120px"></td>
              <td class="acciones"><button class="btn-icon" type="button" data-srm="${i}">🗑️</button></td></tr>`).join("")}
          </tbody></table></div>` : `<p class="kpi__sub">Aún sin períodos de seguimiento.</p>`;
          segBox.querySelectorAll("[data-srm]").forEach(b => b.onclick = () => { syncSegs(); segs.splice(Number(b.dataset.srm), 1); renderSegs(); });
        }
        function syncSegs() {
          segBox.querySelectorAll("[data-si]").forEach(el => { const i = Number(el.dataset.si); segs[i] = segs[i] || {}; segs[i][el.dataset.sf] = el.value; });
        }
        m.querySelector("#ind-addseg").onclick = () => { syncSegs(); segs.push({ periodo: "", valor: "" }); renderSegs(); };
        renderSegs();

        m.querySelector("[data-save]").onclick = () => {
          syncSegs();
          const d = u.readForm(m);
          if (!d.nombre) { u.toast("El nombre es obligatorio", "danger"); return; }
          d.seguimientos = segs.filter(s => (s.periodo || "") !== "" || (s.valor || "") !== "");
          if (rec.id) S().update("indicadores", rec.id, d); else S().insert("indicadores", d);
          u.closeModal(); u.toast("Indicador guardado", "ok"); refresh();
        };
      }
    });
  }

  function addSeguimiento(ind) {
    const u = ui();
    u.modal({
      title: "Agregar seguimiento · " + (ind.nombre || ""),
      body: u.formHTML([
        { name: "periodo", label: "Período", value: "", hint: "Ej: 2026-S1" },
        { name: "valor", label: "Valor (%)", type: "number" }
      ], {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Agregar</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          if (d.valor === "") { u.toast("Indica el valor", "danger"); return; }
          const segs = (ind.seguimientos || []).concat([{ periodo: d.periodo, valor: Number(d.valor) }]);
          S().update("indicadores", ind.id, { seguimientos: segs });
          u.closeModal(); refresh();
        };
      }
    });
  }

  function detalle(ind) {
    const u = ui(); const sem = SEM[semaforo(ind)]; const cur = currentValue(ind); const t = tendencia(ind); const s = serie(ind);
    const chart = s.length > 1
      ? U.charts.lineChart({ labels: s.map(x => x.periodo || ""), series: [{ name: ind.nombre || "Indicador", color: sem.c, values: s.map(x => x.valor) }], meta: Number(ind.meta) })
      : u.empty("Aún no hay serie de seguimiento.", "Agrega períodos para ver la tendencia.", "📈");
    const alerta = semaforo(ind) === "rojo"
      ? `<div class="badge badge--danger" style="margin:.4rem 0">🔴 Bajo la meta: requiere intervención</div>`
      : (semaforo(ind) === "amarillo" ? `<div class="badge badge--warn" style="margin:.4rem 0">🟡 En seguimiento</div>` : "");
    function fila(l, v) { return `<div><span>${u.esc(l)}</span><strong>${v != null && v !== "" ? u.esc(v) : "—"}</strong></div>`; }
    u.modal({
      title: ind.nombre || "Indicador", wide: true,
      body: `<div class="flex" style="gap:.5rem;margin-bottom:.4rem">
          <span class="tag" style="background:${TIPO_COLOR[ind.tipo]}22;color:${TIPO_COLOR[ind.tipo]}">${u.esc(ind.tipo || "")}</span>
          <span class="badge badge--${sem.k}">${sem.l}</span>
          <span style="margin-left:auto;font-weight:800;color:${t.fav == null ? "var(--text-2)" : (t.fav ? "var(--verde)" : "var(--danger)")}">${t.arrow} ${u.esc(t.txt)}</span></div>
        ${alerta}
        <div class="dl">
          ${fila("Valor actual", cur == null ? "—" : cur + "%")}${fila("Meta", (ind.meta || "—") + "%")}
          ${fila("Cumplimiento", cumplimiento(ind) != null ? cumplimiento(ind) + "%" : "—")}${fila("Sentido", ind.sentido)}
          ${fila("Línea base", ind.lineaBase !== "" && ind.lineaBase != null ? ind.lineaBase + "%" : "—")}${fila("Periodicidad", ind.periodicidad)}
          ${ind.tipo !== "Estructura" ? fila("Fórmula", ind.formula) + fila("Numerador / Denominador", (ind.numerador || "—") + " / " + (ind.denominador || "—")) : ""}
          ${fila("Fuente de datos", ind.fuenteDatos)}${fila("Responsable", ind.responsable)}
        </div>
        <div style="grid-column:1/-1"><span class="muted" style="font-size:12px;font-weight:600">Objetivo</span><p class="narrativo">${u.esc(ind.objetivo || "—")}</p></div>
        <h4 style="margin:.6rem 0 .2rem">Tendencia</h4>${chart}`,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>
        <button class="btn btn--primary" data-seg>+ Seguimiento</button>`,
      onMount(m) { m.querySelector("[data-seg]").onclick = () => { u.closeModal(); addSeguimiento(ind); }; }
    });
  }

  /* ---------- EVI recomienda indicadores ---------- */
  function recomendaciones() {
    const recs = [];
    const evals = S().all("evaluacionesRNAO");
    U.data.CAT.guiasArea.forEach(g => {
      const eg = evals.filter(e => e.guia === g).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      if (!eg.length) return;
      const vals = eg.map(e => CS().globalCumplimiento(e)).filter(v => v != null);
      recs.push({ nombre: "Cumplimiento RNAO · " + g, tipo: "Resultado", fuente: "RNAO",
        prefill: { nombre: "Cumplimiento RNAO · " + g, tipo: "Resultado", objetivo: "Monitorear el cumplimiento de la guía " + g + ".",
          fuenteDatos: "Evaluaciones RNAO", periodicidad: "Semestral", sentido: "Mayor es mejor", meta: Number(eg[0].meta) || 90,
          lineaBase: vals[0], seguimientos: eg.map(e => ({ periodo: e.periodo || "", valor: CS().globalCumplimiento(e) })) } });
    });
    if (S().all("nt234").length) recs.push({ nombre: "Cumplimiento NT 234 (institucional)", tipo: "Resultado", fuente: "NT 234",
      prefill: { nombre: "Cumplimiento NT 234 (institucional)", tipo: "Resultado", objetivo: "Cumplimiento promedio de la Norma Técnica 234.",
        fuenteDatos: "Módulo NT 234", periodicidad: "Semestral", sentido: "Mayor es mejor", meta: Number(S().getConfig("nt234.meta", 90)),
        lineaBase: Math.round(S().all("nt234").reduce((a, b) => a + (Number(b.porcentaje) || 0), 0) / S().all("nt234").length) } });
    const acts = S().all("actividades");
    if (acts.length) { const po = acts.reduce((n, a) => n + (parseInt(a.poblacionObjetivo) || 0), 0), pc = acts.reduce((n, a) => n + (parseInt(a.personasCapacitadas) || 0), 0);
      recs.push({ nombre: "Cobertura de capacitación", tipo: "Proceso", fuente: "Capacitaciones",
        prefill: { nombre: "Cobertura de capacitación", tipo: "Proceso", objetivo: "Cobertura de personal capacitado respecto a la población objetivo.",
          formula: "(personas capacitadas / población objetivo) × 100", numerador: pc, denominador: po || "", fuenteDatos: "Módulo de Fortalecimiento",
          periodicidad: "Trimestral", sentido: "Mayor es mejor", meta: 80 } }); }
    if (S().all("documentos").length) recs.push({ nombre: "Documentos vigentes", tipo: "Estructura", fuente: "Gestión Documental",
      prefill: { nombre: "Documentos institucionales vigentes", tipo: "Estructura", objetivo: "Disponibilidad de documentos institucionales vigentes.",
        fuenteDatos: "Gestión Documental", periodicidad: "Anual", sentido: "Mayor es mejor", meta: 90,
        lineaBase: Math.round(S().all("documentos").filter(d => /vigente/i.test(d.estado || "")).length / S().all("documentos").length * 100) } });
    if (S().all("monitoreoRef").length || S().all("accionesRNAO").length) recs.push({ nombre: "Auditorías clínicas realizadas", tipo: "Proceso", fuente: "Auditorías / apoyo técnico",
      prefill: { nombre: "Auditorías clínicas realizadas", tipo: "Proceso", objetivo: "Auditorías clínicas ejecutadas en el período.",
        fuenteDatos: "Monitoreo y apoyo técnico", periodicidad: "Trimestral", sentido: "Mayor es mejor", meta: 100 } });
    if (S().all("edicionesEVI").length) recs.push({ nombre: "Evidencia difundida (EVI)", tipo: "Impacto", fuente: "Evidencia registrada",
      prefill: { nombre: "Evidencia difundida (EVI)", tipo: "Impacto", objetivo: "Ediciones de evidencia difundidas al equipo clínico.",
        fuenteDatos: "EVI · Evidencia que transforma", periodicidad: "Semestral", sentido: "Mayor es mejor", meta: 4,
        lineaBase: S().all("edicionesEVI").length } });
    return recs;
  }
  function renderEvi() {
    const u = ui();
    const existentes = new Set(S().all("indicadores").map(i => (i.nombre || "").toLowerCase()));
    const recs = recomendaciones().filter(r => !existentes.has(r.nombre.toLowerCase())).slice(0, 6);
    const box = document.getElementById("ind-evi");
    if (!recs.length) { box.innerHTML = ""; return; }
    box.innerHTML = `<div class="card" style="border-left:4px solid var(--c-morado);margin-bottom:1.2rem">
      <div class="flex" style="gap:.6rem;align-items:center;margin-bottom:.5rem">
        <img src="assets/img/evi-full.png" alt="EVI, mascota de la UBPC" style="width:64px;height:auto;filter:drop-shadow(0 4px 8px rgba(18,90,80,.25))">
        <div><strong>EVI recomienda indicadores</strong>
        <div class="kpi__sub">Sugerencias a partir de RNAO, NT 234, capacitaciones, auditorías, documentos y evidencia registrada.</div></div></div>
      <div class="flex wrap" style="gap:.5rem">${recs.map((r, i) => `<button class="btn btn--ghost btn--sm" data-rec="${i}">
        <span class="tag" style="background:${TIPO_COLOR[r.tipo]}22;color:${TIPO_COLOR[r.tipo]}">${r.tipo}</span> ${u.esc(r.nombre)} <span style="opacity:.6">+</span></button>`).join("")}</div></div>`;
    box.querySelectorAll("[data-rec]").forEach(b => b.onclick = () => ficha(null, recs[Number(b.dataset.rec)].prefill));
  }

  U.coord.views.indicadores = indicadores;
  U.coord.binders.indicadores = refresh;

  /* Cálculos expuestos para reportes u otros módulos */
  U.indicadoresCalc = { currentValue, semaforo, cumplimiento, serie, tendencia, SEM, TIPO_COLOR };
})();
