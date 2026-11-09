# Control Banding — Entrega técnica: fases 1 y 2

Fecha: 9 de noviembre de 2026. Rama: `feat/fases-1-2-seguridad-metodologia`.

## Qué se ha modificado

- **Inicio de sesión:** formulario con documento/cédula y código de integrante existentes, verificados en la función Supabase `crear-sesion-integrante`; intercambio por sesión de Supabase Auth y verificación del usuario por el servidor antes de ejecutar la interfaz. Cierre de sesión y revalidación al volver a la pestaña.
- **Identidad y usabilidad:** logo horizontal oficial servido desde `www.movidasst.com`, turquesa `#007B85`, superficies pastel, foco visible, menú horizontal desplazable en móvil, campos de mezcla adaptables.
- **Método:** archivo independiente `methodology.js` con bandas H conforme a la guía técnica COSHH Essentials del HSE, tablas de exposición sólido/líquido y control, excepciones del HSE. Gases se rechazan como fuera de alcance.
- **Información insuficiente:** H desconocidas, frases vacías y peligros únicamente físicos sin datos de salud no retornan por defecto una banda A.
- **Mezclas:** campos de CAS opcional, frases H y concentración por componente; validación de rangos, suma y origen de la FDS. El cribado no es clasificación reglamentaria SGA.
- **Compatibilidad:** nunca certifica como COMPATIBLE usando reglas reducidas. Usa resultados «NO EVALUABLE», «NO CONCLUYENTE» y alertas basadas en datos disponibles.
- **Informes e historial:** se identifican como orientativos y de registro local, sin afirmaciones de validez documental en servidor. Se separa el historial por usuario autenticado. Importación de datos antiguos únicamente mediante acción explícita; los resultados históricos no se recalculan silenciosamente.
- **Pruebas:** `node tests/methodology.test.cjs` y `node tests/integration.test.cjs`; workflow `.github/workflows/controlbanding-tests.yml`.

## Validación obligatoria antes de publicar en producción

1. Comprobar el login con una credencial válida real, una inválida y una sesión vencida. El equipo de integración no debe copiar credenciales reales en pruebas públicas.
2. Comprobar que ningún cambio de vista muestra datos antes de validar la sesión. Como el sitio es HTML estático, el código y algoritmo no están protegidos por autenticación del servidor; solo su ejecución en la interfaz y operaciones con sesión están condicionadas.
3. Ejecutar pruebas desde teléfono, tablet y escritorio: menú, campos de mezcla, formularios y PDF.
4. Comprobar una mezcla de ejemplo contra su FDS real; solicitar juicio profesional sobre compatibilidad y resultados cualitativos antes de emplearlos para decisiones de SST.
5. Confirmar que la función compartida `crear-sesion-integrante` mantiene disponibilidad y configuración de CORS para `controlbanding.movidasst.com`.
6. Verificar datos locales importados únicamente en un dispositivo autorizado. La aplicación usa `localStorage` del navegador: **no hay cifrado ni almacenamiento privado en servidor** para el historial. Evitar equipos compartidos y datos confidenciales.

## Limitaciones deliberadas

- No se alteró el Directorio, la cuenta de integrantes ni la función compartida de autenticación de La Movida.
- No se desplegó una API privada ni se modificaron esquemas de Supabase.
- El modelo dérmico es una estimación cualitativa propia: **no debe presentarse como implementación validada de RISKOFDERM**.
- La consulta de código de informe es local y **no verifica integridad documental independiente**.
- La disponibilidad del acceso real no puede darse por probada con pruebas unitarias; precisa una prueba manual con credenciales autorizadas.
- La rama y PR deben fusionarse solo tras la validación del propietario: el sitio público en GitHub Pages usa `main`.

## Referencia metodológica
HSE, *COSHH Essentials: The technical basis for COSHH essentials — Easy steps to control chemicals* (Tablas de frases H, exposición y niveles de control): https://www.hse.gov.uk/pubns/guidance/coshh-technical-basis.pdf
