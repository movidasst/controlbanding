# Entrega de fases 3 y 4 — Control Banding
Fecha: 9 de noviembre de 2026
Repositorio: movidasst/controlbanding
Rama de implementación: feat/fases-3-4-evidencia-accesibilidad

## Fase 3 — Evidencia, informes y datos

- Modelo de captura y restauración versionado en `evaluation-evidence.js`: contexto, país, fecha, evaluador, sustancias/mezclas, componentes, concentración, frases H, condiciones de proceso, controles declarados, fuente/FDS y plan.
- Borrador completo del formulario, incluidos componentes creados dinámicamente, guardado automáticamente tras los cambios y recuperable desde la barra superior.
- Historial editable: la opción **Editar** restaura las entradas; exige recalcular antes de sustituir el registro original. Los registros antiguos sin entradas completas se conservan, pero no se pueden editar de manera fiable.
- Exportación e importación JSON del historial, con validación del esquema y del propietario de la sesión. No se importa automáticamente un archivo de otra identidad.
- Informe PDF con jsPDF y AutoTable: secciones de identificación, fuentes, composición, entradas, control y exposición, resultados, recomendaciones y plan de trabajo. Filas largas y tablas se distribuyen automáticamente entre páginas.
- En pantalla y PDF se obtienen recomendaciones mediante el mismo módulo `report-pdf.js`; la ficha identifica la versión del cálculo.
- La consulta de código de informe sigue siendo **local**, sin certificación de integridad criptográfica ni validación en servidor.
- Consultas CAS de PubChem en curso impiden avanzar en pasos relevantes o procesar datos inconsistentes.

## Fase 4 — Marca, experiencia móvil y accesibilidad

- Se conserva el logo horizontal oficial de La Movida de SST+ (el mismo utilizado por el sitio principal), Outfit y paleta teal `#007B85` con superficies pastel claras.
- Menú horizontal desplazable en móvil, controles táctiles con altura mínima, tableros y tablas adaptables, formularios que se reorganizan a 320 px.
- Enlace «Saltar al contenido principal», encabezados por paso, áreas semánticas y validación visible y anunciada a tecnologías de asistencia.
- Pestañas con `role=tablist`, `aria-selected`, `aria-controls`, foco y teclas de dirección, Inicio y Fin; las áreas no activas quedan fuera del orden de tabulación.
- Indicador de avance con `role=progressbar` y `aria-valuenow`, estados de formularios y foco visible.
- Etiquetas asociadas a campos, accesibilidad de los selectores de sustancia/mezcla y controles de ajustes con `aria-expanded`.
- Reglas de alto contraste y movimiento reducido.

## Validación

Automatizadas en GitHub Actions: sintaxis JavaScript y HTML, pruebas previas del motor metodológico, evidencia/FDS/propietario, integridad del esquema JSON, generación estructural del informe y regresiones de los elementos de interfaz.

Pendiente de validación manual en entorno real: credenciales de un integrante autorizado, flujos completos en móvil y teclado, exportación e importación entre navegadores del mismo integrante, PDF con nombres de más de una página, impresión, lector de pantalla (TalkBack/NVDA/VoiceOver) y zoom del 200–400 %. **Las pruebas automáticas no sustituyen una revisión visual ni validación profesional del método.**

## Uso seguro y límites

- El sitio sigue siendo HTML estático hospedado en GitHub Pages; el inicio de sesión existente en Supabase valida el acceso a la interfaz, **no oculta el código fuente**.
- Historial, borrador y registro local de códigos PDF se guardan en `localStorage`, sin cifrado ni sincronización con servidor. Evitar introducir información personal o empresarial confidencial en equipos compartidos.
- Los datos importados del JSON no recalculan resultados antiguos; para actualizarlos se requiere edición y procesamiento con el motor vigente.
- COSHH Essentials ofrece orientación cualitativa. Los gases se excluyen del motor; la puntuación dérmica no representa RISKOFDERM validado; las mezclas requieren interpretación de la FDS. La comparación entre controles requeridos y declarados **no comprueba riesgo residual real**.
- Si no se puede cargar la imagen oficial en el PDF por restricciones del navegador, el encabezado textual preserva la identificación del autor. Los elementos de interfaz siguen usando el logo auténtico.
- Ninguna operación cambia tablas de Supabase, los datos del Directorio GEO ni el funcionamiento de la autenticación de La Movida.

## Verificación recomendada antes de ampliar alcance

1. Inicio/cierre de sesión con credenciales válidas e inválidas.
2. Sustancia pura con frases H válidas y FDS identificada → evaluación → guardar → PDF.
3. Mezcla de dos componentes con CAS opcional, H y concentración → guardar borrador → recargar → recuperar → recalcular → PDF.
4. Desde historial: ver, editar, guardar, exportar e importar usando la misma cuenta en otro navegador.
5. Probar 320 px, 375 px, tablet, escritorio, teclado y lector de pantalla.
6. Verificar visualmente varias páginas del PDF, nombres extensos, tabla de mezcla y pie de página.

