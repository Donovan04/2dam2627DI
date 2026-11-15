# CLAUDE.md · InkFocus

Información permanente para trabajar en este proyecto. El detalle está en `README.md` y el estado en `ESTADO_PROYECTO.md`.

- **Proyecto:** aplicación Pomodoro académica (Desarrollo de Interfaces, 2.º DAM). Interfaz, textos y comentarios en **español**.
- **Tecnología:** HTML + CSS + JavaScript con módulos ES, sin frameworks, dependencias ni compilación. Debe poder publicarse como web estática (GitHub Pages, también en subcarpeta): **usar siempre rutas relativas**.
- **Ejecutar:** `powershell -ExecutionPolicy Bypass -File tools\servidor.ps1` → `http://localhost:5500` (no funciona con `file://`). `tools/servidor.ps1` admite `-Port` y `-Root`.
- **Datos:** `localStorage` con claves `inkfocus.*` (ver README). Cambios de estructura → sanear y migrar con valores por defecto; nunca borrar con `localStorage.clear()`.
- **Pruebas:** no tocar los datos reales de `localhost:5500`. Usar la configuración `inkfocus-pruebas` de `.claude/launch.json` (puerto 5600, origen aislado) y limpiar las claves `inkfocus.*` al terminar.
- **Reglas de dominio:** solo los finales reales de concentración generan sesiones (nunca saltos, reinicios, descansos ni modo demostración); una sesión cuenta en la fecha local en que termina; todas las estadísticas salen del registro de sesiones.
- **Diseño:** usar las variables de `css/tokens.css` (tema y tinta por `data-theme` / `data-ink`); comprobar contraste en ambos temas; las animaciones deben respetar `:root[data-motion='reduce']`.
- **Estética:** inspirada en Splatoon pero sin imágenes, sonidos ni nombres oficiales de Nintendo.
- **Pendiente acordado:** la web del proceso y el PDF se harán a partir del documento Word del autor o la autora; no generarlos sin ese material.
