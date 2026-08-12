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
    estamentos: ["Enfermería", "TENS", "Médico", "Kinesiología", "Matrona", "Multiestamento", "Otro"],
    prioridades: ["alta", "media", "baja"],
    guiasArea: ["Lesiones por presión", "Accesos vasculares", "Dolor"],
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

  /* ---------- Indicadores oficiales por guía BPSO ---------- */
  const INDICADORES = {
    "Lesiones por presión": [
      "Escala de riesgo aplicada antes de 6 horas",
      "Reevaluación según condición clínica",
      "Plan preventivo acorde al riesgo",
      "Cambios de posición",
      "Superficie de alivio o redistribución de presión",
      "Registro de LPP previa",
      "Pacientes sin LPP intrahospitalaria"
    ],
    "Accesos vasculares": [
      "Indicación documentada",
      "Evaluación diaria del acceso vascular",
      "Vigilancia del sitio de inserción",
      "Accesos sin complicaciones (flebitis/infección)"
    ],
    "Dolor": [
      "Valoración inicial del dolor",
      "Reevaluación posterior a la intervención",
      "Manejo multimodal del dolor",
      "Pacientes con dolor controlado (EVA ≤ meta)"
    ]
  };

  /* ---------- Clasificación de indicadores (modelo Donabedian / NQuIRE) ----------
     Estructura = recursos/capacidad · Proceso = si se hace la práctica recomendada
     · Resultado = efecto clínico. Se asigna automáticamente por nombre. */
  const INDICADOR_TIPO = {
    // Lesiones por presión
    "Escala de riesgo aplicada antes de 6 horas": "Proceso",
    "Reevaluación según condición clínica": "Proceso",
    "Plan preventivo acorde al riesgo": "Proceso",
    "Cambios de posición": "Proceso",
    "Superficie de alivio o redistribución de presión": "Estructura",
    "Registro de LPP previa": "Proceso",
    "Pacientes sin LPP intrahospitalaria": "Resultado",
    // Accesos vasculares
    "Indicación documentada": "Proceso",
    "Evaluación diaria del acceso vascular": "Proceso",
    "Vigilancia del sitio de inserción": "Proceso",
    "Accesos sin complicaciones (flebitis/infección)": "Resultado",
    // Dolor
    "Valoración inicial del dolor": "Proceso",
    "Reevaluación posterior a la intervención": "Proceso",
    "Manejo multimodal del dolor": "Proceso",
    "Pacientes con dolor controlado (EVA ≤ meta)": "Resultado"
  };
  const TIPO_DONABEDIAN = {
    "Estructura": { color: "#7a5cd0", ic: "🏗️", def: "Recursos y capacidad (disponibilidad de insumos, protocolos vigentes, dotación)." },
    "Proceso":    { color: "#176ac0", ic: "⚙️", def: "Si se realiza la práctica recomendada (adherencia: valoración, cambios de posición, registro)." },
    "Resultado":  { color: "#2f9d57", ic: "🎯", def: "Efecto clínico observado (incidencia/prevalencia de LPP, tasa de complicaciones)." }
  };
  function indicadorTipo(nombre) { return INDICADOR_TIPO[(nombre || "").trim()] || "Proceso"; }

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
    "Dolor":                "#e0526f"
  };
  const GUIA_PALETTE = ["#12b5a5", "#e0912f", "#e0526f", "#37a04a", "#1e9fe0", "#0891b2", "#be185d", "#8a6d3b"];
  function guiaColor(nombre) {
    const n = (nombre || "").trim();
    if (GUIA_COLORS[n]) return GUIA_COLORS[n];
    let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    return GUIA_PALETTE[h % GUIA_PALETTE.length];
  }

  window.UBPC = window.UBPC || {};
  window.UBPC.data = { CAT, INDICADORES, seedIfEmpty, guiaColor, INDICADOR_TIPO, TIPO_DONABEDIAN, indicadorTipo };
})();
