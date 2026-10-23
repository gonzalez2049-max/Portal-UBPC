/* ============================================================
   DATA — Semillas iniciales y catálogos institucionales
   ============================================================ */
(function () {
  "use strict";
  const store = () => window.UBPC.store;

  /* ---------- Catálogos reutilizables ---------- */
  const CAT = {
    unidades: [
      "Emergencia Hospitalaria", "UCI Valech", "Quemados",
      "UCM 3 piso", "UCM 4 piso", "UCM 6 piso", "UTI",
      "Clínica Asistencial", "Pabellón y Anestesia", "Esterilización",
      "Buenas Prácticas Clínicas", "Acceso Vascular", "Angiografía",
      "Subdirección de Gestión del Cuidado", "Hospitalización Domiciliaria",
      "Control Post Alta", "Epidemiología – Gestión RedCap",
      "Programa Control Infecciones – IAAS", "Calidad y Seguridad del Paciente",
      "Gestión de Casos · Oncología", "Gestión de Casos · Psiquiatría y Psicología de Enlace",
      "Gestión de Casos · Medicina Paliativa", "Gestión de Casos · Nefrología",
      "Gestión de Casos · Neurología",
      "Todas las unidades"
    ],
    estamentos: ["Enfermería", "TENS", "Auxiliar de servicio", "Médico", "Kinesiología", "Multiestamento", "Otro"],
    prioridades: ["alta", "media", "baja"],
    guiasArea: ["Lesiones por presión", "Accesos vasculares", "Cuidados centrados en la persona y la familia"],
    pilares: ["Calidad y seguridad", "Gestión del cuidado", "Formación continua",
              "Evidencia científica", "Articulación institucional"],
    tiposColaboracion: ["Asesoría Técnica", "Colaboración interna", "Visita técnica",
      "Curso", "Capacitación", "Curso B-learning", "Taller", "Exposición", "Otra colaboración"],
    rolUBPC: ["Solicitó apoyo", "Entregó apoyo", "Colaboración recíproca"],
    tiposDocumento: ["Protocolo", "Guía", "Norma", "Procedimiento", "Manual", "Instructivo", "Flujograma", "Otro"],
    estadosDoc: ["Borrador", "En revisión", "Vigente", "Enviado a Calidad", "Obsoleto"],
    estadoGenerico: ["Pendiente", "En curso", "Completado"],
    tipoEvaluacion: ["Línea base", "Seguimiento"],
    modoIngreso: ["Tengo porcentajes del informe", "Tengo casos auditados"],
    frecuencias: ["Mensual", "Bimensual", "Trimestral", "Semestral", "Anual"]
  };

  /* ---------- Indicadores oficiales por guía (Anexo 4 · Atención Cerrada,
     Norma Técnica de implementación RNAO/BPSO) ---------- */
  const INDICADORES = {
    "Caídas": [
      "Educación de precauciones universales de caídas",
      "Evaluación posterior a las caídas",
      "Tasa de caídas de pacientes",
      "Lesiones relacionadas a caídas"
    ],
    "Lesiones por presión": [
      "Valoración de riesgo de LPP",
      "Reevaluación riesgo LPP",
      "Prevención LPP: uso superficie manejo de presión",
      "Plan preventivo acorde al riesgo",
      "Incidencia LPP"
    ],
    "Accesos vasculares": [
      "Educación práctica a proveedores de salud",
      "Protocolo de cuidado multicomponente de DAVP",
      "Complicaciones no infecciosas DAVC",
      "Infección torrente sanguíneo por vía central (Tasa)"
    ]
  };

  /* ---------- Clasificación de indicadores (modelo Donabedian / NQuIRE) ----------
     Estructura = recursos/capacidad · Proceso = si se hace la práctica recomendada
     · Resultado = efecto clínico. Según el Anexo 4 de la Norma Técnica. */
  const INDICADOR_TIPO = {
    // Caídas
    "Educación de precauciones universales de caídas": "Estructura",
    "Evaluación posterior a las caídas": "Proceso",
    "Tasa de caídas de pacientes": "Resultado",
    "Lesiones relacionadas a caídas": "Resultado",
    // Lesiones por presión
    "Valoración de riesgo de LPP": "Proceso",
    "Reevaluación riesgo LPP": "Proceso",
    "Prevención LPP: uso superficie manejo de presión": "Proceso",
    "Plan preventivo acorde al riesgo": "Proceso",
    "Incidencia LPP": "Resultado",
    // Accesos vasculares
    "Educación práctica a proveedores de salud": "Estructura",
    "Protocolo de cuidado multicomponente de DAVP": "Proceso",
    "Complicaciones no infecciosas DAVC": "Resultado",
    "Infección torrente sanguíneo por vía central (Tasa)": "Resultado"
  };

  /* ---------- Fórmula del indicador (numerador / denominador) · Anexo 4 ---------- */
  const INDICADOR_FORMULA = {
    "Educación de precauciones universales de caídas": { num: "N° trabajadores de la salud educados", den: "N° total trabajadores de la salud" },
    "Evaluación posterior a las caídas": { num: "N° pacientes evaluados posterior a una caída", den: "N° total pacientes con 1 o más caídas" },
    "Tasa de caídas de pacientes": { num: "N° total pacientes con caída", den: "N° total días cama ocupados" },
    "Lesiones relacionadas a caídas": { num: "N° caídas con lesiones", den: "N° total pacientes con caída" },
    "Valoración de riesgo de LPP": { num: "N° pacientes con valoración riesgo LPP antes de 24 h del ingreso", den: "N° pacientes evaluados" },
    "Reevaluación riesgo LPP": { num: "N° pacientes hospitalizados revalorados según protocolo local", den: "N° pacientes evaluados" },
    "Prevención LPP: uso superficie manejo de presión": { num: "N° pacientes con riesgo moderado y alto con uso superficie manejo presión", den: "N° pacientes con riesgo moderado y alto evaluados" },
    "Plan preventivo acorde al riesgo": { num: "N° usuarios en riesgo con plan preventivo acorde a su nivel de riesgo", den: "N° total usuarios en riesgo de desarrollar LPP" },
    "Incidencia LPP": { num: "N° pacientes con al menos una LPP categoría II a IV", den: "N° pacientes egresados del servicio clínico (alta + trasladados + fallecidos)" },
    "Educación práctica a proveedores de salud": { num: "N° proveedores de salud con educación práctica en inserción y/o mantenimiento de DAV", den: "N° proveedores de salud" },
    "Protocolo de cuidado multicomponente de DAVP": { num: "N° pacientes con DAVP con atención según protocolo", den: "N° pacientes con DAVP" },
    "Complicaciones no infecciosas DAVC": { num: "N° pacientes con complicaciones no infecciosas DAVC", den: "N° pacientes con DAVC" },
    "Infección torrente sanguíneo por vía central (Tasa)": { num: "N° infecciones del torrente sanguíneo asociadas a la vía central", den: "N° total días de DAVC" }
  };
  function indicadorFormula(nombre) {
    const f = INDICADOR_FORMULA[(nombre || "").trim()];
    return f ? (f.num + " ÷ " + f.den + " × 100") : "";
  }
  const TIPO_DONABEDIAN = {
    "Estructura": { color: "#7a5cd0", ic: "🏗️", def: "Recursos y capacidad (disponibilidad de insumos, protocolos vigentes, dotación)." },
    "Proceso":    { color: "#176ac0", ic: "⚙️", def: "Si se realiza la práctica recomendada (adherencia: valoración, prevención, registro)." },
    "Resultado":  { color: "#2f9d57", ic: "🎯", def: "Efecto clínico observado (incidencia de LPP, tasa de caídas, infección de la vía central)." }
  };
  function indicadorTipo(nombre) { return INDICADOR_TIPO[(nombre || "").trim()] || "Proceso"; }

  /* ---------- Catálogo de indicadores NQuIRE (por guía) ----------
     Indicadores oficiales NQuIRE del programa BPSO. El "Indicador de éxito" del
     plan (Fase 6) se elige de aquí para dar trazabilidad y comparabilidad.
     Nota: por ahora se carga el indicador de proceso de LPP tomado del
     Consolidado Nacional (ulcerprev_pro01). Se pueden agregar los demás. */
  const NQUIRE = {
    "Lesiones por presión": [
      {
        codigo: "ulcerprev_pro01",
        nombre: "Valoración de riesgo de LPP al ingreso",
        tipo: "Proceso",
        recomendaciones: "RNAO 1.1 y 1.2a",
        descripcion: "Porcentaje de usuarios que ingresan al servicio clínico en los que se cumple la valoración del riesgo de LPP mediante escala validada (NSRAS, Braden Q o Braden) antes de las 24 horas.",
        formula: "N° de usuarios con valoración del riesgo de LPP con escala validada antes de 24 h desde el ingreso ÷ N° total de usuarios evaluados que ingresaron al servicio durante el mes × 100",
        periodicidad: "Mensual",
        interpretacion: "La mejora se observa como un aumento en el porcentaje.",
        alias: ["valoracion de riesgo", "escala de riesgo", "valoracion del riesgo"]
      },
      // Indicadores de práctica de la unidad (código NQuIRE por confirmar con el consolidado).
      { codigo: "", nombre: "Cumplimiento de medidas preventivas según riesgo", tipo: "Proceso", periodicidad: "Mensual",
        recomendaciones: "RNAO — implementación de medidas preventivas",
        descripcion: "Porcentaje de usuarios en riesgo con aplicación de las medidas preventivas de LPP acordes a su nivel de riesgo (incluye cambios de posición, superficie de alivio, cuidado de la piel y manejo de la humedad).",
        formula: "N° de usuarios en riesgo con medidas preventivas aplicadas según su nivel de riesgo ÷ N° total de usuarios en riesgo × 100",
        alias: ["medidas preventivas", "cumplimiento de medidas", "aplicacion de medidas"] },
      { codigo: "", nombre: "Reevaluación del riesgo según condición clínica", tipo: "Proceso", periodicidad: "Mensual",
        descripcion: "Porcentaje de usuarios en riesgo con reevaluación del riesgo de LPP ante cambios en su condición clínica.",
        formula: "N° de usuarios en riesgo con reevaluación del riesgo de LPP registrada según cambio de condición ÷ N° total de usuarios en riesgo × 100",
        alias: ["reevaluacion"] },
      { codigo: "", nombre: "Plan preventivo acorde al riesgo", tipo: "Proceso", periodicidad: "Mensual",
        descripcion: "Porcentaje de usuarios en riesgo con un plan preventivo de LPP acorde a su nivel de riesgo.",
        formula: "N° de usuarios en riesgo con plan preventivo acorde a su nivel de riesgo ÷ N° total de usuarios en riesgo × 100",
        alias: ["plan preventivo"] },
      { codigo: "", nombre: "Cambios de posición según riesgo", tipo: "Proceso", periodicidad: "Mensual",
        descripcion: "Porcentaje de usuarios en riesgo con registro de cambios de posición según la frecuencia indicada por su nivel de riesgo.",
        formula: "N° de usuarios en riesgo con registro de cambios de posición según la frecuencia indicada ÷ N° total de usuarios en riesgo × 100",
        alias: ["cambios de posicion", "cambio de posicion"] },
      { codigo: "", nombre: "Superficie de alivio o redistribución de presión", tipo: "Estructura", periodicidad: "Mensual",
        descripcion: "Porcentaje de usuarios en riesgo con superficie de alivio o redistribución de presión indicada según su nivel de riesgo.",
        formula: "N° de usuarios en riesgo con superficie de alivio/redistribución indicada según su nivel de riesgo ÷ N° total de usuarios en riesgo × 100",
        alias: ["superficie de alivio", "redistribucion de presion", "colchon"] },
      { codigo: "", nombre: "Registro de LPP previa (al ingreso)", tipo: "Proceso", periodicidad: "Mensual",
        descripcion: "Porcentaje de usuarios con registro de la valoración de LPP presentes al ingreso.",
        formula: "N° de usuarios con registro de valoración de LPP previa al ingreso ÷ N° total de usuarios ingresados × 100",
        alias: ["lpp previa", "registro de lpp"] },
      { codigo: "", nombre: "Pacientes sin LPP intrahospitalaria", tipo: "Resultado", periodicidad: "Mensual",
        descripcion: "Porcentaje de usuarios que no desarrollan LPP de origen intrahospitalario durante su hospitalización.",
        formula: "N° de usuarios sin LPP de origen intrahospitalario ÷ N° total de usuarios evaluados × 100",
        alias: ["sin lpp", "incidencia", "prevalencia", "intrahospitalaria"] }
    ]
  };
  function nquireFor(guia) { return NQUIRE[(guia || "").trim()] || []; }
  // Normaliza para emparejar sin importar mayúsculas, acentos ni espacios extra.
  function _norm(s) {
    return (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  }
  function nquireByName(nombre) {
    const n = _norm(nombre);
    if (!n) return null;
    let all = [];
    for (const g in NQUIRE) all = all.concat(NQUIRE[g]);
    // 1) coincidencia exacta normalizada
    let hit = all.find(i => _norm(i.nombre) === n);
    if (hit) return hit;
    // 2) por alias contenido en el texto
    hit = all.find(i => (i.alias || []).some(a => n.indexOf(_norm(a)) >= 0));
    if (hit) return hit;
    // 3) el nombre del catálogo está contenido en el texto (o viceversa)
    hit = all.find(i => { const cn = _norm(i.nombre); return cn && (n.indexOf(cn) >= 0 || cn.indexOf(n) >= 0); });
    return hit || null;
  }

  /* ---------- Deducir el TEMA/guía de un indicador ----------
     Usa la guía guardada si existe; si no, la deduce del nombre (catálogo
     oficial, catálogo NQuIRE o por palabras clave). Así los indicadores
     antiguos (sin campo "guia") igual se agrupan por tema. */
  function guiaDeIndicador(nombre, guiaGuardada) {
    const gg = (guiaGuardada || "").toString().trim();
    if (gg && gg.toLowerCase() !== "general") return gg;
    const n = _norm(nombre);
    if (!n) return "General";
    // 1) nombre exacto dentro del catálogo oficial (INDICADORES)
    for (const g in INDICADORES) if ((INDICADORES[g] || []).some(x => _norm(x) === n)) return g;
    // 2) catálogo NQuIRE (por guía)
    for (const g in NQUIRE) if ((NQUIRE[g] || []).some(i => _norm(i.nombre) === n || (i.alias || []).some(a => n.indexOf(_norm(a)) >= 0))) return g;
    // 3) nombre del catálogo contenido en el texto (o viceversa)
    for (const g in INDICADORES) if ((INDICADORES[g] || []).some(x => { const cx = _norm(x); return cx && (n.indexOf(cx) >= 0 || cx.indexOf(n) >= 0); })) return g;
    // 4) por palabras clave
    if (/\blpp\b|presion|presión|ulcer|escara/.test(n)) return "Lesiones por presión";
    if (/caid|caíd/.test(n)) return "Caídas";
    if (/vascular|\bdav\b|davp|davc|via central|vía central|torrente|cateter|catéter|acceso/.test(n)) return "Accesos vasculares";
    if (/centrad|persona y (la )?familia|\bccpf\b|cuidados centrados/.test(n)) return "Cuidados centrados en la persona y la familia";
    return "General";
  }

  /* ---------- Semilla inicial (solo si la base está vacía) ---------- */
  function seedIfEmpty() {
    const s = store();
    if (s.all("usuarios").length === 0) {
      s.insert("usuarios", {
        rol: "coordinador",
        nombre: "Coordinador/a UBPC",
        cargo: "Coordinador/a UBPC",
        unidad: "Unidad de Buenas Prácticas Clínicas – UBPC",
        foto: "", esPlaceholder: true
      }, { silent: true });
      s.insert("usuarios", {
        rol: "referente",
        nombre: "Referente Técnico",
        cargo: "Referente Técnico de Buenas Prácticas Clínicas",
        unidad: "Unidad de Buenas Prácticas Clínicas – UBPC",
        foto: "", esPlaceholder: true
      }, { silent: true });
    }

    if (s.all("guiasBPSO").length === 0) {
      CAT.guiasArea.forEach(area => {
        s.insert("guiasBPSO", {
          nombre: "Guía BPSO – " + area,
          area,
          estado: "Activa",
          unidadesImplementadoras: []
        }, { silent: true });
      });
    }

    if (s.getConfig("__seeded") !== true) {
      s.setConfig("__seeded", true);
      // Hito institucional de inicio (línea de tiempo del Home)
      if (s.all("hitos").length === 0) {
        s.insert("hitos", {
          fecha: new Date().toISOString(),
          icono: "🚀", modulo: "Portal",
          titulo: "Puesta en marcha del Portal de Gestión Operativa",
          descripcion: "Inicio del registro digital de la gestión de la UBPC."
        }, { silent: true });
      }
    }
  }

  /* ---------- Color de identidad por guía (etiquetas y gráficos) ----------
     Estable por nombre de guía y consistente en todo el portal. No usa morado:
     ese color queda reservado para la línea de "Meta institucional". */
  const GUIA_COLORS = {
    "Lesiones por presión": "#12b5a5",
    "Accesos vasculares":   "#e0912f",
    "Cuidados centrados en la persona y la familia": "#1e9fe0",
    "Caídas":               "#e0526f"
  };
  const GUIA_PALETTE = ["#12b5a5", "#e0912f", "#e0526f", "#37a04a", "#1e9fe0", "#0891b2", "#be185d", "#8a6d3b"];
  function guiaColor(nombre) {
    const n = (nombre || "").trim();
    if (GUIA_COLORS[n]) return GUIA_COLORS[n];
    let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    return GUIA_PALETTE[h % GUIA_PALETTE.length];
  }

  // Color por UNIDAD (consistente) para reconocer planes/registros por unidad.
  const UNIDAD_PALETTE = ["#1554b8", "#0f8f83", "#7a5cd0", "#e0912f", "#e0526f", "#37a04a", "#0d6ea8", "#b8355a", "#c86a1f", "#2f9d57", "#8a44c9", "#0d8175"];
  function unidadColor(nombre) {
    const n = (nombre || "").trim();
    if (!n) return "#8a97a8";
    const idx = CAT.unidades.indexOf(n);               // color por posición → distinto entre unidades conocidas
    if (idx >= 0) return UNIDAD_PALETTE[idx % UNIDAD_PALETTE.length];
    let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    return UNIDAD_PALETTE[h % UNIDAD_PALETTE.length];
  }

  // Escape mínimo para los helpers de chips (data.js no depende de U.ui).
  function _esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m])); }
  /* ---------- Chips consistentes de GUÍA y UNIDAD (en todo el portal) ----------
     Deben distinguirse SIEMPRE, no solo por color:
     · Guía  = píldora RELLENA (color sólido, texto blanco) con 📋
     · Unidad = chip con BORDE punteado (tinte claro + contorno) con 🏥
     Así, aunque los colores se parezcan, nunca se confunde una con otra. */
  function guiaChip(nombre, opts) {
    opts = opts || {}; const c = guiaColor(nombre); const t = (nombre == null || nombre === "") ? "—" : nombre;
    const ico = opts.noIcon ? "" : "📋 ";
    return `<span class="tag tag--guia" style="--chip-c:${c}" title="Guía BPSO">${ico}${_esc(t)}</span>`;
  }
  function unidadChip(nombre, opts) {
    opts = opts || {}; const c = unidadColor(nombre); const t = (nombre == null || nombre === "") ? "—" : nombre;
    const ico = opts.noIcon ? "" : "🏥 ";
    return `<span class="tag tag--unidad" style="--chip-c:${c}" title="Unidad">${ico}${_esc(t)}</span>`;
  }

  window.UBPC = window.UBPC || {};
  window.UBPC.data = { CAT, INDICADORES, seedIfEmpty, guiaColor, unidadColor, guiaChip, unidadChip, INDICADOR_TIPO, INDICADOR_FORMULA, TIPO_DONABEDIAN, indicadorTipo, indicadorFormula, NQUIRE, nquireFor, nquireByName, guiaDeIndicador };
})();
