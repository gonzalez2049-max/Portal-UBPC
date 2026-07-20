# Portal de Gestión Operativa — UBPC / HUAP

Portal institucional de la **Unidad de Buenas Prácticas Clínicas (UBPC)** del
**Hospital de Urgencia Asistencia Pública (HUAP)**.

Permite registrar, organizar, monitorear y respaldar la gestión operativa de la
Unidad: procesos, documentos, reuniones, evaluaciones, capacitaciones, evidencias
y colaboraciones, manteniendo trazabilidad de responsables, fechas, estados y
resultados.

## Cómo usar

Es una aplicación web autónoma (SPA). No requiere servidor ni instalación:

1. Abre `index.html` en un navegador moderno, **o**
2. Publícalo como sitio estático (por ejemplo GitHub Pages).

Los datos se guardan localmente en el navegador (`localStorage`). Desde
**Configuración → Respaldo de datos** puedes exportar/importar un archivo JSON
para trasladar o resguardar la información.

## Perfiles

- **Coordinador/a UBPC** — acceso completo a todos los módulos, gestión de
  usuarios, revisión y cierre de solicitudes, exportación y configuración.
- **Referente Técnico** — portal propio de trabajo (Kanban, bitácora de
  biblioteca, capacitación por turno, evidencia, solicitudes, reuniones,
  monitoreo).

En la pantalla de acceso, cada perfil puede editar su **nombre, cargo y
fotografía**; el cambio se refleja automáticamente en el acceso, el encabezado y
el perfil.

## Arquitectura

Sin dependencias externas. JavaScript modular con espacio de nombres `UBPC`:

| Archivo | Rol |
|---|---|
| `assets/js/store.js` | Persistencia local, trazabilidad y códigos automáticos |
| `assets/js/auth.js` | Perfiles, sesión y notificaciones |
| `assets/js/ui.js` | Fechas chilenas, modales, toasts, badges, formularios, exportación |
| `assets/js/charts.js` | Gráficos SVG (gauge, línea, barras) |
| `assets/js/data.js` | Catálogos e indicadores RNAO, semillas iniciales |
| `assets/js/components.js` | Tablero Kanban reutilizable |
| `assets/js/router.js` | Navegación por perfiles y layout |
| `assets/js/views/*` | Pantalla de acceso, portal Coordinador, portal Referente |

### Trazabilidad y persistencia

- Cada registro guarda `creadoPor`, `fechaCreacion`, `modificadoPor`,
  `fechaModificacion` (y `revisadoPor` / `cerradoPor` donde corresponde).
- El versionado de esquema (`esquemaVersion`) **no elimina registros
  históricos** al modificar formularios: la migración solo agrega lo faltante.
- Códigos automáticos, únicos y permanentes: `UBPC-SOL-2026-001`,
  `UBPC-REU-…`, `UBPC-DOC-…`, `UBPC-EVI-…`, `UBPC-COL-…`, etc.

## Estado de implementación (por etapas)

- [x] **Fase 1 — Base:** identidad y franja multicolor, pantalla de acceso,
  perfiles editables, layouts de ambos portales, motor de persistencia con
  trazabilidad, códigos automáticos, notificaciones, estados vacíos, y **Home
  del Coordinador** completo (3 niveles, tendencia, Kanban, actividad reciente,
  evidencia de la semana con mascota EVI, línea de tiempo) e **Inicio del
  Referente**.
- [x] **Fase 2 — Módulos 1, 2 y 5** + **flujo completo de solicitudes
  técnicas** (envío → alerta al Referente → “En curso” → respuesta técnica +
  medio de verificación → “Completada por referente” → revisión del Coordinador
  → cierre o devolución, con trazabilidad visual). Incluye framework CRUD
  reutilizable (tabla + formulario + exportación + trazabilidad), códigos
  automáticos DOC/REU/ACU/ART/SOL, historial de versiones documentales y las
  guardas de negocio (no cerrar sin respaldo, no eliminar solicitudes cerradas).
- [x] **Fase 3 — Módulo 3 (Programa RNAO):** evaluaciones de línea base y
  seguimiento con los **dos modos de ingreso** (porcentajes del informe o casos
  auditados con cálculo automático por denominadores reales), indicadores
  oficiales por guía (LPP, accesos vasculares, dolor), **tarjetas consolidadas**
  (una por evaluación, indicadores ordenados de menor a mayor, dos más bajos,
  cumplimiento global destacado), **Dashboard RNAO** (cumplimiento institucional,
  prioridades, comparativas por guía/unidad, indicadores críticos, alertas),
  **acciones de mejora** (generables desde indicadores bajo meta), Guías BPSO,
  Red Champion e índice de implementación.
- [ ] Fase 4 — Módulo 4 (Fortalecimiento: actividades, EVI, reconocimientos).
- [ ] Fase 5 — Módulo 6 (NT 234) y Módulo 7 (Red de Colaboración).
- [ ] Fase 6 — Submódulos operativos del Referente y exportaciones completas.
