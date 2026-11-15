# InkFocus

Estación de concentración Pomodoro con estética urbana de tinta, inspirada en Splatoon.
Proyecto de **Desarrollo de Interfaces · 2.º DAM**.

> Inspirada en la estética de Splatoon. Sin afiliación con Nintendo y sin usar sus imágenes, música ni archivos: todas las ilustraciones son SVG y CSS originales.

## Estado actual: versión 6 (cierre de la aplicación)

**Novedades de la v6 · Datos, insignias, demostración y publicación**

- **Tanque en tema claro** con interior blanco, borde oscuro y un borde fino en la superficie de la tinta para que el nivel se lea con cualquier color.
- **Insignias** por hitos reales: primera sesión, diez sesiones, cinco horas de concentración y primer objetivo diario. Se guardan con su fecha y no se pierden al cambiar el objetivo. Celebraciones breves y desactivables.
- **Exportar** una copia JSON (con versión de formato) e **importarla** con validación completa, confirmación, opción de copia previa y escritura atómica.
- **Borrar todos los datos** de InkFocus (solo sus claves) con confirmación explícita y opción de copia previa.
- **Modo demostración** aislado: fases de 10 / 5 / 8 s, indicador permanente, sin sumar nada a los datos reales, tareas de prueba que se descartan al salir y temporizador real restaurado.
- Preparada para **GitHub Pages**, también dentro de una subcarpeta (rutas relativas comprobadas).

## Versiones anteriores

**Novedades de la v5 · Personalización y utilidades**

- **Tema** oscuro, claro o «Sistema» (sigue al dispositivo, también si cambia con la app abierta).
- **Cuatro parejas de tinta** con muestras con nombre: Lima y violeta (original), Naranja y azul, Turquesa y rosa, Menta y coral. Se aplican al tanque, territorio, botones, indicadores y gráficos.
- **Reducir animaciones** desde Ajustes, además de la preferencia del sistema. El tanque sigue mostrando el nivel.
- **Modo concentración** (botón en la cabecera o tecla C): deja solo tanque, tiempo, fase, posición del ciclo, tarea activa y controles. Opción aparte de **pantalla completa**. Ninguno de los dos toca la sesión.
- **Sonidos originales** generados con Web Audio al terminar una concentración o un descanso, con volumen, silencio y botones de prueba. Saltar una fase no suena.
- **Notificaciones opcionales** de fin de fase, con estado del permiso (pendiente, concedido, denegado, no disponible) y explicación de sus límites.
- **Atajos de teclado** (Espacio, R, S, C, Esc, N, T, 1-3, H), desactivables, y ventana de **Ayuda** con la técnica Pomodoro, la diferencia entre tanque, territorio y objetivo, «Saltar fase» y la lista de atajos.

**Novedades de la v4 · Escala compacta, objetivo diario, estadísticas e historial**

- **Escala más compacta** al 100 % de zoom: en pantallas de 900 px o más el texto base pasa a 15 px y se reducen de forma específica el tanque, el bloque del tiempo, los botones, los márgenes, las columnas, el calendario y las ventanas. En móvil se mantienen 16 px y botones de 44 px. Desde 1180 px (incluido 1366 × 768) se usan las tres columnas: territorio · temporizador · objetivo y ciclo.
- **Objetivo de hoy** (columna derecha): sesiones de concentración completadas frente a la meta, con gotas y texto, minutos de hoy y una celebración breve al alcanzarla. Se configura en Ajustes (1-24, por defecto 6) o con el botón «Cambiar».
- **Pestaña Estadísticas**: hoy (minutos, sesiones, tareas de hoy completadas), últimos 7 días con gráfico de barras y tabla equivalente, y totales históricos.
- **Historial de sesiones**: de la más reciente a la más antigua, con fecha, hora, minutos sin pausas, tarea y categoría; filtros por intervalo de fechas y tarea, «Restablecer filtros» y «Cargar más» (15 por página).

**Novedades de la v3 · Calendario**

- Pestañas **Concentración** y **Calendario** (la vista se guarda en la dirección: `#calendario`). Mientras ves el calendario, la pestaña Concentración muestra el tiempo restante si hay una fase en marcha.
- Calendario mensual de lunes a domingo, con mes y año en español, navegación por meses (incluido el cambio de año) y botón «Hoy».
- Indicadores con formas distintas y cifras: anillo = tareas pendientes, gota = completadas, barra = sesiones de concentración. Hoy lleva un aro; el día seleccionado, relleno de tinta. Leyenda incluida.
- Cuadrícula accesible: flechas, Inicio/Fin (semana), Re Pág/Av Pág (mes; con Mayús, año) y Enter. Cada día se anuncia con sus tareas y su actividad.
- Panel del día seleccionado: resumen (tareas completadas, sesiones y minutos), **territorio de ese día**, tareas planificadas (crear con esa fecha propuesta, editar, cambiar de fecha, completar, reabrir, activar, eliminar y deshacer) y actividad registrada.
- «Territorio de hoy», en la vista principal, sigue mostrando siempre el día actual.
- Registro de sesiones ampliado: tiempo efectivo sin pausas, tiempo en pausa, fecha real de fin, y título y fecha planificada de la tarea en ese momento.

**Ajustes de la v2.1**

- Distribución en escritorio: **Territorio de hoy** (izquierda) · **temporizador** (centro) · **Ciclo actual** (derecha). En pantallas medianas, el temporizador arriba y los otros dos debajo; en móvil, una sola columna.
- La gestión de tareas pasa a una **ventana «Tareas»** (búsqueda, filtros, activar, editar, completar, reabrir, eliminar y deshacer). Se abre con «Ver tareas» (territorio y franja de tarea activa) o con «Elegir tarea». El territorio tiene siempre visible «Nueva tarea».
- «Elegir tarea» sin tareas pendientes muestra un aviso integrado: «No hay ninguna tarea disponible. ¿Quieres crear una?», con «Crear tarea» y «Cancelar» (y «Ver tareas» si hay completadas). El formulario llega con «Hacerla la tarea activa al guardar» marcado.
- «Saltar fase» recorre toda la secuencia del ciclo hasta el descanso largo. La **posición** en el ciclo y las **sesiones completadas** se guardan y se muestran por separado.
- Etiquetas «Zona N» con texto oscuro sobre lima (contraste aproximado de 14:1).

**Novedades de la v2 · Tareas y territorio del día**

- Crear, editar, completar, reabrir y eliminar tareas, con aviso «Deshacer» tras eliminar.
- Cada tarea tiene título (obligatorio), notas, fecha, categoría o asignatura, prioridad y pomodoros estimados.
- Tarea activa visible dentro del temporizador. Cada concentración **completada** suma un pomodoro a la tarea activa.
- Búsqueda (sin distinguir tildes ni mayúsculas) y filtros por estado, categoría y fecha («Hoy» o «Todas las fechas»).
- **Territorio de hoy**: mapa SVG original en el que cada tarea del día es una zona numerada. Al completarla se pinta con tinta; al reabrirla vuelve a quedar rayada. Muestra el progreso en texto («3 de 5 tareas completadas»).
- Zonas utilizables con ratón, toque y teclado (flechas + Enter), y enlazadas con la lista («Zona N» ↔ «Ver en la lista»).
- Tareas y sesiones guardadas en `localStorage`.

**Base de la v1 · Temporizador**

- Temporizador con tres fases: concentración, descanso corto y descanso largo (25 / 5 / 15 min).
- Ciclo de 4 sesiones de concentración (configurable de 2 a 12) que termina en un descanso largo.
- Iniciar, pausar, continuar, reiniciar fase, saltar fase y reiniciar ciclo.
- **Tanque de tinta** SVG: se vacía durante la concentración y se recarga en los descansos. Al pausar se congela.
- Tiempo restante en números grandes, hora estimada de fin y tiempo + fase en el título de la pestaña.
- Recorrido visual del ciclo con leyenda.
- Ajustes: duraciones, presets 25/5 y 50/10, sesiones por ciclo, inicio automático (descansos y concentración por separado).
- **Modo demostración** con fases de segundos, claramente señalado.
- Transición de tinta al terminar una fase.
- Estado guardado en `localStorage`: recargar no pierde la sesión.
- Diseño adaptado a móvil, foco visible, anuncios accesibles y respeto por el movimiento reducido.

## Cómo ejecutarla

La app usa módulos de JavaScript (`<script type="module">`), que **no funcionan abriendo `index.html` con doble clic** (`file://`). Hay que servir la carpeta por HTTP. Cualquiera de estas opciones vale:

**Opción A · Script incluido (Windows, sin instalar nada)**

```bash
powershell -ExecutionPolicy Bypass -File tools\servidor.ps1
```

Abre <http://localhost:5500>. Para detenerlo, pulsa `Ctrl+C` en la terminal. Si no responde, recarga la página una vez.

**Opción B · VS Code**: instala la extensión *Live Server*, haz clic derecho en `index.html` y elige «Open with Live Server».

**Simular que está dentro de una subcarpeta** (como en GitHub Pages): desde la carpeta del proyecto,

```bash
powershell -ExecutionPolicy Bypass -File tools\servidor.ps1 -Port 5700 -Root ..
```

y abre <http://localhost:5700/InkFocus/>. Cada puerto es un origen distinto, así que sus datos guardados no se mezclan con los de `localhost:5500`.

## Publicar como web estática (GitHub Pages)

No hay compilación ni dependencias: se publica tal cual. Todas las rutas (CSS, JS, imágenes, módulos importados) son **relativas**, así que funciona tanto en la raíz como en una subcarpeta.

1. Sube el proyecto a un repositorio de GitHub.
2. En *Settings → Pages*, elige *Deploy from a branch*, la rama `main` y la carpeta `/ (root)`.
3. Dirección resultante:
   - si InkFocus está en la raíz del repositorio: `https://USUARIO.github.io/REPOSITORIO/`;
   - si está dentro de una carpeta: `https://USUARIO.github.io/REPOSITORIO/InkFocus/` (con la barra final; GitHub Pages la añade solo).
4. GitHub Pages usa HTTPS, necesario para las notificaciones.

Notas: los datos se guardan en el navegador de cada persona (`localStorage`), por dominio. Los archivos de `tools/` y `.claude/` solo sirven para probar en local; publicarlos no afecta a la app.

## Estructura

```
InkFocus/
├── index.html            Estructura semántica de toda la interfaz
├── assets/favicon.svg
├── css/
│   ├── tokens.css        Variables: colores, tipografías, formas
│   ├── base.css          Reset, fondo con textura, utilidades
│   ├── layout.css        Cabecera, rejilla, paneles, adaptación
│   ├── components.css    Botones, pegatinas, ciclo, diálogos, formularios, transición
│   ├── tank.css          Tanque de tinta y sus animaciones
│   ├── tasks.css         Tarea activa, lista de tareas, filtros, avisos
│   ├── territory.css     Mapa del territorio
│   ├── calendar.css      Pestañas, calendario y panel del día
│   ├── stats.css         Objetivo, estadísticas, gráfico e historial
│   └── preferences.css   Ajustes visuales, modo concentración y ayuda
├── js/
│   ├── main.js           Punto de entrada: conecta todo
│   ├── config.js         Constantes (fases, valores por defecto, límites, claves)
│   ├── timer.js          Motor del temporizador (sin DOM)
│   ├── timer-view.js     Pinta el estado en la página
│   ├── tank.js           Nivel y estado del tanque
│   ├── settings.js       Validación y saneado de ajustes
│   ├── settings-dialog.js Ventana de ajustes
│   ├── confirm-dialog.js Confirmaciones accesibles
│   ├── splash.js         Transición de tinta
│   ├── announcer.js      Anuncios para lectores de pantalla
│   ├── format.js         Formato de tiempos en español
│   ├── storage.js        localStorage seguro
│   ├── dates.js          Fechas locales "AAAA-MM-DD"
│   ├── tasks-model.js    Forma de una tarea, validación y orden
│   ├── tasks-store.js    Estado de las tareas + guardado
│   ├── sessions-store.js Registro de concentraciones completadas
│   ├── tasks-view.js     Ventana «Tareas»: lista, búsqueda y filtros
│   ├── task-card.js      Tarjeta de tarea compartida (ventana y calendario)
│   ├── views.js          Pestañas Concentración / Calendario
│   ├── calendar.js       Calendario mensual y su navegación con teclado
│   ├── day-view.js       Panel del día seleccionado
│   ├── goal-view.js      Panel «Objetivo de hoy»
│   ├── stats-view.js     Estadísticas, gráfico de 7 días e historial
│   ├── appearance.js     Tema, tintas y movimiento (atributos en <html>)
│   ├── sound.js          Avisos sonoros generados con Web Audio
│   ├── notifications.js  Notificaciones opcionales de fin de fase
│   ├── focus-mode.js     Modo concentración y pantalla completa
│   ├── shortcuts.js      Atajos de teclado (lista única)
│   ├── help-dialog.js    Ventana de ayuda
│   ├── badges.js         Insignias: definición, cálculo y guardado
│   ├── badges-view.js    Sección «Insignias» de Estadísticas
│   ├── data-transfer.js  Exportar, validar e importar, borrar datos
│   ├── data-dialogs.js   Ventanas de importar y borrar (Ajustes › Tus datos)
│   ├── task-dialog.js    Formulario de crear / editar tarea
│   ├── active-task-view.js Franja «Tarea activa» del temporizador
│   ├── territory-geometry.js Cálculo del mapa (sin DOM)
│   ├── territory.js      Mapa del territorio e interacción
│   ├── toast.js          Avisos temporales con «Deshacer»
│   └── html.js           Escapado de texto para innerHTML
└── tools/servidor.ps1    Servidor local mínimo
```

## Decisiones del temporizador

| Situación | Comportamiento |
|---|---|
| Cálculo del tiempo | Se guarda la hora de fin (`endsAt`) y el restante es `endsAt − ahora`. No se suman ticks, así que no se acumula desfase al cambiar de pestaña. |
| Recargar durante una fase | Continúa donde estaba (en marcha o en pausa). |
| Volver tras mucho tiempo | Si una **concentración** terminó hace más de 3 minutos (app cerrada, equipo suspendido…), **no se cuenta sola**: se pregunta «¿Contamos esta sesión?». Si era un descanso, se pasa a la concentración sin iniciarla. |
| Inicio automático | Solo actúa si la fase anterior terminó con la app abierta. |
| Saltar / reiniciar | Nunca cuentan como completadas. Si se perdería más de 1 minuto de concentración, se pide confirmación. Saltar mantiene el temporizador en marcha si lo estaba. |
| Secuencia del ciclo | C1 → corto → C2 → corto → … → CN → largo → C1 de un ciclo nuevo. Un final natural y un salto usan el mismo avance (`#advance` en `timer.js`); solo cambia el resultado apuntado para ese hueco. |
| Posición frente a completadas | `cycleIndex` guarda en qué sesión del ciclo estás; `slotResults` guarda si cada sesión recorrida se **completó** o se **saltó**. Solo las completadas generan registro (pomodoros, tiempo de estudio, futuras estadísticas). El recorrido muestra completadas (rellenas), saltadas (tachadas), posición actual (anillo) y pendientes. |
| Transición al saltar | La misma mancha de tinta que en un final natural, con el texto «Fase saltada · No cuenta como completada». |
| Cambiar duraciones con una fase en curso | La fase actual conserva su duración; los cambios se aplican desde la siguiente. Si el temporizador está detenido, se aplican al momento. |
| Mismo final registrado dos veces | Cada fase tiene un identificador (`runId`); un final ya registrado se ignora, también si la app está abierta en dos pestañas. |
| Modo demostración | Usa 10 s / 5 s / 8 s (desde la v6). Sus fases se marcan como `demo` y no se registran. Detalles en «Decisiones de datos, insignias y demostración». |
| Datos guardados dañados | Se descartan campo a campo y se usan los valores por defecto. |

## Decisiones de tareas y territorio

| Situación | Comportamiento |
|---|---|
| Contador de pomodoros | Solo suma cuando una **concentración termina de verdad** (o cuando el usuario elige «Sí, contarla» en una sesión que terminó con la app cerrada). Saltar, reiniciar, «No contarla», los descansos y el modo demo no suman nada. |
| Qué tarea recibe el pomodoro | La que está activa **cuando termina** la sesión. Si se cambia de tarea activa a mitad, se avisa de que la sesión irá a la nueva. |
| Completar una tarea | Lo decide el usuario. Terminar pomodoros (aunque se supere la estimación) nunca completa la tarea. Completar la tarea activa la deja de marcar como activa. |
| Dónde se guarda el contador | No en la tarea, sino en un registro de sesiones (`inkfocus.sessions.v1`) identificado por el `runId` de la fase: el mismo final no puede registrarse dos veces. Ese registro servirá para calendario, historial y estadísticas. |
| Fecha de una sesión | La fecha local en la que **termina**. Una sesión de 23:50 a 00:15 cuenta para el día nuevo. |
| Fechas | Siempre locales (`AAAA-MM-DD`), nunca UTC. Si la app sigue abierta a medianoche, «hoy» cambia solo. |
| Eliminar | Sin confirmación previa, pero con «Deshacer» durante 8 s (la cuenta atrás se detiene con el ratón encima o el foco dentro). Deshacer devuelve la tarea a su posición y a su misma zona. |
| Distribución del mapa | Se calcula a partir del orden de creación de las tareas de hoy (diagrama de Voronoi sobre semillas en espiral). Completar, reabrir o editar no la cambia; solo cambia si se añaden, eliminan o cambian de fecha tareas de hoy. |
| Tareas de otras fechas | Se crean y editan igual; se ven con el filtro «Todas las fechas». El territorio siempre muestra hoy. |
| Territorio frente a objetivo diario | El territorio mide **tareas terminadas**; el objetivo de sesiones de concentración llegará en una versión posterior y será un indicador separado. |

## Decisiones del calendario y del registro de actividad

| Situación | Comportamiento |
|---|---|
| Fecha planificada frente a actividad | La tarea guarda su **fecha planificada**; cada sesión guarda la **fecha real** en que termina. Una sesión de una tarea planificada para otro día cuenta en el día de la actividad y la fecha de la tarea no cambia. |
| Sesión que cruza la medianoche | Cuenta en el día en que **termina** (23:50 → 00:15 cuenta para el día nuevo). Se explica en el panel del día. |
| Tiempo de estudio | `focusMs` = tiempo efectivo sin pausas (se acumula solo mientras la fase está en marcha). Las pausas se guardan aparte (`pausedMs`). Descansos, fases saltadas, reinicios y modo demo no generan sesiones ni minutos. |
| Fechas | Siempre locales `AAAA-MM-DD` (nunca `toISOString`, que pasa a UTC y puede mover el día). Sumar días o meses se hace con el calendario local. |
| Consultar otro día | Solo cambia lo que se muestra: el temporizador, la fase y la tarea activa no se tocan. «Territorio de hoy» sigue en el día actual. |
| Fecha por defecto al crear | La del día seleccionado en el calendario; desde la vista Concentración, hoy. |
| Eliminar o mover una tarea | Las sesiones ya registradas se conservan, con el título que tenía la tarea; el día muestra «(tarea eliminada)» si ya no existe. |
| Migración | Tareas sin fecha válida → hoy (las que tenían fecha no cambian). Sesiones de la v2 sin `focusMs` → su duración (aquella cuenta atrás tampoco avanzaba en pausa); sin título → se completa si la tarea aún existe. Nunca se inventa la fecha planificada de sesiones antiguas ni actividad que no se registró. Los datos migrados se guardan solo si algo cambió. |
| Indicadores | Solo datos reales guardados; sin actividad de ejemplo. |

## Decisiones del objetivo, las estadísticas y el historial

| Situación | Comportamiento |
|---|---|
| Fuente de datos | Objetivo, estadísticas, historial, calendario y pomodoros de cada tarea leen el **mismo** registro de sesiones (`inkfocus.sessions.v1`). No hay contadores aparte que puedan contradecirse. |
| Qué suma | Solo concentraciones completadas (final natural o «Sí, contarla»). Saltar, descansar, reiniciar, «No contarla» y el modo demo no suman. |
| Objetivo frente a territorio | El objetivo mide **sesiones** completadas hoy; el territorio, **tareas** planificadas para hoy y terminadas. |
| Cambiar la meta | Solo cambia la representación; la actividad registrada no se toca. La celebración aparece únicamente al cruzar la meta con una sesión real (no al cambiarla ni al recargar). Después se puede seguir sumando. |
| Tareas de hoy completadas | Cuenta las tareas **planificadas para hoy** que están completadas, se completaran el día que se completaran. |
| Últimos 7 días | Del día de hace 6 días hasta hoy, por fecha local de **fin** de cada sesión. |
| Contadores antiguos | No existen: desde la v2 cada sesión se guarda con su fecha, así que no hay totales heredados que repartir ni que contar dos veces. |
| Historial y tareas borradas | Se muestra el título guardado con la sesión y «(tarea eliminada)». La categoría se guarda desde la v4; en sesiones anteriores se usa la de la tarea si aún existe y, si no, se omite. |
| Gráfico accesible | Cada barra lleva su número de minutos, el día, la fecha y las sesiones; hoy se distingue también por la etiqueta «Hoy». El SVG tiene título y descripción, y hay una tabla con los mismos datos. |
| Migración | Ajustes sin `dailyGoal` → 6. Sesiones sin `taskCategory` → `null` (no se inventa). |

## Decisiones de personalización y utilidades

| Tema | Decisión |
|---|---|
| Un solo sistema de ajustes | Todas las preferencias nuevas (tema, tinta, movimiento, sonido, notificaciones, atajos) van en el mismo objeto `inkfocus.settings.v1`. Si faltan (datos de versiones anteriores), se usan valores por defecto sin tocar el resto. |
| Cómo se aplican | `appearance.js` pone `data-theme`, `data-ink` y `data-motion` en `<html>`; el CSS solo usa variables. Un script mínimo en `<head>` hace lo mismo antes de pintar para evitar un destello. Ningún cambio visual reinicia el temporizador. |
| Contraste | Cada tinta tiene una versión para texto sobre fondo oscuro y otra sobre fondo claro, y un color de texto propio para rellenos (por eso «Zona N» es siempre oscuro sobre lima, naranja, turquesa o menta). El interior del tanque y el mapa son un «tablero» oscuro en ambos temas. Comprobado con WCAG: texto ≥ 4,9:1 y gráficos ≥ 3,4:1 en las 8 combinaciones. |
| Movimiento | `data-motion="reduce"` si el sistema lo pide **o** si se activa en Ajustes. Se quitan olas, gotas, burbujas, transiciones y animaciones de gráficos; el nivel del tanque y el pintado se siguen actualizando, sin animación. |
| Sonidos | Generados con Web Audio (osciladores y ruido filtrado): no hay archivos de audio ni sonidos de terceros. El contexto de audio se prepara en el primer clic o tecla; si el navegador bloquea el sonido, se avisa una vez y siguen los avisos visuales. Suenan solo con un final natural y una sola vez por fase. |
| Notificaciones | El permiso se pide solo al activar la opción; si está denegado no se vuelve a pedir. Solo se notifica con la app fuera de la vista (con ella delante ya hay aviso visual, anuncio y sonido) y con `tag` para no duplicar entre pestañas. **Limitación:** sin servidor ni service worker no hay avisos con la pestaña cerrada; en segundo plano pueden retrasarse hasta ~1 minuto. Requieren https o localhost. |
| Atajos | Una sola lista (`SHORTCUTS`) para el código y la ayuda. Sin Ctrl/Alt/Cmd/Mayús; no actúan al escribir, con una ventana abierta, ni con Espacio sobre un control. Desactivables para lectores de pantalla (WCAG 2.1.4); Esc sigue funcionando. |
| Modo concentración | Solo oculta elementos con un atributo en `<body>`; no se guarda entre recargas. La pantalla completa es independiente. |

## Decisiones de datos, insignias y demostración

| Tema | Decisión |
|---|---|
| Claves guardadas | `inkfocus.settings.v1`, `inkfocus.timer.v1`, `inkfocus.tasks.v1`, `inkfocus.sessions.v1`, `inkfocus.badges.v1` y, solo durante la demostración, `inkfocus.timer-real.v1`. |
| Formato de exportación | `{ app: "InkFocus", format: 1, exportedAt, data: { settings, tasks, sessions, badges } }`. No incluye el estado del temporizador ni permisos; `demo` y `notifications` se exportan desactivados. |
| Validación al importar | Se comprueban tipo, rango y coherencia de cada preferencia, tarea, sesión e insignia (fechas reales, ids únicos, prioridades válidas, duraciones…). Al primer error se explica qué falla («Tarea nº 3: la fecha no es válida») y no se cambia nada. Archivos de otra app, JSON roto o de un formato más reciente se rechazan. |
| Sin cambios parciales | Primero se valida todo; después se escribe. Si una escritura falla (almacenamiento lleno), se restauran los valores anteriores. |
| Textos importados | Siempre se insertan como texto (`escapeHTML` o `textContent`), nunca como HTML. |
| Sesión en curso | Importar, borrar y entrar en demostración se bloquean con una sesión iniciada, en pausa o pendiente de confirmar, con un mensaje que explica cómo resolverlo. |
| Borrar datos | Solo se eliminan las claves `inkfocus.*`, nunca `localStorage.clear()`. La interfaz vuelve al estado inicial sin recargar. |
| Insignias | Se calculan con el registro de sesiones reales. Las ya cumplidas al cargar (por datos anteriores) se guardan sin celebración y con la fecha en que se alcanzaron. «Primera meta» solo se comprueba con el objetivo actual (de días pasados no consta qué objetivo había). Nunca se quitan. |
| Celebraciones | Breves y opcionales (Ajustes › Apariencia). Respetan el movimiento reducido. El anuncio accesible se mantiene aunque se desactiven. |
| Modo demostración | Al entrar se guarda el temporizador real aparte y las tareas pasan a una copia en memoria; las sesiones demo no se registran. Al salir se descartan los cambios de tareas y se restaura el temporizador real preparado (sin tiempo ni progreso ficticio). Si se recarga en demostración, sigue en demostración y las tareas guardadas siguen intactas. |
| Tanque en tema claro | Interior blanco (`--tank-bg`), borde oscuro y una línea más oscura en la superficie de la tinta solo en tema claro. El tema oscuro no cambia. |

## Si el navegador abre la app con otro zoom

El proyecto no aplica ningún zoom: no hay `zoom` ni escalados globales, la etiqueta viewport es la estándar (`width=device-width, initial-scale=1`) y ningún script cambia la escala. Si al abrir aparece al 67 %, casi siempre es el navegador recordando el zoom de ese sitio:

1. Pulsa `Ctrl + 0` en la pestaña de InkFocus para volver al 100 %.
2. Chrome/Edge recuerdan el zoom por **nombre de host**, sin distinguir el puerto: cualquier otra web servida en `localhost` comparte ese zoom. Revísalo en `chrome://settings/content/zoomLevels` (Edge: `edge://settings/content/zoomLevels`) y elimina la entrada de `localhost`.
3. Comprueba también el zoom predeterminado en Configuración › Apariencia › Zoom de la página.
4. Para distinguir el zoom del navegador de un escalado por CSS: con zoom de navegador aparece un icono de lupa en la barra de direcciones y en la consola `window.devicePixelRatio` deja de valer lo habitual (por ejemplo, 0,67 en una pantalla normal). Un escalado CSS no cambiaría ese valor.
5. Prueba en `http://127.0.0.1:5500` o en una ventana privada: si ahí se ve al 100 %, es el zoom guardado para `localhost`.

## Plan de versiones

1. **v1** · Temporizador, tanque, fases, ajustes, modo demo, móvil básico. ✅
2. **v2** · Tareas y territorio diario. ✅
3. **v3** · Calendario y registro de sesiones por fecha. ✅
4. **v4** · Escala compacta, objetivo diario, estadísticas e historial. ✅
5. **v5** · Personalización (tintas, tema claro), modo concentración, sonido, notificaciones, atajos, ayuda. ✅
6. **v6** · Insignias, exportar / importar, restablecer, modo demostración aislado, revisión final y preparación para publicar. ✅

Pendiente fuera de la aplicación: la web del proceso (prompts, IAs, versiones y capturas) y el PDF de entrega.
