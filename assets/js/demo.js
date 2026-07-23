/* ============================================================
   DEMO — Datos de ejemplo para presentar el portal con contenido
   ============================================================ */
(function () {
  "use strict";
  const U = window.UBPC;
  const S = () => U.store;
  const iso = d => new Date(Date.now() - d * 864e5).toISOString();
  const isoIn = d => new Date(Date.now() + d * 864e5).toISOString();
  const ind = (names, pcts) => names.map((n, i) => ({ nombre: n, porcentaje: pcts[i] }));

  function add(coll, rows, opts) {
    rows.forEach(r => S().insert(coll, r, opts || {}));
  }

  function load() {
    const s = S();
    // Base limpia conservando los perfiles (para no invalidar la sesión activa)
    const users = s.all("usuarios");
    s.reset();
    if (users.length) s.replaceAll("usuarios", users);
    s.setConfig("__seeded", true); // evita que seedIfEmpty duplique el hito inicial
    U.data.seedIfEmpty();          // repone las guías BPSO (perfiles ya presentes)
    const I = U.data.INDICADORES;
    const LPP = I["Lesiones por presión"], AV = I["Accesos vasculares"], DOL = I["Dolor"];

    // Guías BPSO: unidades implementadoras
    s.all("guiasBPSO").forEach(g => {
      const map = {
        "Lesiones por presión": "UTI, UCI Valech, UCM 3 piso",
        "Accesos vasculares": "UCI Valech, UTI",
        "Dolor": "Emergencia Hospitalaria, UCM 3 piso"
      };
      s.update("guiasBPSO", g.id, { unidadesImplementadoras: map[g.area] || "" });
    });

    /* ---------- RNAO: evaluaciones (con tendencia) ---------- */
    add("evaluacionesRNAO", [
      { anio: 2025, periodo: "2025-S2", fecha: iso(210), tipo: "Línea base", guia: "Lesiones por presión", unidad: "UTI",
        frecuencia: "Semestral", fuente: "Auditoría de fichas", responsable: "EU. Carolina Reyes", referente: "EU. Marcos Soto",
        meta: 90, modoIngreso: "Tengo porcentajes del informe", resultadoGlobalOficial: 64, indicadores: ind(LPP, [90, 55, 70, 60, 40, 80]),
        brechas: "Registro de reevaluación y superficie de alivio bajo meta." },
      { anio: 2026, periodo: "2026-S1", fecha: iso(35), tipo: "Seguimiento", guia: "Lesiones por presión", unidad: "UTI",
        frecuencia: "Semestral", fuente: "Auditoría de fichas", responsable: "EU. Carolina Reyes", referente: "EU. Marcos Soto",
        meta: 90, modoIngreso: "Tengo porcentajes del informe", resultadoGlobalOficial: 71, proximaMedicion: isoIn(24),
        indicadores: ind(LPP, [95, 60, 80, 70, 45, 88]), brechas: "Superficie de alivio persiste como brecha crítica." },
      { anio: 2026, periodo: "2026-S1", fecha: iso(28), tipo: "Seguimiento", guia: "Accesos vasculares", unidad: "UCI Valech",
        frecuencia: "Trimestral", fuente: "Rondas clínicas", responsable: "EU. Marcos Soto", referente: "EU. Marcos Soto",
        meta: 90, modoIngreso: "Tengo casos auditados", resultadoGlobalOficial: 86,
        indicadores: [
          { nombre: AV[0], denominador: 20, cumplen: 18, noCumplen: 2, noAplica: 0 },
          { nombre: AV[1], denominador: 20, cumplen: 16, noCumplen: 4, noAplica: 0 },
          { nombre: AV[2], denominador: 20, cumplen: 17, noCumplen: 3, noAplica: 0 }
        ], brechas: "Evaluación diaria del acceso a reforzar." },
      { anio: 2026, periodo: "2026-S1", fecha: iso(21), tipo: "Seguimiento", guia: "Dolor", unidad: "Emergencia Hospitalaria",
        frecuencia: "Trimestral", fuente: "Encuesta y ficha", responsable: "EU. Marcos Soto", referente: "EU. Marcos Soto",
        meta: 90, modoIngreso: "Tengo porcentajes del informe", resultadoGlobalOficial: 78, indicadores: ind(DOL, [80, 74, 78]),
        brechas: "Reevaluación posterior a la intervención bajo meta." },
      { anio: 2026, periodo: "2026-S1", fecha: iso(15), tipo: "Línea base", guia: "Lesiones por presión", unidad: "UCM 3 piso",
        frecuencia: "Semestral", fuente: "Auditoría de fichas", responsable: "EU. Carolina Reyes", referente: "EU. Marcos Soto",
        meta: 90, modoIngreso: "Tengo porcentajes del informe", resultadoGlobalOficial: 68, indicadores: ind(LPP, [88, 58, 72, 62, 50, 78]),
        brechas: "Reevaluación y superficie de alivio por debajo de la meta." }
    ], { silent: true });

    add("accionesRNAO", [
      { guia: "Lesiones por presión", unidad: "UTI", indicadorOrigen: "Superficie de alivio o redistribución de presión",
        resultado: 45, meta: 90, brecha: "45 pts", accion: "Gestionar colchones de redistribución y capacitar en su uso.",
        responsable: "EU. Marcos Soto", fechaComprometida: isoIn(15), estado: "En curso", medioVerificacion: "Acta de solicitud a Abastecimiento", requiereReferente: "Sí", observaciones: "Priorizar camas de mayor riesgo." },
      { guia: "Dolor", unidad: "Emergencia Hospitalaria", indicadorOrigen: "Reevaluación posterior a la intervención",
        resultado: 74, meta: 90, brecha: "16 pts", accion: "Estandarizar reevaluación a los 30 min post analgesia.",
        responsable: "EU. Marcos Soto", fechaComprometida: isoIn(30), estado: "Pendiente", medioVerificacion: "", requiereReferente: "No", observaciones: "" },
      { guia: "Lesiones por presión", unidad: "UCM 3 piso", indicadorOrigen: "Reevaluación según condición clínica",
        resultado: 58, meta: 90, brecha: "32 pts", accion: "Incorporar reevaluación en pauta de enfermería por turno.",
        responsable: "EU. Carolina Reyes", fechaComprometida: iso(3), estado: "Pendiente", medioVerificacion: "", requiereReferente: "Sí", observaciones: "Plazo vencido, reprogramar." }
    ], { silent: true });

    add("redChampion", [
      { nombre: "TENS Javiera Rojas", estamento: "TENS", unidad: "UTI", guia: "Lesiones por presión", contacto: "anexo 2345", estado: "Activo" },
      { nombre: "EU. Diego Fuentes", estamento: "Enfermería", unidad: "UCI Valech", guia: "Accesos vasculares", contacto: "anexo 2360", estado: "Activo" },
      { nombre: "EU. Paula Núñez", estamento: "Enfermería", unidad: "Emergencia Hospitalaria", guia: "Dolor", contacto: "anexo 2372", estado: "Activo" },
      { nombre: "TENS Luis Vera", estamento: "TENS", unidad: "UCM 3 piso", guia: "Lesiones por presión", contacto: "anexo 2388", estado: "Inactivo" }
    ], { silent: true });

    /* ---------- Módulo 1 — Apoyo y mejora ---------- */
    add("apoyoMejora", [
      { responsable: "EU. Marcos Soto", unidad: "UTI", problema: "Alta incidencia de LPP en pacientes críticos.",
        intervencion: "Implementación de bundle de prevención y capacitación por turno.", resultado: "Reducción de incidencia y mejor registro.",
        proximaAccion: "Auditoría de seguimiento en 30 días.", estado: "En desarrollo", respaldo: "Acta UBPC-2026-07" },
      { responsable: "EU. Marcos Soto", unidad: "UCI Valech", problema: "Vigilancia de accesos vasculares no estandarizada.",
        intervencion: "Checklist diario de accesos.", resultado: "Cobertura de vigilancia al alza.", proximaAccion: "Consolidar en protocolo.", estado: "En curso", respaldo: "" },
      { responsable: "EU. Carolina Reyes", unidad: "Emergencia Hospitalaria", problema: "Valoración de dolor no sistemática.",
        intervencion: "Incorporación de escala EVA al ingreso.", resultado: "Mejora en valoración inicial.", proximaAccion: "Capacitar reevaluación.", estado: "En desarrollo", respaldo: "" },
      { responsable: "EU. Marcos Soto", unidad: "Pabellón y Anestesia", problema: "Protocolo de posicionamiento desactualizado.",
        intervencion: "Actualización con evidencia RNAO.", resultado: "Protocolo validado.", proximaAccion: "Difusión.", estado: "Finalizado", respaldo: "UBPC-DOC-2026-002" }
    ], { silent: true });

    /* ---------- Módulo 2 — Documentos ---------- */
    add("documentos", [
      { nombre: "Protocolo de prevención de LPP", tipo: "Protocolo", version: "2", fecha: iso(40), unidadResponsable: "UTI",
        responsable: "EU. Carolina Reyes", estado: "Vigente", envioCalidad: "Sí", fechaEnvio: iso(35), difusion: "Difundido en UTI y UCI Valech", observaciones: "Actualizado con escala de Braden.", respaldo: "" },
      { nombre: "Procedimiento de vigilancia de accesos vasculares", tipo: "Procedimiento", version: "1", fecha: iso(20), unidadResponsable: "UCI Valech",
        responsable: "EU. Marcos Soto", estado: "En revisión", envioCalidad: "No", fechaEnvio: "", difusion: "", observaciones: "En revisión por Calidad.", respaldo: "" },
      { nombre: "Flujo de valoración y manejo del dolor", tipo: "Flujograma", version: "1", fecha: iso(12), unidadResponsable: "Emergencia Hospitalaria",
        responsable: "EU. Marcos Soto", estado: "Borrador", envioCalidad: "No", fechaEnvio: "", difusion: "", observaciones: "", respaldo: "" },
      { nombre: "Manual de buenas prácticas UBPC", tipo: "Manual", version: "3", fecha: iso(60), unidadResponsable: "UBPC",
        responsable: "EU. Carolina Reyes", estado: "Vigente", envioCalidad: "Sí", fechaEnvio: iso(58), difusion: "Institucional", observaciones: "", respaldo: "" }
    ], { withCode: true, silent: true });

    /* ---------- Módulo 4 — Fortalecimiento ---------- */
    add("actividades", [
      { fecha: iso(30), actividad: "Taller de prevención de LPP", tipo: "Taller", unidadResp: "UBPC", unidadesParticipantes: "UTI, UCI Valech",
        estamento: "Enfermería", personasCapacitadas: 24, poblacionObjetivo: 30, cobertura: "80%", guia: "Lesiones por presión", responsable: "EU. Marcos Soto", estado: "Completado" },
      { fecha: iso(18), actividad: "Capacitación en accesos vasculares", tipo: "Capacitación", unidadResp: "UBPC", unidadesParticipantes: "UCI Valech",
        estamento: "Multiestamento", personasCapacitadas: 18, poblacionObjetivo: 20, cobertura: "90%", guia: "Accesos vasculares", responsable: "EU. Marcos Soto", estado: "Completado" },
      { fecha: iso(9), actividad: "Charla de manejo del dolor", tipo: "Charla", unidadResp: "UBPC", unidadesParticipantes: "Emergencia Hospitalaria",
        estamento: "TENS", personasCapacitadas: 15, poblacionObjetivo: 25, cobertura: "60%", guia: "Dolor", responsable: "EU. Carolina Reyes", estado: "Completado" },
      { fecha: isoIn(10), actividad: "Simulación de posicionamiento", tipo: "Simulación", unidadResp: "UBPC", unidadesParticipantes: "UCM 3 piso",
        estamento: "Enfermería", personasCapacitadas: 0, poblacionObjetivo: 20, cobertura: "", guia: "Lesiones por presión", responsable: "EU. Marcos Soto", estado: "Pendiente" }
    ], { withCode: true, silent: true });

    add("edicionesEVI", [
      { numeroEdicion: 1, version: "1", fechaEnvio: iso(45), evidencias: [
        { area: "Lesiones por presión", autores: "García et al.", trabajo: "Reposicionamiento programado y LPP", anio: "2025", tipo: "Revisión sistemática", hallazgo: "El reposicionamiento cada 2 h reduce la incidencia de LPP.", enlace: "" },
        { area: "Accesos vasculares", autores: "Smith et al.", trabajo: "Bundle de accesos vasculares", anio: "2024", tipo: "Guía de práctica clínica", hallazgo: "La vigilancia diaria disminuye infecciones asociadas.", enlace: "" }
      ] },
      { numeroEdicion: 2, version: "1", fechaEnvio: iso(10), evidencias: [
        { area: "Dolor", autores: "Pérez et al.", trabajo: "Manejo multimodal del dolor", anio: "2025", tipo: "Metaanálisis", hallazgo: "El manejo multimodal mejora el control del dolor agudo.", enlace: "" }
      ] }
    ], { withCode: true, silent: true });

    add("reconocimientos", [
      { fecha: iso(22), unidad: "UTI", tipo: "Buena práctica del mes", motivo: "Reducción sostenida de lesiones por presión durante tres períodos consecutivos.", buenaPractica: "Bundle de prevención de LPP con reposicionamiento cada 2 h.", responsable: "EU. Marcos Soto", observaciones: "" },
      { fecha: iso(48), unidad: "UTI", tipo: "Reconocimiento institucional", motivo: "Liderazgo en la implementación de la guía BPSO.", buenaPractica: "Champions de guía activos por turno.", responsable: "EU. Carolina Reyes", observaciones: "" },
      { fecha: iso(80), unidad: "UTI", tipo: "Mención destacada", motivo: "Participación destacada en auditorías clínicas.", buenaPractica: "Registro trazable de cambios de posición.", responsable: "EU. Marcos Soto", observaciones: "" },
      { fecha: iso(5), unidad: "UCI Valech", tipo: "Felicitación", motivo: "Alta adherencia a la vigilancia de accesos vasculares.", buenaPractica: "Checklist diario de accesos.", responsable: "EU. Diego Fuentes", observaciones: "" },
      { fecha: iso(40), unidad: "UCI Valech", tipo: "Buena práctica del mes", motivo: "Cero infecciones asociadas a accesos en el período.", buenaPractica: "Higiene de manos supervisada y bundle CVC.", responsable: "EU. Diego Fuentes", observaciones: "" },
      { fecha: iso(15), unidad: "UCM 3 piso", tipo: "Mención destacada", motivo: "Mejora continua en la valoración del dolor.", buenaPractica: "Escala del dolor aplicada en cada turno.", responsable: "EU. Paula Ríos", observaciones: "" },
      { fecha: iso(30), unidad: "Pabellón y Anestesia", tipo: "Felicitación", motivo: "Compromiso con la seguridad quirúrgica.", buenaPractica: "Checklist de pausa quirúrgica al 100%.", responsable: "EU. Ignacio Vera", observaciones: "" }
    ], { silent: true });

    add("docsTrabajo", [
      { titulo: "Plan de Mejora · Prevención de LPP en UTI", plantilla: "planMejora",
        contenido: "<h2>Problema o brecha detectada</h2><p>Incidencia de lesiones por presión sobre la meta en pacientes críticos de UTI.</p><h2>Objetivo de mejora</h2><p>Reducir la incidencia de LPP a menos del 5% en el semestre.</p><h2>Acciones</h2><ol><li>Estandarizar el reposicionamiento cada 2 horas.</li><li>Capacitar al equipo en la escala de Braden.</li><li>Auditar el registro de cambios de posición.</li></ol><h2>Responsable y plazo</h2><p>Responsable: EU. Marcos Soto · Plazo: 6 meses</p><h2>Indicador de éxito</h2><p>Incidencia de LPP < 5% y adherencia al registro > 90%.</p>" }
    ], { silent: true });

    /* ---------- Módulo 5 — Gestión y respaldo ---------- */
    add("reuniones", [
      { fecha: iso(25), tipo: "Comité", tema: "Comité de Calidad y Seguridad", unidad: "Dirección", responsable: "EU. Carolina Reyes", resultado: "Se aprueba plan de prevención de LPP." },
      { fecha: iso(11), tipo: "Mesa técnica", tema: "Mesa técnica de dolor", unidad: "Emergencia Hospitalaria", responsable: "EU. Marcos Soto", resultado: "Compromiso de estandarizar reevaluación." },
      { fecha: isoIn(6), tipo: "Reunión de seguimiento", tema: "Seguimiento LPP · UTI", unidad: "UTI", responsable: "EU. Marcos Soto", resultado: "Programada." }
    ], { withCode: true, silent: true });

    add("acuerdos", [
      { compromiso: "Estandarizar reevaluación del dolor a los 30 min.", responsable: "EU. Marcos Soto", plazo: isoIn(20), estado: "En curso" },
      { compromiso: "Adquirir colchones de redistribución para UTI.", responsable: "Abastecimiento", plazo: isoIn(45), estado: "Pendiente" }
    ], { withCode: true, silent: true });

    add("articulaciones", [
      { institucion: "Servicio de Salud Metropolitano", participacion: "Presentación de resultados RNAO.", aporte: "Modelo de auditoría clínica.", resultado: "Interés en replicar el modelo.", continuidad: "Sí", proximaAccion: "Enviar informe consolidado." },
      { institucion: "Comité de IAAS", participacion: "Trabajo conjunto en accesos vasculares.", aporte: "Datos de vigilancia.", resultado: "Alineación de indicadores.", continuidad: "Sí", proximaAccion: "Reunión mensual." }
    ], { withCode: true, silent: true });

    add("respaldos", [
      { fecha: iso(25), tipo: "Acta", titulo: "Acta Comité de Calidad julio", responsable: "EU. Carolina Reyes", observaciones: "Aprobación plan LPP.", enlace: "" },
      { fecha: iso(11), tipo: "Presentación", titulo: "Resultados RNAO 2026-S1", responsable: "EU. Marcos Soto", observaciones: "", enlace: "" }
    ], { silent: true });

    /* ---------- Solicitudes (con distintos estados) ---------- */
    const ref = U.auth.referente(); const refN = ref ? ref.nombre : "Referente Técnico";
    add("solicitudes", [
      { direccion: "coord-a-ref", moduloOrigen: "Programa RNAO", solicitante: "EU. Carolina Reyes", fechaEnvio: iso(6), referente: refN,
        titulo: "Auditoría de accesos vasculares · UCI Valech", unidad: "UCI Valech", prioridad: "alta", plazo: isoIn(2),
        descripcion: "Auditoría técnica de los 3 indicadores de accesos vasculares.", estado: "Enviada",
        respuestaTecnica: "", intervencion: "", medioVerificacion: "", conclusion: "", decisionCoordinador: "", obsCierre: "" },
      { direccion: "coord-a-ref", moduloOrigen: "Acción de mejora RNAO", solicitante: "EU. Carolina Reyes", fechaEnvio: iso(9), referente: refN,
        titulo: "Intervención en superficie de alivio · UTI", unidad: "UTI", prioridad: "alta", plazo: isoIn(8),
        descripcion: "Apoyo para gestionar y capacitar en superficies de redistribución.", estado: "En curso",
        respuestaTecnica: "", intervencion: "", medioVerificacion: "", conclusion: "", decisionCoordinador: "", obsCierre: "" },
      { direccion: "coord-a-ref", moduloOrigen: "Gestión Documental", solicitante: "EU. Carolina Reyes", fechaEnvio: iso(20), referente: refN,
        titulo: "Validación técnica del flujo de dolor", unidad: "Emergencia Hospitalaria", prioridad: "media", plazo: iso(2),
        descripcion: "Validar técnicamente el flujograma de manejo del dolor.", estado: "Cerrada por coordinación",
        respuestaTecnica: "Flujo revisado y ajustado según evidencia RNAO.", intervencion: "Sesión de trabajo con la unidad.",
        medioVerificacion: "Flujograma v1 con visto bueno.", conclusion: "Listo para difusión.", fechaRespuesta: iso(12),
        decisionCoordinador: "Cerrada por coordinación", obsCierre: "Conforme.", fechaCierre: iso(10) }
    ], { withCode: true, silent: true });

    /* ---------- NT 234 ---------- */
    s.setConfig("nt234.responsable", "Dra. Andrea Salas");
    s.setConfig("nt234.resolucion", "Res. Exenta N° 1234/2026");
    s.setConfig("nt234.subdireccion", "Subdirección de Gestión del Cuidado");
    s.setConfig("nt234.meta", 90);
    add("nt234", [
      /* 2025-S1 (línea base) */
      { periodo: "2025-S1", unidad: "UTI", porcentaje: 78, indicadores: "6 indicadores LPP", observaciones: "" },
      { periodo: "2025-S1", unidad: "UCI Valech", porcentaje: 72, indicadores: "Accesos vasculares", observaciones: "" },
      { periodo: "2025-S1", unidad: "Emergencia Hospitalaria", porcentaje: 51, indicadores: "Dolor", observaciones: "Brecha inicial importante." },
      { periodo: "2025-S1", unidad: "Pabellón y Anestesia", porcentaje: 60, indicadores: "LPP", observaciones: "" },
      { periodo: "2025-S1", unidad: "UCM 3 piso", porcentaje: 80, indicadores: "LPP", observaciones: "" },
      /* 2025-S2 (seguimiento) */
      { periodo: "2025-S2", unidad: "UTI", porcentaje: 86, indicadores: "6 indicadores LPP", observaciones: "" },
      { periodo: "2025-S2", unidad: "UCI Valech", porcentaje: 81, indicadores: "Accesos vasculares", observaciones: "" },
      { periodo: "2025-S2", unidad: "Emergencia Hospitalaria", porcentaje: 58, indicadores: "Dolor", observaciones: "Avance leve." },
      { periodo: "2025-S2", unidad: "Pabellón y Anestesia", porcentaje: 69, indicadores: "LPP", observaciones: "" },
      { periodo: "2025-S2", unidad: "UCM 3 piso", porcentaje: 87, indicadores: "LPP", observaciones: "" },
      /* 2026-S1 (actual) */
      { periodo: "2026-S1", unidad: "UTI", porcentaje: 95, indicadores: "6 indicadores LPP", observaciones: "" },
      { periodo: "2026-S1", unidad: "UCI Valech", porcentaje: 88, indicadores: "Accesos vasculares", observaciones: "" },
      { periodo: "2026-S1", unidad: "Emergencia Hospitalaria", porcentaje: 63, indicadores: "Dolor", observaciones: "Requiere intervención." },
      { periodo: "2026-S1", unidad: "Pabellón y Anestesia", porcentaje: 74, indicadores: "LPP", observaciones: "" },
      { periodo: "2026-S1", unidad: "UCM 3 piso", porcentaje: 91, indicadores: "LPP", observaciones: "" }
    ], { silent: true });
    add("planesNT234", [
      { fechaSolicitud: iso(14), unidad: "Emergencia Hospitalaria", indicadores: "Valoración y reevaluación del dolor", porcentaje: 63, plazo: isoIn(30), estado: "En curso", responsable: "EU. Marcos Soto", requiereReferente: "Sí", observaciones: "Intervención focalizada." },
      { fechaSolicitud: iso(8), unidad: "Pabellón y Anestesia", indicadores: "Prevención de LPP", porcentaje: 74, plazo: isoIn(45), estado: "Pendiente", responsable: "EU. Carolina Reyes", requiereReferente: "No", observaciones: "" }
    ], { silent: true });

    /* ---------- Módulo 7 — Colaboración ---------- */
    add("colaboraciones", [
      { fecha: iso(30), institucion: "Hospital San José", contacto: "EU. Ana Torres", unidad: "UTI", objetivo: "Asesoría en implementación BPSO.",
        tipo: "Asesoría Técnica", rolUBPC: "Entregó apoyo", pilar: "Calidad y seguridad", influencia: "Institucional", coordCapacitacion: "No", estado: "Completado", resultado: "Se comparte modelo de auditoría.", observaciones: "Colaboración muy valorada por la contraparte." },
      { fecha: iso(20), institucion: "Universidad Andrés Bello", contacto: "Dr. Pedro Lagos", unidad: "UBPC", objetivo: "Curso de prevención de LPP.",
        tipo: "Curso", rolUBPC: "Colaboración recíproca", pilar: "Formación continua", influencia: "Regional", coordCapacitacion: "Sí", estado: "Completado", resultado: "45 profesionales certificados.", observaciones: "", publicoObjetivo: "Enfermería y TENS", hayParticipantes: "Sí", nParticipantes: 45 },
      { fecha: iso(12), institucion: "Comité IAAS HUAP", contacto: "EU. Rocío Díaz", unidad: "UCI Valech", objetivo: "Trabajo conjunto en accesos vasculares.",
        tipo: "Colaboración interna", rolUBPC: "Colaboración recíproca", pilar: "Gestión del cuidado", influencia: "Local", coordCapacitacion: "No", estado: "En curso", resultado: "Indicadores alineados.", observaciones: "" },
      { fecha: iso(4), institucion: "Servicio de Salud", contacto: "Sr. Iván Mora", unidad: "UBPC", objetivo: "Exposición de resultados.",
        tipo: "Exposición", rolUBPC: "Entregó apoyo", pilar: "Articulación institucional", influencia: "Nacional", coordCapacitacion: "No", estado: "Completado", resultado: "Reconocimiento del modelo.", observaciones: "", publicoObjetivo: "Referentes de red", hayParticipantes: "Sí", nParticipantes: 60 }
    ], { withCode: true, silent: true });

    /* ---------- Home: hitos, evidencia, kanban ---------- */
    add("hitos", [
      { fecha: iso(200), icono: "🚀", modulo: "Portal", titulo: "Puesta en marcha del Portal", descripcion: "Inicio del registro digital de la gestión de la UBPC." },
      { fecha: iso(120), icono: "📋", modulo: "RNAO", titulo: "Línea base institucional LPP", descripcion: "Primera medición de la guía de lesiones por presión." },
      { fecha: iso(40), icono: "🏆", modulo: "Fortalecimiento", titulo: "Reconocimiento a UTI", descripcion: "Buena práctica del mes por reducción de LPP." },
      { fecha: iso(10), icono: "📈", modulo: "RNAO", titulo: "Seguimiento 2026-S1", descripcion: "Mejora del cumplimiento global a 78%." }
    ], { silent: true });
    add("evidenciaSemana", [
      { titulo: "Reposicionamiento cada 2 h reduce LPP", fuente: "Revisión sistemática · JBI 2025", fecha: iso(3),
        resumen: "El reposicionamiento programado disminuye significativamente la incidencia de lesiones por presión en pacientes críticos.",
        recomendacion: "Estandarizar el registro de cambios de posición en UTI y UCI Valech.", enlace: "" }
    ], { withCode: true, silent: true });

    const kb = (owner, titulo, columna, prioridad, resp, dias, orden) =>
      ({ owner, titulo, columna, prioridad, responsable: resp, fechaLimite: dias == null ? "" : isoIn(dias), orden });
    add("kanban", [
      kb("coordinador", "Validar protocolo de dolor", "Pendiente", "alta", "EU. Carolina Reyes", 4, 1),
      kb("coordinador", "Enviar informe NT 234 Q2", "Pendiente", "media", "EU. Carolina Reyes", 9, 2),
      kb("coordinador", "Plan de mejora LPP · UTI", "En curso", "alta", "EU. Marcos Soto", 8, 3),
      kb("coordinador", "Difusión guía BPSO · UCM 3 piso", "En curso", "media", "EU. Marcos Soto", 12, 4),
      kb("coordinador", "Capacitación turno noche", "Completado", "baja", "Enfermería", null, 5),
      kb("coordinador", "Informe NT 234 Q1", "Completado", "media", "EU. Carolina Reyes", null, 6),
      kb("referente", "Auditoría accesos · UCI Valech", "Pendiente", "alta", "EU. Marcos Soto", 2, 1),
      kb("referente", "Actualizar bitácora de biblioteca", "Pendiente", "baja", "EU. Marcos Soto", 6, 2),
      kb("referente", "Plan de mejora LPP · UTI", "En curso", "alta", "EU. Marcos Soto", 8, 3),
      kb("referente", "Respuesta técnica SOL-2026-012", "Completado", "media", "EU. Marcos Soto", null, 4),
      kb("referente", "Capacitación turno noche", "Completado", "baja", "Enfermería", null, 5)
    ], { silent: true });

    /* ---------- Referente: submódulos ---------- */
    add("bibliotecaBitacora", [
      { tipoAccion: "Recurso incorporado", nombreRecurso: "Escala de Braden actualizada", tipo: "Instrumento", version: "2", fuente: "RNAO", cambioRealizado: "Se incorpora versión revisada.", motivo: "Actualización de evidencia.", enlace: "", ubicacionRespaldo: "Carpeta UBPC/Escalas", fecha: iso(18), unidadGuia: "Lesiones por presión" },
      { tipoAccion: "Recurso actualizado", nombreRecurso: "Bundle de accesos vasculares", tipo: "Protocolo", version: "1.1", fuente: "Guía RNAO 2024", cambioRealizado: "Ajuste de vigilancia diaria.", motivo: "Brecha detectada.", enlace: "", ubicacionRespaldo: "Carpeta UBPC/Accesos", fecha: iso(7), unidadGuia: "Accesos vasculares" }
    ], { silent: true });
    add("capacitacionRef", [
      { fecha: iso(15), turno: "Noche", tema: "Prevención de LPP", unidad: "UTI", estamento: "Enfermería", participantes: 8, guia: "Lesiones por presión", observaciones: "" },
      { fecha: iso(6), turno: "Largo", tema: "Vigilancia de accesos", unidad: "UCI Valech", estamento: "TENS", participantes: 6, guia: "Accesos vasculares", observaciones: "" }
    ], { silent: true });
    add("evidenciaRef", [
      { tema: "Vigilancia diaria del sitio de inserción", fuente: "Guía práctica RNAO", autores: "RNAO", anio: "2024", nivelTipo: "Guía de práctica clínica", hallazgo: "La inspección diaria reduce complicaciones.", aplicabilidad: "Aplicable a UCI Valech y UTI.", recomendacion: "Checklist diario de accesos.", enlace: "", guia: "Accesos vasculares" }
    ], { silent: true });
    add("monitoreoRef", [
      { fecha: iso(12), tipoRegistro: "Auditoría clínica", unidad: "UTI", guia: "Lesiones por presión", descripcion: "Auditoría de fichas.", resultado: "71% de cumplimiento.", brecha: "Superficie de alivio.", intervencion: "Gestión de colchones.", medioVerificacion: "Planilla de auditoría", estado: "En curso" },
      { fecha: iso(5), tipoRegistro: "Indicador", unidad: "UCI Valech", guia: "Accesos vasculares", descripcion: "Medición de vigilancia.", resultado: "86%.", brecha: "Evaluación diaria.", intervencion: "Refuerzo en turno noche.", medioVerificacion: "", estado: "Completado" }
    ], { silent: true });

    /* ---------- Notificaciones ---------- */
    U.notif.push({ titulo: "Nueva solicitud técnica: Auditoría de accesos vasculares · UCI Valech", modulo: "Solicitudes de apoyo", prioridad: "alta", destinatario: "referente", ref: "#/ref/solicitudesRecibidas" });
    U.notif.push({ titulo: "Indicadores bajo meta en RNAO", modulo: "Programa RNAO", prioridad: "normal", destinatario: "coordinador", ref: "#/coord/m3?tab=dashboard" });
    U.notif.push({ titulo: "Reunión de seguimiento programada", modulo: "Gestión y Respaldo", prioridad: "normal", destinatario: "referente", ref: "#/ref/reunion" });

    s.setConfig("__demoLoaded", true);
  }

  U.demo = { load };
})();
