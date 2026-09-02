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
  const TIPO_ORDEN = { Estructura: 0, Proceso: 1, Resultado: 2, Impacto: 3 };
  // Orden legible: por tipo (Estructura → Proceso → Resultado → Impacto) y luego por nombre.
  function ordenados(list) {
    return list.slice().sort((a, b) =>
      (TIPO_ORDEN[a.tipo] != null ? TIPO_ORDEN[a.tipo] : 9) - (TIPO_ORDEN[b.tipo] != null ? TIPO_ORDEN[b.tipo] : 9)
      || String(a.nombre || "").localeCompare(String(b.nombre || "")));
  }

  // Indicadores RNAO / BPSO · LPP (Consolidado Nacional NQUIRE). Se cargan una vez.
  const RNAO_LPP = [
    { tipo: "Proceso", codigoNquire: "ulcerprev_pro01", nombre: "Valoración de riesgo de LPP al ingreso",
      formula: "(Usuarios con valoración de riesgo mediante escala validada ≤24 h desde el ingreso / Total de usuarios evaluados en el mes) × 100",
      numeradorDesc: "N° de usuarios con valoración del riesgo de LPP según escala validada (NSRAS, Braden Q o Braden) antes de las 24 h desde su ingreso",
      denominadorDesc: "N° total de usuarios evaluados que ingresaron al servicio clínico durante el mes de medición",
      fuenteDatos: "Ficha clínica / registro de enfermería · Pauta de cotejo", periodicidad: "Mensual", sentido: "Mayor es mejor", meta: 95 },
    { tipo: "Proceso", codigoNquire: "ulcerprev_pro02", nombre: "Reevaluación de riesgo de LPP",
      formula: "(Usuarios hospitalizados revalorados según protocolo institucional / Total de usuarios evaluados hospitalizados) × 100",
      numeradorDesc: "N° de usuarios hospitalizados que fueron revalorados acorde a lo establecido en el protocolo institucional",
      denominadorDesc: "N° total de usuarios evaluados que están hospitalizados en el servicio clínico",
      fuenteDatos: "Ficha clínica / registro de enfermería · Pauta de cotejo", periodicidad: "Mensual", sentido: "Mayor es mejor", meta: 95 },
    { tipo: "Proceso", codigoNquire: "ulcerprev_pro03", nombre: "Prevención de LPP: uso de superficie de manejo de presión",
      formula: "(Usuarios con riesgo moderado y alto que usan Superficie Especial de Manejo de Presión / Total de usuarios con riesgo moderado y alto evaluados) × 100",
      numeradorDesc: "N° total de usuarios con riesgo moderado y alto que usan una Superficie Especial de Manejo de Presión",
      denominadorDesc: "N° total de usuarios con riesgo moderado y alto evaluados",
      fuenteDatos: "Ficha clínica / registro de enfermería · Pauta de cotejo", periodicidad: "Mensual", sentido: "Mayor es mejor", meta: 90 },
    { tipo: "Resultado", codigoNquire: "ulcermgt_out01", nombre: "Incidencia de LPP",
      formula: "(Usuarios que desarrollaron una o más LPP categoría II a IV durante el mes / Total de usuarios que egresaron del servicio clínico en el mes) × 100",
      numeradorDesc: "N° total de usuarios que desarrollaron una o más Lesiones por Presión categoría II a IV durante el mes de medición",
      denominadorDesc: "N° total de usuarios que egresaron del servicio clínico durante el mes de medición",
      fuenteDatos: "Ficha clínica / notificación de LPP intrahospitalaria", periodicidad: "Mensual", sentido: "Menor es mejor", meta: 5 }
  ];
  function seedRnaoLPP() {
    try {
      if (S().getConfig("seed.rnaoLPP.v1", false)) return;
      const existentes = new Set(S().all("indicadores").map(i => i.codigoNquire).filter(Boolean));
      RNAO_LPP.forEach(def => {
        if (existentes.has(def.codigoNquire)) return;
        S().insert("indicadores", Object.assign({
          programa: "RNAO / BPSO", guia: "Lesiones por presión",
          responsable: "Enf. Coordinador/a UBPC", fichaVersion: 1
        }, def), { silent: true });
      });
      S().setConfig("seed.rnaoLPP.v1", true);
    } catch (e) {}
  }
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

  /* ---- Estimación de la demanda técnica desde datos del portal ---- */
  function icoHorasBase() { return Number(S().getConfig("ico.horasBase", 160)) || 160; }
  function icoJornada() { return Number(S().getConfig("ico.jornadaMes", 176)) || 176; }
  function icoPesos() {
    return {
      solicitudes: Number(S().getConfig("ico.pesoSolicitudes", 4)),
      reuniones: Number(S().getConfig("ico.pesoReuniones", 2)),
      capacitaciones: Number(S().getConfig("ico.pesoCapacitaciones", 3)),
      monitoreo: Number(S().getConfig("ico.pesoMonitoreo", 5))
    };
  }
  function enMes(fecha, periodo) {
    const m = String(fecha || "").match(/^(\d{4})-(\d{2})/);
    return !!m && (m[1] + "-" + m[2]) === periodo;
  }
  function icoConteo(periodo) {
    return {
      solicitudes: S().all("solicitudes").filter(x => enMes(x.fechaEnvio, periodo)).length,
      reuniones: S().all("reuniones").filter(x => enMes(x.fecha, periodo)).length,
      capacitaciones: S().all("actividades").filter(x => enMes(x.fecha, periodo)).length
        + S().all("capacitacionRef").filter(x => enMes(x.fecha, periodo)).length,
      monitoreo: S().all("monitoreoRef").filter(x => enMes(x.fecha, periodo)).length
    };
  }
  const icoFmt = n => (Number.isInteger(n) ? n : Math.round(n * 10) / 10);
  function icoEstimar(periodo) {
    const c = icoConteo(periodo), w = icoPesos();
    const items = [
      { ico: "📨", lab: "Solicitudes técnicas", n: c.solicitudes, w: w.solicitudes },
      { ico: "📅", lab: "Reuniones", n: c.reuniones, w: w.reuniones },
      { ico: "🎓", lab: "Capacitaciones", n: c.capacitaciones, w: w.capacitaciones },
      { ico: "📈", lab: "Monitoreo / auditorías", n: c.monitoreo, w: w.monitoreo }
    ];
    const total = items.reduce((a, i) => a + i.n * i.w, 0);
    return { items, total: icoFmt(total) };
  }
  function icoBreakdownHTML(periodo) {
    const u = ui();
    const est = icoEstimar(periodo);
    if (!est.items.some(i => i.n > 0)) {
      return `<p class="kpi__sub">No hay actividad registrada en ${u.esc(icoPeriodoLabel(periodo))} para estimar. Ajusta el mes o ingresa la demanda a mano.</p>`;
    }
    return `<div class="ico-brk">
      ${est.items.map(i => `<div class="ico-brk__row ${i.n ? "" : "is-zero"}">
        <span>${i.ico} ${i.lab}</span><em>${i.n} × ${i.w} h</em><b>${icoFmt(i.n * i.w)} h</b></div>`).join("")}
      <div class="ico-brk__total"><span>Demanda estimada · ${u.esc(icoPeriodoLabel(periodo))}</span><b>${est.total} h</b></div>
    </div>`;
  }

  function icoParams() {
    const u = ui();
    u.modal({
      title: "Parámetros de estimación",
      body: `<p class="card__hint">Horas disponibles del Coordinador y tiempo estimado por cada actividad. El portal cuenta la <strong>cantidad</strong> de actividades del mes y la multiplica por estas horas.</p>
        ${u.formHTML([
          { name: "horasBase", label: "Horas profesionales disponibles / mes", type: "number", value: icoHorasBase(), hint: "Jornada del Coordinador dedicada a la UBPC." },
          { name: "jornadaMes", label: "Jornada completa de referencia (h/mes)", type: "number", value: icoJornada(), hint: "1 EU a jornada completa. Se usa para expresar la demanda en jornadas (FTE)." },
          { name: "pesoSolicitudes", label: "Horas por solicitud técnica", type: "number", value: icoPesos().solicitudes },
          { name: "pesoReuniones", label: "Horas por reunión", type: "number", value: icoPesos().reuniones },
          { name: "pesoCapacitaciones", label: "Horas por capacitación", type: "number", value: icoPesos().capacitaciones },
          { name: "pesoMonitoreo", label: "Horas por monitoreo / auditoría", type: "number", value: icoPesos().monitoreo }
        ], {})}`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar parámetros</button>`,
      onMount(m) {
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          S().setConfig("ico.horasBase", Number(d.horasBase) || 160);
          S().setConfig("ico.jornadaMes", Number(d.jornadaMes) || 176);
          S().setConfig("ico.pesoSolicitudes", Number(d.pesoSolicitudes) || 0);
          S().setConfig("ico.pesoReuniones", Number(d.pesoReuniones) || 0);
          S().setConfig("ico.pesoCapacitaciones", Number(d.pesoCapacitaciones) || 0);
          S().setConfig("ico.pesoMonitoreo", Number(d.pesoMonitoreo) || 0);
          u.closeModal(); u.toast("Parámetros guardados", "ok"); renderICO();
        };
      }
    });
  }

  function icoForm(rec) {
    const u = ui(); rec = rec || {};
    const hoy = new Date();
    const mesActual = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");
    u.modal({
      title: (rec.id ? "Editar" : "Registrar") + " mes · Capacidad Operativa",
      body: `<p class="card__hint">Índice = demanda técnica mensual ÷ horas profesionales disponibles × 100. Se calcula y clasifica automáticamente.</p>
        ${u.formHTML([
          { name: "periodo", label: "Mes", type: "month", required: true, value: rec.periodo || mesActual }
        ], {})}
        <div class="ico-estim">
          <button type="button" class="btn btn--ghost btn--sm" id="ico-estimar">🔗 Estimar demanda desde el portal</button>
          <div id="ico-breakdown" class="ico-breakdown"></div>
        </div>
        ${u.formHTML([
          { name: "demanda", label: "Demanda técnica mensual (horas)", type: "number", required: true, value: rec.demanda != null ? rec.demanda : "", hint: "Estímala desde el portal o escríbela a mano." },
          { name: "horas", label: "Horas profesionales disponibles (horas)", type: "number", required: true, value: rec.horas != null ? rec.horas : icoHorasBase(), hint: "Jornada del Coordinador UBPC (valor base editable en Parámetros)." },
          { name: "nota", label: "Observación (opcional)", type: "textarea", full: true, value: rec.nota || "" }
        ], {})}
        <div id="ico-preview" class="ico-preview"></div>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar mes</button>`,
      onMount(m) {
        const prev = m.querySelector("#ico-preview");
        const dI = m.querySelector('input[name="demanda"]'), hI = m.querySelector('input[name="horas"]');
        const perI = m.querySelector('input[name="periodo"]');
        const brk = m.querySelector("#ico-breakdown");
        m.querySelector("#ico-estimar").onclick = () => {
          const per = perI.value || mesActual;
          const est = icoEstimar(per);
          brk.innerHTML = icoBreakdownHTML(per);
          if (est.total > 0) { dI.value = est.total; paint(); }
        };
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

  /* ---- Lectura en jornadas (FTE) para justificar dotación ---- */
  const fteFmt = n => (Math.round(n * 10) / 10).toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function icoFTEcardHTML(rec) {
    const u = ui(), j = icoJornada();
    const req = Number(rec.demanda) / j;        // jornadas que exige la demanda
    const disp = Number(rec.horas) / j;         // jornada disponible (coordinador)
    const deficit = req - disp;                 // jornadas que faltan
    const justifica = deficit >= 0.2;
    const concl = justifica
      ? `La demanda equivale a <strong>${fteFmt(req)} jornadas</strong> y hay <strong>${fteFmt(disp)}</strong> disponible: se justifica reforzar con <strong>~${fteFmt(deficit)} jornada de EU referente</strong>.`
      : `La demanda equivale a <strong>${fteFmt(req)} jornadas</strong> y la capacidad disponible (${fteFmt(disp)}) alcanza a cubrirla este mes.`;
    return `<div class="ico-fte ${justifica ? "is-gap" : ""}">
      <div class="ico-fte__title">🧮 Lectura en jornadas (EU) · ${u.esc(icoPeriodoLabel(rec.periodo))}</div>
      <div class="ico-fte__row">
        <div class="ico-fte__box"><b>${fteFmt(req)}</b><span>jornadas requeridas</span></div>
        <div class="ico-fte__box"><b>${fteFmt(disp)}</b><span>jornada disponible</span></div>
        <div class="ico-fte__box ico-fte__box--gap"><b>${deficit > 0 ? "+" : ""}${fteFmt(deficit)}</b><span>${deficit > 0 ? "déficit de EU" : "holgura"}</span></div>
      </div>
      <p class="ico-fte__concl">${concl} <span class="kpi__sub">Jornada de referencia: ${j} h/mes.</span></p>
    </div>`;
  }

  /* ---- Evidencia de saturación con datos reales del portal (sin horas) ---- */
  function icoActividadMes(ym) {
    const s = S();
    return s.all("solicitudes").filter(x => enMes(x.fechaEnvio, ym)).length
      + s.all("reuniones").filter(x => enMes(x.fecha, ym)).length
      + s.all("actividades").filter(x => enMes(x.fecha, ym)).length
      + s.all("capacitacionRef").filter(x => enMes(x.fecha, ym)).length
      + s.all("monitoreoRef").filter(x => enMes(x.fecha, ym)).length;
  }
  function icoEvidenciaData() {
    const s = S();
    const now = new Date();
    const ym = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const ymPrev = prevD.getFullYear() + "-" + String(prevD.getMonth() + 1).padStart(2, "0");

    const sols = s.all("solicitudes");
    const pend = sols.filter(x => !/cerrad/i.test(x.estado || "")).length;
    const cerr = sols.filter(x => x.fechaCierre && x.fechaEnvio);
    const avgResp = cerr.length
      ? Math.round(cerr.reduce((a, x) => a + (new Date(x.fechaCierre) - new Date(x.fechaEnvio)) / 86400000, 0) / cerr.length)
      : null;

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const venc = s.all("kanban").filter(k => k.columna !== "Completado" && k.fechaLimite && new Date(k.fechaLimite) < hoy).length
      + s.all("accionesRNAO").filter(a => (a.estado || "") !== "Completado" && a.fechaComprometida && new Date(a.fechaComprometida) < hoy).length;

    const cob = new Set();
    const addU = (coll, cf, cu) => s.all(coll).forEach(r => { if (enMes(r[cf], ym) && r[cu]) cob.add(r[cu]); });
    addU("solicitudes", "fechaEnvio", "unidad"); addU("reuniones", "fecha", "unidad");
    addU("actividades", "fecha", "unidadResp"); addU("monitoreoRef", "fecha", "unidad");
    addU("capacitacionRef", "fecha", "unidad");
    const totalUn = ((U.data.CAT && U.data.CAT.unidades) || []).filter(x => x && !/todas/i.test(x)).length || 23;

    const actNow = icoActividadMes(ym), actPrev = icoActividadMes(ymPrev);
    return { pend, avgResp, venc, cob: cob.size, totalUn, actNow, actPrev, dAct: actNow - actPrev };
  }
  function icoEvidenciaHTML() {
    const u = ui();
    const d = icoEvidenciaData();
    const tendTxt = d.actPrev === 0 ? (d.actNow ? "Primer mes con actividad" : "Sin actividad")
      : (d.dAct > 0 ? `▲ +${d.dAct} vs mes anterior` : d.dAct < 0 ? `▼ ${d.dAct} vs mes anterior` : "→ igual que el mes anterior");
    const card = (ico, val, lab, sub, kind) => `<div class="card kpi ${kind ? "kpi--" + kind : ""}">
      <div class="kpi__top"><div class="kpi__label">${lab}</div><span class="kpi__ico kpi__ico--${kind || "info"}">${ico}</span></div>
      <div class="kpi__value">${val}</div><div class="kpi__sub">${u.esc(sub)}</div></div>`;

    return `<div class="ico-evi">
      <div class="section__head"><div><h4 style="margin:0">Evidencia de saturación operativa</h4>
        <p class="kpi__sub" style="margin:.15rem 0 0">Datos en vivo del portal — no requieren registrar horas.</p></div></div>
      <div class="grid grid--kpi">
        ${card("📨", d.pend, "Solicitudes pendientes", d.avgResp != null ? "Respuesta prom.: " + d.avgResp + " días" : "Sin cierres registrados aún", d.pend ? "warn" : "ok")}
        ${card("⏱️", d.venc, "Tareas / acciones vencidas", d.venc ? "Compromisos fuera de plazo" : "Todo dentro de plazo", d.venc ? "danger" : "ok")}
        ${card("🏥", d.cob + " / " + d.totalUn, "Cobertura de unidades", "Con actividad este mes", d.cob >= d.totalUn * 0.6 ? "ok" : "warn")}
        ${card("📈", d.actNow, "Actividad del mes", tendTxt, "info")}
      </div>
    </div>`;
  }

  /* ---- Observación y recomendación (lectura automática + nota editable) ---- */
  function icoAutoRecom() {
    const u = ui();
    const recs = icoOrdenados();
    const d = icoEvidenciaData();
    const j = icoJornada();
    if (!recs.length) {
      return `Aún no hay registros mensuales del índice. Registra al menos un mes (o estímalo desde el portal) para generar la lectura automática. ` +
        (d.pend || d.venc ? `De todas formas, ya se observan señales de carga: ${d.pend} solicitud(es) pendiente(s) y ${d.venc} compromiso(s) vencido(s).` : "");
    }
    const last = recs[recs.length - 1];
    const pct = icoIndex(last), est = icoEstado(pct);
    const req = Number(last.demanda) / j, disp = Number(last.horas) / j, deficit = req - disp;
    const tend = d.actPrev === 0 ? "" : (d.dAct > 0 ? " La actividad va en aumento respecto al mes anterior, lo que proyecta una brecha creciente." : d.dAct < 0 ? " La actividad disminuyó respecto al mes anterior." : "");
    const parte1 = `En <strong>${u.esc(icoPeriodoLabel(last.periodo))}</strong> el Índice de Capacidad Operativa fue <strong>${pct}%</strong> (${est.l.toLowerCase()}). ` +
      `La demanda técnica equivale a <strong>${fteFmt(req)} jornadas</strong> frente a <strong>${fteFmt(disp)}</strong> disponible(s).`;
    const evid = ` Como respaldo operativo se registran <strong>${d.pend}</strong> solicitud(es) pendiente(s)${d.avgResp != null ? ` (respuesta promedio ${d.avgResp} días)` : ""}, <strong>${d.venc}</strong> compromiso(s) vencido(s) y una cobertura de <strong>${d.cob}/${d.totalUn}</strong> unidades en el mes.`;
    const reco = deficit >= 0.2
      ? ` <strong>Recomendación:</strong> la demanda supera la capacidad de un/a solo profesional (déficit de ${fteFmt(deficit)} jornada). Se recomienda gestionar ante la Subdirección de Gestión del Cuidado la incorporación de un/a <strong>enfermero/a referente</strong> para asegurar la continuidad técnica y la cobertura de las unidades.`
      : ` <strong>Recomendación:</strong> la capacidad disponible alcanza a cubrir la demanda del mes. Se recomienda mantener el monitoreo mensual y reevaluar si la tendencia continúa al alza.`;
    return parte1 + evid + tend + reco;
  }
  function icoRecomendacionHTML() {
    const u = ui();
    const auto = icoAutoRecom();
    const nota = S().getConfig("ico.observacion", "");
    return `<div class="ico-recom">
      <div class="section__head"><div><h4 style="margin:0">Observación y recomendación</h4>
        <p class="kpi__sub" style="margin:.15rem 0 0">Lectura automática de los datos + tu observación.</p></div></div>
      <div class="ico-recom__auto">${auto}</div>
      <label class="ico-recom__lbl" for="ico-obs">✍️ Observación del Coordinador/a (opcional)</label>
      <textarea class="input" id="ico-obs" rows="3" placeholder="Agrega tu análisis, contexto o gestión realizada. Se guarda automáticamente.">${u.esc(nota)}</textarea>
    </div>`;
  }
  function bindObs() {
    const t = document.getElementById("ico-obs");
    if (t) t.onblur = () => { S().setConfig("ico.observacion", t.value); ui().toast("Observación guardada", "ok"); };
  }

  /* ---- Informe imprimible A4 (una página) para Subdirección ---- */
  const ICR_CSS = `
    .icr{ max-width:180mm; margin:0 auto; text-align:left; color:#22303a; }
    .icr__head{ display:flex; align-items:center; gap:12px; border-bottom:3px solid #7a5cd0; padding-bottom:10px; margin-bottom:14px; }
    .icr__logo{ width:54px; height:54px; object-fit:contain; flex:none; }
    .icr__eb{ font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#7a5cd0; font-weight:800; }
    .icr__title{ font-family:'Fraunces',serif; font-size:19px; margin:2px 0 0; }
    .icr__meta{ font-size:10.5px; color:#5a6b66; margin-top:2px; }
    .icr__lbl{ font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#7a5cd0; }
    .icr__grid2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:12px 0; }
    .icr__box{ border:1px solid #e2e9f0; border-radius:10px; padding:10px 12px; }
    .icr__big{ font-family:'Fraunces',serif; font-size:34px; line-height:1; margin:3px 0; }
    .icr__badge{ display:inline-block; padding:3px 11px; border-radius:999px; font-size:11px; font-weight:800; }
    .icr__fte{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:6px 0 4px; }
    .icr__fteb{ text-align:center; border:1px solid #e2e9f0; border-radius:8px; padding:6px 4px; }
    .icr__fteb b{ font-family:'Fraunces',serif; font-size:22px; display:block; }
    .icr__fteb span{ font-size:9.5px; color:#5a6b66; }
    .icr__evi{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:5px 0 0; }
    .icr__evib{ border:1px solid #e2e9f0; border-radius:8px; padding:8px 6px; text-align:center; }
    .icr__evib b{ font-size:19px; display:block; font-family:'Fraunces',serif; }
    .icr__evib span{ font-size:9.5px; color:#5a6b66; }
    .icr__reco{ border:1px solid #e2e9f0; border-left:4px solid #7a5cd0; border-radius:8px; padding:10px 12px; font-size:11.5px; line-height:1.55; margin-top:5px; }
    .icr__firmas{ display:grid; grid-template-columns:1fr 1fr; gap:34px; margin-top:40px; }
    .icr__firma{ text-align:center; font-size:10.5px; color:#40536f; }
    .icr__firma .line{ border-top:1px solid #22303a; margin:0 6px 5px; padding-top:5px; font-weight:700; color:#22303a; }
    .icr__foot{ margin-top:16px; font-size:9.5px; color:#98a4ac; text-align:center; border-top:1px solid #e6ecf0; padding-top:6px; }
    .b-ok{ background:#e4f6ec; color:#1c7a4c; } .b-warn{ background:#fbf1de; color:#b06f14; }
    .b-danger{ background:#fbe6ea; color:#c62f3b; } .b-neutral{ background:#eef2f1; color:#5a6b66; }`;

  function informeICOInner() {
    const u = ui();
    const recs = icoOrdenados();
    const last = recs.length ? recs[recs.length - 1] : null;
    const pct = last ? icoIndex(last) : null;
    const est = icoEstado(pct);
    const j = icoJornada();
    const req = last ? Number(last.demanda) / j : null;
    const disp = last ? Number(last.horas) / j : null;
    const deficit = (req != null && disp != null) ? req - disp : null;
    const d = icoEvidenciaData();
    const nota = S().getConfig("ico.observacion", "");
    const me = U.auth.current();
    const logo = new URL("assets/img/huap-logo.png", document.baseURI).href;
    const hoy = u.fechaCL(new Date().toISOString());
    const tendTxt = d.actPrev === 0 ? "" : (d.dAct > 0 ? " (▲ +" + d.dAct + ")" : d.dAct < 0 ? " (▼ " + d.dAct + ")" : "");

    return `<div class="icr">
      <div class="icr__head">
        <img class="icr__logo" src="${logo}" alt="">
        <div>
          <div class="icr__eb">Unidad de Buenas Prácticas Clínicas · HUAP</div>
          <h1 class="icr__title">Informe · Índice de Capacidad Operativa UBPC</h1>
          <div class="icr__meta">Indicador de estructura · Dimensión: Capacidad operativa · Subdimensión: Disponibilidad de recurso humano</div>
          <div class="icr__meta">Período: <strong>${last ? u.esc(icoPeriodoLabel(last.periodo)) : "—"}</strong> · Emitido: ${hoy} · Dirigido a: <strong>Subdirección de Gestión del Cuidado</strong></div>
        </div>
      </div>

      <div class="icr__grid2">
        <div class="icr__box">
          <div class="icr__lbl">Resultado del mes</div>
          <div class="icr__big" style="color:${est.c}">${pct == null ? "—" : pct + "%"}</div>
          <span class="icr__badge b-${est.k}">${est.l}</span>
          <div class="icr__meta">Demanda ${last ? u.esc(last.demanda) : "—"} h ÷ disponibles ${last ? u.esc(last.horas) : "—"} h × 100</div>
        </div>
        <div class="icr__box">
          <div class="icr__lbl">Lectura en jornadas (EU)</div>
          <div class="icr__fte">
            <div class="icr__fteb"><b>${req != null ? fteFmt(req) : "—"}</b><span>requeridas</span></div>
            <div class="icr__fteb"><b>${disp != null ? fteFmt(disp) : "—"}</b><span>disponible</span></div>
            <div class="icr__fteb"><b style="color:${deficit != null && deficit > 0 ? "#c62f3b" : "#1c7a4c"}">${deficit != null ? (deficit > 0 ? "+" : "") + fteFmt(deficit) : "—"}</b><span>${deficit != null && deficit > 0 ? "déficit EU" : "holgura"}</span></div>
          </div>
          <div class="icr__meta">Jornada de referencia: ${j} h/mes</div>
        </div>
      </div>

      <div class="icr__lbl">Evidencia de saturación operativa</div>
      <div class="icr__evi">
        <div class="icr__evib"><b>${d.pend}</b><span>Solicitudes pendientes${d.avgResp != null ? " · " + d.avgResp + "d resp." : ""}</span></div>
        <div class="icr__evib"><b>${d.venc}</b><span>Tareas/acciones vencidas</span></div>
        <div class="icr__evib"><b>${d.cob}/${d.totalUn}</b><span>Cobertura de unidades</span></div>
        <div class="icr__evib"><b>${d.actNow}${tendTxt}</b><span>Actividad del mes</span></div>
      </div>

      <div class="icr__lbl" style="margin-top:12px">Observación y recomendación</div>
      <div class="icr__reco">${icoAutoRecom()}${nota ? `<br><br><strong>Observación del Coordinador/a:</strong> ${u.esc(nota)}` : ""}</div>

      <div class="icr__firmas">
        <div class="icr__firma"><div class="line">${me ? u.esc(me.nombre) : "____________________"}</div>Coordinador/a UBPC · Responsable del indicador</div>
        <div class="icr__firma"><div class="line">&nbsp;</div>Subdirección de Gestión del Cuidado</div>
      </div>
      <div class="icr__foot">Portal de Gestión Operativa · UBPC · Hospital de Urgencia Asistencia Pública (HUAP) · Documento generado el ${hoy}</div>
    </div>`;
  }

  function printInformeICO() {
    const u = ui();
    const w = window.open("", "_blank");
    if (!w) { u.toast("Permite las ventanas emergentes para imprimir", "danger"); return; }
    const fr = new URL("assets/fonts/fraunces.woff2", document.baseURI).href;
    const ns = new URL("assets/fonts/nunitosans.woff2", document.baseURI).href;
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe · Índice de Capacidad Operativa UBPC</title><style>
      @font-face{font-family:'Fraunces';src:url('${fr}') format('woff2');font-weight:100 900;font-display:swap}
      @font-face{font-family:'Nunito Sans';src:url('${ns}') format('woff2');font-weight:200 900;font-display:swap}
      @page{size:A4;margin:0}
      *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      html,body{margin:0}
      body{font-family:'Nunito Sans',system-ui,Arial,sans-serif;color:#22303a}
      .sheet{padding:14mm}
      ${ICR_CSS}
    </style></head><body><div class="sheet">${informeICOInner()}</div></body></html>`);
    w.document.close();
    const go = () => { try { w.focus(); w.print(); } catch (e) {} };
    if (w.document.fonts && w.document.fonts.ready) { w.document.fonts.ready.then(() => setTimeout(go, 150)); setTimeout(go, 1400); }
    else setTimeout(go, 500);
  }

  function renderICO() {
    const u = ui();
    const box = document.getElementById("ico-data");
    if (!box) return;
    const recs = icoOrdenados();
    const addBtn = `<div class="btn-row"><button class="btn btn--ghost btn--sm" id="ico-print" title="Informe imprimible para Subdirección">🖨️ Informe</button><button class="btn btn--ghost btn--sm" id="ico-params" title="Parámetros de estimación">⚙️ Parámetros</button><button class="btn btn--primary btn--sm" id="ico-add">+ Registrar mes</button></div>`;
    if (!recs.length) {
      box.innerHTML = `<div class="ico-data__head"><h4>Seguimiento mensual</h4>${addBtn}</div>
        ${u.empty("Aún sin registros mensuales.", "Ingresa el primer mes o estímalo desde el portal para calcular el índice.", "🗓️")}
        ${icoEvidenciaHTML()}
        ${icoRecomendacionHTML()}`;
      const b = document.getElementById("ico-add"); if (b) b.onclick = () => icoForm(null);
      const pb = document.getElementById("ico-params"); if (pb) pb.onclick = () => icoParams();
      const prb = document.getElementById("ico-print"); if (prb) prb.onclick = () => printInformeICO();
      bindObs();
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
      ${icoFTEcardHTML(last)}
      <div style="margin:.6rem 0">${chart}</div>
      <div class="table-wrap"><table class="tbl"><thead><tr>
        <th>Mes</th><th class="right">Demanda (h)</th><th class="right">Horas disp. (h)</th><th class="right">Índice</th><th>Estado</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table></div>
      ${icoEvidenciaHTML()}
      ${icoRecomendacionHTML()}`;

    document.getElementById("ico-add").onclick = () => icoForm(null);
    document.getElementById("ico-params").onclick = () => icoParams();
    document.getElementById("ico-print").onclick = () => printInformeICO();
    bindObs();
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
  const TABS_IND = [
    { key: "registrados", label: "Indicadores registrados" },
    { key: "matriz", label: "Ficha técnica (matriz)" }
  ];
  let _box = null, _tab = "registrados";
  function indicadores(params) {
    const tab = (params && params.tab) || "registrados";
    return `<div class="page-head"><h1>Indicadores UBPC</h1>
      <p>Gestión de indicadores de estructura, proceso, resultado e impacto, con semáforo, cumplimiento, tendencias y alertas.</p></div>
      ${U.components.resource.tabsBar("coord", "indicadores", TABS_IND, tab)}
      <div id="ind-body"></div>`;
  }
  function indBind(main, params) {
    _tab = (params && params.tab) || "registrados";
    _box = document.getElementById("ind-body");
    seedRnaoLPP();
    renderTab();
  }
  function renderTab() {
    if (!_box) return;
    if (_tab === "matriz") renderMatriz(_box); else renderRegistrados(_box);
  }

  function renderRegistrados(box) {
    const u = ui();
    box.innerHTML = `
      <div id="ind-kpi"></div>
      <div id="ind-evi"></div>
      ${fichaCapacidadOperativa()}
      <div class="section__head"><h2 class="section__title">Indicadores registrados</h2>
        <button class="btn btn--primary btn--sm" id="ind-new">+ Nuevo indicador</button></div>
      <div id="ind-list"></div>`;
    const list = ordenados(S().all("indicadores"));
    const by = k => list.filter(i => semaforo(i) === k).length;
    document.getElementById("ind-kpi").innerHTML = `<div class="grid grid--kpi" style="margin-bottom:1.1rem">
      ${kpi("Indicadores", list.length, "Registrados en total", "info", "📏")}
      ${kpi("En meta", by("verde"), "Semáforo verde", "ok", "🟢")}
      ${kpi("En seguimiento", by("amarillo"), "Semáforo amarillo", "warn", "🟡")}
      ${kpi("En intervención", by("rojo"), "Semáforo rojo", "danger", "🔴")}</div>`;

    renderEvi();
    renderICO();

    const lb = document.getElementById("ind-list");
    if (!list.length) { lb.innerHTML = u.empty("Aún no hay indicadores registrados.", "Crea uno o usa las recomendaciones de EVI.", "📏"); }
    else {
      const groups = {}; list.forEach(i => { const t = i.tipo || "Otros"; (groups[t] = groups[t] || []).push(i); });
      lb.innerHTML = TIPOS.concat(["Otros"]).filter(t => groups[t]).map(t => {
        const c = TIPO_COLOR[t] || "#8a94a6";
        return `<div style="margin-bottom:1.1rem">
          <div style="display:flex;align-items:center;gap:.45rem;margin:.2rem 0 .5rem;font-weight:700;color:var(--text)">
            <span style="width:10px;height:10px;border-radius:3px;background:${c};display:inline-block"></span>
            Indicadores de ${u.esc(t)} <span class="kpi__sub" style="font-weight:500">· ${groups[t].length}</span>
          </div>
          <div class="grid grid--3">${groups[t].map(card).join("")}</div>
        </div>`;
      }).join("");
      lb.querySelectorAll("[data-idet]").forEach(b => b.onclick = () => detalle(S().get("indicadores", b.dataset.idet)));
      lb.querySelectorAll("[data-ied]").forEach(b => b.onclick = () => ficha(S().get("indicadores", b.dataset.ied)));
      lb.querySelectorAll("[data-iseg]").forEach(b => b.onclick = () => addSeguimiento(S().get("indicadores", b.dataset.iseg)));
      lb.querySelectorAll("[data-idel]").forEach(b => b.onclick = () => u.confirmDelete("¿Eliminar este indicador?", () => { S().remove("indicadores", b.dataset.idel); renderTab(); }));
    }
    document.getElementById("ind-new").onclick = () => ficha(null);
  }

  /* ---------- Estándar de cumplimiento legible ---------- */
  function estandarTxt(ind) {
    if (ind.meta == null || ind.meta === "") return "—";
    return (menorMejor(ind) ? "≤ " : "≥ ") + ind.meta + "%";
  }

  /* ---------- Próxima medición según periodicidad ---------- */
  const PERIOD_MESES = { "Mensual": 1, "Bimensual": 2, "Trimestral": 3, "Semestral": 6, "Anual": 12 };
  function anclaMedicion(ind) {
    const raw = ind.fechaMedicion || ind.fechaCreacion;
    if (!raw) return null;
    const d = new Date(raw); return isNaN(d) ? null : d;
  }
  function proximaMedicion(ind) {
    const off = PERIOD_MESES[ind.periodicidad]; if (!off) return null;
    const base = anclaMedicion(ind); if (!base) return null;
    const d = new Date(base); d.setMonth(d.getMonth() + off); d.setHours(0, 0, 0, 0); return d;
  }
  function proxLabel(d) { return d ? MESES_ICO[d.getMonth()] + " " + d.getFullYear() : "—"; }
  function proximaInfo(ind) {
    const d = proximaMedicion(ind); if (!d) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dias = Math.round((d - today) / 86400000);
    return { d, label: proxLabel(d), dias, overdue: dias < 0, soon: dias >= 0 && dias <= 15 };
  }
  function proximaChip(ind) {
    const pi = proximaInfo(ind); if (!pi) return "";
    const color = pi.overdue ? "var(--danger)" : pi.soon ? "var(--naranjo)" : "inherit";
    const txt = pi.overdue ? "Medición pendiente (" + pi.label + ")" : "Próx. medición: " + pi.label;
    return `<div class="kpi__sub" style="color:${color}">📏 ${txt}</div>`;
  }

  /* ---------- Submódulo: Ficha técnica (matriz) ---------- */
  function fichaSheet(ind) {
    const u = ui();
    const crit = (ind.metodologia || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const rows = [
      ["Indicador", u.esc(ind.nombre || "—")],
      ["Fórmula", u.esc(ind.formula || (ind.tipo === "Estructura" ? "Indicador de estructura (verificación)" : "—"))],
      ["Estándar de cumplimiento", estandarTxt(ind)],
      ["Fuente de información", u.esc(ind.fuenteDatos || "—")],
      ["Periodicidad", u.esc(ind.periodicidad || "—")],
      ["Próxima medición", (() => { const pi = proximaInfo(ind); return pi ? (pi.overdue ? `<span style="color:var(--danger);font-weight:700">Pendiente · ${u.esc(pi.label)}</span>` : u.esc(pi.label)) : "—"; })()],
      ["Responsable", u.esc(ind.responsable || "Enf. Coordinador/a UBPC")]
    ];
    return `<div class="mtx-card" style="--tc:${TIPO_COLOR[ind.tipo] || "#12b5a5"}">
      <div class="mtx-card__head"><span class="tag" style="background:${TIPO_COLOR[ind.tipo]}22;color:${TIPO_COLOR[ind.tipo]}">${u.esc(ind.tipo || "—")}</span>
        <span class="mtx-ver">Versión ${ind.fichaVersion || 1}</span></div>
      <table class="mtx-tbl"><tbody>
        ${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join("")}
        <tr><th>Metodología de evaluación</th><td>${crit.length ? `<ol class="mtx-crit">${crit.map(c => `<li>${u.esc(c)}</li>`).join("")}</ol>` : "—"}</td></tr>
      </tbody></table>
      <div class="btn-row" style="margin-top:.6rem">
        <button class="btn btn--ghost btn--sm" data-mtxedit="${ind.id}">✏️ Editar ficha</button>
        <button class="btn btn--ghost btn--sm" data-mtxver="${ind.id}">🕘 Versiones (${(ind.fichaHist || []).length || 1})</button>
        <button class="btn-icon" data-mtxdel="${ind.id}" title="Eliminar">🗑️</button>
      </div></div>`;
  }
  function verVersiones(ind) {
    const u = ui();
    const h = (ind.fichaHist && ind.fichaHist.length ? ind.fichaHist : [{ version: ind.fichaVersion || 1, fecha: ind.fechaCreacion, por: "—", cambio: "Versión inicial" }]).slice().reverse();
    u.modal({
      title: "Versiones de la ficha · " + (ind.nombre || ""),
      body: `<ul class="feed">${h.map(x => `<li><span class="feed__ico">🏷️</span><div><strong>Versión ${x.version}</strong>${x.cambio ? " · " + u.esc(x.cambio) : ""}
        <div class="feed__meta">${u.esc(x.por || "—")} · ${x.fecha ? u.fechaHoraCL(x.fecha) : "—"}</div></div></li>`).join("")}</ul>`,
      footer: `<button class="btn btn--ghost" data-close>Cerrar</button>`
    });
  }
  function renderMatriz(box) { seedRnaoLPP();
    const u = ui();
    const list = ordenados(S().all("indicadores"));
    const head = `<div class="section__head"><div><h2 class="section__title">Ficha técnica de indicadores (matriz)</h2>
        <p class="section__hint">Diccionario técnico de cada indicador: fórmula, estándar, fuente, periodicidad, responsable, metodología y versión.</p></div>
        <button class="btn btn--primary btn--sm" id="mtx-new">+ Nuevo indicador</button></div>`;
    if (!list.length) {
      box.innerHTML = head + u.empty("Aún no hay fichas técnicas.", "Crea un indicador para generar su ficha.", "🗂️");
      document.getElementById("mtx-new").onclick = () => ficha(null);
      return;
    }
    box.innerHTML = head + `<div class="mtx-grid">${list.map(fichaSheet).join("")}</div>`;
    document.getElementById("mtx-new").onclick = () => ficha(null);
    box.querySelectorAll("[data-mtxedit]").forEach(b => b.onclick = () => ficha(S().get("indicadores", b.dataset.mtxedit)));
    box.querySelectorAll("[data-mtxver]").forEach(b => b.onclick = () => verVersiones(S().get("indicadores", b.dataset.mtxver)));
    box.querySelectorAll("[data-mtxdel]").forEach(b => b.onclick = () => u.confirmDelete("¿Eliminar este indicador y su ficha?", () => { S().remove("indicadores", b.dataset.mtxdel); renderTab(); }));
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
      <div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.25rem">
        ${/rnao|bpso/i.test(ind.programa || "") ? `<span class="tag" style="background:#0d6ea81f;color:#0d6ea8;border:1px solid #0d6ea855">🦉 RNAO / BPSO</span>` : ""}
        ${ind.codigoNquire ? `<span class="mono kpi__sub">${u.esc(ind.codigoNquire)}</span>` : ""}
      </div>
      <h3 class="card__title" style="font-size:1rem;margin-bottom:.1rem">${u.esc(ind.nombre || "Indicador")}</h3>
      ${ind.formula ? `<div class="kpi__sub" style="margin-bottom:.2rem">ƒ ${u.esc(ind.formula)}</div>` : ""}
      <div class="flex" style="justify-content:space-between;align-items:flex-end;margin:.3rem 0">
        <div><div style="font-size:1.9rem;font-weight:800;font-family:var(--font-disp);color:${sem.c};line-height:1">${cur == null ? "—" : cur + "%"}</div>
          <div class="kpi__sub">Meta ${ind.meta || "—"}% · ${cumpl != null ? cumpl + "% cumpl." : "—"}</div></div>
        <div class="right"><div style="font-weight:800;color:${t.fav == null ? "var(--text-2)" : (t.fav ? "var(--verde)" : "var(--danger)")}">${t.arrow} ${u.esc(t.txt)}</div>
          <div class="kpi__sub">${u.esc(ind.periodicidad || "")}</div>
          ${proximaChip(ind)}</div>
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
      { name: "nombre", label: "Nombre del indicador", required: true, full: true, value: rec.nombre || "", hint: "Nombre oficial del indicador. Ej: Valoración de riesgo de LPP al ingreso." },
      { name: "tipo", label: "Tipo de indicador", type: "select", options: TIPOS, value: tipo, hint: "Estructura = si algo existe · Proceso = cómo se hace · Resultado = efecto en el paciente · Impacto = efecto a largo plazo." },
      { name: "responsable", label: "Responsable", value: rec.responsable || "Enf. Coordinador/a UBPC", hint: "Quién mide y reporta este indicador." },
      { name: "objetivo", label: "Objetivo", type: "textarea", full: true, value: rec.objetivo || "", hint: "Qué se busca lograr o vigilar con este indicador (en una frase)." }
    ], {});
    const cambioField = rec.id ? u.formHTML([{ name: "cambioFicha", label: "Motivo del cambio (crea una nueva versión de la ficha)", full: true, value: "", hint: "Opcional. Si lo completas, la ficha sube de versión y queda registrado en el historial." }], {}) : "";

    u.modal({
      title: (rec.id ? "Editar" : "Nuevo") + " indicador" + (rec.id ? " · ficha v" + (rec.fichaVersion || 1) : ""), wide: true,
      body: `${commonTop}<div id="ind-dyn"></div>
        <h4 style="margin:.6rem 0 .3rem">Seguimiento (resultados por período)</h4>
        <div id="ind-segs"></div>
        <button type="button" class="btn btn--ghost btn--sm" id="ind-addseg">+ Agregar período</button>
        ${cambioField}`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar indicador</button>`,
      onMount(m) {
        const dyn = m.querySelector("#ind-dyn");
        const tipoSel = m.querySelector('select[name="tipo"]');
        function paintFormula() {
          const box = m.querySelector("#ind-formula"); if (!box) return;
          const nd = (m.querySelector('[name="numeradorDesc"]') || {}).value || "Numerador";
          const dd = (m.querySelector('[name="denominadorDesc"]') || {}).value || "Denominador";
          const nv = (m.querySelector('[name="numerador"]') || {}).value;
          const dv = (m.querySelector('[name="denominador"]') || {}).value;
          const pctTxt = (dv && Number(dv) > 0 && nv !== "") ? " = <b>" + Math.round(Number(nv) / Number(dv) * 100) + "%</b>" : "";
          box.innerHTML = `<span class="ind-formula__lbl">Fórmula</span>
            <div class="ind-formula__eq"><span class="ind-frac"><span class="num">${u.esc(nd)}</span><span class="bar"></span><span class="den">${u.esc(dd)}</span></span>
            <span class="x">× 100</span>${pctTxt}</div>`;
        }
        function renderDyn() {
          tipo = tipoSel.value;
          const estructura = tipo === "Estructura";
          dyn.innerHTML = (estructura ? "" : `<div class="ind-formula" id="ind-formula"></div>`) + u.formHTML([
            estructura ? null : { name: "numeradorDesc", label: "Numerador — ¿qué se cuenta?", full: true, value: rec.numeradorDesc || "", hint: "Define QUÉ casos cumplen. Ej: N° de pacientes con valoración de riesgo realizada ≤24 h." },
            estructura ? null : { name: "numerador", label: "Numerador (cantidad actual)", type: "number", value: rec.numerador != null ? rec.numerador : "", hint: "Se actualiza solo al registrar cada medición mensual. Puedes dejarlo vacío aquí." },
            estructura ? null : { name: "denominadorDesc", label: "Denominador — ¿sobre qué total?", full: true, value: rec.denominadorDesc || "", hint: "Define el TOTAL sobre el que se mide. Ej: Total de pacientes evaluados en el período." },
            estructura ? null : { name: "denominador", label: "Denominador (cantidad actual)", type: "number", value: rec.denominador != null ? rec.denominador : "", hint: "Se actualiza solo al registrar cada medición mensual. Puedes dejarlo vacío aquí." },
            { name: "fuenteDatos", label: "Fuente de información", full: true, value: rec.fuenteDatos || "", hint: "De dónde sale el dato. Ej: ficha clínica, pauta de cotejo, registro de enfermería." },
            { name: "periodicidad", label: "Periodicidad", type: "select", options: PERIODICIDAD, value: rec.periodicidad || "Trimestral", hint: "Cada cuánto se mide. Para los indicadores LPP de NQUIRE es Mensual." },
            { name: "fechaMedicion", label: "Fecha de la última medición", type: "date", value: rec.fechaMedicion ? ui().isoDay(rec.fechaMedicion) : "", hint: "Se usa para calcular y avisar la próxima medición según la periodicidad." },
            { name: "sentido", label: "Sentido de la meta", type: "select", options: SENTIDOS, value: rec.sentido || "Mayor es mejor", hint: "«Mayor es mejor» para cumplimiento (ej. valoración) · «Menor es mejor» para daño (ej. incidencia)." },
            { name: "meta", label: "Estándar de cumplimiento / Meta (%)", type: "number", value: rec.meta != null ? rec.meta : "", hint: "Umbral esperado. Ej: ≥95% en procesos, ≤5% en incidencia de LPP." },
            { name: "lineaBase", label: "Línea base (%)", type: "number", value: rec.lineaBase != null ? rec.lineaBase : "", hint: "Primer resultado medido, antes de intervenir. Sirve de punto de comparación." },
            { name: "metodologia", label: "Metodología de evaluación (un criterio por línea)", type: "textarea", full: true, rows: 3, value: rec.metodologia || "", hint: "Escribe un criterio por línea; cada línea será un ítem numerado en la ficha." }
          ].filter(Boolean), {});
          paintFormula();
          ["numeradorDesc", "denominadorDesc", "numerador", "denominador"].forEach(n => { const el = m.querySelector(`[name="${n}"]`); if (el) el.addEventListener("input", paintFormula); });
        }
        tipoSel.onchange = renderDyn; renderDyn();

        const segBox = m.querySelector("#ind-segs");
        function renderSegs() {
          segBox.innerHTML = segs.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Período</th><th>Valor (%)</th><th></th></tr></thead><tbody>
            ${segs.map((s, i) => `<tr><td><input class="input" data-si="${i}" data-sf="periodo" value="${u.esc(s.periodo || "")}" placeholder="2026-09"></td>
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
          if (!d.responsable) d.responsable = "Enf. Coordinador/a UBPC";
          // Fórmula automática (indicadores no estructurales)
          if (d.tipo !== "Estructura") d.formula = "(" + (d.numeradorDesc || "Numerador") + " ÷ " + (d.denominadorDesc || "Denominador") + ") × 100";
          else d.formula = "";
          // Versión de la ficha
          const me = U.auth.current();
          if (rec.id) {
            if ((d.cambioFicha || "").trim()) {
              d.fichaVersion = (rec.fichaVersion || 1) + 1;
              d.fichaHist = (rec.fichaHist || []).concat([{ version: d.fichaVersion, fecha: new Date().toISOString(), por: me ? me.nombre : "—", cambio: d.cambioFicha.trim() }]);
            } else {
              d.fichaVersion = rec.fichaVersion || 1;
              d.fichaHist = rec.fichaHist || [];
            }
            delete d.cambioFicha;
            S().update("indicadores", rec.id, d);
          } else {
            d.fichaVersion = 1;
            d.fichaHist = [{ version: 1, fecha: new Date().toISOString(), por: me ? me.nombre : "—", cambio: "Creación de la ficha" }];
            S().insert("indicadores", d);
          }
          u.closeModal(); u.toast("Indicador guardado", "ok"); renderTab();
        };
      }
    });
  }

  function addSeguimiento(ind) {
    const u = ui();
    const estructura = ind.tipo === "Estructura";
    const ym = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); })();
    u.modal({
      title: "Registrar medición · " + (ind.nombre || ""),
      body: (estructura
          ? `<p class="card__hint">Indica el resultado del período para este indicador de estructura.</p>`
          : `<p class="card__hint">Ingresa los <strong>dos datos que pide NQUIRE</strong>: el <strong>numerador</strong> (los que cumplen) y el <strong>denominador</strong> (el total). El portal calcula el <strong>resultado (%)</strong> automáticamente.</p>`) +
        u.formHTML([
          { name: "periodo", label: "Período (mes que reportas)", type: "month", value: ym, hint: "Mes al que corresponde la medición, en formato AAAA-MM (ej. 2026-09). Es el período que reportas a NQUIRE." },
          { name: "fecha", label: "Fecha en que registras la medición", type: "date", value: u.hoyISO(), hint: "Día en que ingresas el dato. Se usa para avisar la próxima medición." },
          estructura ? null : { name: "numerador", label: "Numerador (los que cumplen)", type: "number", full: true, hint: (ind.numeradorDesc ? ind.numeradorDesc + "." : "") + " Cuántos casos cumplen la condición del indicador." },
          estructura ? null : { name: "denominador", label: "Denominador (el total)", type: "number", full: true, hint: (ind.denominadorDesc ? ind.denominadorDesc + "." : "") + " Total de casos sobre el que se mide." },
          { name: "valor", label: "Resultado (%)", type: "number", hint: estructura ? "Porcentaje o valor del período." : "Se calcula solo (numerador ÷ denominador × 100). Solo escríbelo a mano si no tienes numerador y denominador." }
        ].filter(Boolean), {}),
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button><button class="btn btn--primary" data-save>Guardar medición</button>`,
      onMount(m) {
        const numI = m.querySelector('[name="numerador"]'), denI = m.querySelector('[name="denominador"]'), valI = m.querySelector('[name="valor"]');
        const calc = () => {
          if (!numI || !denI || !valI) return;
          const n = Number(numI.value), d = Number(denI.value);
          if (numI.value !== "" && d > 0) { valI.value = Math.round(n / d * 100); valI.readOnly = true; valI.style.background = "var(--surface-2)"; }
          else { valI.readOnly = false; valI.style.background = ""; }
        };
        if (numI) numI.addEventListener("input", calc);
        if (denI) denI.addEventListener("input", calc);
        calc();
        m.querySelector("[data-save]").onclick = () => {
          const d = u.readForm(m);
          const num = d.numerador !== "" && d.numerador != null ? Number(d.numerador) : null;
          const den = d.denominador !== "" && d.denominador != null ? Number(d.denominador) : null;
          let valor = (num != null && den > 0) ? Math.round(num / den * 100) : (d.valor !== "" ? Number(d.valor) : null);
          if (valor == null) { u.toast(estructura ? "Indica el resultado (%)" : "Indica numerador y denominador (o el %)", "danger"); return; }
          const entry = { periodo: d.periodo, valor: valor, fecha: d.fecha || "" };
          if (num != null) entry.numerador = num;
          if (den != null) entry.denominador = den;
          const segs = (ind.seguimientos || []).concat([entry]);
          const patch = { seguimientos: segs };
          if (num != null) patch.numerador = num;   // refleja el último período (para el panel RNAO y el semáforo)
          if (den != null) patch.denominador = den;
          if (d.fecha) patch.fechaMedicion = d.fecha;
          S().update("indicadores", ind.id, patch);
          u.closeModal(); u.toast("Medición registrada", "ok"); renderTab();
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
          ${fila("Valor actual", cur == null ? "—" : cur + "%")}${fila("Estándar de cumplimiento", estandarTxt(ind))}
          ${fila("Cumplimiento", cumplimiento(ind) != null ? cumplimiento(ind) + "%" : "—")}${fila("Sentido", ind.sentido)}
          ${fila("Línea base", ind.lineaBase !== "" && ind.lineaBase != null ? ind.lineaBase + "%" : "—")}${fila("Periodicidad", ind.periodicidad)}
          ${(() => { const pi = proximaInfo(ind); return pi ? fila("Próxima medición", pi.overdue ? "Pendiente · " + pi.label : pi.label) : ""; })()}
          ${ind.tipo !== "Estructura" ? fila("Fórmula", ind.formula) + fila("Numerador / Denominador", (ind.numerador || "—") + " / " + (ind.denominador || "—")) : ""}
          ${fila("Fuente de información", ind.fuenteDatos)}${fila("Responsable", ind.responsable)}
          ${fila("Ficha", "Versión " + (ind.fichaVersion || 1))}
        </div>
        <div style="grid-column:1/-1"><span class="muted" style="font-size:12px;font-weight:600">Objetivo</span><p class="narrativo">${u.esc(ind.objetivo || "—")}</p></div>
        ${(ind.metodologia || "").trim() ? `<div style="grid-column:1/-1"><span class="muted" style="font-size:12px;font-weight:600">Metodología de evaluación</span><ol class="mtx-crit">${ind.metodologia.split(/\r?\n/).map(x => x.trim()).filter(Boolean).map(x => `<li>${u.esc(x)}</li>`).join("")}</ol></div>` : ""}
        ${(ind.seguimientos && ind.seguimientos.length) ? `<h4 style="margin:.6rem 0 .2rem">Mediciones registradas · reporte NQUIRE</h4>
          <div class="table-wrap"><table class="tbl"><thead><tr><th>Período</th><th class="right">Numerador</th><th class="right">Denominador</th><th class="right">Resultado</th></tr></thead>
          <tbody>${ind.seguimientos.slice().reverse().map(s => `<tr><td>${u.esc(s.periodo || "—")}</td><td class="num">${s.numerador != null ? s.numerador : "—"}</td><td class="num">${s.denominador != null ? s.denominador : "—"}</td><td class="num"><strong>${s.valor != null ? s.valor + "%" : "—"}</strong></td></tr>`).join("")}</tbody></table></div>` : ""}
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
  U.coord.binders.indicadores = indBind;
  // Utilidad reutilizable (Agenda): próxima medición según periodicidad
  U.indicadoresUtil = { proximaMedicion, proximaInfo };

  /* Cálculos expuestos para reportes u otros módulos */
  U.indicadoresCalc = { currentValue, semaforo, cumplimiento, serie, tendencia, SEM, TIPO_COLOR };
})();
