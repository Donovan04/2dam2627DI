# Estado del proyecto · InkFocus

Última actualización: 15 de noviembre de 2026 · Versión 6 (aplicación terminada).
Proyecto de Desarrollo de Interfaces (2.º DAM): aplicación Pomodoro con estética de tinta inspirada en Splatoon, sin recursos oficiales.

## 1. Qué está implementado

| Área | Estado |
|---|---|
| Temporizador | Concentración / descanso corto / descanso largo; iniciar, pausar, continuar, reiniciar, saltar y reiniciar ciclo; duraciones y sesiones por ciclo configurables; presets 25/5 y 50/10; inicio automático por separado; hora estimada de fin; tiempo y fase en el título; cálculo por referencia temporal; sesiones caducadas con la app cerrada se preguntan, no se cuentan solas. |
| Tanque | SVG original que se vacía en concentración y se recarga en descansos; se congela en pausa; % y sello textual; interior blanco en tema claro. |
| Ciclo | Posición (`cycleIndex`) separada de resultados (`slotResults`: completada / saltada); «Saltar fase» recorre la secuencia completa hasta el descanso largo sin contar la sesión. |
| Tareas | Crear, editar, completar, reabrir, eliminar con «Deshacer»; título, notas, fecha, categoría, prioridad, estimación; búsqueda y filtros; tarea activa junto al temporizador; pomodoros por tarea desde el registro de sesiones; aviso integrado si no hay tareas al «Elegir tarea». |
| Territorio | Mapa SVG original (Voronoi sobre semillas en espiral) con zonas por tarea; pintado al completar; teclado, ratón y táctil; distribución estable; progreso en texto; «Territorio de hoy» y territorio del día del calendario. |
| Calendario | Mensual (lunes-domingo), «Hoy», indicadores con formas y cifras, leyenda, cuadrícula ARIA con teclado, panel del día con resumen, territorio, tareas y actividad. Fechas locales; cada sesión cuenta en el día en que termina. |
| Objetivo y estadísticas | Objetivo diario configurable con celebración; hoy, últimos 7 días (gráfico + tabla), totales; historial con filtros por fechas y tarea y «Cargar más». |
| Insignias | Primera sesión, diez sesiones, cinco horas, primer objetivo diario; guardadas con fecha; nunca se pierden. |
| Personalización | Tema oscuro / claro / sistema; 4 parejas de tinta; reducir animaciones; celebraciones desactivables. |
| Utilidades | Modo concentración (+ pantalla completa opcional); sonidos Web Audio con volumen, silencio y prueba; notificaciones opcionales con estados de permiso; atajos de una tecla desactivables; ventana de Ayuda. |
| Datos | Exportar JSON versionado; importar con validación completa, confirmación, copia previa y escritura atómica; borrar solo las claves de InkFocus con confirmación explícita. |
| Demostración | Fases 10 / 5 / 8 s, indicador permanente, sin registrar nada, tareas en copia temporal, temporizador real restaurado al salir. |
| Publicación | Rutas relativas; probado en raíz y en subcarpeta (`/InkFocus/`). |

## 2. Estructura

```
index.html                Toda la interfaz (HTML semántico, diálogos <dialog>)
css/                      tokens · base · layout · components · tank · tasks · territory · calendar · stats · preferences
js/main.js                Orquestación: crea módulos, conecta eventos, pinta todo
js/timer.js               Motor del temporizador (sin DOM)
js/*-store.js, badges.js  Datos: tareas, sesiones, insignias (localStorage)
js/*-view.js, *-dialog.js Vistas y ventanas
js/data-transfer.js       Exportar / importar / borrar
tools/servidor.ps1        Servidor local (opciones -Port y -Root)
```

Claves de `localStorage`: `inkfocus.settings.v1`, `inkfocus.timer.v1`, `inkfocus.tasks.v1`, `inkfocus.sessions.v1`, `inkfocus.badges.v1`, `inkfocus.timer-real.v1` (solo en demostración).

## 3. Decisiones relevantes

- **Una sola fuente de actividad:** calendario, objetivo, estadísticas, historial, insignias y pomodoros de cada tarea leen el registro de sesiones. No hay contadores aparte.
- **Solo cuentan finales reales** (o «Sí, contarla»). Saltos, reinicios, descansos y demostración nunca se registran; cada final se registra una vez (`runId`).
- **Fechas locales** `AAAA-MM-DD`, sin UTC.
- **Migraciones compatibles:** los datos de versiones anteriores se completan con valores por defecto y se guardan solo si algo cambió.
- **Apariencia por atributos** en `<html>` (`data-theme`, `data-ink`, `data-motion`) y variables CSS; un script en `<head>` evita el destello del tema.
- **Accesibilidad:** foco visible, gestión de foco en todas las ventanas, anuncios en región `aria-live` (no cada segundo), estados no solo por color, contraste AA medido en 8 combinaciones de tema y tinta, movimiento reducido del sistema o de Ajustes.
- Explicación detallada de cada decisión: `README.md`.

## 4. Cómo ejecutar y publicar

```bash
powershell -ExecutionPolicy Bypass -File tools\servidor.ps1
```

Abrir `http://localhost:5500`. Publicación en GitHub Pages: ver `README.md` › «Publicar como web estática».

## 5. Comprobaciones realizadas en la v6 (entorno aislado, `localhost:5600`)

- Tanque en tema claro: lleno, parcial y casi vacío; concentración y descanso; en pausa.
- Insignias: desbloqueo silencioso con datos previos, desbloqueo con celebración en sesión real, «Primera meta» al bajar el objetivo y permanencia al subirlo; sin duplicados.
- Exportación: estructura y versión; sin temporizador ni permisos.
- Importación: 8 tipos de archivo inválido rechazados sin cambios (JSON roto, otra app, formato futuro, fecha imposible, volumen fuera de rango, sesión repetida, insignia desconocida, título vacío); importación válida con confirmación, copia previa, vistas actualizadas y títulos con HTML mostrados como texto.
- Bloqueos con sesión en marcha (importar, borrar, entrar en demostración).
- Borrado: confirmación explícita, solo claves `inkfocus.*`, interfaz al estado inicial.
- Demostración: sesión demo real de 10 s sin registro, ciclo completo hasta el descanso largo, recarga en demostración, salida con temporizador real y tareas intactas.
- Regresiones: preset 50/10, inicio automático, sesión caducada, eliminar y deshacer, foco y Escape en ventanas nuevas.
- Subcarpeta `/InkFocus/` (redirección con barra final, recursos, cambios de vista).
- Móvil 375 px sin desplazamiento horizontal; datos reales de `localhost:5500` sin cambios.
- Error encontrado y corregido: el botón «Borrar todos los datos…» compartía `id` con «Reiniciar» del temporizador.

## 6. Limitaciones y pendientes reales

- **Notificaciones:** solo con la app abierta (sin service worker); en segundo plano pueden retrasarse hasta ~1 minuto; en algunos móviles las notificaciones de página no están disponibles.
- **Sonido:** el navegador puede bloquearlo hasta la primera interacción tras recargar (se avisa una vez).
- **Datos locales:** viven en el navegador de cada persona; no hay sincronización (fuera del alcance).
- **«Primera meta»** no se calcula para días pasados porque no consta qué objetivo había entonces.
- **Zoom al 67 %:** no se debe al proyecto; ver README › «Si el navegador abre la app con otro zoom».
- **Pendiente fuera de la app:** web del proceso (prompts, IAs, versiones, capturas) y PDF de entrega, a partir del documento de la autora o el autor.
