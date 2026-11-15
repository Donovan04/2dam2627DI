# servidor.ps1 · Servidor estático mínimo para probar InkFocus en local.
# Los módulos de JavaScript (type="module") no funcionan abriendo index.html
# con doble clic (file://), por eso hace falta servir la carpeta por HTTP.
#
# Uso (desde la carpeta del proyecto):
#   powershell -ExecutionPolicy Bypass -File tools\servidor.ps1
#   powershell -ExecutionPolicy Bypass -File tools\servidor.ps1 -Port 8080
# Simular una subcarpeta (como GitHub Pages en usuario.github.io/repositorio/):
#   powershell -ExecutionPolicy Bypass -File tools\servidor.ps1 -Port 5700 -Root ..
#   y abrir http://localhost:5700/InkFocus/
param([int]$Port = 5500, [string]$Root = '')

$root = if ($Root) { [IO.Path]::GetFullPath((Join-Path (Get-Location) $Root)) } else { [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')) }
if (-not $root.EndsWith([IO.Path]::DirectorySeparatorChar)) { $root += [IO.Path]::DirectorySeparatorChar }

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.md'   = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "InkFocus disponible en http://localhost:$Port/  (Ctrl+C para detener)"

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response
    try {
      $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
      # Carpeta pedida sin barra final: se redirige con barra (como GitHub Pages),
      # para que las rutas relativas (css/, js/…) se resuelvan dentro de ella.
      $asFolder = Join-Path $root $relative
      if ($relative -ne '' -and -not $relative.EndsWith('/') -and (Test-Path -LiteralPath $asFolder -PathType Container)) {
        $response.StatusCode = 301
        $response.RedirectLocation = $context.Request.Url.AbsolutePath + '/'
        continue
      }
      if ($relative -eq '' -or $relative.EndsWith('/')) { $relative += 'index.html' }
      $full = [IO.Path]::GetFullPath((Join-Path $root $relative))

      # Solo se sirven archivos dentro de la carpeta del proyecto
      if ($full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $full -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($full)
        $ext = [IO.Path]::GetExtension($full).ToLower()
        $response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $response.Headers.Add('Cache-Control', 'no-store')
        $response.ContentLength64 = $bytes.Length
        # Las peticiones HEAD solo piden cabeceras, sin cuerpo
        if ($context.Request.HttpMethod -ne 'HEAD') {
          $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      } else {
        $response.StatusCode = 404
      }
    } catch {
      # Un error en una petición (p. ej. el navegador cierra la conexión) no detiene el servidor
      Write-Host "Aviso: $($_.Exception.Message)"
    } finally {
      $response.Close()
    }
  }
} finally {
  $listener.Stop()
}
